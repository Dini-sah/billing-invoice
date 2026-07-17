import { Invoice, InvoiceFilters, InvoiceSummary } from "../types/invoice";
import { Card, CardContent } from "../components/ui/card";
import { useEffect, useState } from "react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import {
  BarChart3,
  CalendarDays,
  Check,
  ChevronDown,
  Eye,
  FileText,
  Filter,
  Plus,
  RefreshCw,
  Search,
  Settings,
  SlidersHorizontal,
  Smartphone,
  WalletCards,
  X,
} from "lucide-react";
import { getRelativeDate } from "../utils/date";
import {
  createDefaultFilters,
  getActiveFilterCount,
  getDateRangeValues,
  getFilterLabel,
} from "../utils/invoiceFilters";
import { formatCurrency } from "../utils/invoiceMath";
import { InvoiceInsights } from "./InvoiceInsights";
import { RecentInvoices } from "./RecentInvoices";

interface InvoiceListProps {
  invoices: Invoice[];
  loading: boolean;
  error: string | null;
  onRefresh: () => void;
  onViewInvoice: (invoice: Invoice) => void;
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  search: string;
  onSearchChange: (value: string) => void;
  filters: InvoiceFilters;
  onFiltersChange: (filters: InvoiceFilters) => void;
  summary: InvoiceSummary;
  onCreateInvoice: () => void;
}

