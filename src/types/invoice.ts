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
  items: InvoiceItem[];
  subtotal: number;
  taxTotal: number;
  total: number;
  status: 'pending' | 'paid';
}

export interface GoogleSheetsResponse {
  success: boolean;
  data?: any;
  error?: string;
}
