import { DiscountType, InvoiceItem } from "../types/invoice";

export const TAX_RATE = 0.035;

export const DEFAULT_DISCOUNT_TYPE: DiscountType = "flat";
export const DEFAULT_DISCOUNT_VALUE = 0;

export const PRODUCT_TYPE_OPTIONS: Record<InvoiceItem["category"], string[]> = {
  sale: ["Phone cases", "Tempered glass", "Mobile phones", "Accessories", "Other"],
  service: [
    "Combo replacement",
    "OCA",
    "Battery replacement",
    "Software service",
    "Water damage",
    "CC (Charging connector)",
    "Other",
  ],
};

const createClientId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : Date.now().toString();

export const createBlankInvoiceItem = (id = createClientId()): InvoiceItem => ({
  id,
  category: "sale",
  description: "",
  productType: "",
  quantity: 1,
  price: 0,
  taxable: false,
});
