import { ORDER_CONFIRMATION } from "../src/lib/payment-methods.js";
import test from "node:test";
import assert from "node:assert/strict";
import { createHash, createHmac } from "node:crypto";
import { isIP } from "node:net";
import { loadModule } from "./helpers/load-module.mjs";
import { calculateDiscountedLines } from "../src/lib/order-totals.mjs";
import { customerMeta, isApprovedWholesaleCustomer } from "../src/lib/wholesale-approval.mjs";

const securityError = (error, status) => Response.json({ error }, { status });
const store = { id: "maya-herbs", name: "Maya", baseUrl: "https://store.test", consumerKey: "test", consumerSecret: "test" };
const product = { id: 10, name: "Pack", sku: "pack", status: "publish", type: "simple", price: "12.50", weight: "", stock_status: "instock", stock_quantity: 20, categories: [], attributes: [], meta_data: [] };
const mapper = await loadModule("src/lib/wc-mappers.js", ["extractWeightGrams", "roleBasedPrices"]);
const pricing = await loadModule("src/lib/pricing.js", ["progressivePerGramRate", "progressiveTableKeyFor", "NEW_CUSTOMER_ROLE"]);

async function orderFixture({ parent = {}, variation = {}, discountRate = 0, role = "customer" } = {}) {
  const created = [];
  const customer = { id: 42, email: "test@example.invalid", role };
  // Exercise the actual REST client projection, rather than mocks that return
  // fields the production request never asked for.
  const client = await loadModule("src/lib/woocommerce.js", ["getProductById", "getVariationById", "findProductBySku", "WooCommerceApiError"], {
    PRIMARY_STORE_ID: store.id, getCommerceStore: () => store, isCommerceStoreConfigured: () => true,
    fetch: async (url, options) => {
      assert.equal(options.cache, "no-store");
      const isVariation = url.pathname.includes("/variations/");
      const source = isVariation ? { ...product, id: 11, type: "variation", ...variation } : { ...product, ...parent };
      const fields = url.searchParams.get("_fields").split(",");
      const projected = Object.fromEntries(Object.entries(source).filter(([key]) => fields.includes(key)));
      return Response.json(url.searchParams.has("sku") ? [projected] : projected);
    },
  });
  const { POST } = await loadModule("src/app/api/orders/route.js", ["POST"], {
    ...client, ...mapper, ...pricing, calculateDiscountedLines, createHash,
    getSession: async () => ({ customerId: 42, email: customer.email }), getLocalDevSessionUser: () => null,
    getCustomerByEmail: async () => customer, isApprovedWholesaleCustomer: () => true, isSessionCurrent: () => true,
    isSameOrigin: () => true, readJsonBody: (request) => request.json(),
    getMissingCommerceStores: () => [], getRequiredCommerceStores: () => [store], PRIMARY_STORE_ID: store.id,
    enforceRateLimit: async () => null,
    mapCustomerToUser: () => ({ ...customer, discountRate, billingAddress: {}, shippingAddress: {} }),
    getPaymentGateway: async () => ({ enabled: true }),
    createOrder: async (payload) => { created.push(payload); return { id: created.length, ...payload }; },
    getOrdersByEmail: async () => [], mapOrder: (order) => order, securityError,
    ORDER_CONFIRMATION, bankTransferOrderNote: () => "", MANUAL_BANK_TRANSFER: { id: "bacs", title: "Bank" }, BUNQ_CARD_PAYMENT: { id: "card" },
    cleanText: (value) => String(value || ""), toWcAddress: (address) => address,
  });
  return {
    created,
    submit: (items, extra = {}) => POST(new Request("https://portal.test/api/orders", {
      method: "POST", headers: { "Content-Type": "application/json", "Idempotency-Key": "regression-key-123" },
      body: JSON.stringify({ items, ...extra }),
    })),
  };
}

test("real REST projections allow published simple, SKU and variation orders", async () => {
  for (const item of [{ wcProductId: 10, quantity: 1 }, { sku: "pack", quantity: 1 }, { wcProductId: 10, wcVariationId: 11, quantity: 1 }]) {
    const fixture = await orderFixture({ parent: { type: item.wcVariationId ? "variable" : "simple" } });
    assert.equal((await fixture.submit([item])).status, 201);
    assert.equal(fixture.created.length, 1);
  }
});

