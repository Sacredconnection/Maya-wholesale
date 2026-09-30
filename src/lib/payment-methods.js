export const MANUAL_BANK_TRANSFER = Object.freeze({
  id: "bacs",
  title: "Manual bank transfer",
  description:
    "Make your payment directly into our bank account. Your order will be shipped as soon as the funds have cleared in our account.",
  referenceInstruction:
    "Your Order Number will be generated after you submit the order. Use it as the payment reference.",
  accountName: "Maya World Trading B.V.",
  accountDetails: "NL11 INGB 0007 9517 851",
  bankName: "ING Bank1",
  bic: "INGBNL2A1",
  bankAddress: [],
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
    `IBAN: ${method.accountDetails}`,
    `Bank Name: ${method.bankName}`,
    `BIC: ${method.bic}`,
    `Company Address: ${method.companyAddress.join(", ")}`,
  ].join("\n");
};
