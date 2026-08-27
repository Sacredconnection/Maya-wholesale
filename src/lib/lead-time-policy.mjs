export const LEAD_TIME_META_KEY = "_maya_lead_time_mode";

export const LEAD_TIME_MODES = Object.freeze({
  AUTO: "auto",
  BULK_REQUEST: "bulk_request",
  SMALL_BATCH: "small_batch",
});

export const LEAD_TIME_POLICIES = Object.freeze({
  BULK_REQUEST: "bulk-request",
  SMALL_BATCH: "small-batch",
});

export const BULK_MIN_WEIGHT_GRAMS = 250;

const VALID_MODES = new Set(Object.values(LEAD_TIME_MODES));

export function normalizeLeadTimeMode(value, fallback = LEAD_TIME_MODES.AUTO) {
  const normalized = String(value || "").trim().toLowerCase();
  return VALID_MODES.has(normalized) ? normalized : fallback;
}

export function leadTimeModeFromMeta(metaData = [], fallback = LEAD_TIME_MODES.AUTO) {
  const entry = [...(Array.isArray(metaData) ? metaData : [])]
    .reverse()
    .find((item) => item?.key === LEAD_TIME_META_KEY);
  return normalizeLeadTimeMode(entry?.value, fallback);
}

export function outOfStockLeadTimePolicy({ inStock, weightGrams, mode }) {
  if (inStock !== false) return null;

  const normalizedMode = normalizeLeadTimeMode(mode);
  if (normalizedMode === LEAD_TIME_MODES.BULK_REQUEST) {
    return LEAD_TIME_POLICIES.BULK_REQUEST;
  }
  if (normalizedMode === LEAD_TIME_MODES.SMALL_BATCH) {
    return LEAD_TIME_POLICIES.SMALL_BATCH;
  }

  return Number(weightGrams) >= BULK_MIN_WEIGHT_GRAMS
    ? LEAD_TIME_POLICIES.BULK_REQUEST
    : LEAD_TIME_POLICIES.SMALL_BATCH;
}

export function leadTimeMessage(policy) {
  return policy === LEAD_TIME_POLICIES.BULK_REQUEST
    ? "Expected lead time: 1–4 weeks."
    : "New batch in production. Expected lead time: 1–3 days.";
}
