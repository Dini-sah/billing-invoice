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
}
