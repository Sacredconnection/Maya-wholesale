import test from "node:test";
import assert from "node:assert/strict";
import { isApprovedWholesaleCustomer } from "../src/lib/wholesale-approval.mjs";

test("Customer role requires explicit approval and cannot override pending markers", () => {
  assert.equal(isApprovedWholesaleCustomer({ role: "customer", meta_data: [
    { key: "maya_account_status", value: "pending_approval" },
    { key: "sc_approval_status", value: "pending" },
  ] }), false);
  assert.equal(isApprovedWholesaleCustomer({ role: "customer" }), false);
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
