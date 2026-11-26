import test from "node:test";
import assert from "node:assert/strict";
import { isApprovedWholesaleCustomer } from "../src/lib/wholesale-approval.mjs";

const portalCustomer = (role, meta = {}) => ({
  role,
  meta_data: [
    { key: "sc_channel", value: "wholesale-portal" },
    ...Object.entries(meta).map(([key, value]) => ({ key, value })),
  ],
});

test("the pending WordPress role always blocks portal access", () => {
  assert.equal(
    isApprovedWholesaleCustomer(
      portalCustomer("pending", {
        sc_approval_status: "approved",
        maya_account_status: "approved",
      })
    ),
    false
  );
});

test("customer role overrides stale pending application metadata", () => {
  assert.equal(
    isApprovedWholesaleCustomer(
      portalCustomer("customer", {
        sc_approval_status: "pending",
        maya_account_status: "pending_approval",
      })
    ),
    true
  );
});

test("portal roles without explicit approval remain pending", () => {
  for (const role of ["wholesale_user", "special_customer"]) {
    assert.equal(isApprovedWholesaleCustomer(portalCustomer(role)), false);
  }
});

test("customer role grants access without legacy markers", () => {
  assert.equal(isApprovedWholesaleCustomer({ role: "customer", meta_data: [] }), true);
});

test("approved legacy metadata remains compatible outside portal registrations", () => {
  assert.equal(
    isApprovedWholesaleCustomer({
      role: "customer",
      meta_data: [{ key: "maya_account_status", value: "approved" }],
    }),
    true
  );
});

const approved = { sc_approval_status: "approved", maya_account_status: "approved", pw_user_status: "approved" };
test("manual approval unlocks customer and wholesale roles", () => {
  for (const role of ["customer", "wholesale_user", "special_customer"]) {
    assert.equal(isApprovedWholesaleCustomer(portalCustomer(role, approved)), true);
  }
});
test("denials block access and pending markers block other roles", () => {
  for (const key of Object.keys(approved)) {
    for (const status of ["pending", "pending_approval", "denied", "rejected"]) {
      assert.equal(isApprovedWholesaleCustomer(portalCustomer("wholesale_user", { ...approved, [key]: status })), false);
      assert.equal(isApprovedWholesaleCustomer(portalCustomer("customer", { ...approved, [key]: status })), status.startsWith("pending"));
    }
  }
});
test("partial approval and missing accounts cannot grant portal access", () => {
  assert.equal(isApprovedWholesaleCustomer(null), false);
  assert.equal(isApprovedWholesaleCustomer(portalCustomer("wholesale_user", { sc_approval_status: "approved" })), false);
  assert.equal(isApprovedWholesaleCustomer(portalCustomer("", approved)), false);
});
