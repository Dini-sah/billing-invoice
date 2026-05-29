import { useState, useEffect } from 'react';
import { Invoice } from '../types/invoice';
import { storage, CACHE_KEYS, CACHE_DURATION } from '../utils/storage';
import { fetchRecentInvoices } from '../utils/googleSheets';

export const useInvoices = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');

  const cacheKeyForPage = (pageNumber: number, searchTerm: string) =>
    `${CACHE_KEYS.RECENT_INVOICES}_${pageNumber}_${pageSize}_${searchTerm || 'all'}`;
  const cacheKeyForLastFetch = (pageNumber: number, searchTerm: string) =>
    `${CACHE_KEYS.LAST_FETCH}_${pageNumber}_${pageSize}_${searchTerm || 'all'}`;

  const loadInvoices = async (
    pageNumber = page,
    forceRefresh = false,
    searchTerm = search
  ) => {
    const lastFetch = storage.get(cacheKeyForLastFetch(pageNumber, searchTerm));
    const now = Date.now();
    
    // Use cache if available and not expired
    if (!forceRefresh && lastFetch && (now - lastFetch < CACHE_DURATION)) {
      const cached = storage.get(cacheKeyForPage(pageNumber, searchTerm));
      if (cached) {
        setInvoices(cached.invoices || []);
        setTotal(cached.total || 0);
        return;
      }
    }

    setLoading(true);
    setError(null);
    
    try {
      const result = await fetchRecentInvoices(pageNumber, pageSize, searchTerm);
      if (result.success && result.data) {
        setInvoices(result.data);
        setTotal(result.total || 0);
        storage.set(cacheKeyForPage(pageNumber, searchTerm), {
          invoices: result.data,
          total: result.total || 0
        });
        storage.set(cacheKeyForLastFetch(pageNumber, searchTerm), now);
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
    setPage: (nextPage: number) => {
      setPage(nextPage);
      loadInvoices(nextPage);
    },
    setSearch: (nextSearch: string) => {
      setSearch(nextSearch);
      setPage(1);
      loadInvoices(1, true, nextSearch);
    },
    refresh: () => {
      setSearch('');
      setPage(1);
      loadInvoices(1, true, '');
    }
  };
};
