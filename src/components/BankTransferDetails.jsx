import { MANUAL_BANK_TRANSFER, ORDER_CONFIRMATION, ORDER_STEPS } from "@/lib/payment-methods";
export default function BankTransferDetails({ showTitle = true }) {
  return <section className="space-y-4 text-sm leading-6">
    {showTitle && <h3 className="font-bold">{MANUAL_BANK_TRANSFER.title}</h3>}
    <p>{ORDER_CONFIRMATION}</p>
    <ol className="list-decimal space-y-2 pl-5">{ORDER_STEPS.map((step) => <li key={step}>{step}</li>)}</ol>
  </section>;
}
