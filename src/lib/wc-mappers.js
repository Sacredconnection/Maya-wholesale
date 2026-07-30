// Maps WooCommerce REST payloads to the internal product shape used by the UI.

const decodeHtmlEntities = (value) =>
  String(value || "")
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/&#x([\da-f]+);/gi, (_, code) => String.fromCodePoint(Number.parseInt(code, 16)))
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#0*39;|&apos;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">");

const stripHtml = (html) =>
  decodeHtmlEntities(html)
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

// Reads the first option of a product attribute by name (case-insensitive).
// Product attributes carry `options` (array); variation attributes carry `option`.
const attributeOption = (attributes, name) => {
  const attr = (attributes || []).find(
    (a) => (a.name || "").toLowerCase() === name.toLowerCase()
  );
  if (!attr) return null;
  if (Array.isArray(attr.options)) return attr.options[0] || null;
  if (Array.isArray(attr.terms)) return attr.terms[0]?.name || null;
  return attr.option || null;
};

const attributeKey = (attribute) => {
  const source = attribute.slug || attribute.name || "";
  return String(source)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase()
    .replace(/^pa_/, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
};

const mapProductAttributes = (attributes = []) =>
  attributes
    .map((attribute) => {
      const values = Array.isArray(attribute.options)
        ? attribute.options
        : Array.isArray(attribute.terms)
          ? attribute.terms.map((term) => term?.name)
          : [attribute.option || attribute.value];

      return {
        key: attributeKey(attribute),
        name: decodeHtmlEntities(attribute.name || attribute.slug || ""),
        values: [...new Set(values.filter(Boolean).map(decodeHtmlEntities))],
      };
    })
    .filter(
      (attribute) =>
        attribute.key &&
        attribute.values.length > 0 &&
        attribute.name.trim().toLowerCase() !== "tribe"
    );

// "28gr" → 28, "7.1gr" → 7.1, "1kg" → 1000
const parseGramsFromText = (text) => {
  const m = /([\d.,]+)\s*(kg|gr?|g)\b/i.exec(text || "");
  if (!m) return null;
  const n = parseFloat(m[1].replace(",", "."));
  if (!Number.isFinite(n)) return null;
  return /kg/i.test(m[2]) ? n * 1000 : n;
};

// The store's weight unit is configurable; this backend uses kg (e.g. "0.028"
// for a 28g pouch). Values under 5 are treated as kg, otherwise as grams.
const weightFieldToGrams = (weight) => {
  const n = parseFloat(weight);
  if (!n) return null;
  return n < 5 ? n * 1000 : n;
};

export const extractWeightGrams = (nameText, weightField) =>
  parseGramsFromText(nameText) ?? weightFieldToGrams(weightField);

// Reads the "Role Based Pricing" plugin rules from meta_data and resolves the
// effective flat price per access level, e.g. { "Special Customer": 200 }.
// Levels without a resolvable flat price are omitted (fall back to base price).
export function roleBasedPrices(metaData = []) {
  const rules = metaData.find((m) => m.key === "_role_based_pricing_rules")?.value;
  if (!rules || typeof rules !== "object") return {};

  const prices = {};
  for (const [role, rule] of Object.entries(rules)) {
    if (!rule || rule.pricing_type !== "flat") continue;
    const price = parseFloat(rule.sale_price ?? rule.regular_price);
    if (Number.isFinite(price)) prices[role] = price;
  }
  return prices;
}

export function mapVariationToOption(variation) {
  const name =
    (variation.attributes || [])
      .map((a) => a.option)
      .filter(Boolean)
      .join(" / ") || variation.sku;

  return {
    name,
    price: parseFloat(variation.price) || 0,
    rolePrices: roleBasedPrices(variation.meta_data),
    sku: variation.sku || String(variation.id),
    weightGrams: extractWeightGrams(name, variation.weight),
    wcVariationId: variation.id,
    inStock: variation.stock_status !== "outofstock",
    stockQuantity:
      variation.stock_quantity == null ? null : Number(variation.stock_quantity),
  };
}

const storePrice = (prices = {}) => {
  const amount = Number(prices.price);
  const minorUnit = Number(prices.currency_minor_unit ?? 2);
  if (!Number.isFinite(amount) || !Number.isFinite(minorUnit)) return 0;
  return amount / (10 ** minorUnit);
};

const storeVariationName = (variation) => {
  const attributes = (variation.attributes || [])
    .map((attribute) => attribute.value || attribute.option)
    .filter(Boolean);
  if (attributes.length) return attributes.join(" / ");
  const variationLabel = String(variation.variation || "");
  return variationLabel.replace(/^[^:]+:\s*/, "") || variation.sku || String(variation.id);
};

const mapStoreVariationToOption = (variation) => {
  const name = storeVariationName(variation);
  return {
    name,
    price: storePrice(variation.prices),
    rolePrices: {},
    sku: variation.sku || String(variation.id),
    weightGrams: extractWeightGrams(name, null),
    wcVariationId: variation.id,
    inStock: variation.is_in_stock !== false,
    stockQuantity: null,
  };
};

// Pre-computes category hierarchy info used by mapProduct: which categories
// are subcategories (their names double as the tribe list, e.g. "Huni Kuin"
// under "Rapé Indigenous").
export function buildCategoryContext(categories = []) {
  const parentById = {};
  const nameById = {};
  categories.forEach((c) => {
    parentById[c.id] = c.parent || 0;
    nameById[c.id] = c.name;
  });

  return { parentById, nameById };
}

// Walks up the category tree to the top-level ancestor (e.g. "Yawanawa" →
// "Rapé Indigenous"). Depth-capped in case of malformed hierarchies.
const topLevelCategoryName = (categoryId, parentById, nameById) => {
  let id = categoryId;
  for (let depth = 0; depth < 10 && parentById[id]; depth++) {
    id = parentById[id];
  }
  return nameById[id] || null;
};

const categoryPathNames = (categoryId, parentById, nameById) => {
  const path = [];
  let id = categoryId;
  const visited = new Set();
  for (let depth = 0; depth < 10 && id && !visited.has(id); depth += 1) {
    visited.add(id);
    if (nameById[id]) path.unshift(decodeHtmlEntities(nameById[id]));
    id = parentById[id] || 0;
  }
  return path;
};

const deepestCategoryPath = (categories, parentById, nameById) =>
  (categories || [])
    .map((category) => categoryPathNames(category.id, parentById, nameById))
    .sort((left, right) => right.length - left.length)[0] || [];

// Internal address shape ↔ WooCommerce address shape
export const toWcAddress = (address = {}) => ({
  address_1: address.street || "",
  address_2: address.neighborhood || "",
  city: address.city || "",
  state: address.state || "",
  postcode: address.zip || "",
  country: address.country || "",
});

export const fromWcAddress = (address = {}) => ({
  street: address.address_1 || "",
  neighborhood: address.address_2 || "",
  city: address.city || "",
  state: address.state || "",
  zip: address.postcode || "",
  country: address.country || "",
});

const customerMeta = (customer, key) => {
  const entries = customer.meta_data || [];
  for (let index = entries.length - 1; index >= 0; index -= 1) {
    if (entries[index].key === key) return entries[index].value;
  }
  return undefined;
};

export function isApprovedWholesaleCustomer(customer) {
  if (!customer) return false;

  const approvalStatus = String(
    customerMeta(customer, "maya_account_status") ||
      customerMeta(customer, "sc_approval_status") ||
      ""
  ).toLowerCase();

  if (["pending", "pending_approval"].includes(approvalStatus)) return false;
  if (approvalStatus === "approved") return true;

  return !["pending", "customer"].includes((customer.role || "").toLowerCase());
}

// Maps a WooCommerce customer to the user shape the UI stores in AuthContext.
// Wholesale discounts live in customer meta so the team can manage them from
// WP Admin; they default to 0 when absent.
export function mapCustomerToUser(customer) {
  const profileAvatar = customerMeta(customer, "sc_profile_avatar_url");
  const savedDisplayName = customerMeta(customer, "sc_display_name");
  return {
    firstName: customer.first_name || "",
    lastName: customer.last_name || "",
    displayName:
      savedDisplayName ||
      [customer.first_name, customer.last_name].filter(Boolean).join(" ") ||
      customer.username ||
      customer.email,
    email: customer.email,
    company: customer.billing?.company || "",
    phone: customer.billing?.phone || "",
    country: customer.billing?.country || customer.shipping?.country || "",
    accountId: `MAYA-WC-${customer.id}`,
    wcCustomerId: customer.id,
    // Access level (WP role) — drives role-based pricing, e.g. "New Customer",
    // "Special Customer", "Old Customer".
    role: customer.role || null,
    status: isApprovedWholesaleCustomer(customer) ? "ACTIVE" : "PENDING",
    discountRate: Number(customerMeta(customer, "sc_discount_rate")) || 0,
    avatar:
      profileAvatar === "__none__"
        ? null
        : profileAvatar || customer.avatar_url || null,
    isAdmin: customer.role === "administrator",
    shippingAddress: fromWcAddress(customer.shipping),
    billingAddress: fromWcAddress(customer.billing),
  };
}

// Light order shape sent to the client (never expose the raw WC payload).
export function mapOrder(order, store = { id: "maya-herbs", name: "Maya Herbs" }) {
  return {
    id: `${store.id}:${order.id}`,
    storeId: store.id,
    storeName: store.name,
    number: order.number,
    status: order.status,
    dateCreated: order.date_created,
    total: order.total,
    currency: order.currency,
    paymentMethodTitle: order.payment_method_title,
    customerNote: order.customer_note,
    items: (order.line_items || []).map((li) => ({
      name: li.name,
      sku: li.sku,
      productId: li.product_id || null,
      variationId: li.variation_id || null,
      quantity: li.quantity,
      total: li.total,
    })),
  };
}

export function mapProduct(
  product,
  variations = [],
  categoryContext = {},
  store = { id: "maya-herbs", name: "Maya Herbs" }
) {
  const { parentById = {}, nameById = {} } = categoryContext;

  const options =
    product.type === "variable" && variations.length > 0
      ? variations
          .filter((v) => v.purchasable !== false)
          .map(mapVariationToOption)
          .sort((a, b) => (a.weightGrams ?? Infinity) - (b.weightGrams ?? Infinity))
      : [
          {
            name: parseGramsFromText(product.name) ? `${parseGramsFromText(product.name)}g` : "Default",
            price: parseFloat(product.price) || 0,
            rolePrices: roleBasedPrices(product.meta_data),
            sku: product.sku || String(product.id),
            weightGrams: extractWeightGrams(product.name, product.weight),
            wcVariationId: null,
            inStock: product.stock_status !== "outofstock",
            stockQuantity:
              product.stock_quantity == null ? null : Number(product.stock_quantity),
          },
        ];

  const trackedQuantities = options
    .map((option) => option.stockQuantity)
    .filter(Number.isFinite);
  const stockQuantity =
    trackedQuantities.length > 0
      ? trackedQuantities.reduce((total, quantity) => total + quantity, 0)
      : null;

  // Category hierarchy: top-level Maya catalog groups are the product
  // category; subcategories become the more specific product type or tribe.
  const cats = product.categories || [];
  const topCats = cats.filter((c) => !parentById[c.id]);
  const subCats = cats.filter((c) => parentById[c.id]);
  const categoryPath = deepestCategoryPath(cats, parentById, nameById);

  const tribe =
    attributeOption(product.attributes, "tribe") ||
    subCats[0]?.name ||
    "";

  return {
    // Prefix with the store id so equal slugs from different backends never collide.
    id: `${store.id}~${product.slug}`,
    storeId: store.id,
    storeName: store.name,
    wcId: product.id,
    productType: product.type,
    optionsLoaded: product.type !== "variable" || variations.length > 0,
    name: decodeHtmlEntities(product.name),
    sku: product.sku || String(product.id),
    category:
      categoryPath[0] ||
      topCats[0]?.name ||
      (subCats[0] && topLevelCategoryName(subCats[0].id, parentById, nameById)) ||
      cats[0]?.name ||
      "Uncategorized",
    categoryPath,
    subcategory: categoryPath[1] || "",
    childCategory: categoryPath[2] || "",
    tribe,
    image: product.images?.[0]?.src || null,
    images: (product.images || []).map((img) => img.src),
    description: stripHtml(product.short_description) || stripHtml(product.description),
    isNew: product.featured === true || (product.tags || []).some((t) => t.slug === "new"),
    inStock:
      product.stock_status !== "outofstock" &&
      options.some((option) => option.inStock !== false),
    stockQuantity,
    attributes: mapProductAttributes(product.attributes),
    options,
  };
}

export function mapStoreProduct(
  product,
  variations = [],
  categoryContext = {},
  store = { id: "maya-herbs", name: "Maya Herbs" }
) {
  const { parentById = {}, nameById = {} } = categoryContext;
  const options =
    product.type === "variable" && variations.length > 0
      ? variations
          .filter((variation) => variation.is_purchasable !== false)
          .map(mapStoreVariationToOption)
          .sort((a, b) => (a.weightGrams ?? Infinity) - (b.weightGrams ?? Infinity))
      : [
          {
            name: parseGramsFromText(product.name)
              ? `${parseGramsFromText(product.name)}g`
              : "Default",
            price: storePrice(product.prices),
            rolePrices: {},
            sku: product.sku || String(product.id),
            weightGrams: extractWeightGrams(product.name, null),
            wcVariationId: null,
            inStock: product.is_in_stock !== false,
            stockQuantity: null,
          },
        ];

  const cats = product.categories || [];
  const topCats = cats.filter((category) => !parentById[category.id]);
  const subCats = cats.filter((category) => parentById[category.id]);
  const categoryPath = deepestCategoryPath(cats, parentById, nameById);
  const tribe =
    attributeOption(product.attributes, "tribe") ||
    subCats[0]?.name ||
    "";

  return {
    id: `${store.id}~${product.slug}`,
    storeId: store.id,
    storeName: store.name,
    wcId: product.id,
    productType: product.type,
    optionsLoaded: product.type !== "variable" || variations.length > 0,
    name: decodeHtmlEntities(product.name),
    sku: product.sku || String(product.id),
    category:
      categoryPath[0] ||
      topCats[0]?.name ||
      (subCats[0] && topLevelCategoryName(subCats[0].id, parentById, nameById)) ||
      cats[0]?.name ||
      "Uncategorized",
    categoryPath,
    subcategory: categoryPath[1] || "",
    childCategory: categoryPath[2] || "",
    tribe,
    image: product.images?.[0]?.src || null,
    images: (product.images || []).map((image) => image.src),
    description: stripHtml(product.short_description) || stripHtml(product.description),
    isNew: (product.tags || []).some((tag) => tag.slug === "new"),
    inStock:
      product.is_in_stock !== false &&
      options.some((option) => option.inStock !== false),
    stockQuantity: null,
    stockKnown: true,
    attributes: mapProductAttributes(product.attributes),
    options,
  };
}

export function mapProductForRole(product, variations, categoryContext, role, store) {
  const mapped = mapProduct(product, variations, categoryContext, store);
  return {
    ...mapped,
    options: mapped.options.map((option) => ({
      ...option,
      rolePrices:
        role && option.rolePrices?.[role] != null ? { [role]: option.rolePrices[role] } : {},
    })),
  };
}
