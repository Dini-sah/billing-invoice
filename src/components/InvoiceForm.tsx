import { useState } from "react";
import { Invoice, InvoiceItem } from "../types/invoice";
import { generateInvoiceId, formatDate } from "../utils/invoiceGenerator";
import { saveInvoice } from "../utils/googleSheets";
import { createBlankInvoiceItem, PRODUCT_TYPE_OPTIONS } from "../utils/invoiceConstants";
import {
  calculateInvoiceTotals,
  formatCurrency,
  getInvoiceType,
} from "../utils/invoiceMath";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { InvoiceItemRow } from "./InvoiceItemRow";
import {
  CalendarDays,
  FileText,
  Plus,
  ReceiptText,
  Save,
  UserRound,
} from "lucide-react";

interface InvoiceFormProps {
  onSave: (invoice: Invoice) => void;
  showToast: (message: string, type: "success" | "error") => void;
}

export const InvoiceForm = ({ onSave, showToast }: InvoiceFormProps) => {
  const [customerName, setCustomerName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [date, setDate] = useState(formatDate());
  const [items, setItems] = useState<InvoiceItem[]>([createBlankInvoiceItem("1")]);
  const [saving, setSaving] = useState(false);

  const addItem = () => {
    setItems([...items, createBlankInvoiceItem()]);
  };

  const removeItem = (id: string) => {
    if (items.length > 1) {
      setItems(items.filter((item) => item.id !== id));
    }
  };

  const updateItem = (id: string, updatedItem: InvoiceItem) => {
    setItems(items.map((item) => (item.id === id ? updatedItem : item)));
  };

  const handleSave = async () => {
    if (!customerName.trim() || !phoneNumber.trim()) {
      showToast("Please fill in customer details", "error");
      return;
    }

    const hasValidItems = items.some(
      (item) => item.description.trim() && item.price > 0
    );
    if (!hasValidItems) {
      showToast("Please add at least one valid item", "error");
      return;
    }

    setSaving(true);
    const validItems = items.filter((item) => item.description.trim());
    const { subtotal, taxTotal, total } = calculateInvoiceTotals(validItems);

    const invoice: Invoice = {
      id: generateInvoiceId(),
      customerName: customerName.trim(),
      phoneNumber: phoneNumber.trim(),
      date,
      createdAt: new Date().toLocaleString("sv-SE").replace(" ", "T"),
      type: getInvoiceType(validItems),
      items: validItems,
      subtotal,
      taxTotal,
      total,
      status: "pending",
    };

    try {
      const result = await saveInvoice(invoice);
      if (result.success) {
        showToast("Invoice saved successfully!", "success");
        onSave(invoice);
        setCustomerName("");
        setPhoneNumber("");
        setItems([createBlankInvoiceItem("1")]);
      } else {
        showToast(result.error || "Failed to save invoice", "error");
      }
    } catch (error) {
      showToast("Network error. Please try again.", "error");
    } finally {
      setSaving(false);
    }
  };

  const { subtotal, taxTotal, total } = calculateInvoiceTotals(items);

  return (
    <div className="mx-auto max-w-5xl overflow-hidden rounded-lg border border-gray-200/80 bg-white shadow-sm shadow-gray-950/[0.03]">
      <div className="border-b border-gray-200 bg-[var(--theme-header)] px-4 py-5 text-white sm:px-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-white/10 text-white ring-1 ring-white/15">
            <FileText className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Create Invoice</h2>
              <p className="text-sm text-gray-300">
                Add customer details and billable items.
              </p>
            </div>
          </div>
          <div className="rounded-lg border border-white/10 bg-white/10 px-4 py-2">
            <p className="text-xs font-semibold uppercase text-gray-300">Current total</p>
            <p className="text-lg font-bold">{formatCurrency(total)}</p>
          </div>
        </div>
      </div>

      <div className="p-4 sm:p-6">
        <section className="mb-6 rounded-lg border border-gray-200 bg-gray-50/70 p-4">
          <div className="mb-4 flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--theme-soft)] text-[var(--theme-primary)] shadow-sm">
              <UserRound className="h-4 w-4" />
            </span>
            <h3 className="font-semibold text-gray-950">Customer Details</h3>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <Label htmlFor="customerName">Customer Name</Label>
              <Input
                id="customerName"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="John Doe"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="phoneNumber">Phone Number</Label>
              <Input
                id="phoneNumber"
                type="tel"
                value={phoneNumber}
                placeholder="9876543210"
                maxLength={10}
                className="mt-1"
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, "");
                  if (value.length <= 10) {
                    setPhoneNumber(value);
                  }
                }}
              />
            </div>
          </div>
        </section>

        <section className="mb-6 rounded-lg border border-gray-200 bg-gray-50/70 p-4">
          <div className="mb-4 flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--theme-soft)] text-[var(--theme-primary)] shadow-sm">
              <CalendarDays className="h-4 w-4" />
            </span>
            <h3 className="font-semibold text-gray-950">Invoice Date</h3>
          </div>
          <div className="max-w-sm">
            <Label htmlFor="date">Date</Label>
            <Input
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="mt-1"
            />
          </div>
        </section>

        <section className="mb-6 rounded-lg border border-gray-200 bg-gray-50/70 p-4">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--theme-soft)] text-[var(--theme-primary)] shadow-sm">
                <ReceiptText className="h-4 w-4" />
              </span>
              <h3 className="font-semibold text-gray-950">Items & Services</h3>
            </div>
            <Button
              type="button"
              onClick={addItem}
              variant="outline"
              size="sm"
              className="w-full sm:w-auto"
            >
              <Plus className="w-4 h-4 mr-1" />
              Add Item
            </Button>
          </div>

          <div className="space-y-3">
            {items.map((item) => (
              <InvoiceItemRow
                key={item.id}
                item={item}
                productTypeOptions={PRODUCT_TYPE_OPTIONS}
                onChange={(updatedItem) => updateItem(item.id, updatedItem)}
                onRemove={() => removeItem(item.id)}
                canRemove={items.length > 1}
              />
            ))}
          </div>
        </section>

        <div className="ml-auto max-w-md rounded-lg border border-gray-200 bg-white p-4 shadow-sm shadow-gray-950/[0.03]">
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-gray-600">
              <span>Subtotal</span>
              <span className="font-medium text-gray-900">{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm text-gray-600">
              <span>Tax (3.5%)</span>
              <span className="font-medium text-gray-900">{formatCurrency(taxTotal)}</span>
            </div>
            <div className="flex justify-between border-t border-gray-200 pt-3 text-lg font-bold text-gray-950">
              <span>Total</span>
              <span className="text-[var(--theme-primary)]">{formatCurrency(total)}</span>
            </div>
          </div>
        </div>

        <div className="mt-6 flex flex-col-reverse gap-3 border-t border-gray-200 pt-5 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setCustomerName("");
              setPhoneNumber("");
              setItems([createBlankInvoiceItem("1")]);
            }}
            className="sm:w-32"
          >
            Clear
          </Button>
          <Button onClick={handleSave} disabled={saving} className="sm:w-48">
            {saving ? (
              <span className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Saving...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Save className="w-4 h-4" />
                Save Invoice
              </span>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};
