import { useState } from "react";
import {
  BarChart3,
  Banknote,
  CreditCard,
  Download,
  Landmark,
  Package,
  Plus,
  Save,
  Smartphone,
  Trash2,
  Users,
  WalletCards,
  X,
} from "lucide-react";
import {
  AppSettings,
  CustomerRecord,
  DefaultItem,
  Invoice,
  InvoiceSummary,
} from "../types/invoice";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { formatCurrency } from "../utils/invoiceMath";
import { createCustomer, createDefaultItem } from "../utils/masterData";
import { PRODUCT_TYPE_OPTIONS } from "../utils/invoiceConstants";

export const CustomersView = ({
  customers,
  onCustomersChange,
}: {
  customers: CustomerRecord[];
  onCustomersChange: (customers: CustomerRecord[]) => void;
}) => {
  const [name, setName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");

  const addCustomer = () => {
    if (!name.trim() || !phoneNumber.trim()) return;
    onCustomersChange([createCustomer(name, phoneNumber), ...customers]);
    setName("");
    setPhoneNumber("");
  };

  return (
    <SectionShell icon={Users} title="Customers" subtitle="Create and reuse customer details in invoices.">
      <div className="mb-5 grid gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4 md:grid-cols-[1fr_220px_auto] md:items-end">
        <Field label="Customer name">
          <Input value={name} onChange={(event) => setName(event.target.value)} placeholder="Customer name" />
        </Field>
        <Field label="Phone number">
          <Input
            value={phoneNumber}
            maxLength={10}
            onChange={(event) => setPhoneNumber(event.target.value.replace(/\D/g, ""))}
            placeholder="9876543210"
          />
        </Field>
        <Button onClick={addCustomer} className="gap-2">
          <Plus className="h-4 w-4" />
          Add
        </Button>
      </div>

      <DataTable
        headers={["Name", "Phone", "Invoices", "Total spend", "Last invoice", ""]}
        emptyText="No customers saved yet."
      >
        {customers.map((customer) => (
          <tr key={customer.id} className="border-t border-slate-100">
            <Cell strong>{customer.name}</Cell>
            <Cell>{customer.phoneNumber}</Cell>
            <Cell>{customer.invoiceCount}</Cell>
            <Cell>{formatCurrency(customer.totalSpend)}</Cell>
            <Cell>{customer.lastInvoiceDate || "-"}</Cell>
            <Cell align="right">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onCustomersChange(customers.filter((entry) => entry.id !== customer.id))}
                aria-label="Delete customer"
              >
                <Trash2 className="h-4 w-4 text-rose-600" />
              </Button>
            </Cell>
          </tr>
        ))}
      </DataTable>
    </SectionShell>
  );
};

