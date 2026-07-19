import { Invoice } from "./invoice";

export type CashbookEntryType = "credit" | "debit";

export interface CashbookEntry {
  id: string;
  type: CashbookEntryType;
  date: string;
  title: string;
  category: string;
  amount: number;
  paymentMethod: NonNullable<Invoice["paymentMethod"]>;
  note?: string;
  createdAt: string;
  // Optional invoice breakdown (populated when entry is from a paid invoice)
  invoiceId?: string;
  subtotal?: number;
  discountType?: Invoice["discountType"];
  discountValue?: number;
  discountAmount?: number;
  taxableBase?: number;
  taxTotal?: number;
}

export interface CashbookSummary {
  manualIn: number;
  invoiceIn: number;
  todayIn: number;
  todayOut: number;
  todayNet: number;
  allTimeIn: number;
  allTimeOut: number;
  allTimeNet: number;
  // Aggregated discount info from paid-invoice credit entries
  invoiceDiscountTotal: number;
  invoiceSubtotalTotal: number;
}
