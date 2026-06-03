import { useState, useEffect } from 'react';
import { Invoice, InvoiceFilters, InvoiceSummary } from '../types/invoice';
import { storage, CACHE_KEYS, CACHE_DURATION } from '../utils/storage';
import { fetchRecentInvoices } from '../utils/googleSheets';

const defaultFilters: InvoiceFilters = {
  dateRange: 'all',
  startDate: '',
  endDate: '',
  type: 'all',
  status: 'all',
  paymentMethod: 'all'
};

const defaultSummary: InvoiceSummary = {
  filteredCount: 0,
  filteredTotal: 0,
  todayCount: 0,
  todayTotal: 0,
  paidTotal: 0,
  pendingTotal: 0
};

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

  const filtersKey = (nextFilters: InvoiceFilters) =>
    JSON.stringify(nextFilters);
  const cacheKeyForPage = (
    pageNumber: number,
    searchTerm: string,
    nextFilters: InvoiceFilters
  ) =>
    `${CACHE_KEYS.RECENT_INVOICES}_${pageNumber}_${pageSize}_${searchTerm || 'all'}_${filtersKey(nextFilters)}`;
  const cacheKeyForLastFetch = (
    pageNumber: number,
    searchTerm: string,
    nextFilters: InvoiceFilters
  ) =>
    `${CACHE_KEYS.LAST_FETCH}_${pageNumber}_${pageSize}_${searchTerm || 'all'}_${filtersKey(nextFilters)}`;

  const loadInvoices = async (
    pageNumber = page,
    forceRefresh = false,
    searchTerm = search,
    nextFilters = filters
  ) => {
    const lastFetch = storage.get(cacheKeyForLastFetch(pageNumber, searchTerm, nextFilters));
    const now = Date.now();
    
    // Use cache if available and not expired
    if (!forceRefresh && lastFetch && (now - lastFetch < CACHE_DURATION)) {
      const cached = storage.get(cacheKeyForPage(pageNumber, searchTerm, nextFilters));
      if (cached) {
        setInvoices(cached.invoices || []);
        setTotal(cached.total || 0);
        setSummary(cached.summary || defaultSummary);
        return;
      }
    }

    setLoading(true);
    setError(null);
    
    try {
      const result = await fetchRecentInvoices(pageNumber, pageSize, searchTerm, nextFilters);
      if (result.success && result.data) {
        setInvoices(result.data);
        setTotal(result.total || 0);
        setSummary(result.summary || defaultSummary);
        storage.set(cacheKeyForPage(pageNumber, searchTerm, nextFilters), {
          invoices: result.data,
          total: result.total || 0,
          summary: result.summary || defaultSummary
        });
        storage.set(cacheKeyForLastFetch(pageNumber, searchTerm, nextFilters), now);
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
      setSearch('');
      setFiltersState(defaultFilters);
      setPage(1);
      loadInvoices(1, true, '', defaultFilters);
    }
  };
};
