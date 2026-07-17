import {
  Banknote,
  CreditCard,
  FileText,
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
  { label: "Cash", key: "cashTotal", icon: Banknote, color: "#22c55e" },
  { label: "GPay", key: "gpayTotal", icon: Smartphone, color: "#38bdf8" },
  { label: "Card", key: "cardTotal", icon: CreditCard, color: "#8b5cf6" },
  { label: "Bank", key: "bankTransferTotal", icon: Landmark, color: "#f97316" },
  { label: "Other", key: "otherPaymentTotal", icon: WalletCards, color: "#cbd5e1" },
] as const;

export const InvoiceInsights = ({ summary, filterLabel }: InvoiceInsightsProps) => {
  const paidTotal =
    summary.cashTotal +
    summary.gpayTotal +
    summary.cardTotal +
    summary.bankTransferTotal +
    summary.otherPaymentTotal;
  const outstanding = Math.max(0, summary.filteredTotal - paidTotal);
  const totalForMix = Math.max(0, paidTotal);
  const segments = paymentRows.map(({ key, color }) => ({
    value: summary[key],
    color,
  }));
  const donut = buildDonut(segments, totalForMix);

  return (
    <div className="mb-6 grid gap-4 xl:grid-cols-[1fr_1fr_1.2fr_.9fr]">
      <SummaryTile
        icon={ReceiptText}
        label={`${filterLabel} bills`}
        value={String(summary.filteredCount)}
        helper="Matching invoices"
        accent="bg-emerald-100 text-emerald-600"
        trendColor="text-emerald-600"
      />
      <SummaryTile
        icon={WalletCards}
        label="Recorded payments"
        value={formatCurrency(paidTotal)}
        helper="Paid invoices in view"
        accent="bg-orange-100 text-orange-600"
        trendColor="text-orange-600"
      />

      <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm shadow-slate-950/[0.04]">
        <div className="mb-5">
          <p className="text-sm font-bold uppercase text-slate-950">Payment Mix</p>
          <p className="mt-1 text-sm text-slate-500">Totals from the active view</p>
        </div>

        <div className="grid items-center gap-5 sm:grid-cols-[120px_1fr]">
          <div
            className="mx-auto h-28 w-28 rounded-full"
            style={{ background: donut }}
            aria-label="Payment mix chart"
          >
            <div className="m-[18px] h-[76px] w-[76px] rounded-full bg-white shadow-inner" />
          </div>
          <div className="space-y-3">
            {paymentRows.map(({ label, key, color }) => {
              const value = summary[key];
              const percent = totalForMix > 0 ? Math.round((value / totalForMix) * 100) : 0;

              return (
                <div key={key} className="grid grid-cols-[1fr_auto_34px] items-center gap-3 text-sm">
                  <span className="inline-flex items-center gap-2 text-slate-700">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />
                    {label}
                  </span>
                  <span className="font-semibold text-slate-950">{formatCurrency(value)}</span>
                  <span className="text-right text-slate-500">{percent}%</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <SummaryTile
        icon={FileText}
        label="Outstanding"
        value={formatCurrency(outstanding)}
        helper="From all unpaid invoices"
        accent="bg-rose-100 text-rose-600"
        trendColor="text-rose-600"
        sparkColor="rose"
      />
    </div>
  );
};

const SummaryTile = ({
  icon: Icon,
  label,
  value,
  helper,
  accent,
  trendColor,
  sparkColor = "emerald",
}: {
  icon: typeof ReceiptText;
  label: string;
  value: string;
  helper: string;
  accent: string;
  trendColor: string;
  sparkColor?: "emerald" | "rose";
}) => (
  <div className="relative min-h-[176px] overflow-hidden rounded-lg border border-slate-200 bg-white p-5 shadow-sm shadow-slate-950/[0.04]">
    <div className={`mb-7 flex h-14 w-14 items-center justify-center rounded-2xl ${accent}`}>
      <Icon className="h-6 w-6" />
    </div>
    <p className="text-xs font-bold uppercase tracking-wide text-slate-500">{label}</p>
    <p className="mt-3 truncate text-3xl font-bold text-slate-950">{value}</p>
    <p className="mt-2 text-sm text-slate-500">{helper}</p>
    <p className={`mt-4 text-sm font-semibold ${trendColor}`}>- 0% from yesterday</p>
    <Sparkline color={sparkColor} />
  </div>
);

const Sparkline = ({ color }: { color: "emerald" | "rose" }) => {
  const stroke = color === "emerald" ? "#22c55e" : "#fb7185";
  const fill = color === "emerald" ? "rgba(34,197,94,.13)" : "rgba(251,113,133,.13)";

  return (
    <svg className="pointer-events-none absolute bottom-0 right-0 h-16 w-44" viewBox="0 0 176 64" fill="none">
      <path d="M0 46 C24 54 35 54 56 42 C81 28 95 45 119 42 C143 39 149 17 176 30 V64 H0 Z" fill={fill} />
      <path d="M0 46 C24 54 35 54 56 42 C81 28 95 45 119 42 C143 39 149 17 176 30" stroke={stroke} strokeWidth="2" />
    </svg>
  );
};

const buildDonut = (segments: Array<{ value: number; color: string }>, total: number) => {
  if (total <= 0) {
    return "conic-gradient(#e2e8f0 0deg 360deg)";
  }

  let start = 0;
  const stops = segments
    .filter((segment) => segment.value > 0)
    .map((segment) => {
      const end = start + (segment.value / total) * 360;
      const stop = `${segment.color} ${start}deg ${end}deg`;
      start = end;
      return stop;
    });

  return `conic-gradient(${stops.join(", ")})`;
};
