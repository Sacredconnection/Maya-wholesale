import { isSessionCurrent } from "@/lib/session-customer.mjs";
import { isApprovedWholesaleCustomer } from "@/lib/wholesale-approval.mjs";
import { securityError } from "@/lib/request-security";
import { getSession } from "@/lib/session";
import { getLocalDevSessionUser } from "@/lib/local-dev-auth";
import { getMissingCommerceStores, getRequiredCommerceStores } from "@/lib/commerce-stores";
import { getPaymentGateway, getCustomerByEmail } from "@/lib/woocommerce";
import {
  MANUAL_BANK_TRANSFER,
} from "@/lib/payment-methods";

const responseHeaders = {
  "Cache-Control": "private, no-store, max-age=0",
};

async function gatewayAvailableEverywhere(gatewayId, stores) {
  const results = await Promise.allSettled(
    stores.map((store) => getPaymentGateway(gatewayId, store.id))
  );
  return results.every(
    (result) => result.status === "fulfilled" && result.value?.enabled === true
  );
}

export async function GET(request) {
  const session = await getSession();
  if (!session) {
    return Response.json(
      { error: "Authentication required." },
      { status: 401, headers: responseHeaders }
    );
  }
  if (session.localDev && !getLocalDevSessionUser(request, session)) {
    return Response.json(
      { error: "Authentication required." },
      { status: 401, headers: responseHeaders }
    );
  }

  if (!session.localDev) {
    try {
      const customer = await getCustomerByEmail(session.email);
      if (!isApprovedWholesaleCustomer(customer) || !isSessionCurrent(session, customer)) return securityError("Authentication required.", 401);
    } catch { return securityError("Authentication backend unavailable.", 502); }
  }

  const missingStores = getMissingCommerceStores();
  if (missingStores.length > 0) {
    return Response.json(
      { error: "Payment methods are temporarily unavailable." },
      { status: 503, headers: responseHeaders }
    );
  }

  const stores = getRequiredCommerceStores();
  const bankTransferAvailable = await gatewayAvailableEverywhere(MANUAL_BANK_TRANSFER.id, stores);

  return Response.json(
    {
      methods: [
        {
          ...MANUAL_BANK_TRANSFER,
          available: bankTransferAvailable,
        },

      ],
    },
    { headers: responseHeaders }
  );
}
