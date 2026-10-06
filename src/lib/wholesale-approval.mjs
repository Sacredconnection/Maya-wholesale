const normalize = (value) => String(value || "").trim().toLowerCase();

export const PENDING_WORDPRESS_ROLE = "pending";
export const WHOLESALE_PORTAL_CHANNEL = "wholesale-portal";

export function customerMeta(customer, key) {
  const entries = customer?.meta_data || [];
  for (let index = entries.length - 1; index >= 0; index -= 1) {
    if (entries[index].key === key) return entries[index].value;
  }
  return undefined;
}

/**
 * Default WooCommerce roles are not proof of manual approval. Pending or
 * rejected markers block access, including when metadata disagrees.
 */
export function isApprovedWholesaleCustomer(customer) {
  if (!customer) return false;

  const role = normalize(customer.role);
  if (!role || role === PENDING_WORDPRESS_ROLE) return false;

  const approvalStatuses = [
    customerMeta(customer, "sc_approval_status"),
    customerMeta(customer, "maya_account_status"),
    customerMeta(customer, "pw_user_status"),
  ].map(normalize);

  if (approvalStatuses.some((status) => status && status !== "approved")) {
    return false;
  }

  const channel = normalize(customerMeta(customer, "sc_channel"));
  if (channel === WHOLESALE_PORTAL_CHANNEL) {
    return approvalStatuses[0] === "approved" && approvalStatuses[1] === "approved";
  }
  if (approvalStatuses.includes("approved")) return true;

  // Preserve the previous protection against ordinary WooCommerce customers
  // gaining wholesale access without a portal application.
  return new Set(["administrator", "shop_manager", "wholesale_customer", "wholesale_user",
    "new customer", "special customer", "old customer", "new_customer", "special_customer", "old_customer"]).has(role);
}
