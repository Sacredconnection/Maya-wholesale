import { getSession } from "@/lib/session";
import { getLocalDevSessionUser } from "@/lib/local-dev-auth";
import { getMissingCommerceStores, getRequiredCommerceStores } from "@/lib/commerce-stores";
import { getPaymentGateway } from "@/lib/woocommerce";
import {
  BUNQ_CARD_PAYMENT,
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

  const missingStores = getMissingCommerceStores();
  if (missingStores.length > 0) {
    return Response.json(
      { error: "Payment methods are temporarily unavailable." },
      { status: 503, headers: responseHeaders }
    );
  }

  const stores = getRequiredCommerceStores();
  const [bankTransferAvailable, bunqCardAvailable] = await Promise.all([
    gatewayAvailableEverywhere(MANUAL_BANK_TRANSFER.id, stores),
    gatewayAvailableEverywhere(BUNQ_CARD_PAYMENT.id, stores),
  ]);

  return Response.json(
    {
      methods: [
        {
          ...MANUAL_BANK_TRANSFER,
          available: bankTransferAvailable,
        },
        {
          ...BUNQ_CARD_PAYMENT,
          available: bunqCardAvailable,
          unavailableReason: bunqCardAvailable
            ? ""
            : "Card payment is being activated and is not available yet.",
        },
      ],
    },
    { headers: responseHeaders }
  );
}
