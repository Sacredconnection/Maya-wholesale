import "server-only";

export const PRIMARY_STORE_ID = "maya-herbs";

const STORE_DEFINITIONS = [
  {
    id: PRIMARY_STORE_ID,
    name: "Maya Herbs",
    catalogLanguage: "en",
    urlEnv: "WOOCOMMERCE_URL",
    keyEnv: "WOOCOMMERCE_CONSUMER_KEY",
    secretEnv: "WOOCOMMERCE_CONSUMER_SECRET",
  },
];

const definitionFor = (storeId) =>
  STORE_DEFINITIONS.find((store) => store.id === storeId);

export function getCommerceStore(storeId = PRIMARY_STORE_ID) {
  const definition = definitionFor(storeId);
  if (!definition) throw new Error(`Unknown commerce store: ${storeId}`);

  const rawUrl = (process.env[definition.urlEnv] || "").replace(/\/+$/, "");
  if (!rawUrl) throw new Error(`${definition.urlEnv} is not configured.`);

  const url = new URL(rawUrl);
  const isLocalDevelopment =
    process.env.NODE_ENV !== "production" &&
    url.protocol === "http:" &&
    ["localhost", "127.0.0.1", "::1"].includes(url.hostname);
  if (url.protocol !== "https:" && !isLocalDevelopment) {
    throw new Error(`${definition.urlEnv} must use HTTPS.`);
  }

  return {
    id: definition.id,
    name: definition.name,
    catalogLanguage: definition.catalogLanguage || "",
    baseUrl: rawUrl,
    consumerKey: process.env[definition.keyEnv] || "",
    consumerSecret: process.env[definition.secretEnv] || "",
  };
}

export function isCommerceStoreConfigured(storeId = PRIMARY_STORE_ID) {
  try {
    const store = getCommerceStore(storeId);
    return Boolean(store.consumerKey && store.consumerSecret);
  } catch {
    return false;
  }
}

export function getRequiredCommerceStores() {
  return STORE_DEFINITIONS.map(({ id, name }) => ({ id, name }));
}

export function getMissingCommerceStores() {
  return getRequiredCommerceStores().filter(({ id }) => !isCommerceStoreConfigured(id));
}

export function getCommerceStoreOrigins() {
  return STORE_DEFINITIONS.flatMap(({ id }) => {
    try {
      return [new URL(getCommerceStore(id).baseUrl).origin];
    } catch {
      return [];
    }
  });
}
