import {
  createOrder,
  findProductBySku,
  getCustomerByEmail,
  getOrdersByEmail,
  getProductById,
  getVariationById,
  WooCommerceApiError,
} from "@/lib/woocommerce";
import {
  getMissingCommerceStores,
  getRequiredCommerceStores,
  PRIMARY_STORE_ID,
} from "@/lib/commerce-stores";
import {
  extractWeightGrams,
  isApprovedWholesaleCustomer,
  mapCustomerToUser,
  mapOrder,
  roleBasedPrices,
  toWcAddress,
} from "@/lib/wc-mappers";
import {
  MIN_ORDER_GRAMS,
  NEW_CUSTOMER_ROLE,
  progressivePerGramRate,
  progressiveTableKeyFor,
} from "@/lib/pricing";
import {
  cleanText,
  isSameOrigin,
  readJsonBody,
  RequestBodyError,
  securityError,
} from "@/lib/request-security";
import { getSession } from "@/lib/session";
import { isSupportedCountryCode } from "@/lib/countries";

const ORDER_CUSTOMER_NOTE =
  process.env.WHOLESALE_ORDER_NOTE?.replace(/\\n/g, "\n").trim() ||
  "Thank you for your wholesale order request. The Maya Herbs team will confirm availability, shipping and payment instructions before fulfillment.";

const missingBackendsResponse = () => {
  const missingStores = getMissingCommerceStores();
  return missingStores.length > 0
    ? Response.json(
        {
          error: `WooCommerce backends are not configured: ${missingStores.map((store) => store.name).join(", ")}.`,
        },
        { status: 503 }
      )
    : null;
};

const orderErrorStatus = (err) =>
  err instanceof WooCommerceApiError && err.status >= 400 ? 502 : 500;

const sanitizedAddress = (address) => {
  if (!address || typeof address !== "object" || Array.isArray(address)) return null;
  return {
    street: cleanText(address.street, 160),
    neighborhood: cleanText(address.neighborhood, 160),
    city: cleanText(address.city, 100),
    state: cleanText(address.state, 100),
    zip: cleanText(address.zip, 24),
    country: cleanText(address.country, 2).toUpperCase(),
  };
};

const addressIsComplete = (address) =>
  Boolean(
    address?.street &&
      address.city &&
      address.zip &&
      isSupportedCountryCode(address.country)
  );

// Lists orders from both backends for My Account.
export async function GET() {
  const session = await getSession();
  if (!session) return securityError("Authentication required.", 401);
  const configurationError = missingBackendsResponse();
  if (configurationError) return configurationError;

  const stores = getRequiredCommerceStores();
  const results = await Promise.allSettled(
    stores.map(async (store) => {
      const orders = await getOrdersByEmail(session.email, store.id);
      return orders.map((order) => mapOrder(order, store));
    })
  );

  const orders = results
    .flatMap((result) => (result.status === "fulfilled" ? result.value : []))
    .sort((a, b) => new Date(b.dateCreated) - new Date(a.dateCreated));
  const failures = results.flatMap((result, index) =>
    result.status === "rejected"
      ? [{ storeId: stores[index].id, storeName: stores[index].name }]
      : []
  );

  if (orders.length === 0 && failures.length === stores.length) {
    results.forEach((result, index) => {
      if (result.status === "rejected") {
        console.error(`GET /api/orders failed for ${stores[index].id}:`, result.reason);
      }
    });
    return Response.json(
      { error: "Failed to load orders from the configured WooCommerce stores." },
      { status: 502 }
    );
  }

  return Response.json(
    { orders, failures },
    { headers: { "Cache-Control": "no-store" } }
  );
}

