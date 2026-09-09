import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

// Resolve the project's Next.js alias for the Node test runner.
const source = (await readFile(new URL("../src/lib/wc-mappers.js", import.meta.url), "utf8"))
  .replace("@/lib/lead-time-policy.mjs", new URL("../src/lib/lead-time-policy.mjs", import.meta.url).href);
const { isApprovedWholesaleCustomer } = await import(
  `data:text/javascript;base64,${Buffer.from(source).toString("base64")}`
);

test("Customer role is approved even with stale pending markers", () => {
  assert.equal(isApprovedWholesaleCustomer({ role: "customer", meta_data: [
    { key: "maya_account_status", value: "pending_approval" },
    { key: "sc_approval_status", value: "pending" },
  ] }), true);
  assert.equal(isApprovedWholesaleCustomer({ role: "customer" }), true);
});

test("pending roles cannot gain access from stale approved metadata", () => {
  for (const role of ["pending", "pending_approval"]) {
    assert.equal(isApprovedWholesaleCustomer({ role, meta_data: [
      { key: "maya_account_status", value: "approved" },
    ] }), false);
  }
});

test("missing customers fail closed and existing wholesale decisions are preserved", () => {
  assert.equal(isApprovedWholesaleCustomer(null), false);
  assert.equal(isApprovedWholesaleCustomer({}), false);
  assert.equal(isApprovedWholesaleCustomer({ role: "wholesale_customer" }), true);
  assert.equal(isApprovedWholesaleCustomer({ role: "wholesale_customer", meta_data: [
    { key: "sc_approval_status", value: "pending" },
  ] }), false);
});