test("real REST projections retain publication and variable-parent protections", async () => {
  for (const [parent, variation, item] of [
    [{ status: "draft" }, {}, { wcProductId: 10, quantity: 1 }],
    [{ status: "draft" }, {}, { sku: "pack", quantity: 1 }],
    [{ status: "draft", type: "variable" }, {}, { wcProductId: 10, wcVariationId: 11, quantity: 1 }],
    [{ type: "variable" }, { status: "private" }, { wcProductId: 10, wcVariationId: 11, quantity: 1 }],
    [{ type: "variable" }, {}, { wcProductId: 10, quantity: 1 }],
  ]) {
    const fixture = await orderFixture({ parent, variation });
    assert.equal((await fixture.submit([item])).status, 409);
    assert.equal(fixture.created.length, 0);
  }
});

test("configured kg weights never change units at 5; explicit package units take precedence", () => {
  for (const [weight, grams] of [["0.028", 28], ["4", 4000], ["5", 5000], ["10", 10000]]) {
    assert.equal(mapper.extractWeightGrams("Pack", weight), grams);
  }
  assert.equal(mapper.extractWeightGrams("28gr", "5"), 28);
  assert.equal(mapper.extractWeightGrams("1,5 kg", "5"), 1500);
  assert.equal(mapper.extractWeightGrams("100 ml", ""), null);
  for (const value of ["", null, "bad", "5garbage", "Infinity", "-1", "0"]) {
    assert.equal(mapper.extractWeightGrams("Pack", value), null);
  }
});

test("discount allocation preserves the rounded order total across small lines", () => {
  const totals = calculateDiscountedLines([0.05, 0.05, 0.05], 10);
  assert.equal(totals.subtotal, 0.15);
  assert.equal(totals.discount, 0.02);
  assert.equal(totals.total, 0.13);
  assert.equal(totals.lines.reduce((sum, line) => sum + Math.round(line.total * 100), 0), 13);
  for (const rate of [0, 10, 33.33, 100]) {
    const result = calculateDiscountedLines([0, 1.005, 12.50, 999.99], rate);
    assert.equal(result.lines.reduce((sum, line) => sum + Math.round(line.total * 100), 0), Math.round(result.total * 100));
    assert.ok(result.lines.every((line) => line.total >= 0 && line.total <= line.subtotal));
  }
  for (const invalid of [-1, 101, Infinity, "bad"]) assert.equal(calculateDiscountedLines([25], invalid).total, 25);
  assert.throws(() => calculateDiscountedLines([NaN], 10));
  assert.equal(calculateDiscountedLines([], 10).total, 0);
});

test("order discount uses the authoritative account and ignores client prices and discount", async () => {
  for (const rate of [0, 10, 100]) {
    const fixture = await orderFixture({ discountRate: rate });
    const response = await fixture.submit([{ wcProductId: 10, quantity: 2, price: 0.01 }], { discountRate: 99 });
    assert.equal(response.status, 201);
    const line = fixture.created[0].line_items[0];
    assert.equal(line.subtotal, "25.00");
    assert.equal(line.total, (25 * (1 - rate / 100)).toFixed(2));
  }
});

test("discount follows authoritative role and progressive pricing", async () => {
  const roleFixture = await orderFixture({ role: "Special Customer", discountRate: 10, parent: {
    meta_data: [{ key: "_role_based_pricing_rules", value: { "Special Customer": { pricing_type: "flat", regular_price: "20" } } }],
  } });
  assert.equal((await roleFixture.submit([{ wcProductId: 10, quantity: 2 }])).status, 201);
  assert.equal(roleFixture.created[0].line_items[0].total, "36.00");
  const progressive = await orderFixture({ role: "New Customer", discountRate: 10, parent: { weight: "0.5" } });
  assert.equal((await progressive.submit([{ wcProductId: 10, quantity: 2 }])).status, 201);
  assert.equal(progressive.created[0].line_items[0].subtotal, "600.00");
  assert.equal(progressive.created[0].line_items[0].total, "540.00");
});

