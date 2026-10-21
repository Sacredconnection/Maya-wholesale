export const ORDER_CONFIRMATION = "Thank you for your wholesale order. Our sales team will confirm product availability and shipping terms, then send your invoice with payment instructions. Please wait for the invoice before making any payment. Once payment is received, we will arrange shipment of your order.";
export const ORDER_STEPS = Object.freeze([
  "Submit your wholesale order.",
  "Our sales team reviews your details and product availability.",
  "We confirm your order and shipping terms, then send your invoice.",
  "Pay using the instructions on your invoice.",
  "We ship your products after receiving payment.",
]);
export const MANUAL_BANK_TRANSFER = Object.freeze({
  id: "bacs",
  title: "Manual bank transfer after receiving the invoice",
  description: "Please wait for your invoice before making any payment. Payment instructions will be included in the invoice.",
});
// Retained for historical records; new wholesale orders use invoice payment.
export const BUNQ_CARD_PAYMENT = Object.freeze({ id: "bunq_payment_2000", title: "Credit or debit card", provider: "Bunq Payment 2000" });
export const bankTransferOrderNote = () => "Payment method: " + MANUAL_BANK_TRANSFER.title + ". " + MANUAL_BANK_TRANSFER.description;
