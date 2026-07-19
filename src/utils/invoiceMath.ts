import { DiscountType, Invoice, InvoiceItem } from "../types/invoice";
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

export interface DiscountInput {
  discountType: DiscountType;
  discountValue: number;
}

export const round2 = (value: number) => Math.round((value + Number.EPSILON) * 100) / 100;

/**
 * Compute the discount amount for a given subtotal.
 * - percentage: discountValue is a percent (e.g. 10 = 10%)
 * - flat: discountValue is a fixed currency amount
 * The discount is capped so it never exceeds the subtotal.
 */
export const calculateDiscountAmount = (
  subtotal: number,
  { discountType, discountValue }: DiscountInput
): number => {
  const value = Number.isFinite(discountValue) ? discountValue : 0;
  if (value <= 0) return 0;

  let amount = 0;
  if (discountType === "percentage") {
    amount = (subtotal * value) / 100;
  } else {
    amount = value;
  }

  // Never allow a discount larger than the subtotal.
  return round2(Math.min(amount, subtotal));
};

export const calculateInvoiceTotals = (
  items: InvoiceItem[],
  discount: DiscountInput = { discountType: "flat", discountValue: 0 }
) => {
  const subtotal = items.reduce((sum, item) => sum + getLineSubtotal(item), 0);
  const discountAmount = calculateDiscountAmount(subtotal, discount);
  const taxableBase = round2(subtotal - discountAmount);

  // Tax is applied proportionally on the discounted base so that the
  // effective tax rate stays consistent regardless of the discount.
  const fullTaxableSubtotal = items
    .filter((item) => item.taxable)
    .reduce((sum, item) => sum + getLineSubtotal(item), 0);
  const taxRate = subtotal > 0 ? fullTaxableSubtotal / subtotal : 0;
  const taxTotal = round2(taxableBase * taxRate * TAX_RATE);

  const total = round2(taxableBase + taxTotal);

  return {
    subtotal: round2(subtotal),
    discountAmount,
    taxableBase,
    taxTotal,
    total,
  };
};

export const getInvoiceType = (items: InvoiceItem[]): Invoice["type"] => {
  const validItems = items.filter((item) => item.description.trim());
  const categories = new Set(validItems.map((item) => item.category));

  if (categories.size > 1) return "sale & service";
  return validItems[0]?.category || "sale";
};
