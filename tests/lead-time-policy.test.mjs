import test from "node:test";
import assert from "node:assert/strict";
import {
  LEAD_TIME_META_KEY,
  LEAD_TIME_MODES,
  LEAD_TIME_POLICIES,
  leadTimeModeFromMeta,
  outOfStockLeadTimePolicy,
} from "../src/lib/lead-time-policy.mjs";

test("available formats do not receive a lead-time policy", () => {
  assert.equal(
    outOfStockLeadTimePolicy({
      inStock: true,
      weightGrams: 1000,
      mode: LEAD_TIME_MODES.BULK_REQUEST,
    }),
    null
  );
});

test("automatic policy treats formats below 250g as a short production batch", () => {
  assert.equal(
    outOfStockLeadTimePolicy({
      inStock: false,
      weightGrams: 50,
      mode: LEAD_TIME_MODES.AUTO,
    }),
    LEAD_TIME_POLICIES.SMALL_BATCH
  );
});

test("automatic policy treats 250g and larger formats as bulk requests", () => {
  for (const weightGrams of [250, 1000]) {
    assert.equal(
      outOfStockLeadTimePolicy({
        inStock: false,
        weightGrams,
        mode: LEAD_TIME_MODES.AUTO,
      }),
      LEAD_TIME_POLICIES.BULK_REQUEST
    );
  }
});

test("manual bulk override applies the request flow to a smaller format", () => {
  assert.equal(
    outOfStockLeadTimePolicy({
      inStock: false,
      weightGrams: 10,
      mode: LEAD_TIME_MODES.BULK_REQUEST,
    }),
    LEAD_TIME_POLICIES.BULK_REQUEST
  );
});

test("variation metadata overrides the product-level policy", () => {
  const mode = leadTimeModeFromMeta(
    [{ key: LEAD_TIME_META_KEY, value: LEAD_TIME_MODES.SMALL_BATCH }],
    LEAD_TIME_MODES.BULK_REQUEST
  );
  assert.equal(mode, LEAD_TIME_MODES.SMALL_BATCH);
});

test("missing variation metadata inherits the product-level policy", () => {
  assert.equal(
    leadTimeModeFromMeta([], LEAD_TIME_MODES.BULK_REQUEST),
    LEAD_TIME_MODES.BULK_REQUEST
  );
});