export const InvoiceList = ({
  invoices,
  loading,
  error,
  onRefresh,
  onViewInvoice,
  page,
  pageSize,
  total,
  onPageChange,
  search,
  onSearchChange,
  filters,
  onFiltersChange,
  summary,
  onCreateInvoice,
}: InvoiceListProps) => {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const [searchInput, setSearchInput] = useState(search);
  const [draftFilters, setDraftFilters] = useState(filters);
  const [filtersOpen, setFiltersOpen] = useState(false);

  useEffect(() => {
    setSearchInput(search);
  }, [search]);

  useEffect(() => {
    setDraftFilters(filters);
  }, [filters]);

  const updateFilters = (nextFilters: InvoiceFilters) => {
    setDraftFilters(nextFilters);
    onFiltersChange(nextFilters);
  };

  const runSearch = () => {
    onSearchChange(searchInput.trim());
  };

  const clearSearch = () => {
    setSearchInput("");
    if (search) {
      onSearchChange("");
    }
  };

  const handleDateRangeChange = (dateRange: InvoiceFilters["dateRange"]) => {
    updateFilters({
      ...draftFilters,
      dateRange,
      ...getDateRangeValues(dateRange),
    });
  };

  const activeFilterCount = getActiveFilterCount(filters);
  const filterLabel = getFilterLabel(filters);
  const paidTotal =
    summary.cashTotal +
    summary.gpayTotal +
    summary.cardTotal +
    summary.bankTransferTotal +
    summary.otherPaymentTotal;
  const unpaidTotal = Math.max(0, summary.filteredTotal - paidTotal);
  const paidInvoices = invoices.filter((invoice) => invoice.status === "paid").length;
  const unpaidInvoices = Math.max(0, summary.filteredCount - paidInvoices);

  if (loading) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-8 shadow-sm">
        <div className="flex items-center justify-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-orange-500 border-t-transparent" />
          <span className="ml-3 text-slate-600">Loading invoices...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="p-6">
          <p className="mb-4 font-medium text-red-700">{error}</p>
          <Button
            onClick={onRefresh}
            variant="outline"
            className="border-red-200 text-red-700 hover:bg-red-100"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div>
      <InvoiceInsights summary={summary} filterLabel={filterLabel} />

      {/* <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm shadow-slate-950/[0.04] sm:p-6">
        <div className="mb-6 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-950">Recent Invoices</h2>
            <p className="mt-1 text-sm text-slate-500">
              Showing saved sales and service invoices.
            </p>
          </div>

          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <Button
              type="button"
              variant="outline"
              onClick={() => setFiltersOpen((open) => !open)}
              className="h-12 justify-between gap-3 px-4"
              aria-expanded={filtersOpen}
            >
              <span className="inline-flex items-center gap-2">
                <SlidersHorizontal className="h-4 w-4" />
                Filters
                {activeFilterCount > 0 && (
                  <span className="rounded-full bg-orange-500 px-1.5 py-0.5 text-[11px] font-bold text-white">
                    {activeFilterCount}
                  </span>
                )}
              </span>
              <ChevronDown className="h-4 w-4 text-slate-400" />
            </Button>

            <Select
              value={draftFilters.status}
              onValueChange={(status: InvoiceFilters["status"]) =>
                updateFilters({ ...draftFilters, status })
              }
            >
              <SelectTrigger className="h-12 w-full min-w-40 lg:w-40">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
              </SelectContent>
            </Select>

            <div className="relative">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="Search invoice, customer, phone, item..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    runSearch();
                  }
                }}
                className="h-12 w-full pl-12 pr-11 lg:w-[420px]"
              />
              {searchInput && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={clearSearch}
                  className="absolute right-1.5 top-1/2 h-9 w-9 -translate-y-1/2 p-0"
                  aria-label="Clear search"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>

            <div className="flex gap-3">
              <Button
                onClick={runSearch}
                disabled={!searchInput.trim()}
                variant="outline"
                className="h-12 w-12 p-0"
                aria-label="Search"
              >
                <Filter className="h-4 w-4" />
              </Button>
              <Button onClick={onRefresh} variant="outline" className="h-12 gap-2 px-4">
                <RefreshCw className="h-4 w-4" />
                <span className="hidden sm:inline">Refresh</span>
              </Button>
              <Button variant="outline" className="h-12 w-12 p-0" aria-label="Settings">
                <Settings className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {filtersOpen && (
          <div className="mb-5 rounded-lg border border-slate-200 bg-slate-50/80 p-4">
            <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                <Filter className="h-4 w-4" />
                Invoice filters
              </div>
              {activeFilterCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => updateFilters(createDefaultFilters())}
                  className="justify-center"
                >
                  <X className="mr-2 h-4 w-4" />
                  Reset to today
                </Button>
              )}
            </div>

            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <Select value={draftFilters.dateRange} onValueChange={handleDateRangeChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Date" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="yesterday">Yesterday</SelectItem>
                  <SelectItem value="last7">Last 7 days</SelectItem>
                  <SelectItem value="custom">Custom range</SelectItem>
                  <SelectItem value="all">All dates</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={draftFilters.type}
                onValueChange={(type: InvoiceFilters["type"]) =>
                  updateFilters({ ...draftFilters, type })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All types</SelectItem>
                  <SelectItem value="sale">Sale</SelectItem>
                  <SelectItem value="service">Service</SelectItem>
                  <SelectItem value="sale & service">Sale & service</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={draftFilters.status}
                onValueChange={(status: InvoiceFilters["status"]) =>
                  updateFilters({ ...draftFilters, status })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All status</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={draftFilters.paymentMethod}
                onValueChange={(paymentMethod: InvoiceFilters["paymentMethod"]) =>
                  updateFilters({ ...draftFilters, paymentMethod })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Payment" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All payments</SelectItem>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="gpay">GPay</SelectItem>
                  <SelectItem value="card">Card</SelectItem>
                  <SelectItem value="bank transfer">Bank transfer</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {draftFilters.dateRange === "custom" && (
              <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:max-w-xl">
                <div className="relative">
                  <CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    type="date"
                    value={draftFilters.startDate}
                    onChange={(e) =>
                      updateFilters({ ...draftFilters, startDate: e.target.value })
                    }
                    className="pl-9"
                  />
                </div>
                <div className="relative">
                  <CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    type="date"
                    value={draftFilters.endDate}
                    onChange={(e) =>
                      updateFilters({ ...draftFilters, endDate: e.target.value })
                    }
                    className="pl-9"
                  />
                </div>
              </div>
            )}
          </div>
        )}

        <div className="overflow-hidden rounded-lg border border-slate-200">
          <div className="hidden grid-cols-[48px_1fr_1.2fr_.8fr_.8fr_.8fr_.8fr_.8fr_.8fr_.8fr] items-center bg-slate-50 px-5 py-4 text-xs font-bold uppercase text-slate-600 lg:grid">
            <span className="h-4 w-4 rounded border border-slate-300 bg-white" />
            <span>Invoice #</span>
            <span>Customer</span>
            <span>Date</span>
            <span>Due Date</span>
            <span>Status</span>
            <span>Amount</span>
            <span>Paid</span>
            <span>Due</span>
            <span className="text-right">Actions</span>
          </div>

          {invoices.length === 0 ? (
            <EmptyInvoices filterLabel={filterLabel} onCreateInvoice={onCreateInvoice} />
          ) : (
            <div className="divide-y divide-slate-100">
              {invoices.map((invoice) => (
                <InvoiceRow key={invoice.id} invoice={invoice} onViewInvoice={onViewInvoice} />
              ))}
            </div>
          )}
        </div>

        {total > 0 && (
          <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-slate-600">
              Showing {(page - 1) * pageSize + 1}-{Math.min(page * pageSize, total)} of {total}
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(Math.max(1, page - 1))}
                disabled={page <= 1}
              >
                Previous
              </Button>
              <span className="text-sm font-medium text-slate-600">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(Math.min(totalPages, page + 1))}
                disabled={page >= totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </section> */}

      <RecentInvoices 
        invoices={invoices}
        onRefresh={onRefresh}
        onViewInvoice={onViewInvoice}
        onCreateInvoice={onCreateInvoice}
        page={page}
        pageSize={pageSize}
        total={total}
        onPageChange={onPageChange}
        search={search}
        onSearchChange={onSearchChange}
        filters={filters}
        onFiltersChange={onFiltersChange}
        filterLabel={filterLabel}
      />

      <div className="mt-6 grid gap-4 lg:grid-cols-4">
        <FooterMetric
          label="Total Revenue"
          value={formatCurrency(summary.filteredTotal)}
          icon={WalletCards}
          color="violet"
        />
        <FooterMetric label="Paid Invoices" value={String(paidInvoices)} icon={Check} color="emerald" />
        <FooterMetric label="Unpaid Invoices" value={String(unpaidInvoices)} icon={ClockIcon} color="rose" />
        <FooterMetric
          label="Avg. Invoice Value"
          value={formatCurrency(summary.filteredCount > 0 ? summary.filteredTotal / summary.filteredCount : 0)}
          icon={BarChart3}
          color="blue"
        />
      </div>
    </div>
  );
};

