// Client-safe pricing helpers (no secrets here). Also imported server-side by
// /api/orders so the order totals use exactly the same rules as the UI.

// Minimum wholesale order weight, enforced in the cart UI and re-validated
// server-side when the order is registered.
export const MIN_ORDER_GRAMS = 250;

// ── Progressive weight-based pricing (New Customer level) ───────────────────
// For the "New Customer" access level the price is per gram and the rate
// improves with the TOTAL ORDER WEIGHT. Each product line has its own table:
//   Indigenous (default): 100g+ $1.20/g · 250g+ $1.00/g · 500g+ $0.80/g · 1kg+ $0.60/g
//   Shamanic (Maya Herbs line): 100g+ $1.00/g · 250g+ $0.90/g · 500g+ $0.70/g · 1kg+ $0.50/g
// The tier is chosen by the total order weight; the rate applied to each item
// comes from that item's own table. Other levels use the flat role prices
// configured per variation in WooCommerce (_role_based_pricing_rules).

export const NEW_CUSTOMER_ROLE = "New Customer";

export const PROGRESSIVE_TABLES = {
  default: [
    { minGrams: 1000, perGram: 0.6 },
    { minGrams: 500, perGram: 0.8 },
    { minGrams: 250, perGram: 1.0 },
    { minGrams: 100, perGram: 1.2 },
  ],
  shamanic: [
    { minGrams: 1000, perGram: 0.5 },
    { minGrams: 500, perGram: 0.7 },
    { minGrams: 250, perGram: 0.9 },
    { minGrams: 100, perGram: 1.0 },
  ],
};

// Product categories (top-level WC category name) priced by the shamanic table.
const SHAMANIC_CATEGORIES = ["maya herbs"];

export const progressiveTableKeyFor = (category) =>
  SHAMANIC_CATEGORIES.includes((category || "").toLowerCase()) ? "shamanic" : "default";

// Rate for a given weight within a table, or null below the first tier.
export function progressivePerGramRate(totalGrams, tableKey = "default") {
  const table = PROGRESSIVE_TABLES[tableKey] || PROGRESSIVE_TABLES.default;
  for (const tier of table) {
    if (totalGrams >= tier.minGrams) return tier.perGram;
  }
  return null;
}

const isNewCustomer = (user) => user?.role === NEW_CUSTOMER_ROLE;

/**
 * Price shown in the catalog / product page for one option, before the cart
 * total is known. For New Customer the option's own weight sets the tier
 * (e.g. an indigenous 500g option shows 500 × $0.80 = $400); the cart then
 * re-rates everything by the full order weight. `category` is the product's
 * top-level category, used to pick the tier table.
 */
export function optionPriceForUser(option, user, category) {
  if (!option) return 0;

  if (isNewCustomer(user) && option.weightGrams > 0) {
    const rate = progressivePerGramRate(option.weightGrams, progressiveTableKeyFor(category));
    if (rate != null) return option.weightGrams * rate;
  }

  const rolePrice = user?.role ? option.rolePrices?.[user.role] : undefined;
  return rolePrice != null ? rolePrice : option.price || 0;
}

/**
 * Effective unit price of a cart item once the whole order weight is known.
 * For New Customer every weighted item is charged weight × the order-tier
 * rate from the item's own table; other levels keep the price captured when
 * the item was added. Items must carry `category`.
 */
export function cartUnitPrice(item, user, orderTotalGrams) {
  if (isNewCustomer(user) && item.weightGrams > 0) {
    const rate = progressivePerGramRate(
      orderTotalGrams,
      progressiveTableKeyFor(item.category)
    );
    if (rate != null) return item.weightGrams * rate;
  }
  return item.price || 0;
}
