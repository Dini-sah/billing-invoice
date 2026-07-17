import { useState } from "react";
import {
  BarChart3,
  Banknote,
  CreditCard,
  Landmark,
  Package,
  Plus,
  Save,
  Smartphone,
  Trash2,
  Users,
  WalletCards,
} from "lucide-react";
import { AppSettings, CustomerRecord, DefaultItem, Invoice, InvoiceSummary } from "../types/invoice";
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

  return (
    <SectionShell icon={BarChart3} title="Reports" subtitle={`Business summary for ${selectedDate}.`}>
      <div className="mb-5 grid gap-4 md:grid-cols-4">
        <Metric label="Revenue" value={formatCurrency(revenue)} />
        <Metric label="Paid" value={formatCurrency(paid)} />
        <Metric label="Pending" value={formatCurrency(pending)} />
        <Metric label="Average bill" value={formatCurrency(summary.filteredCount ? revenue / summary.filteredCount : 0)} />
      </div>
      <DataTable headers={["Top item/service", "Quantity"]} emptyText="No item data available.">
        {topItems.map(([description, quantity]) => (
          <tr key={description} className="border-t border-slate-100">
            <Cell strong>{description}</Cell>
            <Cell>{quantity}</Cell>
          </tr>
        ))}
      </DataTable>
    </SectionShell>
  );
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
