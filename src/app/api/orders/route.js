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
import { createHash } from "node:crypto";

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

const orderMetaValue = (order, key) => {
  const entries = order?.meta_data || [];
  for (let index = entries.length - 1; index >= 0; index -= 1) {
    if (entries[index]?.key === key) return String(entries[index].value || "");
  }
  return "";
};

const productCanFulfill = (product, quantity) =>
  Boolean(
    product &&
      product.purchasable !== false &&
      product.stock_status !== "outofstock" &&
      (product.stock_quantity == null ||
        Number(product.stock_quantity) >= quantity)
  );

async function mapWithConcurrency(items, concurrency, mapper) {
  const results = new Array(items.length);
  let nextIndex = 0;

  async function worker() {
    for (;;) {
      const index = nextIndex;
      nextIndex += 1;
      if (index >= items.length) return;
      results[index] = await mapper(items[index], index);
    }
  }

  await Promise.all(
    Array.from(
      { length: Math.min(Math.max(1, concurrency), items.length) },
      () => worker()
    )
  );
  return results;
}

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
  const idempotencyKey = request.headers.get("idempotency-key")?.trim() || "";
  if (!/^[A-Za-z0-9._:-]{8,200}$/.test(idempotencyKey)) {
    return securityError("A valid idempotency key is required.", 400);
  }

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
          shippingAddress: sanitizedAddress(body.checkout.shippingAddress),
          billingAddress: sanitizedAddress(body.checkout.billingAddress),
        }
      : null;
  if (!Array.isArray(items) || items.length === 0 || items.length > 100) {
    return securityError("The cart must contain between 1 and 100 items.", 400);
  }
  if (
    body.checkout &&
    (!checkout ||
      !checkout.firstName ||
      !checkout.lastName ||
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

    const validatedItems = [];
    const productCache = new Map();
    const variationCache = new Map();
    const skuCache = new Map();
    const getParentProduct = async (storeId, id) => {
      const key = `${storeId}:${id}`;
      if (!productCache.has(key)) {
        productCache.set(key, getProductById(id, storeId));
      }
      return productCache.get(key);
    };
    const getVariation = async (storeId, productId, variationId) => {
      const key = `${storeId}:${productId}:${variationId}`;
      if (!variationCache.has(key)) {
        variationCache.set(
          key,
          getVariationById(productId, variationId, storeId)
        );
      }
      return variationCache.get(key);
    };
    const getBySku = async (storeId, sku) => {
      const key = `${storeId}:${sku.toLowerCase()}`;
      if (!skuCache.has(key)) {
        skuCache.set(key, findProductBySku(sku, storeId));
      }
      return skuCache.get(key);
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

      validatedItems.push({
        store,
        storeId,
        quantity,
        requestedProductId,
        requestedVariationId,
        sku,
      });
    }

    const resolutionResults = await mapWithConcurrency(
      validatedItems,
      8,
      async ({
        store,
        storeId,
        quantity,
        requestedProductId,
        requestedVariationId,
        sku,
      }) => {
        let payload = null;
        let productId = null;
        let variationId = null;
        let categories = [];

        if (requestedProductId && requestedVariationId) {
          const [variation, parentProduct] = await Promise.all([
            getVariation(storeId, requestedProductId, requestedVariationId),
            getParentProduct(storeId, requestedProductId),
          ]);
          payload = variation;
          productId = requestedProductId;
          variationId = requestedVariationId;
          categories = parentProduct.categories;
        } else if (requestedProductId) {
          payload = await getParentProduct(storeId, requestedProductId);
          productId = requestedProductId;
          categories = payload.categories;
        } else if (sku) {
          const found = await getBySku(storeId, sku);
          if (found) {
            payload = found;
            productId = found.parent_id || found.id;
            variationId = found.parent_id ? found.id : null;
            categories = variationId
              ? (await getParentProduct(storeId, productId)).categories
              : found.categories;
          }
        }

        if (!payload) {
          return { unresolved: `${store.name}: ${sku || "unknown item"}` };
        }
        if (!productCanFulfill(payload, quantity)) {
          return {
            unavailable: `${store.name}: ${sku || payload.name || "unknown item"}`,
          };
        }

        const optionText =
          (payload.attributes || [])
            .map((attribute) => attribute.option)
            .filter(Boolean)
            .join(" ") || payload.name;
        const weightGrams = extractWeightGrams(optionText, payload.weight) || 0;
        return {
          entry: {
            store,
            productId,
            variationId,
            quantity,
            weightGrams,
            tableKey: tableKeyFromCategories(categories),
            rolePrice: role ? roleBasedPrices(payload.meta_data)[role] : undefined,
            basePrice: parseFloat(payload.price) || 0,
          },
          lineWeightGrams: weightGrams * quantity,
        };
      }
    );

    const resolved = resolutionResults.flatMap((result) =>
      result.entry ? [result.entry] : []
    );
    const unresolved = resolutionResults.flatMap((result) =>
      result.unresolved ? [result.unresolved] : []
    );
    const unavailable = resolutionResults.flatMap((result) =>
      result.unavailable ? [result.unavailable] : []
    );
    const totalWeightGrams = resolutionResults.reduce(
      (total, result) => total + (result.lineWeightGrams || 0),
      0
    );

    if (unresolved.length > 0) {
      return Response.json(
        { error: `Some items were not found in their store catalogs: ${unresolved.join(", ")}.`, unresolved },
        { status: 422 }
      );
    }
    if (unavailable.length > 0) {
      return Response.json(
        {
          error: `Some items are unavailable in the requested quantity: ${unavailable.join(", ")}.`,
          unavailable,
        },
        { status: 409, headers: { "Cache-Control": "no-store" } }
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
    const orderPhone = customer.phone || "";
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
    const requestReference = createHash("sha256")
      .update(`${session.customerId}:${idempotencyKey}`)
      .digest("hex")
      .slice(0, 32);
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

        try {
          const order = await createOrder(
          {
            status: "on-hold",
            set_paid: false,
            customer_id: wcCustomer.id,
            payment_method: "sc_offline",
            payment_method_title: "Offline: Maya Herbs team will contact you to arrange payment",
            billing,
            shipping,
            line_items: lineItems,
            customer_note: ORDER_CUSTOMER_NOTE,
            meta_data: [
              { key: "sc_channel", value: "wholesale-portal" },
              { key: "sc_source_store", value: store.id },
              { key: "sc_request_reference", value: requestReference },
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
        } catch (creationError) {
          try {
            const recentOrders = await getOrdersByEmail(customer.email, store.id);
            const recoveredOrder = recentOrders.find(
              (order) =>
                orderMetaValue(order, "sc_request_reference") === requestReference
            );
            if (recoveredOrder) return mapOrder(recoveredOrder, store);
          } catch (reconciliationError) {
            console.error(
              `Order reconciliation failed for ${store.id}:`,
              reconciliationError
            );
          }
          throw creationError;
        }
      })
    );

    const orders = creationResults.flatMap((result) =>
      result.status === "fulfilled" ? [result.value] : []
    );
    const failures = creationResults.flatMap((result, index) => {
      if (result.status === "fulfilled") return [];
      const store = storesInOrder[index];
      console.error(`POST /api/orders failed for ${store.id}:`, result.reason);
      return [{
        storeId: store.id,
        storeName: store.name,
        uncertain:
          !(result.reason instanceof WooCommerceApiError) ||
          result.reason.status >= 500,
      }];
    });

    if (orders.length === 0) {
      const uncertain = failures.some((failure) => failure.uncertain);
      return Response.json(
        {
          error: uncertain
            ? "We could not confirm the order response. Check My Account before submitting it again."
            : "Failed to register the order in the configured WooCommerce stores.",
          orders,
          failures,
          uncertain,
        },
        { status: 502, headers: { "Cache-Control": "no-store" } }
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
