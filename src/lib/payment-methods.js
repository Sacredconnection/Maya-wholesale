export const MANUAL_BANK_TRANSFER = Object.freeze({
  id: "bacs",
  title: "Manual bank transfer",
  description:
    "Make your payment directly into our bank account. Your order will be shipped as soon as the funds have cleared in our account.",
  referenceInstruction:
    "Please use your Order Number as the payment reference.",
  accountName: "Maya World Trading B.V.",
  accountDetails: "NL79 TRIO 0391 0734 19",
  bankName: "Triodos Bank",
  bankAddress: [
    "De Reehorst, Hoofdstraat 10",
    "3972 LA Driebergen-Rijsenburg",
    "The Netherlands",
  ],
  companyAddress: [
    "Maya World Trading BV",
    "Mollerusweg 66",
    "2031 BZ, Haarlem",
    "The Netherlands",
  ],
});

export const BUNQ_CARD_PAYMENT = Object.freeze({
  id: "bunq_payment_2000",
  title: "Credit or debit card",
  provider: "Bunq Payment 2000",
  description:
    "Pay securely by card on the WooCommerce payment page. Card details are never entered or stored on this wholesale portal.",
});

export const bankTransferOrderNote = () => {
  const method = MANUAL_BANK_TRANSFER;
  return [
    method.title,
    method.description,
    method.referenceInstruction,
    `Account Name: ${method.accountName}`,
    `Account Details: ${method.accountDetails}`,
    `Bank Name: ${method.bankName}`,
    `Bank Address: ${method.bankAddress.join(", ")}`,
    `Company Address: ${method.companyAddress.join(", ")}`,
  ].join("\n");
};
