export const MANUAL_BANK_TRANSFER = Object.freeze({
  id: "bacs",
  title: "Manual bank transfer",
  description:
    "Make your payment directly into our bank account. Important: please use your Order Number as the payment reference. Your order will be shipped as soon as the funds have cleared in our account.",
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

export const bankTransferOrderNote = () => {
  const method = MANUAL_BANK_TRANSFER;
  return [
    method.title,
    method.description,
    `Account Name: ${method.accountName}`,
    `Account Details: ${method.accountDetails}`,
    `Bank Name: ${method.bankName}`,
    `Bank Address: ${method.bankAddress.join(", ")}`,
    `Company Address: ${method.companyAddress.join(", ")}`,
  ].join("\n");
};
