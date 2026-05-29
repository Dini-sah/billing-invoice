// Google Sheets API integration using native fetch
// Replace YOUR_SCRIPT_ID_HERE with your actual Google Apps Script web app URL

const GOOGLE_SCRIPT_URL = 'https://invoice-proxy.harielectronics.workers.dev/';

export interface GoogleSheetsResponse {
  success: boolean;
  data?: any;
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
  status: 'pending' | 'paid'
): Promise<GoogleSheetsResponse> => {
  try {
    const response = await fetch(GOOGLE_SCRIPT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'updateStatus',
        data: { invoiceId, status }
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
  search = ''
): Promise<GoogleSheetsResponse> => {
  try {
    const params = new URLSearchParams({
      action: 'getRecent',
      page: String(page),
      limit: String(limit),
      search
    });
    const response = await fetch(`${GOOGLE_SCRIPT_URL}?${params.toString()}`, {
      method: 'GET',
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