async function webhookFixture({ approved = false, rejected = false, failNotification = false } = {}) {
  const customer = { id: 42, role: approved ? "customer" : "pending", meta_data: [
    { key: "sc_channel", value: "wholesale-portal" },
    ...["sc_approval_status", "maya_account_status", "pw_user_status"].map((key) => ({ key, value: rejected ? "rejected" : approved ? "approved" : "pending" })),
  ] };
  const calls = { received: 0, notification: 0, approved: 0 };
  const { handleCustomerWebhook } = await loadModule("src/app/api/webhooks/woocommerce/route.js", ["handleCustomerWebhook"], {
    getCustomerById: async () => customer, customerMeta, isApprovedWholesaleCustomer,
    sendApplicationReceivedEmail: async () => { calls.received++; },
    sendApplicationNotificationEmail: async () => { calls.notification++; if (failNotification && calls.notification === 1) throw Error("Simulated provider failure"); },
    sendApplicationApprovedEmail: async () => { calls.approved++; },
    updateCustomerMeta: async (_customer, values) => {
      for (const [key, value] of Object.entries(values)) {
        customer.meta_data = customer.meta_data.filter((entry) => entry.key !== key);
        customer.meta_data.push({ key, value });
      }
      return customer;
    },
  });
  return { calls, invoke: (topic = "customer.updated") => handleCustomerWebhook(topic, { id: 42, arg: 42 }) };
}

test("customer.updated retries only missing registration messages after a partial failure", async () => {
  const fixture = await webhookFixture({ failNotification: true });
  await assert.rejects(fixture.invoke("customer.created"));
  assert.equal((await fixture.invoke()).emailSent, true);
  assert.equal((await fixture.invoke()).emailSent, false);
  assert.deepEqual(fixture.calls, { received: 1, notification: 2, approved: 0 });
});

test("approval email recovers on customer.updated with fully approved markers", async () => {
  const fixture = await webhookFixture({ approved: true });
  assert.equal((await fixture.invoke()).emailType, "application-approved");
  assert.equal((await fixture.invoke()).emailSent, false);
  assert.deepEqual(fixture.calls, { received: 0, notification: 0, approved: 1 });
});

test("rejected accounts never receive pending or approval messages", async () => {
  const fixture = await webhookFixture({ rejected: true });
  for (const topic of ["customer.created", "customer.updated", "action.woocommerce_sacred_wholesale_customer_approved"]) {
    assert.equal((await fixture.invoke(topic)).emailSent, false);
  }
  assert.deepEqual(fixture.calls, { received: 0, notification: 0, approved: 0 });
});

test("rate limit diagnostics distinguish HTTP, malformed responses and timeouts without secrets", async () => {
  for (const [failure, upstreamStatus, fetch] of [
    ["upstream_http", 404, async () => Response.json({ secret: "DO-NOT-LOG" }, { status: 404 })],
    ["invalid_response", 200, async () => new Response("DO-NOT-LOG")],
    ["invalid_response", 200, async () => Response.json(null)],
    ["timeout", null, async () => { const error = new Error("DO-NOT-LOG"); error.name = "TimeoutError"; throw error; }],
  ]) {
    const logs = [];
    const { enforceRateLimit } = await loadModule("src/lib/auth-rate-limit.js", ["enforceRateLimit"], {
      createHmac, isIP, securityError, getWooCommerceBaseUrl: () => store.baseUrl, fetch,
      process: { env: { SESSION_SECRET: "s".repeat(32), WP_ADMIN_USER: "DO-NOT-LOG", WP_APP_PASSWORD: "DO-NOT-LOG" } },
      console: { error: (...args) => logs.push(args) },
    });
    assert.equal((await enforceRateLimit(new Request("https://portal.test"), "order", "DO-NOT-LOG")).status, 503);
    assert.equal(logs[0][1].failure, failure);
    assert.equal(logs[0][1].upstreamStatus, upstreamStatus);
    assert.equal(JSON.stringify(logs).includes("DO-NOT-LOG"), false);
  }
});