const InvoiceRow = ({
  invoice,
  onViewInvoice,
}: {
  invoice: Invoice;
  onViewInvoice: (invoice: Invoice) => void;
}) => {
  const paid = invoice.status === "paid" ? invoice.total : 0;
  const due = invoice.status === "pending" ? invoice.total : 0;

  return (
    <div className="bg-white px-4 py-4 transition hover:bg-slate-50 sm:px-5 sm:py-4 lg:grid lg:grid-cols-[48px_1fr_1.2fr_.8fr_.8fr_.8fr_.8fr_.8fr_.8fr_.8fr] lg:items-center">
      {/* Desktop checkbox */}
      <span className="hidden h-4 w-4 rounded border border-slate-300 bg-white lg:block" />

      {/* Row 1: Invoice ID + Status badge (mobile only) */}
      <div className="flex items-center justify-between gap-2 lg:col-start-2">
        <p className="truncate text-sm font-bold text-slate-950">{invoice.id}</p>
        <span
          className={`shrink-0 inline-flex rounded-full border px-2.5 py-0.5 text-[11px] font-bold capitalize lg:hidden ${
            invoice.status === "paid"
              ? "border-emerald-100 bg-emerald-50 text-emerald-700"
              : "border-amber-100 bg-amber-50 text-amber-700"
          }`}
        >
          {invoice.status}
        </span>
      </div>

      {/* Row 2: Customer name + phone */}
      <div className="mt-2 min-w-0 lg:col-start-3 lg:mt-0">
        <p className="truncate text-sm font-semibold text-slate-800">{invoice.customerName}</p>
        <p className="mt-0.5 text-xs text-slate-500">{invoice.phoneNumber}</p>
      </div>

      {/* Desktop-only columns */}
      <p className="hidden text-sm text-slate-600 lg:block">{getRelativeDate(invoice.date)}</p>
      <p className="hidden text-sm text-slate-600 lg:block">{getRelativeDate(invoice.date)}</p>
      <div className="hidden lg:block">
        <span
          className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-bold capitalize ${
            invoice.status === "paid"
              ? "border-emerald-100 bg-emerald-50 text-emerald-700"
              : "border-amber-100 bg-amber-50 text-amber-700"
          }`}
        >
          {invoice.status}
        </span>
      </div>

      {/* Desktop amounts */}
      <p className="hidden text-sm font-bold text-slate-950 lg:block">{formatCurrency(invoice.total)}</p>
      <p className="hidden text-sm font-semibold text-emerald-700 lg:block">{formatCurrency(paid)}</p>
      <p className="hidden text-sm font-semibold text-rose-700 lg:block">{formatCurrency(due)}</p>

      {/* Mobile: compact info bar */}
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-100 bg-slate-50/60 p-2.5 sm:p-3 lg:hidden">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="text-center">
            <p className="text-[9px] font-semibold uppercase text-slate-400 sm:text-[10px]">Total</p>
            <p className="text-xs font-bold text-slate-950 sm:text-sm">{formatCurrency(invoice.total)}</p>
          </div>
          <div className="h-6 w-px bg-slate-200 sm:h-8" />
          <div className="text-center">
            <p className="text-[9px] font-semibold uppercase text-slate-400 sm:text-[10px]">{invoice.status === "paid" ? "Paid" : "Due"}</p>
            <p className={`text-xs font-bold sm:text-sm ${invoice.status === "paid" ? "text-emerald-600" : "text-rose-600"}`}>
              {invoice.status === "paid" ? formatCurrency(paid) : formatCurrency(due)}
            </p>
          </div>
          <div className="h-6 w-px bg-slate-200 sm:h-8" />
          <div className="text-center">
            <p className="text-[9px] font-semibold uppercase text-slate-400 sm:text-[10px]">Date</p>
            <p className="text-[10px] font-semibold text-slate-600 sm:text-xs">{getRelativeDate(invoice.date)}</p>
          </div>
        </div>
        <Button onClick={() => onViewInvoice(invoice)} variant="outline" size="sm" className="h-8 gap-1 px-2.5 text-[11px] font-semibold sm:h-9 sm:gap-1.5 sm:px-3 sm:text-xs">
          <Eye className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
          <span className="hidden sm:inline">View</span>
        </Button>
      </div>

      {/* Desktop: action button */}
      <div className="hidden items-center justify-end lg:flex">
        <Button onClick={() => onViewInvoice(invoice)} variant="outline" size="sm" className="gap-2">
          <Eye className="h-4 w-4" />
          View
        </Button>
      </div>
    </div>
  );
};

const EmptyInvoices = ({
  filterLabel,
  onCreateInvoice,
}: {
  filterLabel: string;
  onCreateInvoice: () => void;
}) => (
  <div className="relative min-h-[340px] overflow-hidden bg-white p-8 text-center">
    <div className="mx-auto mt-10 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100">
      <FileText className="h-8 w-8 text-slate-500" />
    </div>
    <h3 className="mt-5 text-lg font-bold text-slate-950">No invoices found</h3>
    <p className="mx-auto mt-2 max-w-xl text-sm text-slate-500">
      No invoices match {filterLabel.toLowerCase()}. Change the search or filters to see more invoices.
    </p>
    <Button onClick={onCreateInvoice} className="mt-6 bg-orange-500 hover:bg-orange-600">
      <Plus className="mr-2 h-4 w-4" />
      Create Invoice
    </Button>
    <div className="absolute bottom-4 right-6 hidden h-44 w-56 text-orange-200 md:block">
      <svg viewBox="0 0 220 170" fill="none" className="h-full w-full">
        <circle cx="114" cy="100" r="78" fill="#fff7ed" />
        <rect x="58" y="32" width="106" height="132" rx="8" fill="white" stroke="#fed7aa" strokeWidth="2" />
        <path d="M76 58H110M76 74H126M76 90H106" stroke="#fed7aa" strokeWidth="6" strokeLinecap="round" />
        <circle cx="140" cy="113" r="32" fill="white" stroke="#fed7aa" strokeWidth="6" />
        <path d="M163 136L190 162" stroke="#fed7aa" strokeWidth="10" strokeLinecap="round" />
        <path d="M26 160H78M16 160H21M178 160H214" stroke="#fed7aa" strokeWidth="2" strokeLinecap="round" />
      </svg>
    </div>
  </div>
);

const FooterMetric = ({
  label,
  value,
  icon: Icon,
  color,
}: {
  label: string;
  value: string;
  icon: typeof WalletCards;
  color: "violet" | "emerald" | "rose" | "blue";
}) => {
  const colors = {
    violet: "bg-violet-100 text-violet-600",
    emerald: "bg-emerald-100 text-emerald-600",
    rose: "bg-rose-100 text-rose-600",
    blue: "bg-blue-100 text-blue-600",
  };

  return (
    <div className="relative min-h-32 overflow-hidden rounded-lg border border-slate-200 bg-white p-5 shadow-sm shadow-slate-950/[0.04]">
      <div className={`absolute right-5 top-5 flex h-10 w-10 items-center justify-center rounded-full ${colors[color]}`}>
        <Icon className="h-5 w-5" />
      </div>
      <p className="text-xs font-bold uppercase text-slate-500">{label}</p>
      <p className="mt-4 text-2xl font-bold text-slate-950">{value}</p>
      <p className="mt-2 text-sm text-slate-500">- 0% from last 7 days</p>
      <svg className="absolute bottom-0 right-0 h-12 w-40 opacity-80" viewBox="0 0 160 48" fill="none">
        <path d="M0 41 C22 28 32 40 48 31 C66 21 75 8 90 20 C106 34 116 42 132 29 C142 21 150 18 160 20 V48 H0 Z" fill="currentColor" className={colors[color].split(" ")[1]} opacity=".12" />
        <path d="M0 41 C22 28 32 40 48 31 C66 21 75 8 90 20 C106 34 116 42 132 29 C142 21 150 18 160 20" stroke="currentColor" className={colors[color].split(" ")[1]} strokeWidth="2" />
      </svg>
    </div>
  );
};

const ClockIcon = Smartphone;
