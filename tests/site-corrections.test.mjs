import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";
import { loadModule } from "./helpers/load-module.mjs";
import { categoryLabel, organizeCatalogProduct, compareCatalogProducts, HAPE_CATEGORIES } from "../src/lib/catalog-organization.mjs";
import { readCatalogOrderWorkbook, ORDER_WORKBOOK_META_SHEET } from "../src/lib/catalog-order-workbook.js";
import { ORDER_CONFIRMATION, MANUAL_BANK_TRANSFER, bankTransferOrderNote } from "../src/lib/payment-methods.js";

const require = createRequire(import.meta.url);
const source = (await readFile(new URL("../src/lib/catalog-export.js", import.meta.url), "utf8"))
  .replace(/from "@\/lib\/([^"]+)"/g, (_, name) => `from "${new URL("../src/lib/" + name + (/\.m?js$/.test(name) ? "" : ".js"), import.meta.url).href}"`)
  .replace(/import\("(exceljs|jspdf)"\)/g, (_, name) => `import("${pathToFileURL(require.resolve(name)).href}")`);
const { createCatalogOrderWorkbook, renderDigitalCatalogPdf } = await import("data:text/javascript;base64," + Buffer.from(source).toString("base64"));
const product = (id, category, subcategory = "") => ({ id, storeId: "maya-herbs", name: "Product " + id, sku: String(id), category, subcategory, description: "Traditional botanical product from the source community.", options: [{ sku: id + "-25", name: "25 g", price: 8, weightGrams: 25 }, { sku: id + "-100", name: "100 g", price: 20, weightGrams: 100 }] });

test("confirmed Hapé paths have the requested category order without renaming other Shamanic products", () => {
  const products = ["Ashes", "Rapéh Tools", "Tobacco Free", "Shamanic Snuff", "Tribal"].map((subcategory, i) => organizeCatalogProduct({ ...product(i, "Rapé", subcategory), categoryPath: ["Rapé", subcategory, "Source"] }));
  assert.deepEqual(products.sort(compareCatalogProducts).map(p => p.subcategory), HAPE_CATEGORIES);
  assert.equal(categoryLabel("Shamanic"), "Shamanic");
  assert.ok(products.every(p => p.category === "Rapé"));
  assert.equal(products[0].childCategory, "Source");
  assert.deepEqual(organizeCatalogProduct(products[0]), products[0]);
  const accessories = product("other", "Accessories");
  assert.deepEqual(organizeCatalogProduct(accessories), accessories);
  assert.deepEqual(products[0].sourceCategoryPath, ["Rapé", "Tribal", "Source"]);
});

test("English category workbooks round-trip quantities from multiple tabs, preserving SKUs and totals", async () => {
  const workbook = await createCatalogOrderWorkbook({ products: [product("002", "Accessories"), product("001", "Indigenous Hapé", "Nukini")], user: {}, includeLinks: false });
  const sheets = workbook.worksheets.filter(sheet => !["Instructions", ORDER_WORKBOOK_META_SHEET].includes(sheet.name));
  assert.deepEqual(sheets.map(s => s.name), ["Indigenous Hapé", "Accessories"]);
  for (const sheet of sheets) {
    assert.equal(sheet.getCell("B5").value, "Quantity");
    assert.equal(sheet.getCell("H5").value, "Unit price (EUR)");
    assert.match(sheet.getCell("C6").value, /Traditional/);
    assert.deepEqual(sheet.getCell("I6").value, { formula: 'IF(B6>0,B6*H6,"")' });
    sheet.getCell("B6").value = 2;
  }
  const bytes = await workbook.xlsx.writeBuffer();
  const imported = await readCatalogOrderWorkbook({ size: bytes.length, arrayBuffer: async () => bytes });
  assert.deepEqual(imported, [{ storeId: "maya-herbs", sku: "001-25", quantity: 2 }, { storeId: "maya-herbs", sku: "002-25", quantity: 2 }]);
  sheets[0].getCell("B6").value = 1001;
  const invalid = await workbook.xlsx.writeBuffer();
  await assert.rejects(readCatalogOrderWorkbook({ arrayBuffer: async () => invalid }), /Invalid quantity/);
});

test("legacy Portuguese Order workbooks remain importable", async () => {
  const workbook = await createCatalogOrderWorkbook({ products: [product("001", "Accessories")], user: {} });
  const sheet = workbook.getWorksheet("Accessories");
  sheet.name = "Order";
  sheet.getCell("B5").value = "Quantidade";
  sheet.getCell("B7").value = 3;
  const bytes = await workbook.xlsx.writeBuffer();
  assert.deepEqual(await readCatalogOrderWorkbook({ arrayBuffer: async () => bytes }), [{ storeId: "maya-herbs", sku: "001-100", quantity: 3 }]);
});

