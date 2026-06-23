import { Invoice, InvoiceItem } from "../types/invoice";
import { TAX_RATE } from "./invoiceConstants";

export const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number.isFinite(value) ? value : 0);

export const getLineSubtotal = (item: InvoiceItem) => item.quantity * item.price;

export const getLineTax = (item: InvoiceItem) =>
  item.taxable ? getLineSubtotal(item) * TAX_RATE : 0;

export const calculateInvoiceTotals = (items: InvoiceItem[]) => {
  const subtotal = items.reduce((sum, item) => sum + getLineSubtotal(item), 0);
  const taxTotal = items.reduce((sum, item) => sum + getLineTax(item), 0);
  return {
    subtotal,
    taxTotal,
    total: subtotal + taxTotal,
  };
};

export const getInvoiceType = (items: InvoiceItem[]): Invoice["type"] => {
  const validItems = items.filter((item) => item.description.trim());
  const categories = new Set(validItems.map((item) => item.category));

  if (categories.size > 1) return "sale & service";
  return validItems[0]?.category || "sale";
};
