import { InvoiceFilters } from "../types/invoice";
import { CACHE_KEYS } from "./storage";

const filtersKey = (filters: InvoiceFilters) => JSON.stringify(filters);

export const getInvoiceCacheKeys = (
  page: number,
  pageSize: number,
  search: string,
  filters: InvoiceFilters
) => {
  const normalizedSearch = search.trim() || "all";
  const suffix = `${page}_${pageSize}_${normalizedSearch}_${filtersKey(filters)}`;

  return {
    pageKey: `${CACHE_KEYS.RECENT_INVOICES}_${suffix}`,
    fetchKey: `${CACHE_KEYS.LAST_FETCH}_${suffix}`,
  };
};
