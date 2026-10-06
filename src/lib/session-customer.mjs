import { customerMeta } from "./wholesale-approval.mjs";

export function isSessionCurrent(session, customer) {
  return Boolean(session && customer && !session.localDev &&
    customer.id === session.customerId &&
    String(customer.email || "").toLowerCase() === session.email &&
    String(customerMeta(customer, "sc_session_version") || "") === String(session.sessionVersion || ""));
}