export const ItemsView = ({
  items,
  onItemsChange,
}: {
  items: DefaultItem[];
  onItemsChange: (items: DefaultItem[]) => void;
}) => {
  const [category, setCategory] = useState<DefaultItem["category"]>("sale");
  const [productType, setProductType] = useState(PRODUCT_TYPE_OPTIONS.sale[0]);
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [taxable, setTaxable] = useState(false);

  const addItem = () => {
    if (!description.trim()) return;
    onItemsChange([
      createDefaultItem({
        category,
        productType,
        description,
        price: Number(price || 0),
        taxable,
      }),
      ...items,
    ]);
    setDescription("");
    setPrice("");
  };

  return (
    <SectionShell icon={Package} title="Items & Services" subtitle="Maintain default item prices for invoice dropdowns.">
      <div className="mb-5 grid gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4 lg:grid-cols-[150px_220px_1fr_150px_120px_auto] lg:items-end">
        <Field label="Type">
          <Select
            value={category}
            onValueChange={(value: DefaultItem["category"]) => {
              setCategory(value);
              setProductType(PRODUCT_TYPE_OPTIONS[value][0]);
            }}
          >
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="sale">Sale</SelectItem>
              <SelectItem value="service">Service</SelectItem>
            </SelectContent>
          </Select>
        </Field>
        <Field label="Product type">
          <Select value={productType} onValueChange={setProductType}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {PRODUCT_TYPE_OPTIONS[category].map((option) => (
                <SelectItem key={option} value={option}>{option}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field label="Description">
          <Input value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Item or service" />
        </Field>
        <Field label="Price">
          <Input type="number" min="0" value={price} onChange={(event) => setPrice(event.target.value)} placeholder="0.00" />
        </Field>
        <label className="flex h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700">
          <input type="checkbox" checked={taxable} onChange={(event) => setTaxable(event.target.checked)} />
          Tax
        </label>
        <Button onClick={addItem} className="gap-2">
          <Plus className="h-4 w-4" />
          Add
        </Button>
      </div>

      <DataTable headers={["Description", "Type", "Product type", "Price", "Tax", ""]} emptyText="No default items saved.">
        {items.map((item) => (
          <tr key={item.id} className="border-t border-slate-100">
            <Cell strong>{item.description}</Cell>
            <Cell>{item.category}</Cell>
            <Cell>{item.productType}</Cell>
            <Cell>{formatCurrency(item.price)}</Cell>
            <Cell>{item.taxable ? "Yes" : "No"}</Cell>
            <Cell align="right">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onItemsChange(items.filter((entry) => entry.id !== item.id))}
                aria-label="Delete item"
              >
                <Trash2 className="h-4 w-4 text-rose-600" />
              </Button>
            </Cell>
          </tr>
        ))}
      </DataTable>
    </SectionShell>
  );
};

export const PaymentsView = ({
  invoices,
  summary,
  selectedDate,
}: {
  invoices: Invoice[];
  summary: InvoiceSummary;
  selectedDate: string;
}) => {
  const dateInvoices = filterInvoicesByDate(invoices, selectedDate);
  const rows = buildPaymentRows(dateInvoices, summary);
  const paidTotal = rows.reduce((sum, row) => sum + row.total, 0);
  return (
    <SectionShell icon={WalletCards} title="Payments" subtitle={`Track paid and pending invoice amounts for ${selectedDate}.`}>
      <div className="mb-5 grid gap-4 md:grid-cols-3">
        <Metric label="Paid" value={formatCurrency(paidTotal)} />
        <Metric label="Pending" value={formatCurrency(Math.max(0, summary.filteredTotal - paidTotal))} />
        <Metric label="Invoices in view" value={String(summary.filteredCount)} />
      </div>
      <DataTable headers={["Method", "Invoices", "Amount"]} emptyText="No payments found.">
        {rows.map((row) => (
          <tr key={row.label} className="border-t border-slate-100">
            <Cell strong>
              <span className="inline-flex items-center gap-2">
                <row.icon className="h-4 w-4 text-orange-600" />
                {row.label}
              </span>
            </Cell>
            <Cell>{row.count}</Cell>
            <Cell>{formatCurrency(row.total)}</Cell>
          </tr>
        ))}
      </DataTable>
    </SectionShell>
  );
};

export const ReportsView = ({
  invoices,
  summary,
  selectedDate,
}: {
  invoices: Invoice[];
  summary: InvoiceSummary;
  selectedDate: string;
}) => {
  const dateInvoices = filterInvoicesByDate(invoices, selectedDate);
  const revenue = summary.filteredTotal;
  const paid =
    summary.cashTotal +
    summary.gpayTotal +
    summary.cardTotal +
    summary.bankTransferTotal +
    summary.otherPaymentTotal;
  const pending = revenue - paid;
  const topItems = Object.entries(
    dateInvoices.flatMap((invoice) => invoice.items).reduce<Record<string, number>>((map, item) => {
      map[item.description] = (map[item.description] || 0) + item.quantity;
      return map;
    }, {})
  ).sort((a, b) => b[1] - a[1]).slice(0, 8);

  const [showExportModal, setShowExportModal] = useState(false);

  return (
    <SectionShell icon={BarChart3} title="Reports" subtitle={`Business summary for ${selectedDate}.`}>
      <div className="mb-5 flex items-center justify-between">
        <div className="grid gap-4 md:grid-cols-4">
          <Metric label="Revenue" value={formatCurrency(revenue)} />
          <Metric label="Paid" value={formatCurrency(paid)} />
          <Metric label="Pending" value={formatCurrency(pending)} />
          <Metric label="Average bill" value={formatCurrency(summary.filteredCount ? revenue / summary.filteredCount : 0)} />
        </div>
        <Button onClick={() => setShowExportModal(true)} className="gap-2 ml-4">
          <Download className="h-4 w-4" />
          Export
        </Button>
      </div>
      <DataTable headers={["Top item/service", "Quantity"]} emptyText="No item data available.">
        {topItems.map(([description, quantity]) => (
          <tr key={description} className="border-t border-slate-100">
            <Cell strong>{description}</Cell>
            <Cell>{quantity}</Cell>
          </tr>
        ))}
      </DataTable>

      {showExportModal && (
        <ExportModal
          invoices={invoices}
          summary={summary}
          onClose={() => setShowExportModal(false)}
        />
      )}
    </SectionShell>
  );
};

// Export Modal Component
interface ExportModalProps {
  invoices: Invoice[];
  summary: InvoiceSummary;
  onClose: () => void;
}

const ExportModal = ({ invoices, summary, onClose }: ExportModalProps) => {
  const today = new Date().toISOString().split("T")[0];
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState(today);
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const filteredInvoices = filterInvoicesByDateRange(invoices, startDate, endDate);
      const csv = generateExportCSV(filteredInvoices, summary, startDate, endDate);
      downloadCSV(csv, startDate, endDate);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-950/60 p-3 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-lg bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-orange-100 text-orange-600">
              <Download className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-950">Export Data</h3>
              <p className="text-xs text-slate-500">Select date range to export</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="space-y-4 px-6 py-5">
          <p className="text-sm text-slate-600">
            Export all invoices, customers, items, and summary data within the selected date range.
          </p>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="export-start-date">Start Date</Label>
              <Input
                id="export-start-date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="export-end-date">End Date</Label>
              <Input
                id="export-end-date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="mt-1"
              />
            </div>
          </div>

          <div className="rounded-lg bg-slate-50 p-3 text-xs text-slate-500">
            <p className="font-semibold text-slate-700">Export includes:</p>
            <ul className="mt-1 space-y-0.5">
              <li>• Invoice details (ID, date, customer, items, total, status)</li>
              <li>• Payment summary (cash, GPay, card, bank transfer, other)</li>
              <li>• All line items with quantity and price</li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-slate-200 px-6 py-4">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleExport} disabled={isExporting} className="gap-2">
            {isExporting ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Exporting...
              </>
            ) : (
              <>
                <Download className="h-4 w-4" />
                Export CSV
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

// Filter invoices by date range
const filterInvoicesByDateRange = (
  invoices: Invoice[],
  startDate: string,
  endDate: string
): Invoice[] => {
  if (!startDate && !endDate) return invoices;

  return invoices.filter((invoice) => {
    const invoiceDate = getInvoiceDateKey(invoice);
    if (!invoiceDate) return false;

    if (startDate && endDate) {
      return invoiceDate >= startDate && invoiceDate <= endDate;
    }
    if (startDate) return invoiceDate >= startDate;
    if (endDate) return invoiceDate <= endDate;
    return true;
  });
};

// Generate CSV content
const generateExportCSV = (
  invoices: Invoice[],
  summary: InvoiceSummary,
  startDate: string,
  endDate: string
): string => {
  const rows: string[] = [];

  // Header section
  rows.push("HARI ELECTRONICS - EXPORT REPORT");
  rows.push(`Export Date,${new Date().toISOString().split("T")[0]}`);
  rows.push(`Date Range,${startDate || "All"} to ${endDate || "All"}`);
  rows.push("");

  // Summary section
  rows.push("=== SUMMARY ===");
  rows.push(`Total Invoices,${invoices.length}`);
  rows.push(`Total Revenue,${summary.filteredTotal.toFixed(2)}`);
  rows.push(`Cash Total,${summary.cashTotal.toFixed(2)}`);
  rows.push(`GPay Total,${summary.gpayTotal.toFixed(2)}`);
  rows.push(`Card Total,${summary.cardTotal.toFixed(2)}`);
  rows.push(`Bank Transfer Total,${summary.bankTransferTotal.toFixed(2)}`);
  rows.push(`Other Total,${summary.otherPaymentTotal.toFixed(2)}`);
  rows.push("");

  // Invoices section
  rows.push("=== INVOICES ===");
  rows.push(
    "Invoice ID,Date,Customer Name,Phone,Type,Payment Method,Status,Subtotal,Discount Type,Discount Value,Discount Amount,Taxable Base,Tax,Total"
  );

  invoices.forEach((invoice) => {
    rows.push(
      [
        escapeCSV(invoice.id),
        escapeCSV(invoice.date),
        escapeCSV(invoice.customerName),
        escapeCSV(invoice.phoneNumber),
        escapeCSV(invoice.type),
        escapeCSV(invoice.paymentMethod || ""),
        escapeCSV(invoice.status),
        invoice.subtotal.toFixed(2),
        escapeCSV(invoice.discountType || "flat"),
        (invoice.discountValue || 0).toString(),
        (invoice.discountAmount || 0).toFixed(2),
        (invoice.taxableBase || 0).toFixed(2),
        invoice.taxTotal.toFixed(2),
        invoice.total.toFixed(2),
      ].join(",")
    );
  });

  rows.push("");

  // Invoice Items section
  rows.push("=== INVOICE ITEMS ===");
  rows.push(
    "Invoice ID,Item Description,Category,Product Type,Quantity,Price,Taxable"
  );

  invoices.forEach((invoice) => {
    invoice.items.forEach((item) => {
      rows.push(
        [
          escapeCSV(invoice.id),
          escapeCSV(item.description),
          escapeCSV(item.category),
          escapeCSV(item.productType),
          item.quantity.toString(),
          item.price.toFixed(2),
          item.taxable ? "Yes" : "No",
        ].join(",")
      );
    });
  });

  rows.push("");
  rows.push("=== END OF REPORT ===");

  return rows.join("\n");
};

// Escape CSV special characters
const escapeCSV = (value: string): string => {
  if (!value) return "";
  const str = String(value);
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
};

// Download CSV file
const downloadCSV = (csv: string, startDate: string, endDate: string) => {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  const datePrefix = startDate || "all";
  const dateSuffix = endDate || "all";
  link.href = url;
  link.download = `hari-electronics-export-${datePrefix}-to-${dateSuffix}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const SettingsView = ({
  settings,
  onSettingsChange,
}: {
  settings: AppSettings;
  onSettingsChange: (settings: AppSettings) => void;
}) => {
  const [draft, setDraft] = useState(settings);

  return (
    <SectionShell icon={Save} title="Settings" subtitle="Update local business preferences for this billing app.">
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Business name">
          <Input value={draft.businessName} onChange={(event) => setDraft({ ...draft, businessName: event.target.value })} />
        </Field>
        <Field label="Business subtitle">
          <Input value={draft.businessSubtitle} onChange={(event) => setDraft({ ...draft, businessSubtitle: event.target.value })} />
        </Field>
        <Field label="Owner name">
          <Input value={draft.ownerName} onChange={(event) => setDraft({ ...draft, ownerName: event.target.value })} />
        </Field>
        <label className="mt-6 flex h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={draft.defaultTaxable}
            onChange={(event) => setDraft({ ...draft, defaultTaxable: event.target.checked })}
          />
          Apply tax by default on new saved items
        </label>
      </div>
      <Button onClick={() => onSettingsChange(draft)} className="mt-5 gap-2">
        <Save className="h-4 w-4" />
        Save settings
      </Button>
    </SectionShell>
  );
};

const SectionShell = ({
  icon: Icon,
  title,
  subtitle,
  children,
}: {
  icon: typeof Users;
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) => (
  <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm shadow-slate-950/[0.04] sm:p-6">
    <div className="mb-6 flex items-center gap-3">
      <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-orange-50 text-orange-600">
        <Icon className="h-5 w-5" />
      </span>
      <div>
        <h2 className="text-2xl font-bold text-slate-950">{title}</h2>
        <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
      </div>
    </div>
    {children}
  </section>
);

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div>
    <Label>{label}</Label>
    <div className="mt-1">{children}</div>
  </div>
);

const DataTable = ({
  headers,
  emptyText,
  children,
}: {
  headers: string[];
  emptyText: string;
  children: React.ReactNode;
}) => {
  const rows = Array.isArray(children) ? children.filter(Boolean) : children ? [children] : [];
  return (
    <div className="overflow-hidden rounded-lg border border-slate-200">
      <table className="w-full min-w-[720px] text-left text-sm">
        <thead className="bg-slate-50 text-xs font-bold uppercase text-slate-500">
          <tr>
            {headers.map((header) => (
              <th key={header} className="px-4 py-3">{header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length > 0 ? rows : (
            <tr>
              <td className="px-4 py-10 text-center text-slate-500" colSpan={headers.length}>{emptyText}</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

const Cell = ({
  children,
  strong = false,
  align = "left",
}: {
  children: React.ReactNode;
  strong?: boolean;
  align?: "left" | "right";
}) => (
  <td className={`px-4 py-3 ${align === "right" ? "text-right" : ""} ${strong ? "font-semibold text-slate-950" : "text-slate-600"}`}>
    {children}
  </td>
);

const Metric = ({ label, value }: { label: string; value: string }) => (
  <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
    <p className="text-xs font-bold uppercase text-slate-500">{label}</p>
    <p className="mt-2 text-2xl font-bold text-slate-950">{value}</p>
  </div>
);

const buildPaymentRows = (invoices: Invoice[], summary: InvoiceSummary) => {
  const rows = [
    { key: "cash", label: "Cash", icon: Banknote, count: 0, total: summary.cashTotal },
    { key: "gpay", label: "GPay", icon: Smartphone, count: 0, total: summary.gpayTotal },
    { key: "card", label: "Card", icon: CreditCard, count: 0, total: summary.cardTotal },
    { key: "bank transfer", label: "Bank transfer", icon: Landmark, count: 0, total: summary.bankTransferTotal },
    { key: "other", label: "Other", icon: WalletCards, count: 0, total: summary.otherPaymentTotal },
  ];

  invoices.filter((invoice) => invoice.status === "paid").forEach((invoice) => {
    const row = rows.find((entry) => entry.key === (invoice.paymentMethod || "other"));
    if (!row) return;
    row.count += 1;
  });

  return rows;
};

const filterInvoicesByDate = (invoices: Invoice[], selectedDate: string) =>
  invoices.filter((invoice) => getInvoiceDateKey(invoice) === selectedDate);

const getInvoiceDateKey = (invoice: Invoice) => {
  const value = invoice.date || invoice.createdAt || "";
  const match = /^(\d{4}-\d{2}-\d{2})/.exec(value);
  return match ? match[1] : value;
};
