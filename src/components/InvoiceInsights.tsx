import {
  Banknote,
  CreditCard,
  IndianRupee,
  Landmark,
  ReceiptText,
  Smartphone,
  TrendingUp,
  WalletCards,
} from "lucide-react";
import { InvoiceSummary } from "../types/invoice";
import { formatCurrency } from "../utils/invoiceMath";

interface InvoiceInsightsProps {
  summary: InvoiceSummary;
  filterLabel: string;
}

const paymentRows = [
  { label: "Cash", key: "cashTotal", icon: Banknote },
  { label: "GPay", key: "gpayTotal", icon: Smartphone },
  { label: "Card", key: "cardTotal", icon: CreditCard },
  { label: "Bank", key: "bankTransferTotal", icon: Landmark },
  { label: "Other", key: "otherPaymentTotal", icon: WalletCards },
] as const;

export const InvoiceInsights = ({ summary, filterLabel }: InvoiceInsightsProps) => {
  return (
    <div className="mb-5 grid gap-3 xl:grid-cols-[1.15fr_.85fr]">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <SummaryTile
          icon={ReceiptText}
          label={`${filterLabel} bills`}
          value={String(summary.filteredCount)}
          helper="Matching invoices"
        />
        <SummaryTile
          icon={IndianRupee}
          label={`${filterLabel} total`}
          value={formatCurrency(summary.filteredTotal)}
          helper="All payment methods"
        />
        <SummaryTile
          icon={TrendingUp}
          label="Today total"
          value={formatCurrency(summary.todayTotal)}
          helper={`${summary.todayCount} invoices today`}
        />
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-bold text-gray-950">Payment Mix</p>
            <p className="text-xs text-gray-500">Totals from the active view</p>
          </div>
          <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
            {filterLabel}
          </span>
        </div>

        <div className="space-y-2">
          {paymentRows.map(({ label, key, icon: Icon }) => {
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
                  <div className="h-full rounded-full bg-emerald-500" style={{ width: `${width}%` }} />
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
}: {
  icon: typeof ReceiptText;
  label: string;
  value: string;
  helper: string;
}) => (
  <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
    <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
      <Icon className="h-4 w-4" />
    </div>
    <p className="text-xs font-semibold uppercase text-gray-500">{label}</p>
    <p className="mt-1 truncate text-xl font-bold text-gray-950">{value}</p>
    <p className="mt-1 text-sm text-gray-500">{helper}</p>
  </div>
);
