import {
  Banknote,
  CreditCard,
  Landmark,
  ReceiptText,
  Smartphone,
  WalletCards,
} from "lucide-react";
import { InvoiceSummary } from "../types/invoice";
import { formatCurrency } from "../utils/invoiceMath";

interface InvoiceInsightsProps {
  summary: InvoiceSummary;
  filterLabel: string;
}

const paymentRows = [
  { label: "Cash", key: "cashTotal", icon: Banknote, color: "bg-emerald-500" },
  { label: "GPay", key: "gpayTotal", icon: Smartphone, color: "bg-sky-500" },
  { label: "Card", key: "cardTotal", icon: CreditCard, color: "bg-violet-500" },
  { label: "Bank", key: "bankTransferTotal", icon: Landmark, color: "bg-amber-500" },
  { label: "Other", key: "otherPaymentTotal", icon: WalletCards, color: "bg-gray-500" },
] as const;

export const InvoiceInsights = ({ summary, filterLabel }: InvoiceInsightsProps) => {
  return (
    <div className="mb-5 grid gap-3 xl:grid-cols-[1.15fr_.85fr]">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <SummaryTile
          icon={ReceiptText}
          label={`${filterLabel} bills`}
          value={String(summary.filteredCount)}
          helper="Matching invoices"
          accent="bg-[var(--theme-accent-soft)] text-[var(--theme-accent)]"
        />
        <SummaryTile
          icon={WalletCards}
          label="Recorded payments"
          value={formatCurrency(
            summary.cashTotal +
              summary.gpayTotal +
              summary.cardTotal +
              summary.bankTransferTotal +
              summary.otherPaymentTotal
          )}
          helper="Paid invoices in view"
          accent="bg-[var(--theme-soft)] text-[var(--theme-primary)]"
        />
      </div>

      <div className="rounded-lg border border-gray-200/80 bg-white p-4 shadow-sm shadow-gray-950/[0.03]">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-bold text-gray-950">Payment Mix</p>
            <p className="text-xs text-gray-500">Totals from the active view</p>
          </div>
          <span className="rounded-full border border-gray-200 bg-gray-50 px-2.5 py-1 text-xs font-semibold text-gray-700">
            {filterLabel}
          </span>
        </div>

        <div className="space-y-2.5">
          {paymentRows.map(({ label, key, icon: Icon, color }) => {
            const value = summary[key];
            const width =
              summary.filteredTotal > 0
                ? Math.min(100, Math.round((value / summary.filteredTotal) * 100))
                : 0;

            return (
              <div key={key} className="grid grid-cols-[92px_1fr_auto] items-center gap-3 text-sm">
                <span className="inline-flex items-center gap-2 text-gray-600">
                  <Icon className="h-4 w-4 text-gray-400" />
                  {label}
                </span>
                <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                  <div
                    className={`h-full rounded-full ${color}`}
                    style={{ width: `${width}%` }}
                  />
                </div>
                <span className="font-semibold text-gray-900">{formatCurrency(value)}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

const SummaryTile = ({
  icon: Icon,
  label,
  value,
  helper,
  accent,
}: {
  icon: typeof ReceiptText;
  label: string;
  value: string;
  helper: string;
  accent: string;
}) => (
  <div className="relative overflow-hidden rounded-lg border border-gray-200/80 bg-white p-4 shadow-sm shadow-gray-950/[0.03]">
    <div className={`mb-3 flex h-9 w-9 items-center justify-center rounded-lg ${accent}`}>
      <Icon className="h-4 w-4" />
    </div>
    <p className="text-xs font-semibold uppercase text-gray-500">{label}</p>
    <p className="mt-1 truncate text-xl font-bold text-gray-950">{value}</p>
    <p className="mt-1 text-sm text-gray-500">{helper}</p>
  </div>
);
