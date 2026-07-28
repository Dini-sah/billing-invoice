import { useEffect, useRef, useState } from "react";
import { CustomerRecord, DefaultItem, DiscountType, Invoice, InvoiceItem } from "../types/invoice";
import { generateInvoiceId, formatDate } from "../utils/invoiceGenerator";
import { saveInvoice, updateInvoice } from "../utils/googleSheets";
import { createBlankInvoiceItem, DEFAULT_DISCOUNT_TYPE, DEFAULT_DISCOUNT_VALUE, PRODUCT_TYPE_OPTIONS } from "../utils/invoiceConstants";
import {
  calculateInvoiceTotals,
  formatCurrency,
  getInvoiceType,
} from "../utils/invoiceMath";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { InvoiceItemRow } from "./InvoiceItemRow";
import { CustomerSearchSelect } from "./CustomerSearchSelect";
import {
  ArrowLeft,
  CalendarDays,
  FileText,
  IndianRupee,
  Plus,
  ReceiptText,
  Save,
  UserRound,
  Phone,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";

interface InvoiceFormProps {
  onSave: (invoice: Invoice) => void;
  showToast: (message: string, type: "success" | "error") => void;
  editingInvoice?: Invoice | null;
  onCancelEdit?: () => void;
  customers: CustomerRecord[];
  defaultItems: DefaultItem[];
}

export const InvoiceForm = ({
  onSave,
  showToast,
  editingInvoice,
  onCancelEdit,
  customers,
  defaultItems,
}: InvoiceFormProps) => {
  const [customerName, setCustomerName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [date, setDate] = useState(formatDate());
  const [items, setItems] = useState<InvoiceItem[]>([createBlankInvoiceItem("1")]);
  const [discountType, setDiscountType] = useState<DiscountType>(DEFAULT_DISCOUNT_TYPE);
  const [discountValue, setDiscountValue] = useState<number>(DEFAULT_DISCOUNT_VALUE);
  const [saving, setSaving] = useState(false);
  const [notes, setNotes] = useState("");
  const isEditing = Boolean(editingInvoice);
  const formRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!editingInvoice) {
      setCustomerName("");
      setPhoneNumber("");
      setDate(formatDate());
      setItems([createBlankInvoiceItem("1")]);
      setDiscountType(DEFAULT_DISCOUNT_TYPE);
      setDiscountValue(DEFAULT_DISCOUNT_VALUE);
      setNotes("");
      return;
    }

    setCustomerName(String(editingInvoice.customerName || ""));
    setPhoneNumber(String(editingInvoice.phoneNumber || ""));
    setDate(String(editingInvoice.date || formatDate()));
    setItems(
      editingInvoice.items.length > 0
        ? editingInvoice.items
        : [createBlankInvoiceItem("1")]
    );
    setDiscountType(editingInvoice.discountType || DEFAULT_DISCOUNT_TYPE);
    setDiscountValue(
      Number.isFinite(editingInvoice.discountValue)
        ? editingInvoice.discountValue
        : DEFAULT_DISCOUNT_VALUE
    );
    setNotes(String(editingInvoice.notes || ""));
  }, [editingInvoice]);

  useEffect(() => {
    if (isEditing && formRef.current) {
      formRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [isEditing]);

  const addItem = () => {
    setItems([...items, createBlankInvoiceItem()]);
  };

  const selectCustomer = (customerId: string) => {
    const customer = customers.find((entry) => entry.id === customerId);
    if (!customer) return;
    setCustomerName(customer.name);
    setPhoneNumber(customer.phoneNumber);
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
    const {
      subtotal,
      discountAmount,
      taxableBase,
      taxTotal,
      total,
    } = calculateInvoiceTotals(validItems, { discountType, discountValue });

    const invoice: Invoice = {
      id: editingInvoice?.id || generateInvoiceId(),
      customerName: customerName.trim(),
      phoneNumber: String(phoneNumber).trim(),
      date,
      createdAt:
        editingInvoice?.createdAt || new Date().toLocaleString("sv-SE").replace(" ", "T"),
      type: getInvoiceType(validItems),
      items: validItems,
      subtotal,
      discountType,
      discountValue,
      discountAmount,
      taxableBase,
      taxTotal,
      total,
      status: editingInvoice?.status || "pending",
      paymentMethod: editingInvoice?.paymentMethod,
      notes: notes.trim() || undefined,
    };

    try {
      const result = isEditing ? await updateInvoice(invoice) : await saveInvoice(invoice);
      if (result.success) {
        showToast(
          isEditing ? "Invoice updated successfully!" : "Invoice saved successfully!",
          "success"
        );
        onSave(invoice);
        setCustomerName("");
        setPhoneNumber("");
        setItems([createBlankInvoiceItem("1")]);
        setDiscountType(DEFAULT_DISCOUNT_TYPE);
        setDiscountValue(DEFAULT_DISCOUNT_VALUE);
        setNotes("");
      } else {
        showToast(
          result.error || (isEditing ? "Failed to update invoice" : "Failed to save invoice"),
          "error"
        );
      }
    } catch (error) {
      showToast("Network error. Please try again.", "error");
    } finally {
      setSaving(false);
    }
  };

  const {
    subtotal,
    discountAmount,
    taxableBase,
    taxTotal,
    total,
  } = calculateInvoiceTotals(items, { discountType, discountValue });
  const hasDiscount = discountAmount > 0;
  const dueDate = (() => {
    const invoiceDate = new Date(`${date}T00:00:00`);
    if (Number.isNaN(invoiceDate.getTime())) return "";
    invoiceDate.setMonth(invoiceDate.getMonth() + 1);
    return formatDate(invoiceDate);
  })();

  const resetForm = () => {
    if (isEditing) {
      onCancelEdit?.();
      return;
    }

    setCustomerName("");
    setPhoneNumber("");
    setDate(formatDate());
    setItems([createBlankInvoiceItem("1")]);
    setDiscountType(DEFAULT_DISCOUNT_TYPE);
    setDiscountValue(DEFAULT_DISCOUNT_VALUE);
    setNotes("");
  };

  return (
    <div ref={formRef} className="mx-auto w-full max-w-[1500px] px-3 py-4 sm:px-5 lg:px-8">
      <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={resetForm}
            aria-label={isEditing ? "Cancel editing invoice" : "Clear invoice form"}
            className="mt-1 h-10 w-10 rounded-xl p-0"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="mb-1 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.22em] text-[var(--theme-primary)]">
              <FileText className="h-3.5 w-3.5" />
              Sales invoice
            </div>
            <h2 className="text-2xl font-extrabold tracking-tight text-gray-950 sm:text-3xl">
              {isEditing ? "Edit invoice" : "Create new invoice"}
            </h2>
            <p className="text-sm text-slate-500">
              {isEditing
                ? `Correct customer details, services and totals for ${editingInvoice?.id}.`
                : "Add customer details, services and payment terms."}
            </p>
          </div>
        </div>

        <div className="flex gap-2 sm:justify-end">
          <Button type="button" variant="outline" onClick={resetForm}>
            {isEditing ? "Cancel" : "Clear"}
          </Button>
          <Button onClick={handleSave} disabled={saving} className="min-w-36">
            {saving ? (
              <span className="flex items-center gap-2">
                <div className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                Saving...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Save className="h-4 w-4" />
                {isEditing ? "Update" : "Save draft"}
              </span>
            )}
          </Button>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-6">
          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm shadow-slate-950/[0.04]">
            <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-5">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50 text-orange-600">
                <UserRound className="h-5 w-5" />
              </span>
              <div>
                <h3 className="font-bold text-gray-950">Bill to</h3>
                <p className="text-sm text-slate-500">
                  Choose an existing customer or enter a new one.
                </p>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-5 p-5 lg:grid-cols-2">
              <div>
                <Label>Existing customer</Label>
                <CustomerSearchSelect
                  customers={customers}
                  onSelect={selectCustomer}
                />
              </div>
              <div>
                <Label htmlFor="customerName">Customer name *</Label>
                <div className="relative mt-1">
                  <UserRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    id="customerName"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Full name or business"
                    className="rounded-xl pl-9"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="phoneNumber">Phone number *</Label>
                <div className="relative mt-1">
                  <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    id="phoneNumber"
                    type="tel"
                    value={phoneNumber}
                    placeholder="Customer phone"
                    maxLength={10}
                    className="rounded-xl pl-9"
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, "");
                      if (value.length <= 10) {
                        setPhoneNumber(value);
                      }
                    }}
                  />
                </div>
              </div>
            </div>
          </section>

          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm shadow-slate-950/[0.04]">
            <div className="flex flex-col gap-3 border-b border-slate-100 px-5 py-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50 text-orange-600">
                  <ReceiptText className="h-5 w-5" />
                </span>
                <div>
                  <h3 className="font-bold text-gray-950">Items & services</h3>
                  <p className="text-sm text-slate-500">
                    Add products, repair services or custom charges.
                  </p>
                </div>
              </div>
              <Button
                type="button"
                onClick={addItem}
                variant="outline"
                size="sm"
                className="rounded-xl border-orange-200 text-orange-600 hover:border-orange-300 hover:bg-orange-50"
              >
                <Plus className="mr-1 h-4 w-4" />
                Add line
              </Button>
            </div>

            <div className="space-y-4 p-5">
              {items.map((item, index) => (
                <InvoiceItemRow
                  key={item.id}
                  item={item}
                  index={index}
                  productTypeOptions={PRODUCT_TYPE_OPTIONS}
                  defaultItems={defaultItems}
                  onChange={(updatedItem) => updateItem(item.id, updatedItem)}
                  onRemove={() => removeItem(item.id)}
                  canRemove={items.length > 1}
                />
              ))}
            </div>
          </section>

          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm shadow-slate-950/[0.04]">
            <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-5">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50 text-orange-600">
                <FileText className="h-5 w-5" />
              </span>
              <div>
                <h3 className="font-bold text-gray-950">Notes & terms</h3>
                <p className="text-sm text-slate-500">
                  Payment due one calendar month after billing.
                </p>
              </div>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <Label htmlFor="notes">Invoice Notes</Label>
                <textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Enter custom notes or payment details for this invoice..."
                  className="mt-1 flex min-h-[100px] w-full rounded-xl border border-slate-200 bg-transparent px-3 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                />
              </div>
              <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500">
                Saved invoice data remains customer, date, items, tax and total.
              </div>
            </div>
          </section>
        </div>

        <aside className="space-y-5 xl:sticky xl:top-[7.5rem] xl:self-start">
          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm shadow-slate-950/[0.04]">
            <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-5">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50 text-orange-600">
                <CalendarDays className="h-5 w-5" />
              </span>
              <div>
                <h3 className="font-bold text-gray-950">Invoice details</h3>
                <p className="text-sm text-slate-500">Due date is fixed automatically.</p>
              </div>
            </div>
            <div className="space-y-4 p-5">
              <div>
                <Label htmlFor="date">Invoice date</Label>
                <Input
                  id="date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="mt-1 rounded-xl"
                />
              </div>
              <div>
                <Label htmlFor="dueDate">Due date</Label>
                <Input
                  id="dueDate"
                  type="date"
                  value={dueDate}
                  disabled
                  className="mt-1 rounded-xl bg-slate-50"
                />
                <p className="mt-2 text-xs text-slate-400">
                  One calendar month after billing.
                </p>
              </div>
            </div>
          </section>

          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm shadow-slate-950/[0.04]">
            <div className="bg-slate-950 px-5 py-6 text-white">
              <div className="mb-3 flex items-center gap-2 text-sm font-bold">
                <IndianRupee className="h-4 w-4 text-orange-500" />
                Invoice summary
              </div>
              <div className="text-4xl font-extrabold tracking-tight">
                {formatCurrency(total)}
              </div>
              <p className="mt-1 text-sm text-slate-400">Final amount due</p>
            </div>
            <div className="space-y-4 p-5">
              <div>
                <Label>Discount</Label>
                <div className="mt-1 flex gap-2">
                  <Select
                    value={discountType}
                    onValueChange={(value) => setDiscountType(value as DiscountType)}
                  >
                    <SelectTrigger className="h-11 w-28 rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="flat">₹ Amount</SelectItem>
                      <SelectItem value="percentage">% Percent</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input
                    type="number"
                    min={0}
                    step={discountType === "percentage" ? "0.5" : "0.01"}
                    value={discountValue === 0 ? "" : discountValue}
                    placeholder="0"
                    onChange={(e) => {
                      const value = e.target.value === "" ? 0 : Number(e.target.value);
                      if (Number.isFinite(value) && value >= 0) {
                        setDiscountValue(value);
                      }
                    }}
                    className="h-11 rounded-xl"
                  />
                </div>
                {discountType === "percentage" && discountValue > 100 && (
                  <p className="mt-1 text-xs text-red-500">Percent cannot exceed 100.</p>
                )}
              </div>
              <div className="flex justify-between text-sm text-slate-600">
                <span>Subtotal</span>
                <span className="font-bold text-slate-900">{formatCurrency(subtotal)}</span>
              </div>
              {hasDiscount && (
                <div className="flex justify-between text-sm text-emerald-600">
                  <span>
                    Discount
                    {discountType === "percentage" ? ` (${discountValue}%)` : ""}
                  </span>
                  <span className="font-bold">− {formatCurrency(discountAmount)}</span>
                </div>
              )}
              {hasDiscount && (
                <div className="flex justify-between text-xs text-slate-500">
                  <span>Taxable base</span>
                  <span className="font-semibold">{formatCurrency(taxableBase)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm text-slate-600">
                <span>Tax (3.5%)</span>
                <span className="font-bold text-slate-900">{formatCurrency(taxTotal)}</span>
              </div>
              <div className="flex justify-between border-t border-dashed border-slate-200 pt-4 text-base font-extrabold text-slate-950">
                <span>Total</span>
                <span>{formatCurrency(total)}</span>
              </div>
              <Button
                onClick={handleSave}
                disabled={saving}
                className="h-12 w-full rounded-xl"
              >
                {saving ? "Saving..." : (
                  <span className="flex items-center gap-2">
                    <Save className="h-4 w-4" />
                    {isEditing ? "Update invoice" : "Save invoice draft"}
                  </span>
                )}
              </Button>
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
};
