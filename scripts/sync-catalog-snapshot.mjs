import { mkdir, writeFile } from "node:fs/promises";
import http from "node:http";
import https from "node:https";
import { dirname, resolve } from "node:path";

const portalUrl = (process.env.LOCAL_PORTAL_URL || "http://localhost:3000").replace(
  /\/$/,
  ""
);
const outputPath = resolve(
  process.cwd(),
  process.env.CATALOG_SNAPSHOT_PATH || "tmp/catalog-snapshot.json"
);

function requestJson(url, headers = {}) {
  return new Promise((resolveRequest, rejectRequest) => {
    const target = new URL(url);
    const client = target.protocol === "https:" ? https : http;
    const request = client.get(target, { headers }, (response) => {
      const chunks = [];
      response.on("data", (chunk) => chunks.push(chunk));
      response.on("end", () => {
        try {
          resolveRequest({
            ok: response.statusCode >= 200 && response.statusCode < 300,
            status: response.statusCode,
            headers: response.headers,
            data: JSON.parse(Buffer.concat(chunks).toString("utf8")),
          });
        } catch (error) {
          rejectRequest(error);
        }
      });
    });
    request.setTimeout(90_000, () =>
      request.destroy(new Error("The local catalog request timed out."))
    );
    request.on("error", rejectRequest);
  });
}

const sessionResponse = await requestJson(`${portalUrl}/api/auth/session`);
if (!sessionResponse.ok) {
  throw new Error(
    `Local authentication failed with status ${sessionResponse.status}. Start the development server and enable LOCAL_DEV_AUTO_LOGIN first.`
  );
}

const setCookie = sessionResponse.headers["set-cookie"]?.[0];
const requestHeaders = setCookie ? { Cookie: setCookie.split(";", 1)[0] } : {};

async function fetchCatalogPage(page) {
  let lastError;
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      const response = await requestJson(
        `${portalUrl}/api/catalog?page=${page}`,
        requestHeaders
      );
      const catalog = response.data;
      if (response.ok) return catalog;
      lastError = new Error(
        catalog.error || `Catalog request failed with status ${response.status}.`
      );
    } catch (error) {
      lastError = error;
    }
    if (attempt < 3) {
      await new Promise((resolveDelay) => setTimeout(resolveDelay, attempt * 750));
    }
  }
  throw lastError;
}

let products;
let source;
try {
  const firstPage = await fetchCatalogPage(1);
  if (firstPage.source === "snapshot") {
    throw new Error(
      "WooCommerce is unavailable, so the existing local snapshot was kept unchanged."
    );
  }

  const totalPages = Math.max(1, Number(firstPage.pagination?.totalPages) || 1);
  const remainingPages = [];
  for (let page = 2; page <= totalPages; page += 1) {
    remainingPages.push(await fetchCatalogPage(page));
  }
  products = [firstPage, ...remainingPages].flatMap(
    (catalogPage) => catalogPage.products || []
  );
  source = firstPage.source;
} catch (catalogError) {
  const productsResponse = await requestJson(
    `${portalUrl}/api/products`,
    requestHeaders
  );
  const productsPayload = productsResponse.data;
  if (!productsResponse.ok || !Array.isArray(productsPayload.products)) {
    throw catalogError;
  }
  products = productsPayload.products;
  source = "woocommerce-rest-cache";
}

if (products.length === 0) {
  throw new Error("The live catalog did not return any products.");
}

await mkdir(dirname(outputPath), { recursive: true });
await writeFile(
  outputPath,
  `${JSON.stringify(
    {
      generatedAt: new Date().toISOString(),
      source,
      products,
    },
    null,
    2
  )}\n`,
  "utf8"
);

console.log(`Saved ${products.length} products to ${outputPath}`);
