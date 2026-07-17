export interface InvoiceItem {
  id: string;
  category: 'sale' | 'service';
  description: string;
  productType: string;
  quantity: number;
  price: number;
  taxable: boolean;
}

export interface Invoice {
  id: string;
  customerName: string;
  phoneNumber: string;
  date: string;
  createdAt?: string;
  type: 'sale' | 'service' | 'sale & service';
  paymentMethod?: 'cash' | 'gpay' | 'card' | 'bank transfer' | 'other';
  items: InvoiceItem[];
  subtotal: number;
  taxTotal: number;
  total: number;
  status: 'pending' | 'paid';
}

export interface InvoiceFilters {
  dateRange: 'all' | 'today' | 'yesterday' | 'last7' | 'custom';
  startDate: string;
  endDate: string;
  type: 'all' | Invoice['type'];
  status: 'all' | Invoice['status'];
  paymentMethod: 'all' | NonNullable<Invoice['paymentMethod']>;
}

export interface InvoiceSummary {
  filteredCount: number;
  filteredTotal: number;
  todayCount: number;
  todayTotal: number;
  cashTotal: number;
  gpayTotal: number;
  cardTotal: number;
  bankTransferTotal: number;
  otherPaymentTotal: number;
}

export interface GoogleSheetsResponse {
  success: boolean;
  data?: any;
  error?: string;
}

export interface CustomerRecord {
  id: string;
  name: string;
  phoneNumber: string;
  lastInvoiceDate?: string;
  invoiceCount: number;
  totalSpend: number;
}

export interface DefaultItem {
  id: string;
  category: InvoiceItem['category'];
  productType: string;
  description: string;
  price: number;
  taxable: boolean;
}

export interface AppSettings {
  businessName: string;
  businessSubtitle: string;
  ownerName: string;
  defaultTaxable: boolean;
}
