import { InvoiceFilters, InvoiceSummary } from "../types/invoice";
import { getTodayDateInputValue, toDateInputValue } from "./date";

export const defaultSummary: InvoiceSummary = {
  filteredCount: 0,
  filteredTotal: 0,
  todayCount: 0,
  todayTotal: 0,
  cashTotal: 0,
  gpayTotal: 0,
  cardTotal: 0,
  bankTransferTotal: 0,
  otherPaymentTotal: 0,
};

export const normalizeSummary = (
  summary: Partial<InvoiceSummary> | undefined,
  total?: number
): InvoiceSummary => ({
  ...defaultSummary,
  filteredCount: total ?? defaultSummary.filteredCount,
  ...summary,
});

export const createDefaultFilters = (): InvoiceFilters => {
  const today = getTodayDateInputValue();
  return {
    dateRange: "today",
    startDate: today,
    endDate: today,
    type: "all",
    status: "all",
    paymentMethod: "all",
  };
};

export const createAllDataFilters = (): InvoiceFilters => ({
  dateRange: "all",
  startDate: "",
  endDate: "",
  type: "all",
  status: "all",
  paymentMethod: "all",
});

export const getFilterLabel = (filters: InvoiceFilters) => {
  if (filters.dateRange === "today") return "Today";
  if (filters.dateRange === "yesterday") return "Yesterday";
  if (filters.dateRange === "last7") return "Last 7 days";
  if (filters.dateRange === "custom") {
    if (filters.startDate && filters.endDate) {
      return `${filters.startDate} to ${filters.endDate}`;
    }
    return "Custom range";
  }
  return "All dates";
};

export const getActiveFilterCount = (filters: InvoiceFilters) =>
  [
    filters.dateRange !== "today",
    filters.type !== "all",
    filters.status !== "all",
    filters.paymentMethod !== "all",
  ].filter(Boolean).length;

export const getDateRangeValues = (dateRange: InvoiceFilters["dateRange"]) => {
  const today = new Date();

  if (dateRange === "today") {
    const value = getTodayDateInputValue();
    return { startDate: value, endDate: value };
  }

  if (dateRange === "yesterday") {
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    const value = toDateInputValue(yesterday);
    return { startDate: value, endDate: value };
  }

  if (dateRange === "last7") {
    const start = new Date(today);
    start.setDate(today.getDate() - 6);
    return {
      startDate: toDateInputValue(start),
      endDate: toDateInputValue(today),
    };
  }

  return { startDate: "", endDate: "" };
};
