import { useEffect, useMemo, useState } from "react";
import { CashbookEntry } from "../types/cashbook";
import {
  calculateCashbookSummary,
  CASHBOOK_STORAGE_KEY,
  createCashbookEntry,
} from "../utils/cashbook";
import {
  deleteCashbookEntry,
  fetchCashbookEntries,
  saveCashbookEntry,
} from "../utils/googleSheets";
import { storage } from "../utils/storage";

export const useCashbook = (invoiceDateTotal: number, selectedDate?: string) => {
  const [entries, setEntries] = useState<CashbookEntry[]>(
    () => storage.get(CASHBOOK_STORAGE_KEY) || []
  );
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const persist = (nextEntries: CashbookEntry[]) => {
    setEntries(nextEntries);
    storage.set(CASHBOOK_STORAGE_KEY, nextEntries);
  };

  const loadEntries = async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await fetchCashbookEntries();
      if (result.success) {
        const remoteEntries = (result.data || []) as CashbookEntry[];
        const localEntries = (storage.get(CASHBOOK_STORAGE_KEY) || []) as CashbookEntry[];
        const remoteIds = new Set(remoteEntries.map((entry) => entry.id));
        const localOnlyEntries = localEntries.filter((entry) => !remoteIds.has(entry.id));
        const mergedEntries = [...remoteEntries, ...localOnlyEntries];

        persist(mergedEntries);

        if (localOnlyEntries.length > 0) {
          await Promise.all(localOnlyEntries.map((entry) => saveCashbookEntry(entry)));
        }
      } else {
        setError(result.error || "Failed to load cashbook entries");
      }
    } finally {
      setLoading(false);
    }
  };

  const addEntry = async (entry: Parameters<typeof createCashbookEntry>[0]) => {
    const nextEntry = createCashbookEntry(entry);
    const previousEntries = entries;
    persist([nextEntry, ...entries]);
    setSyncing(true);
    setError(null);

    try {
      const result = await saveCashbookEntry(nextEntry);
      if (!result.success) {
        persist(previousEntries);
        setError(result.error || "Failed to save cashbook entry");
        return false;
      }
      return true;
    } finally {
      setSyncing(false);
    }
  };

  const removeEntry = async (entryId: string) => {
    const previousEntries = entries;
    persist(entries.filter((entry) => entry.id !== entryId));
    setSyncing(true);
    setError(null);

    try {
      const result = await deleteCashbookEntry(entryId);
      if (!result.success) {
        persist(previousEntries);
        setError(result.error || "Failed to delete cashbook entry");
        return false;
      }
      return true;
    } finally {
      setSyncing(false);
    }
  };

  const summary = useMemo(
    () => calculateCashbookSummary(entries, invoiceDateTotal, selectedDate),
    [entries, invoiceDateTotal, selectedDate]
  );

  useEffect(() => {
    loadEntries();
  }, []);

  return {
    entries,
    summary,
    loading,
    syncing,
    error,
    refresh: loadEntries,
    addEntry,
    removeEntry,
  };
};