test("PDF formats handle long descriptions and include no images in compact output", async () => {
  const originalDocument = globalThis.document;
  globalThis.document = { createElement: () => ({ set innerHTML(value) { this.value = value; } }) };
  try {
    const products = [product("001", "Indigenous Hapé", "Nukini")];
    products[0].description = "A long description of this botanical product and its traditional origin. ".repeat(150);
    const detailed = await renderDigitalCatalogPdf({ products, loadImages: false });
    const compact = await renderDigitalCatalogPdf({ products, loadImages: false, format: "compact" });
    assert.ok(detailed.getNumberOfPages() > 1);
    assert.equal(compact.getNumberOfPages(), 1);
    assert.ok(!compact.output().includes("/Subtype /Image"));
  } finally { globalThis.document = originalDocument; }
});

test("login uses the private REST bridge and never falls back after rejected admin credentials", async () => {
  const calls = [];
  const stubs = { process: { env: { WP_ADMIN_USER: "admin", WP_APP_PASSWORD: "test" } }, getWooCommerceBaseUrl: () => "https://store.test", fetch: async (url, options) => { calls.push({url,options}); return Response.json({ valid: true }); } };
  const auth = await loadModule("src/lib/wp-auth.js", ["verifyWpCredentials"], stubs);
  assert.equal((await auth.verifyWpCredentials("client@test.invalid", "secret")).valid, true);
  assert.ok(calls[0].url.endsWith("/auth/verify"));
  assert.equal(calls[0].options.redirect, "error");
  let count = 0;
  const rejected = await loadModule("src/lib/wp-auth.js", ["verifyWpCredentials"], { ...stubs, fetch: async () => { count++; return Response.json({ code: "rest_forbidden" }, { status: 401 }); } });
  await assert.rejects(rejected.verifyWpCredentials("client@test.invalid", "secret"), /unavailable/);
  assert.equal(count, 1);
});

test("checkout address saving preserves account email, phone and unrelated metadata", async () => {
  let saved;
  const address = { street: "Main Street 1", city: "Haarlem", zip: "2031", country: "NL" };
  const customer = { id: 42, email: "client@test.invalid", billing: { email: "client@test.invalid", phone: "123", vat: "retained" }, shipping: { phone: "456" } };
  const { POST } = await loadModule("src/app/api/account/checkout-details/route.js", ["POST"], {
    getSession: async () => ({ email: customer.email }), isSameOrigin: () => true,
    cleanText: value => String(value || "").trim(), readJsonBody: request => request.json(),
    isSupportedCountryCode: value => value === "NL", getCustomerByEmail: async () => customer,
    isApprovedWholesaleCustomer: () => true, isSessionCurrent: () => true,
    toWcAddress: a => ({ address_1: a.street, city: a.city, postcode: a.zip, country: a.country }),
    updateCustomer: async (id, payload) => { saved = { id, payload }; return customer; },
    mapCustomerToUser: value => value, securityError: (error,status) => Response.json({error},{status}),
  });
  const response = await POST(new Request("https://portal.test/api/account/checkout-details", { method: "POST", body: JSON.stringify({ firstName: "Test", lastName: "Client", company: "Maya", billingAddress: address, shippingAddress: address, email: "attacker@test.invalid" }) }));
  assert.equal(response.status, 200);
  assert.equal(saved.id, 42);
  assert.equal(saved.payload.billing.email, customer.email);
  assert.equal(saved.payload.billing.phone, "123");
  assert.equal(saved.payload.billing.vat, "retained");
  assert.equal(saved.payload.shipping.address_1, "Main Street 1");
});

test("checkout and email share invoice-first confirmation without bank account details", async () => {
  assert.match(MANUAL_BANK_TRANSFER.title, /after receiving the invoice/);
  assert.doesNotMatch(JSON.stringify(MANUAL_BANK_TRANSFER) + bankTransferOrderNote(), /IBAN|INGB|BIC|Account Name/i);
  const template = await readFile(new URL("../integrations/wordpress/maya-wholesale-site-corrections/templates/order-received.php", import.meta.url), "utf8");
  assert.ok(template.includes(ORDER_CONFIRMATION));
  assert.doesNotMatch(template, /woocommerce_email_before_order_table|customer_note|additional_content/);
});