// Creates one WooCommerce order per backend represented in the cart.
export async function POST(request) {
  if (!isSameOrigin(request)) return securityError("Cross-origin request rejected.", 403);
  const session = await getSession();
  if (!session) return securityError("Authentication required.", 401);
  const configurationError = missingBackendsResponse();
  if (configurationError) return configurationError;

  let body;
  try {
    body = await readJsonBody(request);
  } catch (err) {
    if (err instanceof RequestBodyError) return securityError(err.message, err.status);
    return securityError("Invalid JSON body.", 400);
  }

  const { items = [] } = body;
  const checkout =
    body.checkout && typeof body.checkout === "object" && !Array.isArray(body.checkout)
      ? {
          firstName: cleanText(body.checkout.firstName, 80),
          lastName: cleanText(body.checkout.lastName, 80),
          company: cleanText(body.checkout.company, 160),
          phone: cleanText(body.checkout.phone, 40),
          shippingAddress: sanitizedAddress(body.checkout.shippingAddress),
          billingAddress: sanitizedAddress(body.checkout.billingAddress),
        }
      : null;
  if (!Array.isArray(items) || items.length === 0 || items.length > 100) {
    return securityError("The order sheet must contain between 1 and 100 items.", 400);
  }
  if (
    body.checkout &&
    (!checkout ||
      !checkout.firstName ||
      !checkout.lastName ||
      !checkout.phone ||
      !addressIsComplete(checkout.shippingAddress) ||
      !addressIsComplete(checkout.billingAddress))
  ) {
    return securityError("Complete contact, shipping, and billing details are required.", 400);
  }

  try {
    // Authentication and buyer profile remain authoritative in Maya Herbs.
    const wcCustomer = await getCustomerByEmail(session.email, PRIMARY_STORE_ID);
    if (!isApprovedWholesaleCustomer(wcCustomer) || wcCustomer.id !== session.customerId) {
      return securityError("Authentication required.", 401);
    }
    const customer = mapCustomerToUser(wcCustomer);
    const role = wcCustomer.role || null;
    const stores = getRequiredCommerceStores();
    const storeById = new Map(stores.map((store) => [store.id, store]));

    const resolved = [];
    const unresolved = [];
    let totalWeightGrams = 0;
    const productCache = new Map();
    const getParentProduct = async (storeId, id) => {
      const key = `${storeId}:${id}`;
      if (!productCache.has(key)) {
        productCache.set(key, await getProductById(id, storeId));
      }
      return productCache.get(key);
    };
    const tableKeyFromCategories = (categories = []) =>
      categories.some((category) => progressiveTableKeyFor(category.name) === "shamanic")
        ? "shamanic"
        : "default";

    for (const item of items) {
      if (!item || typeof item !== "object") return securityError("Invalid order item.", 400);

      const storeId = cleanText(item.storeId, 64) || PRIMARY_STORE_ID;
      const store = storeById.get(storeId);
      if (!store) return securityError("Invalid product store.", 400);

      const quantity = Number(item.quantity);
      const requestedProductId = Number(item.wcProductId);
      const requestedVariationId = Number(item.wcVariationId);
      const sku = cleanText(item.sku, 100);
      if (!Number.isSafeInteger(quantity) || quantity < 1 || quantity > 1000) {
        return securityError("Every item quantity must be between 1 and 1000.", 400);
      }
      if (
        (item.wcProductId && (!Number.isSafeInteger(requestedProductId) || requestedProductId < 1)) ||
        (item.wcVariationId && (!Number.isSafeInteger(requestedVariationId) || requestedVariationId < 1))
      ) {
        return securityError("Invalid product identifier.", 400);
      }

      let payload = null;
      let productId = null;
      let variationId = null;
      if (requestedProductId && requestedVariationId) {
        payload = await getVariationById(requestedProductId, requestedVariationId, storeId);
        productId = requestedProductId;
        variationId = requestedVariationId;
      } else if (requestedProductId) {
        payload = await getProductById(requestedProductId, storeId);
        productId = requestedProductId;
      } else if (sku) {
        const found = await findProductBySku(sku, storeId);
        if (found) {
          payload = found;
          productId = found.parent_id || found.id;
          variationId = found.parent_id ? found.id : null;
        }
      }

      if (!payload) {
        unresolved.push(`${store.name}: ${sku || "unknown item"}`);
        continue;
      }

      const optionText =
        (payload.attributes || []).map((attribute) => attribute.option).filter(Boolean).join(" ") ||
        payload.name;
      const weightGrams = extractWeightGrams(optionText, payload.weight) || 0;
      totalWeightGrams += weightGrams * quantity;
      const categories = variationId
        ? (await getParentProduct(storeId, productId)).categories
        : payload.categories;

      resolved.push({
        store,
        productId,
        variationId,
        quantity,
        weightGrams,
        tableKey: tableKeyFromCategories(categories),
        rolePrice: role ? roleBasedPrices(payload.meta_data)[role] : undefined,
        basePrice: parseFloat(payload.price) || 0,
      });
    }

    if (unresolved.length > 0) {
      return Response.json(
        { error: `Some items were not found in their store catalogs: ${unresolved.join(", ")}.`, unresolved },
        { status: 422 }
      );
    }
    if (totalWeightGrams < MIN_ORDER_GRAMS) {
      return Response.json(
        {
          error: `Minimum wholesale order is ${MIN_ORDER_GRAMS}g; this order sheet totals ${Math.round(totalWeightGrams)}g.`,
        },
        { status: 422 }
      );
    }

    const isProgressive = role === NEW_CUSTOMER_ROLE;
    const entriesByStore = new Map();
    for (const entry of resolved) {
      if (!entriesByStore.has(entry.store.id)) entriesByStore.set(entry.store.id, []);
      entriesByStore.get(entry.store.id).push(entry);
    }

    const orderFirstName = checkout?.firstName || customer.firstName || "";
    const orderLastName = checkout?.lastName || customer.lastName || "";
    const orderCompany = checkout?.company || customer.company || "";
    const orderPhone = checkout?.phone || customer.phone || "";
    const orderBillingAddress = checkout?.billingAddress || customer.billingAddress;
    const orderShippingAddress = checkout?.shippingAddress || customer.shippingAddress;
    const billing = {
      first_name: orderFirstName,
      last_name: orderLastName,
      company: orderCompany,
      email: customer.email,
      phone: orderPhone,
      ...toWcAddress(orderBillingAddress),
    };
    const shipping = {
      first_name: orderFirstName,
      last_name: orderLastName,
      company: orderCompany,
      ...toWcAddress(orderShippingAddress),
    };

    const storesInOrder = stores.filter((store) => entriesByStore.has(store.id));
    const creationResults = await Promise.allSettled(
      storesInOrder.map(async (store) => {
        const appliedRates = {};
        const lineItems = entriesByStore.get(store.id).map((entry) => {
          const rate = isProgressive
            ? progressivePerGramRate(totalWeightGrams, entry.tableKey)
            : null;
          const unitPrice =
            rate != null && entry.weightGrams > 0
              ? entry.weightGrams * rate
              : entry.rolePrice != null
                ? entry.rolePrice
                : entry.basePrice;
          if (rate != null && entry.weightGrams > 0) appliedRates[entry.tableKey] = rate;
          const lineTotal = (unitPrice * entry.quantity).toFixed(2);
          return {
            product_id: entry.productId,
            ...(entry.variationId ? { variation_id: entry.variationId } : {}),
            quantity: entry.quantity,
            subtotal: lineTotal,
            total: lineTotal,
          };
        });

        const order = await createOrder(
          {
            status: "on-hold",
            set_paid: false,
            payment_method: "sc_offline",
            payment_method_title: "Offline: Maya Herbs team will contact you to arrange payment",
            billing,
            shipping,
            line_items: lineItems,
            customer_note: ORDER_CUSTOMER_NOTE,
            meta_data: [
              { key: "sc_channel", value: "wholesale-portal" },
              { key: "sc_source_store", value: store.id },
              { key: "sc_access_level", value: role || "none (base prices)" },
              { key: "sc_total_weight_grams", value: String(Math.round(totalWeightGrams)) },
              ...(Object.keys(appliedRates).length > 0
                ? [{
                    key: "sc_per_gram_rate",
                    value: Object.entries(appliedRates)
                      .map(([table, rate]) => `${table}: $${rate.toFixed(2)}/g`)
                      .join(" · "),
                  }]
                : []),
              ...(customer.accountId ? [{ key: "sc_account_id", value: String(customer.accountId) }] : []),
              ...(customer.discountRate
                ? [{ key: "sc_discount_rate", value: String(customer.discountRate) }]
                : []),
            ],
          },
          store.id
        );
        return mapOrder(order, store);
      })
    );

    const orders = creationResults.flatMap((result) =>
      result.status === "fulfilled" ? [result.value] : []
    );
    const failures = creationResults.flatMap((result, index) => {
      if (result.status === "fulfilled") return [];
      const store = storesInOrder[index];
      console.error(`POST /api/orders failed for ${store.id}:`, result.reason);
      return [{ storeId: store.id, storeName: store.name }];
    });

    if (orders.length === 0) {
      return Response.json(
        { error: "Failed to register the order in the configured WooCommerce stores.", orders, failures },
        { status: 502 }
      );
    }

    return Response.json(
      { orders, failures },
      { status: failures.length > 0 ? 207 : 201 }
    );
  } catch (err) {
    console.error("POST /api/orders failed before order creation:", err);
    return Response.json(
      { error: "Failed to validate the order against WooCommerce." },
      { status: orderErrorStatus(err) }
    );
  }
}
