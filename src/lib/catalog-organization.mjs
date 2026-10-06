// One presentation order for the online catalog, PDF and Excel exports.
const normalize = (value) => String(value || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();

export const HAPE_CATEGORIES = ["Indigenous Hapé", "Sacred Snuff Hapé", "Tobacco-free Hapé", "Accessories", "Ashes"];

export function categoryLabel(value) {
  const key = normalize(value);
  if (["tribal", "pribera", "rape indigenous", "indigenous rape", "indigenous hape"].includes(key)) return HAPE_CATEGORIES[0];
  if (["sacred snuff", "sacred snuff hape", "shamanic snuff", "rape shamanic"].includes(key)) return HAPE_CATEGORIES[1];
  if (["tobacco free", "tobacco-free hape", "tobacco free hape", "shamanic tobacco free", "tobacco-free rape", "tobacco free rape"].includes(key)) return HAPE_CATEGORIES[2];
  if (["rapeh tools", "rape tools", "hape tools"].includes(key)) return "Accessories";
  if (["rape", "rapeh"].includes(key)) return "Hapé";
  return value || "Other";
}

export function compareCategories(a, b) {
  const left = categoryLabel(a), right = categoryLabel(b);
  const ai = HAPE_CATEGORIES.indexOf(left), bi = HAPE_CATEGORIES.indexOf(right);
  return (ai < 0 ? 99 : ai) - (bi < 0 ? 99 : bi) || normalize(left).localeCompare(normalize(right));
}

export function compareCatalogProducts(a, b) {
  return compareCategories(a.category, b.category) ||
    compareCategories(a.subcategory || a.tribe, b.subcategory || b.tribe) ||
    compareCategories(a.childCategory, b.childCategory) || normalize(a.name).localeCompare(normalize(b.name));
}

export function catalogGroups(products) {
  const groups = new Map();
  [...products].sort(compareCatalogProducts).forEach((product) => {
    const path = [categoryLabel(product.category), categoryLabel(product.subcategory || product.tribe || product.category), product.childCategory ? categoryLabel(product.childCategory) : ""];
    const heading = [...new Set(path.filter(Boolean))].join(" / ");
    if (!groups.has(heading)) groups.set(heading, { heading, category: path[0], products: [] });
    groups.get(heading).products.push(product);
  });
  return [...groups.values()];
}

export const productFormats = (product) => [...new Set((product.options || []).map((option) => option.name || (option.weightGrams ? `${option.weightGrams} g` : "Single format")))].join(", ");

// Present the five Hapé ranges as categories while preserving their original
// WooCommerce path for traceability. Price rules are not edited here.
export function organizeCatalogProduct(product) {
  const path = product.categoryPath?.length ? product.categoryPath : [product.category, product.subcategory, product.childCategory].filter(Boolean);
  if (categoryLabel(path[0]) !== "Hapé" || !HAPE_CATEGORIES.includes(categoryLabel(path[1]))) return product;
  const categoryPath = [categoryLabel(path[1]), ...path.slice(2)];
  return { ...product, sourceCategoryPath: path, categoryPath, category: categoryPath[0], subcategory: categoryPath[1] || "", childCategory: categoryPath[2] || "" };
}
