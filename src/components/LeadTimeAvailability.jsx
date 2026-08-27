"use client";

import { useRef, useState } from "react";
import { createPortal } from "react-dom";
import { CheckCircle2, Clock3, Loader2, Send, X } from "lucide-react";
import { LEAD_TIME_POLICIES, leadTimeMessage } from "@/lib/lead-time-policy.mjs";
import { useDialogAccessibility } from "@/lib/use-dialog-accessibility";

export default function LeadTimeAvailability({ product, option, compact = false }) {
  const [isOpen, setIsOpen] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [note, setNote] = useState("");
  const [status, setStatus] = useState("idle");
  const [feedback, setFeedback] = useState("");
  const [requestId, setRequestId] = useState("");
  const dialogRef = useRef(null);
  const quantityRef = useRef(null);
  const triggerRef = useRef(null);

  const closeDialog = () => {
    if (status === "submitting") return;
    setIsOpen(false);
  };

  useDialogAccessibility(isOpen, closeDialog, {
    containerRef: dialogRef,
    initialFocusRef: quantityRef,
    returnFocusRef: triggerRef,
  });

  if (!option || option.inStock !== false || !option.leadTimePolicy) return null;

  const canRequest = option.leadTimePolicy === LEAD_TIME_POLICIES.BULK_REQUEST;
  const message = leadTimeMessage(option.leadTimePolicy);

  const openDialog = () => {
    setQuantity(1);
    setNote("");
    setStatus("idle");
    setFeedback("");
    setRequestId(crypto.randomUUID());
    setIsOpen(true);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (status === "submitting") return;

    setStatus("submitting");
    setFeedback("");
    try {
      const response = await fetch("/api/lead-time-requests", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: product.id,
          sku: option.sku,
          quantity,
          note,
          requestId,
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Your request could not be sent.");
      setStatus("sent");
      setFeedback(data.message || "Your request was sent to our sales team.");
    } catch (error) {
      setStatus("error");
      setFeedback(error.message || "Your request could not be sent. Please try again.");
    }
  };

  const totalWeight =
    Number(option.weightGrams) > 0
      ? `${(Number(option.weightGrams) * quantity).toLocaleString("en-US")}g total`
      : null;

  return (
    <>
      <div
        className={`rounded-sm border px-3 py-3 ${
          canRequest
            ? "border-[#999933]/55 bg-[#474618]/25"
            : "border-[#128178]/45 bg-[#093D38]/25"
        } ${compact ? "text-[11px]" : "text-xs"}`}
      >
        <div className="flex items-start gap-2.5">
          <Clock3 className="mt-0.5 h-4 w-4 shrink-0 text-[#E5E791]" aria-hidden="true" />
          <div className="min-w-0 flex-1">
            <p className="font-semibold leading-relaxed text-white">{message}</p>
            {canRequest && (
              <p className="mt-1 leading-relaxed text-white/70">
                Share the quantity you need and our sales team will confirm availability.
              </p>
            )}
          </div>
        </div>
        {canRequest && (
          <button
            ref={triggerRef}
            type="button"
            onClick={openDialog}
            className="mt-3 inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-sm border border-[#E5E791]/45 bg-[#999933] px-4 py-2 text-[10px] font-bold uppercase tracking-[0.12em] text-white transition-colors hover:bg-[#84842C] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#E5E791]"
          >
            <Send className="h-3.5 w-3.5" aria-hidden="true" />
            Request a Lead Time
          </button>
        )}
      </div>

      {isOpen && typeof document !== "undefined"
        ? createPortal(
            <div
              className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
              onMouseDown={(event) => {
                if (event.target === event.currentTarget) closeDialog();
              }}
            >
              <section
                ref={dialogRef}
                role="dialog"
                aria-modal="true"
                aria-labelledby="lead-time-dialog-title"
                aria-describedby="lead-time-dialog-description"
                tabIndex={-1}
                className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl border border-[#727349] bg-[#262019] p-5 text-white shadow-2xl sm:p-7"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#E5E791]">
                      Wholesale availability
                    </span>
                    <h2 id="lead-time-dialog-title" className="mt-1 text-2xl font-bold text-white">
                      Request a Lead Time
                    </h2>
                  </div>
                  <button
                    type="button"
                    onClick={closeDialog}
                    disabled={status === "submitting"}
                    aria-label="Close lead-time request"
                    className="rounded-sm border border-white/15 bg-transparent p-2 text-white/70 hover:text-white focus-visible:outline-2 focus-visible:outline-[#E5E791] disabled:opacity-50"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <p id="lead-time-dialog-description" className="mt-3 text-sm leading-relaxed text-white/70">
                  Tell us the volume you require. The sales team will review production and reply to your account email with a confirmed schedule.
                </p>

                <div className="mt-5 rounded-sm border border-[#675943] bg-[#362E24] p-4">
                  <strong className="block text-sm text-white">{product.name}</strong>
                  <span className="mt-1 block text-xs text-white/65">
                    {option.name} · SKU {option.sku}
                  </span>
                  <span className="mt-2 block text-xs font-semibold text-[#E5E791]">
                    Expected lead time: 1–4 weeks
                  </span>
                </div>

                {status === "sent" ? (
                  <div role="status" className="mt-5 rounded-sm border border-[#128178] bg-[#093D38]/45 p-4">
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[#E5E791]" />
                      <div>
                        <p className="font-bold text-white">Request received</p>
                        <p className="mt-1 text-sm leading-relaxed text-white/75">{feedback}</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={closeDialog}
                      className="mt-4 w-full rounded-sm bg-[#999933] px-4 py-3 text-xs font-bold uppercase tracking-wider text-white hover:bg-[#84842C] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#E5E791]"
                    >
                      Close
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="mt-5 space-y-4" aria-busy={status === "submitting"}>
                    <label className="block">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-white/65">
                        Required quantity
                      </span>
                      <input
                        ref={quantityRef}
                        type="number"
                        min="1"
                        max="10000"
                        step="1"
                        required
                        value={quantity}
                        onChange={(event) => setQuantity(Number(event.target.value))}
                        className="mt-1.5 w-full rounded-sm border border-[#727349] bg-[#362E24] px-4 py-3 text-sm text-white outline-none focus:border-[#E5E791] focus:ring-2 focus:ring-[#E5E791]/25"
                      />
                      <span className="mt-1.5 block text-[11px] text-white/55">
                        Number of {option.name} units{totalWeight ? ` · ${totalWeight}` : ""}
                      </span>
                    </label>

                    <label className="block">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-white/65">
                        Additional details <span className="normal-case text-white/40">(optional)</span>
                      </span>
                      <textarea
                        rows="4"
                        maxLength={1000}
                        value={note}
                        onChange={(event) => setNote(event.target.value)}
                        placeholder="Preferred delivery date or other information for our sales team"
                        className="mt-1.5 w-full resize-y rounded-sm border border-[#727349] bg-[#362E24] px-4 py-3 text-sm text-white placeholder:text-white/35 outline-none focus:border-[#E5E791] focus:ring-2 focus:ring-[#E5E791]/25"
                      />
                    </label>

                    {feedback && (
                      <p role="alert" className="rounded-sm border border-[#9A3232] bg-[#4C1919]/45 px-3 py-2 text-sm text-white">
                        {feedback}
                      </p>
                    )}

                    <button
                      type="submit"
                      disabled={status === "submitting" || !Number.isInteger(quantity) || quantity < 1 || quantity > 10000}
                      className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-sm bg-[#CC6633] px-5 py-3 text-xs font-bold uppercase tracking-[0.12em] text-white hover:bg-[#B2592D] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#E5E791] disabled:cursor-not-allowed disabled:opacity-55"
                    >
                      {status === "submitting" ? (
                        <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                      ) : (
                        <Send className="h-4 w-4" aria-hidden="true" />
                      )}
                      {status === "submitting" ? "Sending request..." : "Send to Sales"}
                    </button>
                  </form>
                )}
              </section>
            </div>,
            document.body
          )
        : null}
    </>
  );
}
