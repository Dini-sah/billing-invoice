import { CashbookEntry, CashbookSummary } from "../types/cashbook";
import { Invoice } from "../types/invoice";
import { getTodayDateInputValue } from "./date";

export const CASHBOOK_STORAGE_KEY = "hari_cashbook_entries_v1";

export const creditCategories = [
  "Advance payment",
  "Old balance received",
  "Accessory sale",
  "Service income",
  "Other income",
];

export const debitCategories = [
  "Parts purchase",
  "Shop expense",
  "Rent",
  "Salary",
  "Courier",
  "Travel",
  "Other expense",
];

export const paymentMethodOptions: NonNullable<Invoice["paymentMethod"]>[] = [
  "cash",
  "gpay",
  "card",
  "bank transfer",
  "other",
];

const createClientId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : Date.now().toString();

export const createCashbookEntry = (
  entry: Omit<CashbookEntry, "id" | "createdAt">
): CashbookEntry => ({
  ...entry,
  id: createClientId(),
  createdAt: new Date().toLocaleString("sv-SE").replace(" ", "T"),
});

export const calculateCashbookSummary = (
  entries: CashbookEntry[],
  invoiceTodayTotal: number,
  today = getTodayDateInputValue()
): CashbookSummary => {
  const todayEntries = entries.filter((entry) => entry.date === today);
  const todayManualIn = todayEntries
    .filter((entry) => entry.type === "credit")
    .reduce((sum, entry) => sum + entry.amount, 0);
  const todayOut = todayEntries
    .filter((entry) => entry.type === "debit")
    .reduce((sum, entry) => sum + entry.amount, 0);
  const allTimeManualIn = entries
    .filter((entry) => entry.type === "credit")
    .reduce((sum, entry) => sum + entry.amount, 0);
  const allTimeOut = entries
    .filter((entry) => entry.type === "debit")
    .reduce((sum, entry) => sum + entry.amount, 0);
  const todayIn = invoiceTodayTotal + todayManualIn;

  return {
    manualIn: todayManualIn,
    invoiceIn: invoiceTodayTotal,
    todayIn,
    todayOut,
    todayNet: todayIn - todayOut,
    allTimeIn: allTimeManualIn,
    allTimeOut,
    allTimeNet: allTimeManualIn - allTimeOut,
  };
};
