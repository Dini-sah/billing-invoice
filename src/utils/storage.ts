export const storage = {
  get: (key: string): any => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch {
      return null;
    }
  },
  
  set: (key: string, value: any): void => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // Silent fail
    }
  },
  
  remove: (key: string): void => {
    localStorage.removeItem(key);
  }
};

export const CACHE_KEYS = {
  RECENT_INVOICES: 'recent_invoices',
  LAST_FETCH: 'last_invoices_fetch'
};

export const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes