import { useEffect, useMemo, useState } from "react";
import {
  ArrowDownLeft,
  ArrowUpRight,
  CalendarDays,
  IndianRupee,
  Plus,
  RefreshCw,
  Trash2,
  WalletCards,
} from "lucide-react";
import { CashbookEntry, CashbookEntryType, CashbookSummary } from "../types/cashbook";
import {
  creditCategories,
  debitCategories,
  paymentMethodOptions,
} from "../utils/cashbook";
import { getTodayDateInputValue } from "../utils/date";
import { formatCurrency } from "../utils/invoiceMath";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";

interface CashbookProps {
  entries: CashbookEntry[];
  summary: CashbookSummary;
  selectedDate: string;
  loading: boolean;
  syncing: boolean;
  error: string | null;
  onRefresh: () => void;
  onAddEntry: (entry: Omit<CashbookEntry, "id" | "createdAt">) => Promise<boolean>;
  onRemoveEntry: (entryId: string) => Promise<boolean>;
}

export const Cashbook = ({
  entries,
  summary,
  selectedDate,
  loading,
  syncing,
  error,
  onRefresh,
  onAddEntry,
  onRemoveEntry,
}: CashbookProps) => {
  const [type, setType] = useState<CashbookEntryType>("debit");
  const [date, setDate] = useState(selectedDate || getTodayDateInputValue());
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState(debitCategories[0]);
  const [amount, setAmount] = useState("");
  const [paymentMethod, setPaymentMethod] =
    useState<CashbookEntry["paymentMethod"]>("cash");
  const [note, setNote] = useState("");

  const categories = type === "credit" ? creditCategories : debitCategories;
  const selectedEntries = useMemo(
    () => entries.filter((entry) => entry.date === selectedDate),
    [entries, selectedDate]
  );

  useEffect(() => {
    setDate(selectedDate);
  }, [selectedDate]);

  const handleTypeChange = (nextType: CashbookEntryType) => {
    setType(nextType);
    setCategory(nextType === "credit" ? creditCategories[0] : debitCategories[0]);
  };

  const handleAdd = async () => {
    const parsedAmount = Number(amount);

    if (!title.trim() || !Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      return;
    }

    const saved = await onAddEntry({
      type,
      date,
      title: title.trim(),
      category,
      amount: parsedAmount,
      paymentMethod,
      note: note.trim() || undefined,
    });

    if (saved) {
      setTitle("");
      setAmount("");
      setNote("");
    }
  };

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <section className="grid gap-3 md:grid-cols-3">
        <CashMetric
          icon={ArrowDownLeft}
          label="Selected In"
          value={formatCurrency(summary.todayIn)}
          helper={`${formatCurrency(summary.invoiceIn)} invoice + ${formatCurrency(summary.manualIn)} manual`}
          tone="text-emerald-700 bg-emerald-50"
        />
        <CashMetric
          icon={ArrowUpRight}
          label="Selected Out"
          value={formatCurrency(summary.todayOut)}
          helper="Manual debit entries"
          tone="text-rose-700 bg-rose-50"
        />
        <CashMetric
          icon={IndianRupee}
          label="Net Selected"
          value={formatCurrency(summary.todayNet)}
          helper={summary.todayNet >= 0 ? "Positive balance" : "More out than in"}
          tone="text-[var(--theme-primary)] bg-[var(--theme-soft)]"
        />
      </section>

      <section className="grid gap-5 lg:grid-cols-[420px_1fr]">
        <div className="rounded-lg border border-gray-200/80 bg-white p-4 shadow-sm shadow-gray-950/[0.03]">
          <div className="mb-4">
            <h2 className="text-lg font-bold text-gray-950">Add Cashbook Entry</h2>
            <p className="text-sm text-gray-500">
              Track shop credits and expenses outside invoices.
            </p>
            {error && (
              <p className="mt-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
                {error}
              </p>
            )}
          </div>

          <div className="mb-4 grid grid-cols-2 rounded-lg border border-gray-200 bg-gray-100 p-1">
            <Button
              type="button"
              variant={type === "credit" ? "default" : "ghost"}
              onClick={() => handleTypeChange("credit")}
              className="h-10 gap-2 shadow-none"
            >
              <ArrowDownLeft className="h-4 w-4" />
              Credit
            </Button>
            <Button
              type="button"
              variant={type === "debit" ? "default" : "ghost"}
              onClick={() => handleTypeChange("debit")}
              className="h-10 gap-2 shadow-none"
            >
              <ArrowUpRight className="h-4 w-4" />
              Debit
            </Button>
          </div>

          <div className="space-y-3">
            <div>
              <Label htmlFor="cashbook-title">Title</Label>
              <Input
                id="cashbook-title"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder={type === "credit" ? "Advance received" : "Display purchase"}
                className="mt-1"
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <Label>Category</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Payment</Label>
                <Select
                  value={paymentMethod}
                  onValueChange={(value) =>
                    setPaymentMethod(value as CashbookEntry["paymentMethod"])
                  }
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {paymentMethodOptions.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <Label htmlFor="cashbook-amount">Amount</Label>
                <Input
                  id="cashbook-amount"
                  type="number"
                  min="0"
                  step="0.01"
                  value={amount}
                  onChange={(event) => setAmount(event.target.value)}
                  placeholder="0.00"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="cashbook-date">Date</Label>
                <div className="relative mt-1">
                  <CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <Input
                    id="cashbook-date"
                    type="date"
                    value={date}
                    onChange={(event) => setDate(event.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>
            </div>

            <div>
              <Label htmlFor="cashbook-note">Note</Label>
              <Input
                id="cashbook-note"
                value={note}
                onChange={(event) => setNote(event.target.value)}
                placeholder="Optional reference"
                className="mt-1"
              />
            </div>

            <Button
              type="button"
              onClick={handleAdd}
              disabled={!title.trim() || Number(amount) <= 0 || syncing}
              className="w-full gap-2"
            >
              <Plus className="h-4 w-4" />
              {syncing ? "Syncing..." : "Add Entry"}
            </Button>
          </div>
        </div>

        <div className="rounded-lg border border-gray-200/80 bg-white p-4 shadow-sm shadow-gray-950/[0.03]">
          <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-bold text-gray-950">Selected Date Ledger</h2>
              <p className="text-sm text-gray-500">
                Invoice income is included automatically. Manual entries sync to Sheets.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs font-semibold text-gray-700">
                {loading
                  ? "Loading..."
                  : `${selectedEntries.length + (summary.invoiceIn > 0 ? 1 : 0)} entries`}
              </span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onRefresh}
                disabled={loading || syncing}
              >
                <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              </Button>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center rounded-lg border border-gray-200 bg-gray-50 p-8 text-gray-600">
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              Loading cashbook entries...
            </div>
          ) : selectedEntries.length === 0 && summary.invoiceIn <= 0 ? (
            <div className="rounded-lg border border-dashed border-gray-200 bg-gray-50 p-8 text-center">
              <WalletCards className="mx-auto mb-3 h-8 w-8 text-gray-400" />
              <p className="font-semibold text-gray-950">No cashbook entries for this date</p>
              <p className="mt-1 text-sm text-gray-500">
                Add expenses or extra income to see the daily net balance.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {summary.invoiceIn > 0 && (
                <div className="grid gap-3 rounded-lg border border-emerald-100 bg-emerald-50/70 p-3 sm:grid-cols-[1fr_auto_auto] sm:items-center">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-white px-2 py-0.5 text-xs font-semibold text-emerald-700">
                        Auto In
                      </span>
                      <p className="truncate font-semibold text-gray-950">
                        Paid invoice collections
                      </p>
                      {(summary.invoiceDiscountTotal || 0) > 0 && (
                        <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-bold text-emerald-700">
                          −{formatCurrency(summary.invoiceDiscountTotal || 0)}
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-sm text-gray-500">
                      Pulled from paid invoice total for the selected date
                    </p>
                    {(summary.invoiceSubtotalTotal != null || (summary.invoiceDiscountTotal || 0) > 0) && (
                      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 rounded-md border border-gray-200 bg-white/70 px-3 py-2 text-xs text-gray-600">
                        {summary.invoiceSubtotalTotal != null && (
                          <span>
                            <span className="text-gray-400">Subtotal:</span>{" "}
                            <span className="font-semibold text-gray-700">{formatCurrency(summary.invoiceSubtotalTotal)}</span>
                          </span>
                        )}
                        {(summary.invoiceDiscountTotal || 0) > 0 && (
                          <span>
                            <span className="text-gray-400">Discount:</span>{" "}
                            <span className="font-semibold text-emerald-600">−{formatCurrency(summary.invoiceDiscountTotal || 0)}</span>
                          </span>
                        )}
                        <span>
                          <span className="text-gray-400">Total:</span>{" "}
                          <span className="font-bold text-gray-900">{formatCurrency(summary.invoiceIn)}</span>
                        </span>
                      </div>
                    )}
                  </div>
                  <p className="text-lg font-bold text-emerald-700">
                    +{formatCurrency(summary.invoiceIn)}
                  </p>
                  <span className="justify-self-start sm:justify-self-end" aria-hidden="true" />
                </div>
              )}
              {selectedEntries.map((entry) => {
                const hasInvoiceBreakdown =
                  entry.category === "Invoice payment" &&
                  (entry.subtotal != null || entry.discountAmount != null);
                const hasDiscount = (entry.discountAmount || 0) > 0;
                return (
                <div
                  key={entry.id}
                  className="grid gap-3 rounded-lg border border-gray-200 bg-gray-50/70 p-3 sm:grid-cols-[1fr_auto_auto] sm:items-center"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                          entry.type === "credit"
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-rose-50 text-rose-700"
                        }`}
                      >
                        {entry.type === "credit" ? "In" : "Out"}
                      </span>
                      <p className="truncate font-semibold text-gray-950">{entry.title}</p>
                      {hasDiscount && (
                        <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-bold text-emerald-700">
                          −{formatCurrency(entry.discountAmount || 0)}
                          {entry.discountType === "percentage"
                            ? ` (${entry.discountValue}%)`
                            : ""}
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-sm capitalize text-gray-500">
                      {entry.category} · {entry.paymentMethod}
                      {entry.note ? ` · ${entry.note}` : ""}
                    </p>
                    {hasInvoiceBreakdown && (
                      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 rounded-md border border-gray-200 bg-white/70 px-3 py-2 text-xs text-gray-600">
                        {entry.subtotal != null && (
                          <span>
                            <span className="text-gray-400">Subtotal:</span>{" "}
                            <span className="font-semibold text-gray-700">{formatCurrency(entry.subtotal)}</span>
                          </span>
                        )}
                        {hasDiscount && (
                          <span>
                            <span className="text-gray-400">Discount:</span>{" "}
                            <span className="font-semibold text-emerald-600">−{formatCurrency(entry.discountAmount || 0)}</span>
                          </span>
                        )}
                        {entry.taxableBase != null && (
                          <span>
                            <span className="text-gray-400">Taxable:</span>{" "}
                            <span className="font-semibold text-gray-700">{formatCurrency(entry.taxableBase)}</span>
                          </span>
                        )}
                        {entry.taxTotal != null && (
                          <span>
                            <span className="text-gray-400">Tax (3.5%):</span>{" "}
                            <span className="font-semibold text-gray-700">{formatCurrency(entry.taxTotal)}</span>
                          </span>
                        )}
                        <span>
                          <span className="text-gray-400">Total:</span>{" "}
                          <span className="font-bold text-gray-900">{formatCurrency(entry.amount)}</span>
                        </span>
                      </div>
                    )}
                  </div>
                  <p
                    className={`text-lg font-bold ${
                      entry.type === "credit" ? "text-emerald-700" : "text-rose-700"
                    }`}
                  >
                    {entry.type === "credit" ? "+" : "-"}
                    {formatCurrency(entry.amount)}
                  </p>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => onRemoveEntry(entry.id)}
                    disabled={syncing || entry.invoiceId != null}
                    className={`justify-self-start sm:justify-self-end ${
                      entry.invoiceId != null
                        ? "cursor-not-allowed text-gray-300 hover:bg-transparent hover:text-gray-300"
                        : "text-red-500 hover:bg-red-50 hover:text-red-700"
                    }`}
                    aria-label={`Delete ${entry.title}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

const CashMetric = ({
  icon: Icon,
  label,
  value,
  helper,
  tone,
}: {
  icon: typeof ArrowUpRight;
  label: string;
  value: string;
  helper: string;
  tone: string;
}) => (
  <div className="rounded-lg border border-gray-200/80 bg-white p-4 shadow-sm shadow-gray-950/[0.03]">
    <div className={`mb-3 flex h-10 w-10 items-center justify-center rounded-lg ${tone}`}>
      <Icon className="h-5 w-5" />
    </div>
    <p className="text-xs font-semibold uppercase text-gray-500">{label}</p>
    <p className="mt-1 truncate text-2xl font-bold text-gray-950">{value}</p>
    <p className="mt-1 text-sm text-gray-500">{helper}</p>
  </div>
);
