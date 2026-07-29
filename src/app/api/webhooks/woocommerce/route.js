import { createHmac, timingSafeEqual } from "node:crypto";
import { revalidateTag } from "next/cache";
import { getRequiredCommerceStores } from "@/lib/commerce-stores";
import {
  getCustomerById,
  getWooCommerceCatalogCacheTag,
  updateCustomerMeta,
} from "@/lib/woocommerce";
import { isApprovedWholesaleCustomer } from "@/lib/wc-mappers";
import {
  isTransactionalEmailConfigured,
  sendApplicationApprovedEmail,
  sendApplicationReceivedEmail,
} from "@/lib/transactional-email";

export const runtime = "nodejs";

const PRODUCT_TOPICS = new Set([
  "product.created",
  "product.updated",
  "product.deleted",
  "product.restored",
]);
const CUSTOMER_ROLE_APPROVED_TOPIC =
  "action.woocommerce_sacred_wholesale_customer_approved";
const CUSTOMER_TOPICS = new Set([
  "customer.created",
  "customer.updated",
  CUSTOMER_ROLE_APPROVED_TOPIC,
]);
const MAX_WEBHOOK_BYTES = 2 * 1024 * 1024;

const customerMeta = (customer, key) => {
  const entries = customer.meta_data || [];
  for (let index = entries.length - 1; index >= 0; index -= 1) {
    if (entries[index].key === key) return entries[index].value;
  }
  return undefined;
};

async function handleCustomerWebhook(topic, payload) {
  const customerId = Number(
    topic === CUSTOMER_ROLE_APPROVED_TOPIC ? payload?.arg : payload?.id
  );
  if (!Number.isInteger(customerId) || customerId <= 0) {
    return { accepted: true, emailSent: false, reason: "invalid-customer" };
  }

  const customer = await getCustomerById(customerId);
  if (customerMeta(customer, "sc_channel") !== "wholesale-portal") {
    return { accepted: true, emailSent: false, reason: "not-wholesale-registration" };
  }

  if (topic === "customer.created") {
    const alreadySent = customerMeta(customer, "sc_pending_email_sent_at");
    const isPending = ["pending", "customer"].includes(
      String(customer.role || "").toLowerCase()
    );
    if (alreadySent || !isPending) {
      return { accepted: true, emailSent: false, reason: alreadySent ? "already-sent" : "not-pending" };
    }

    await sendApplicationReceivedEmail(customer);
    await updateCustomerMeta(customer, {
      sc_pending_email_sent_at: new Date().toISOString(),
    });
    return { accepted: true, emailSent: true, emailType: "application-received" };
  }

  const approvalStatus = customerMeta(customer, "sc_approval_status");
  if (approvalStatus !== "pending" || !isApprovedWholesaleCustomer(customer)) {
    return { accepted: true, emailSent: false, reason: "no-pending-approval-transition" };
  }

  await sendApplicationApprovedEmail(customer);
  await updateCustomerMeta(customer, {
    sc_approval_status: "approved",
    sc_approval_email_role: customer.role || "",
    sc_approval_email_sent_at: new Date().toISOString(),
  });
  return { accepted: true, emailSent: true, emailType: "application-approved" };
}

function hasValidSignature(body, signature, secret) {
  if (!signature || !secret) return false;

  const expected = createHmac("sha256", secret).update(body).digest();
  let received;
  try {
    received = Buffer.from(signature, "base64");
  } catch {
    return false;
  }
  return received.length === expected.length && timingSafeEqual(received, expected);
}

function isWooCommercePing(request, body, signature) {
  if (signature || body.byteLength > 256) return false;
  const userAgent = request.headers.get("user-agent") || "";
  if (!userAgent.includes("WooCommerce/") || !userAgent.includes("Hookshot")) return false;

  const params = new URLSearchParams(body.toString("utf8"));
  const webhookId = params.get("webhook_id");
  return [...params.keys()].length === 1 && /^\d+$/.test(webhookId || "");
}

export async function POST(request) {
  const secret = process.env.WC_WEBHOOK_SECRET;
  if (!secret) {
    return Response.json(
      { error: "WooCommerce webhook is not configured." },
      { status: 503, headers: { "Cache-Control": "no-store" } }
    );
  }

  const contentLength = Number(request.headers.get("content-length"));
  if (Number.isFinite(contentLength) && contentLength > MAX_WEBHOOK_BYTES) {
    return Response.json(
      { error: "Webhook payload is too large." },
      { status: 413, headers: { "Cache-Control": "no-store" } }
    );
  }

  const body = Buffer.from(await request.arrayBuffer());
  if (body.byteLength > MAX_WEBHOOK_BYTES) {
    return Response.json(
      { error: "Webhook payload is too large." },
      { status: 413, headers: { "Cache-Control": "no-store" } }
    );
  }
  const signature = request.headers.get("x-wc-webhook-signature");
  if (isWooCommercePing(request, body, signature)) {
    return Response.json(
      { accepted: true, ping: true },
      { headers: { "Cache-Control": "no-store" } }
    );
  }
  if (!hasValidSignature(body, signature, secret)) {
    return Response.json(
      { error: "Invalid webhook signature." },
      { status: 401, headers: { "Cache-Control": "no-store" } }
    );
  }

  const topic = request.headers.get("x-wc-webhook-topic") || "";
  if (CUSTOMER_TOPICS.has(topic)) {
    if (!isTransactionalEmailConfigured()) {
      return Response.json(
        { error: "Transactional email is not configured." },
        { status: 503, headers: { "Cache-Control": "no-store" } }
      );
    }
    try {
      const payload = JSON.parse(body.toString("utf8"));
      const result = await handleCustomerWebhook(topic, payload);
      return Response.json(result, { headers: { "Cache-Control": "no-store" } });
    } catch (error) {
      console.error(`WooCommerce ${topic} webhook failed:`, error);
      return Response.json(
        { error: "Customer webhook processing failed." },
        { status: 502, headers: { "Cache-Control": "no-store" } }
      );
    }
  }

  if (!PRODUCT_TOPICS.has(topic)) {
    return Response.json(
      { accepted: true, revalidated: false, topic },
      { headers: { "Cache-Control": "no-store" } }
    );
  }

  getRequiredCommerceStores().forEach((store) => {
    revalidateTag(getWooCommerceCatalogCacheTag(store.id), { expire: 0 });
  });
  revalidateTag("woocommerce-catalog", { expire: 0 });
  return Response.json(
    { accepted: true, revalidated: true, topic },
    { headers: { "Cache-Control": "no-store" } }
  );
}
