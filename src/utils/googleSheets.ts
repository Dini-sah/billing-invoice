// Google Sheets API integration using native fetch
// Replace YOUR_SCRIPT_ID_HERE with your actual Google Apps Script web app URL
import { InvoiceFilters, InvoiceSummary } from '../types/invoice';

const GOOGLE_SCRIPT_URL = 'https://invoice-proxy.harielectronics.workers.dev/';

const emptySummary: InvoiceSummary = {
  filteredCount: 0,
  filteredTotal: 0,
  todayCount: 0,
  todayTotal: 0,
  cashTotal: 0,
  gpayTotal: 0,
  cardTotal: 0,
  bankTransferTotal: 0,
  otherPaymentTotal: 0
};

const normalizeSummary = (summary: Partial<InvoiceSummary> | undefined, total = 0): InvoiceSummary => ({
  ...emptySummary,
  filteredCount: total,
  ...summary
});

export interface GoogleSheetsResponse {
  success: boolean;
  data?: any;
  summary?: InvoiceSummary;
  total?: number;
  page?: number;
  limit?: number;
  error?: string;
}

export const saveInvoiceToGoogleSheets = async (invoiceData: any): Promise<GoogleSheetsResponse> => {
  try {
    const response = await fetch(GOOGLE_SCRIPT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'save',
        data: invoiceData
      })
    });
    const data = await response.json().catch(() => null);
    if (!response.ok || !data?.success) {
      return { success: false, error: data?.error || 'Failed to save invoice' };
    }
    return { success: true, data };
  } catch (error) {
    console.error('Error saving invoice:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    };
  }
};

export const saveInvoice = saveInvoiceToGoogleSheets;

export const updateInvoiceStatus = async (
  invoiceId: string,
  status: 'pending' | 'paid',
  paymentMethod?: string
): Promise<GoogleSheetsResponse> => {
  try {
    const response = await fetch(GOOGLE_SCRIPT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'updateStatus',
        data: { invoiceId, status, paymentMethod }
      })
    });
    const data = await response.json().catch(() => null);
    if (!response.ok || !data?.success) {
      return { success: false, error: data?.error || 'Failed to update status' };
    }
    return { success: true, data };
  } catch (error) {
    console.error('Error updating status:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
};

export const fetchRecentInvoices = async (
  page = 1,
  limit = 10,
  search = '',
  filters?: InvoiceFilters
): Promise<GoogleSheetsResponse> => {
  try {
    const params = new URLSearchParams({
      action: 'getRecent',
      page: String(page),
      limit: String(limit),
      search
    });

    if (filters) {
      params.set('dateRange', filters.dateRange);
      params.set('startDate', filters.startDate);
      params.set('endDate', filters.endDate);
      params.set('type', filters.type);
      params.set('status', filters.status);
      params.set('paymentMethod', filters.paymentMethod);
    }

    const response = await fetch(`${GOOGLE_SCRIPT_URL}?${params.toString()}`, {
      method: 'GET',
      cache: 'no-store',
      headers: {
        'Content-Type': 'application/json',
      }
    });
    const data = await response.json().catch(() => null);
    
    if (!response.ok || !data?.success) {
      return { success: false, error: data?.error || 'Failed to fetch invoices' };
    }
    return {
      success: true,
      data: data.data || [],
      total: Number(data.total || 0),
      summary: normalizeSummary(data.summary, Number(data.total || 0)),
      page: Number(data.page || page),
      limit: Number(data.limit || limit)
    };
  } catch (error) {
    console.error('Error fetching invoices:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    };
  }
};
