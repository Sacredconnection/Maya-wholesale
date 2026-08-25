import { Building2, Hash, Landmark } from "lucide-react";
import { MANUAL_BANK_TRANSFER } from "@/lib/payment-methods";

function AddressBlock({ title, lines, icon: Icon }) {
  return (
    <div className="rounded-lg border border-white/15 bg-[#262019] p-4">
      <div className="mb-2 flex items-center gap-2 text-[10px] font-black uppercase tracking-wider text-white/60">
        <Icon className="h-3.5 w-3.5 text-[#f2f2f2]" aria-hidden="true" />
        {title}
      </div>
      <address className="not-italic text-xs leading-5 text-white/65">
        {lines.map((line) => (
          <span key={line} className="block">{line}</span>
        ))}
      </address>
    </div>
  );
}

export default function BankTransferDetails({ showTitle = true, orderReference = "" }) {
  const method = MANUAL_BANK_TRANSFER;
  const referenceInstruction = orderReference
    ? `Use ${orderReference} as the payment reference.`
    : method.referenceInstruction;

  return (
    <div className="brand-contrast-zone flex flex-col gap-4">
      {showTitle && (
        <div className="flex items-start gap-3">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-[#f2f2f2]/30 bg-[#999933]/15 text-[#f2f2f2]">
            <Landmark className="h-4 w-4" aria-hidden="true" />
          </span>
          <div>
            <h3 className="text-sm font-black text-white">{method.title}</h3>
            <p className="mt-1 text-xs leading-relaxed text-white/60">
              {method.description}
            </p>
          </div>
        </div>
      )}

      <div className="flex items-start gap-3 rounded-lg border border-[#D9962B] bg-[#4C330F] px-4 py-3 shadow-[0_0_24px_rgba(217,150,43,0.08)]">
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#6F4C16] text-[#E5E791]">
          <Hash className="h-4 w-4" aria-hidden="true" />
        </span>
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.15em] text-[#E5E791]">
            Payment reference required
          </p>
          <p className="mt-1 text-sm font-black leading-snug text-white">
            {referenceInstruction}
          </p>
        </div>
      </div>

      <dl className="grid gap-3 rounded-lg border border-white/15 bg-[#262019] p-4 text-xs sm:grid-cols-3">
        <div>
          <dt className="text-[9px] font-black uppercase tracking-wider text-white/60">
            Account Name
          </dt>
          <dd className="mt-1 font-bold text-white">{method.accountName}</dd>
        </div>
        <div>
          <dt className="text-[9px] font-black uppercase tracking-wider text-white/60">
            Account Details
          </dt>
          <dd className="mt-1 font-mono font-bold text-white">{method.accountDetails}</dd>
        </div>
        <div>
          <dt className="text-[9px] font-black uppercase tracking-wider text-white/60">
            Bank Name
          </dt>
          <dd className="mt-1 font-bold text-white">{method.bankName}</dd>
        </div>
      </dl>

      <div className="grid gap-3 sm:grid-cols-2">
        <AddressBlock title="Bank address" lines={method.bankAddress} icon={Landmark} />
        <AddressBlock title="Company address" lines={method.companyAddress} icon={Building2} />
      </div>
    </div>
  );
}
