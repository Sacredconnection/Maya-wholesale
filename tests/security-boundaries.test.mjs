import { ORDER_CONFIRMATION } from "../src/lib/payment-methods.js";
import test from "node:test";
import assert from "node:assert/strict";
import { createHmac, timingSafeEqual } from "node:crypto";
import { isIP } from "node:net";
import sharp from "sharp";
import { readLimitedBody, RequestBodyError } from "../src/lib/body-limits.mjs";
import { normalizeImage } from "../src/lib/safe-image.mjs";
import { isSessionCurrent } from "../src/lib/session-customer.mjs";
import { isApprovedWholesaleCustomer } from "../src/lib/wholesale-approval.mjs";
import { loadModule } from "./helpers/load-module.mjs";
import { calculateDiscountedLines } from "../src/lib/order-totals.mjs";

const securityError = (error, status) => Response.json({ error }, { status });
const customer = { id: 42, email: "test@example.com", role: "customer", meta_data: [
  { key: "sc_channel", value: "wholesale-portal" }, { key: "sc_approval_status", value: "approved" }, { key: "maya_account_status", value: "approved" },
] };
const session = { customerId: 42, email: customer.email };

test("stream limits work without Content-Length and cancel oversized streams", async () => {
  let cancelled = false;
  const stream = new ReadableStream({ start(c) { c.enqueue(new Uint8Array(6)); c.enqueue(new Uint8Array(6)); }, cancel() { cancelled = true; } });
  await assert.rejects(readLimitedBody(new Response(stream), 10), (e) => e.status === 413);
  assert.equal(cancelled, true);
  assert.equal((await readLimitedBody(new Response("abcd"), 4)).toString(), "abcd");
});
test("JSON endpoints reject null, arrays, primitives and invalid JSON", async () => {
  const { readJsonBody } = await loadModule("src/lib/request-security.js", ["readJsonBody"], { readLimitedBody, RequestBodyError });
  for (const body of ["null", "[]", "42", '"text"', "{"]) {
    await assert.rejects(readJsonBody(new Request("https://portal.test", { method: "POST", headers: { "Content-Type": "application/json" }, body })), (e) => e.status === 400);
  }
});
test("CSRF guards reject absent, cross-site and malformed origins", async () => {
  const { isSameOrigin } = await loadModule("src/lib/request-security.js", ["isSameOrigin"], { readLimitedBody, RequestBodyError });
  for (const origin of ["", "https://evil.test", "null"]) {
    assert.equal(isSameOrigin(new Request("https://portal.test/api", { headers: origin ? { origin } : {} })), false);
  }
  assert.equal(isSameOrigin(new Request("https://portal.test/api", { headers: { origin: "https://portal.test" } })), true);
});
test("session identity and version must match the authoritative customer", () => {
  assert.equal(isSessionCurrent(session, customer), true);
  assert.equal(isSessionCurrent({ ...session, customerId: 2 }, customer), false);
  assert.equal(isSessionCurrent({ ...session, email: "other@example.com" }, customer), false);
  const reset = { ...customer, meta_data: [...customer.meta_data, { key: "sc_session_version", value: "new-version" }] };
  assert.equal(isSessionCurrent(session, reset), false);
  assert.equal(isSessionCurrent({ ...session, sessionVersion: "new-version" }, reset), true);
});
test("unapproved subscriber/editor roles do not grant wholesale access", () => {
  for (const role of ["subscriber", "editor", "author", "contributor", "unexpected_role"]) {
    assert.equal(isApprovedWholesaleCustomer({ role, meta_data: [] }), false);
  }
});
for (const route of ["orders", "payment-methods"]) {
  test(route + " rejects revoked approval and reset sessions before reading data", async () => {
    for (const current of [{ ...customer, role: "pending" }, { ...customer, meta_data: [...customer.meta_data, { key: "sc_session_version", value: "reset" }] }]) {
      let read = false;
      const { GET } = await loadModule("src/app/api/" + route + "/route.js", ["GET"], {
        getSession: async () => session, getLocalDevSessionUser: () => null,
        getCustomerByEmail: async () => current, isApprovedWholesaleCustomer, isSessionCurrent,
        getMissingCommerceStores: () => [], getRequiredCommerceStores: () => [{ id: "maya-herbs" }],
        getOrdersByEmail: async () => { read = true; return []; }, getPaymentGateway: async () => { read = true; return {}; },
        securityError, ORDER_CONFIRMATION, bankTransferOrderNote: () => "", MANUAL_BANK_TRANSFER: { id: "bank" }, BUNQ_CARD_PAYMENT: { id: "card" },
      });
      assert.equal((await GET(new Request("https://portal.test"))).status, 401);
      assert.equal(read, false);
    }
  });
}
test("images are decoded and re-encoded; fake images and SVG are rejected", async () => {
  const png = await sharp({ create: { width: 2, height: 2, channels: 3, background: "white" } }).png().toBuffer();
  const output = await normalizeImage(Buffer.concat([png, Buffer.from("<script>attack</script>")]), 512);
  assert.equal(output.includes(Buffer.from("<script>")), false);
  assert.equal((await sharp(output).metadata()).format, "png");
  await assert.rejects(normalizeImage(Buffer.from([0xff, 0xd8, 0xff, 0, 0]), 512));
  await assert.rejects(normalizeImage(Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="1" height="1"></svg>'), 512));
});
test("image proxy rejects private destinations, nonstandard ports, credentials and redirects", async () => {
  let called = false;
  const { GET } = await loadModule("src/app/api/catalog/image/route.js", ["GET"], {
    getCommerceStoreOrigins: () => ["https://store.test"], normalizeImage, readLimitedBody, RequestBodyError,
    fetch: async (url, options) => { called = true; assert.equal(options.redirect, "error"); throw Error("redirect"); },
  });
  for (const url of ["http://127.0.0.1/wp-content/uploads/a.png", "https://store.test:444/wp-content/uploads/a.png", "https://user:pass@store.test/wp-content/uploads/a.png", "https://store.test/wp-admin/a.png"]) {
    assert.equal((await GET(new Request("https://portal.test/api?url=" + encodeURIComponent(url)))).status, 403);
  }
  assert.equal(called, false);
  assert.equal((await GET(new Request("https://portal.test/api?url=" + encodeURIComponent("https://store.test/wp-content/uploads/a.png")))).status, 502);
});
test("rate limits hash identifiers, use trusted IPs and fail closed", async () => {
  const env = { SESSION_SECRET: "s".repeat(32), WP_ADMIN_USER: "admin", WP_APP_PASSWORD: "test", VERCEL: "1" };
  let payload;
  const { enforceRateLimit, trustedClientIp } = await loadModule("src/lib/auth-rate-limit.js", ["enforceRateLimit", "trustedClientIp"], {
    process: { env }, createHmac, isIP, getWooCommerceBaseUrl: () => "https://store.test", securityError,
    fetch: async (_url, options) => { payload = JSON.parse(options.body); return Response.json({ allowed: false, retryAfter: 15 }); },
  });
  const request = new Request("https://portal.test", { headers: { "x-vercel-forwarded-for": "203.0.113.1", "x-forwarded-for": "1.2.3.4" } });
  assert.equal(trustedClientIp(request), "203.0.113.1");
  const response = await enforceRateLimit(request, "login", "someone@example.com");
  assert.equal(response.status, 429);
  assert.equal(response.headers.get("Retry-After"), "15");
  assert.match(payload.accountKey, /^[a-f0-9]{64}$/);
  assert.equal(JSON.stringify(payload).includes("someone"), false);
  delete env.VERCEL;
  assert.equal(trustedClientIp(request), "unknown");
  delete env.WP_APP_PASSWORD;
  assert.equal((await enforceRateLimit(request, "login", "someone@example.com")).status, 503);
});
test("signed cookies reject tampering and carry secure production options", async () => {
  let cookie;
  const store = { set(name, value, options) { cookie = { name, value, options }; }, get() { return cookie; }, delete() { cookie = null; } };
  const { createSession, getSession } = await loadModule("src/lib/session.js", ["createSession", "getSession"], {
    createHmac, timingSafeEqual, cookies: async () => store,
    process: { env: { NODE_ENV: "production", SESSION_SECRET: "s".repeat(32) } },
  });
  await createSession({ email: customer.email, customerId: 42, sessionVersion: "version" });
  assert.equal((await getSession()).sessionVersion, "version");
  assert.equal(cookie.options.httpOnly, true);
  assert.equal(cookie.options.secure, true);
  assert.equal(cookie.options.sameSite, "strict");
  cookie.value = "tampered." + cookie.value.split(".")[1];
  assert.equal(await getSession(), null);
});

async function submitOrder(items, parent = {}) {
  let created;
  const product = { id: 10, status: "publish", type: "simple", price: "12.50", stock_quantity: 10, stock_status: "instock", categories: [], ...parent };
  const { POST } = await loadModule("src/app/api/orders/route.js", ["POST"], {
    getSession: async () => session, getLocalDevSessionUser: () => null,
    getCustomerByEmail: async () => customer, isApprovedWholesaleCustomer, isSessionCurrent,
    isSameOrigin: () => true, readJsonBody: async () => ({ items }),
    getMissingCommerceStores: () => [], getRequiredCommerceStores: () => [{ id: "maya-herbs", name: "Maya" }],
    PRIMARY_STORE_ID: "maya-herbs", getProductById: async () => product,
    getVariationById: async () => ({ ...product, type: "variation", id: 11 }),
    findProductBySku: async () => ({ ...product, type: "variation", id: 11, parent_id: 10 }),
    enforceRateLimit: async () => null, mapCustomerToUser: () => ({ ...customer, shippingAddress: {}, billingAddress: {} }),
    getPaymentGateway: async () => ({ enabled: true }), createOrder: async (order) => { created = order; return { id: 1, ...order }; },
    mapOrder: (order) => order, securityError, ORDER_CONFIRMATION, bankTransferOrderNote: () => "",
    MANUAL_BANK_TRANSFER: { id: "bank", title: "Bank" }, BUNQ_CARD_PAYMENT: { id: "card" },
    cleanText: (s) => String(s || ""), extractWeightGrams: () => 0, roleBasedPrices: () => ({}), progressiveTableKeyFor: () => "default", NEW_CUSTOMER_ROLE: "New Customer",
    calculateDiscountedLines, toWcAddress: (s) => s, createHash: (await import("node:crypto")).createHash,
    WooCommerceApiError: class extends Error {},
  });
  const response = await POST(new Request("https://portal.test", { headers: { "Idempotency-Key": "test-key-123" } }));
  return { response, created };
}
test("repeating a product cannot bypass aggregate stock validation", async () => {
  const { response, created } = await submitOrder([{ wcProductId: 10, quantity: 6 }, { wcProductId: 10, quantity: 6 }]);
  assert.equal(response.status, 409);
  assert.equal(created, undefined);
});
test("orders use server prices and ignore client-supplied totals", async () => {
  const { response, created } = await submitOrder([{ wcProductId: 10, quantity: 2, price: 0.01, total: 0.02 }]);
  assert.equal(response.status, 201);
  assert.equal(created.line_items[0].total, "25.00");
});
test("unpublished products and variable parents cannot be purchased directly", async () => {
  for (const [item, product] of [[{ wcProductId: 10, quantity: 1 }, { status: "draft" }], [{ wcProductId: 10, quantity: 1 }, { type: "variable" }], [{ sku: "variation", quantity: 1 }, { status: "draft" }]]) {
    const { response, created } = await submitOrder([item], product);
    assert.equal(response.status, 409);
    assert.equal(created, undefined);
  }
});
test("password recovery performs no account-dependent work before the generic response", async () => {
  const queued = []; let called = false;
  const { POST } = await loadModule("src/app/api/auth/forgot-password/route.js", ["POST"], {
    isSameOrigin: () => true, cleanText: (s) => s, isValidEmail: () => true,
    readJsonBody: async () => ({ email: "test@example.com" }), enforceRateLimit: async () => null,
    trustedClientIp: () => "unknown", after: (fn) => queued.push(fn),
    requestWordPressPasswordReset: async () => { called = true; throw Error("unknown user or mail failure"); },
  });
  const response = await POST({});
  assert.equal(response.status, 200);
  assert.equal(called, false);
  await queued[0]();
  assert.equal(called, true);
});
