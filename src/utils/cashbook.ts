import { CashbookEntry, CashbookSummary } from "../types/cashbook";
import { Invoice } from "../types/invoice";
import { getTodayDateInputValue } from "./date";

export const CASHBOOK_STORAGE_KEY = "hari_cashbook_entries_v1";

export const creditCategories = [
  "Invoice payment",
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
  today = getTodayDateInputValue()
): CashbookSummary => {
  const todayEntries = entries.filter((entry) => entry.date === today);

  // Separate invoice payments from manual entries
  const todayInvoiceEntries = todayEntries.filter(
    (entry) => entry.type === "credit" && entry.category === "Invoice payment"
  );
  const todayManualCreditEntries = todayEntries.filter(
    (entry) => entry.type === "credit" && entry.category !== "Invoice payment"
  );

  const todayInvoiceIn = todayInvoiceEntries.reduce((sum, entry) => sum + entry.amount, 0);
  const todayManualIn = todayManualCreditEntries.reduce((sum, entry) => sum + entry.amount, 0);
  const todayOut = todayEntries
    .filter((entry) => entry.type === "debit")
    .reduce((sum, entry) => sum + entry.amount, 0);

  // All-time calculations
  const allTimeInvoiceEntries = entries.filter(
    (entry) => entry.type === "credit" && entry.category === "Invoice payment"
  );
  const allTimeManualCreditEntries = entries.filter(
    (entry) => entry.type === "credit" && entry.category !== "Invoice payment"
  );
  const allTimeInvoiceIn = allTimeInvoiceEntries.reduce((sum, entry) => sum + entry.amount, 0);
  const allTimeManualIn = allTimeManualCreditEntries.reduce((sum, entry) => sum + entry.amount, 0);
  const allTimeOut = entries
    .filter((entry) => entry.type === "debit")
    .reduce((sum, entry) => sum + entry.amount, 0);

  const todayIn = todayInvoiceIn + todayManualIn;
  const allTimeIn = allTimeInvoiceIn + allTimeManualIn;

  return {
    manualIn: todayManualIn,
    invoiceIn: todayInvoiceIn,
    todayIn,
    todayOut,
    todayNet: todayIn - todayOut,
    allTimeIn,
    allTimeOut,
    allTimeNet: allTimeIn - allTimeOut,
  };
};
