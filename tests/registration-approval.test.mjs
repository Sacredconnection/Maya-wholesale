import test from "node:test";
import assert from "node:assert/strict";
import { loadModule } from "./helpers/load-module.mjs";

async function register({ initialRole = "customer", persistedRole = "pending", roleApplied = true, lookupFails = false, duplicate = false, limited = false, upstreamFails = false } = {}) {
  const calls = { deleted: [], roles: [], emails: 0, guidance: 0, failures: 0, queued: [] };
  class WooCommerceApiError extends Error {}
  const customer = { id: 42, role: initialRole };
  const scope = {
    Response, console: { error() {} },
    after: (callback) => calls.queued.push(callback),
    enforceRateLimit: async () => limited ? Response.json({ error: "Try later" }, { status: 429 }) : null,
    isSameOrigin: () => true, isWooCommerceConfigured: () => true,
    cleanText: (s) => String(s || "").trim(), isValidEmail: () => true,
    isSupportedCountryCode: () => true,
    readJsonBody: async () => ({ name: "Test Applicant", email: "test@example.com", vatNumber: "123", address: "Street", city: "City", state: "State", zip: "123", country: "NL" }),
    toWcAddress: (s) => s,
    createCustomer: async (payload) => {
      calls.payload = payload;
      if (duplicate) { const error = new WooCommerceApiError("email exists"); error.details = { code: "registration-error-email-exists" }; throw error; }
      if (upstreamFails) throw Error("offline");
      return customer;
    },
    getCustomerById: async () => { if (lookupFails) throw Error("offline"); return { ...customer, role: persistedRole }; },
    setWpUserRole: async (...args) => { calls.roles.push(args); return roleApplied; },
    deleteCustomer: async (id) => calls.deleted.push(id),
    sendApplicationReceivedEmail: async () => { calls.emails++; },
    sendApplicationNotificationEmail: async () => { calls.emails++; },
    updateCustomerMeta: async () => {},
    sendRegistrationGuidanceEmail: async () => { calls.guidance++; },
    sendRegistrationFailureEmail: async () => { calls.failures++; },
    mapCustomerToUser: (user) => ({ role: user.role, status: user.role === "pending" ? "PENDING" : "ACTIVE" }),
    securityError: (error, status) => Response.json({ error }, { status }),
    RequestBodyError: class extends Error {}, WooCommerceApiError,
  };
  const { POST } = await loadModule("src/app/api/auth/register/route.js", ["POST"], scope);
  const response = await POST({});
  assert.equal(calls.payload, undefined, "No account lookup/creation before responding");
  const body = await response.json();
  for (const callback of calls.queued) await callback();
  return { calls, response, body };
}

test("registration persists pending markers and verifies the stored role", async () => {
  const { calls, response, body } = await register();
  assert.equal(response.status, 202);
  assert.equal(body.accepted, true);
  assert.equal(body.user, undefined);
  assert.equal(calls.roles[0][1], "pending");
  assert.equal(calls.payload.meta_data.find((m) => m.key === "pw_user_status").value, "pending");
  assert.equal(calls.emails, 2);
});
test("WordPress can initialize pending without a second role assignment", async () => {
  const { calls, response } = await register({ initialRole: "pending" });
  assert.equal(response.status, 202);
  assert.equal(calls.roles.length, 0);
});
for (const scenario of [{ roleApplied: false }, { persistedRole: "customer" }, { lookupFails: true }]) {
  test("registration rolls back when pending cannot be verified: " + JSON.stringify(scenario), async () => {
    const { calls, response } = await register(scenario);
    assert.equal(response.status, 202);
    assert.deepEqual(calls.deleted, [42]);
    assert.equal(calls.emails, 0);
  });
}

test("existing and new emails have identical public responses and no synchronous lookup", async () => {
  const fresh = await register();
  const existing = await register({ duplicate: true });
  const failed = await register({ upstreamFails: true });
  for (const other of [existing, failed]) {
    assert.equal(other.response.status, fresh.response.status);
    assert.deepEqual(other.body, fresh.body);
    assert.deepEqual([...other.response.headers], [...fresh.response.headers]);
  }
  assert.equal(existing.calls.guidance, 1);
  assert.equal(existing.calls.emails, 0);
  assert.deepEqual(existing.calls.deleted, []);
});
test("rate limited requests do not schedule account mutations or emails", async () => {
  const { calls, response } = await register({ limited: true });
  assert.equal(response.status, 429);
  assert.equal(calls.queued.length, 0);
  assert.equal(calls.emails, 0);
});
