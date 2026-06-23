import { useState, useEffect } from 'react';
import { Invoice, InvoiceFilters, InvoiceSummary } from '../types/invoice';
import { storage, CACHE_DURATION } from '../utils/storage';
import { fetchRecentInvoices } from '../utils/googleSheets';
import {
  createAllDataFilters,
  createDefaultFilters,
  defaultSummary,
  normalizeSummary,
} from '../utils/invoiceFilters';
import { getInvoiceCacheKeys } from '../utils/invoiceCache';

const defaultFilters = createDefaultFilters();

export const useInvoices = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [filters, setFiltersState] = useState<InvoiceFilters>(defaultFilters);
  const [summary, setSummary] = useState<InvoiceSummary>(defaultSummary);

  const loadInvoices = async (
    pageNumber = page,
    forceRefresh = false,
    searchTerm = search,
    nextFilters = filters
  ) => {
    const hasSearch = searchTerm.trim().length > 0;
    const filtersForRequest = hasSearch ? createAllDataFilters() : nextFilters;
    const { pageKey, fetchKey } = getInvoiceCacheKeys(
      pageNumber,
      pageSize,
      searchTerm,
      filtersForRequest
    );

    const lastFetch = storage.get(fetchKey);
    const now = Date.now();
    
    // Use cache if available and not expired
    if (!forceRefresh && lastFetch && (now - lastFetch < CACHE_DURATION)) {
      const cached = storage.get(pageKey);
      if (cached) {
        setInvoices(cached.invoices || []);
        setTotal(cached.total || 0);
        setSummary(normalizeSummary(cached.summary));
        return;
      }
    }

    setLoading(true);
    setError(null);
    
    try {
      const result = await fetchRecentInvoices(pageNumber, pageSize, searchTerm, filtersForRequest);
      if (result.success && result.data) {
        setInvoices(result.data);
        setTotal(result.total || 0);
        setSummary(normalizeSummary(result.summary));
        storage.set(pageKey, {
          invoices: result.data,
          total: result.total || 0,
          summary: normalizeSummary(result.summary)
        });
        storage.set(fetchKey, now);
      } else {
        setError(result.error || 'Failed to load invoices');
      }
    } catch (err) {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInvoices(1);
  }, []);

  return {
    invoices,
    loading,
    error,
    page,
    pageSize,
    total,
    search,
    filters,
    summary,
    setPage: (nextPage: number) => {
      setPage(nextPage);
      loadInvoices(nextPage);
    },
    setSearch: (nextSearch: string) => {
      setSearch(nextSearch);
      setPage(1);
      loadInvoices(1, true, nextSearch);
    },
    setFilters: (nextFilters: InvoiceFilters) => {
      setFiltersState(nextFilters);
      setPage(1);
      loadInvoices(1, true, search, nextFilters);
    },
    refresh: () => {
      const nextDefaultFilters = createDefaultFilters();
      setSearch('');
      setFiltersState(nextDefaultFilters);
      setPage(1);
      loadInvoices(1, true, '', nextDefaultFilters);
    }
  };
};
