import { useState } from "react";
import { Invoice, InvoiceItem } from "../types/invoice";
import { generateInvoiceId, formatDate } from "../utils/invoiceGenerator";
import { saveInvoice } from "../utils/googleSheets";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { InvoiceItemRow } from "./InvoiceItemRow";
import { Plus, Save, FileText } from "lucide-react";

interface InvoiceFormProps {
  onSave: (invoice: Invoice) => void;
  showToast: (message: string, type: "success" | "error") => void;
}

export const InvoiceForm = ({ onSave, showToast }: InvoiceFormProps) => {
  const [customerName, setCustomerName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [date, setDate] = useState(formatDate());
  const [items, setItems] = useState<InvoiceItem[]>([
    {
      id: "1",
      category: "sale",
      description: "",
      productType: "",
      quantity: 1,
      price: 0,
      taxable: false,
    },
  ]);
  const [saving, setSaving] = useState(false);

  const productTypeOptions: Record<"sale" | "service", string[]> = {
    sale: ["Phone cases", "Tempered glass", "Mobile phones", "Accessories", "Other"],
    service: ["Combo replacement","OCA", "Battery replacement", "Software service", "Water damage", "CC (Charging connector)", "Other"]
  };

  const addItem = () => {
    const newItem: InvoiceItem = {
      id: Date.now().toString(),
      category: "sale",
      description: "",
      productType: "",
      quantity: 1,
      price: 0,
      taxable: false,
    };
    setItems([...items, newItem]);
  };

  const removeItem = (id: string) => {
    if (items.length > 1) {
      setItems(items.filter((item) => item.id !== id));
    }
  };

  const updateItem = (id: string, updatedItem: InvoiceItem) => {
    setItems(items.map((item) => (item.id === id ? updatedItem : item)));
  };

  const calculateTotals = () => {
    const subtotal = items.reduce(
      (sum, item) => sum + item.quantity * item.price,
      0
    );
    const taxTotal = items.reduce((sum, item) => {
      const itemTotal = item.quantity * item.price;
      return sum + (item.taxable ? itemTotal * 0.035 : 0);
    }, 0);
    const total = subtotal + taxTotal;
    return { subtotal, taxTotal, total };
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
    const { subtotal, taxTotal, total } = calculateTotals();

    const categories = new Set(items.map((item) => item.category));
    const invoiceType: Invoice["type"] =
      categories.size > 1 ? "sale & service" : (items[0]?.category || "sale");

    const invoice: Invoice = {
      id: generateInvoiceId(),
      customerName: customerName.trim(),
      phoneNumber: phoneNumber.trim(),
      date,
      createdAt: new Date().toLocaleString("sv-SE").replace(" ", "T"),
      type: invoiceType,
      items: items.filter((item) => item.description.trim()),
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
        // Reset form
        setCustomerName("");
        setPhoneNumber("");
        setItems([
          {
            id: "1",
            category: "sale",
            description: "",
            productType: "",
            quantity: 1,
            price: 0,
            taxable: false,
          },
        ]);
      } else {
        showToast(result.error || "Failed to save invoice", "error");
      }
    } catch (error) {
      showToast("Network error. Please try again.", "error");
    } finally {
      setSaving(false);
    }
  };

  const { subtotal, taxTotal, total } = calculateTotals();

  return (
    <div className="max-w-2xl mx-auto p-4 sm:p-6 bg-white rounded-xl shadow-sm border">
      <div className="flex items-center gap-2 mb-6">
        <FileText className="w-6 h-6 text-green-600" />
        <h2 className="text-2xl font-bold text-gray-900">Create Invoice</h2>
      </div>

      {/* Customer Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
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

      <div className="mb-6">
        <Label htmlFor="date">Date</Label>
        <Input
          id="date"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="mt-1"
        />
      </div>

      {/* Items */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <Label className="text-lg font-semibold">Items</Label>
          <Button
            type="button"
            onClick={addItem}
            variant="outline"
            size="sm"
            className="text-green-600 border-green-600 hover:bg-green-50"
          >
            <Plus className="w-4 h-4 mr-1" />
            Add Item
          </Button>
        </div>

        <div className="space-y-3">
          {items.map((item, index) => (
            <InvoiceItemRow
              key={item.id}
              item={item}
              productTypeOptions={productTypeOptions}
              onChange={(updatedItem) => updateItem(item.id, updatedItem)}
              onRemove={() => removeItem(item.id)}
              canRemove={items.length > 1}
            />
          ))}
        </div>
      </div>

      {/* Totals */}
      <div className="border-t pt-4 space-y-2">
        <div className="flex justify-between text-gray-600">
          <span>Subtotal:</span>
          <span className="font-medium">₹{subtotal.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-gray-600">
          <span>Tax (3.5%):</span>
          <span className="font-medium">₹{taxTotal.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-lg font-bold text-gray-900 pt-2 border-t">
          <span>Total:</span>
          <span className="text-green-600">₹{total.toFixed(2)}</span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-3 mt-6 sm:flex-row">
        <Button
          onClick={handleSave}
          disabled={saving}
          className="flex-1 bg-green-600 hover:bg-green-700"
        >
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
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            setCustomerName("");
            setPhoneNumber("");
            setItems([
              {
                id: "1",
                category: "sale",
                description: "",
                productType: "",
                quantity: 1,
                price: 0,
                taxable: false,
              },
            ]);
          }}
        >
          Clear
        </Button>
      </div>
    </div>
  );
};
