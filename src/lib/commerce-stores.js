import "server-only";

import {
  WORDPRESS_BACKEND_ORIGIN,
  normalizeServiceBaseUrl,
} from "@/lib/deployment-urls.mjs";

export const PRIMARY_STORE_ID = "maya-herbs";

const STORE_DEFINITIONS = [
  {
    id: PRIMARY_STORE_ID,
    name: "Maya Herbs",
    catalogLanguage: "en",
    urlEnv: "WOOCOMMERCE_URL",
    defaultUrl: WORDPRESS_BACKEND_ORIGIN,
    keyEnv: "WOOCOMMERCE_CONSUMER_KEY",
    secretEnv: "WOOCOMMERCE_CONSUMER_SECRET",
  },
];

const definitionFor = (storeId) =>
  STORE_DEFINITIONS.find((store) => store.id === storeId);

export function getCommerceStore(storeId = PRIMARY_STORE_ID) {
  const definition = definitionFor(storeId);
  if (!definition) throw new Error(`Unknown commerce store: ${storeId}`);

  const baseUrl = normalizeServiceBaseUrl(
    process.env[definition.urlEnv] || definition.defaultUrl,
    {
      allowLocalHttp: process.env.NODE_ENV !== "production",
      name: definition.urlEnv,
    }
  );

  return {
    id: definition.id,
    name: definition.name,
    catalogLanguage: definition.catalogLanguage || "",
    baseUrl,
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
