import { CSSProperties, useEffect, useMemo, useState } from "react";
import {
  BarChart3,
  Bell,
  BookOpenText,
  CalendarDays,
  ChevronDown,
  FileText,
  LayoutDashboard,
  Package,
  Plus,
  ReceiptText,
  Settings,
  Users,
  WalletCards,
} from "lucide-react";
import { AppSettings, CustomerRecord, DefaultItem, Invoice } from "./types/invoice";
import { useInvoices } from "./hooks/useInvoices";
import { InvoiceForm } from "./components/InvoiceForm";
import { InvoiceList } from "./components/InvoiceList";
import { RecentInvoices } from "./components/RecentInvoices";
import { Cashbook } from "./components/Cashbook";
import { InvoiceDetailModal } from "./components/InvoiceDetailModal";
import { Toast } from "./components/Toast";
import { Button } from "./components/ui/button";
import { updateInvoiceStatus } from "./utils/googleSheets";
import { useCashbook } from "./hooks/useCashbook";
import { formatCurrency } from "./utils/invoiceMath";
import { getTodayDateInputValue } from "./utils/date";
import HELogo from "./assets/images/HElogoBlack.webp";
import {
  CustomersView,
  ItemsView,
  PaymentsView,
  ReportsView,
  SettingsView,
} from "./components/ManagementViews";
import {
  getDefaultItems,
  getSettings,
  getStoredCustomers,
  deleteCustomer,
  deleteDefaultItem,
  mergeCustomersWithInvoices,
  mergeItemsWithInvoices,
  saveCustomer,
  saveCustomers,
  saveDefaultItem,
  saveDefaultItems,
  saveSettings,
  syncCustomersFromGoogleSheets,
  syncDefaultItemsFromGoogleSheets,
  upsertCustomerFromInvoice,
} from "./utils/masterData";

type ActiveTab =
  | "create"
  | "list"
  | "cashbook"
  | "customers"
  | "items"
  | "payments"
  | "reports"
  | "settings";

const appTheme = {
  "--theme-primary": "#f97316",
  "--theme-primary-hover": "#ea580c",
  "--theme-header": "#0f172a",
  "--theme-page": "#f8fafc",
  "--theme-soft": "#ffedd5",
  "--theme-accent": "#22c55e",
  "--theme-accent-soft": "#dcfce7",
} as CSSProperties;

function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>("list");
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);
  const [storedCustomers, setStoredCustomers] = useState<CustomerRecord[]>(() =>
    getStoredCustomers()
  );
  const [storedItems, setStoredItems] = useState<DefaultItem[]>(() => getDefaultItems());
  const [settings, setSettings] = useState<AppSettings>(() => getSettings());
  const [selectedDate, setSelectedDate] = useState(() => getTodayDateInputValue());
  const [dateChanging, setDateChanging] = useState(false);
  const [showInvoiceForm, setShowInvoiceForm] = useState(false);

  const {
    invoices,
    loading,
    error,
    refresh,
    page,
    pageSize,
    total,
    setPage,
    search,
    setSearch,
    filters,
    setFilters,
    summary,
  } = useInvoices();
  const cashbook = useCashbook(selectedDate);

  const customers = useMemo(
    () => mergeCustomersWithInvoices(storedCustomers, invoices),
    [storedCustomers, invoices]
  );
  const defaultItems = useMemo(
    () => mergeItemsWithInvoices(storedItems, invoices),
    [storedItems, invoices]
  );

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type });
  };

  useEffect(() => {
    document.title = "Hari Electronics Billing";
  }, []);

  useEffect(() => {
    let cancelled = false;

    syncCustomersFromGoogleSheets()
      .then((sheetCustomers) => {
        if (!cancelled) {
          setStoredCustomers(sheetCustomers);
        }
      })
      .catch(() => {
        // Local cache is already loaded; keep the UI usable if sync fails.
      });

    syncDefaultItemsFromGoogleSheets()
      .then((sheetItems) => {
        if (!cancelled) {
          setStoredItems(sheetItems);
        }
      })
      .catch(() => {
        // Local defaults are already available.
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const handleMarkPaid = async (
    invoiceId: string,
    paymentMethod: Invoice["paymentMethod"]
  ): Promise<boolean> => {
    // Find the invoice to get details for cashbook entry
    const invoice = invoices.find((inv) => inv.id === invoiceId);

    const result = await updateInvoiceStatus(invoiceId, "paid", paymentMethod);
    if (result.success) {
      // Create cashbook entry for this invoice
      if (invoice) {
        await cashbook.addEntry({
          type: "credit",
          date: invoice.date,
          title: invoice.customerName,
          category: "Invoice payment",
          amount: invoice.total,
          paymentMethod: paymentMethod || "cash",
          note: `Invoice #${invoice.id}`,
        });
      }

      setSelectedInvoice((current) =>
        current && current.id === invoiceId
          ? { ...current, status: "paid", paymentMethod }
          : current
      );
      showToast("Invoice marked as paid", "success");
      refresh();
      return true;
    }

    showToast(result.error || "Failed to update status", "error");
    return false;
  };

  const handleInvoiceSaved = (invoice: Invoice) => {
    upsertCustomerFromInvoice(invoice);
    setStoredCustomers(getStoredCustomers());
    setEditingInvoice(null);
    refresh();
    setActiveTab("list");
  };

  const updateCustomers = (nextCustomers: CustomerRecord[]) => {
    const previousIds = new Set(storedCustomers.map((customer) => customer.id));
    const nextIds = new Set(nextCustomers.map((customer) => customer.id));
    const customersToSave = nextCustomers.filter(
      (customer) => !previousIds.has(customer.id)
    );
    const customerIdsToDelete = storedCustomers
      .filter((customer) => !nextIds.has(customer.id))
      .map((customer) => customer.id);

    setStoredCustomers(nextCustomers);
    saveCustomers(nextCustomers);
    Promise.all([
      ...customersToSave.map((customer) => saveCustomer(customer)),
      ...customerIdsToDelete.map((id) => deleteCustomer(id)),
    ])
      .then(() => showToast("Customer data saved to Google Sheet", "success"))
      .catch((error) =>
        showToast(
          error instanceof Error ? error.message : "Customer saved locally, Google Sheet sync failed",
          "error"
        )
      );
  };

  const updateItems = (nextItems: DefaultItem[]) => {
    const previousIds = new Set(storedItems.map((item) => item.id));
    const nextIds = new Set(nextItems.map((item) => item.id));
    const itemsToSave = nextItems.filter((item) => !previousIds.has(item.id));
    const itemIdsToDelete = storedItems
      .filter((item) => !nextIds.has(item.id))
      .map((item) => item.id);

    setStoredItems(nextItems);
    saveDefaultItems(nextItems);
    Promise.all([
      ...itemsToSave.map((item) => saveDefaultItem(item)),
      ...itemIdsToDelete.map((id) => deleteDefaultItem(id)),
    ])
      .then(() => showToast("Item defaults saved to Google Sheet", "success"))
      .catch((error) =>
        showToast(
          error instanceof Error ? error.message : "Item saved locally, Google Sheet sync failed",
          "error"
        )
      );
  };

  const updateSettings = (nextSettings: AppSettings) => {
    setSettings(nextSettings);
    saveSettings(nextSettings);
    showToast("Settings saved", "success");
  };

  const handleEditInvoice = (invoice: Invoice) => {
    setSelectedInvoice(null);
    setEditingInvoice(invoice);
    setActiveTab("create");
  };

  const showList = () => {
    setEditingInvoice(null);
    setActiveTab("list");
  };

  const startCreate = () => {
    setEditingInvoice(null);
    setShowInvoiceForm(true);
    setActiveTab("create");
  };

  const showRecentInvoices = () => {
    setEditingInvoice(null);
    setShowInvoiceForm(false);
  };

  const handleRefreshInvoices = () => {
    setDateChanging(true);
    setSelectedDate(getTodayDateInputValue());
    refresh();
  };

  const handleSelectedDateChange = (nextDate: string) => {
    setDateChanging(true);
    setSelectedDate(nextDate);
    setFilters({
      ...filters,
      dateRange: "custom",
      startDate: nextDate,
      endDate: nextDate,
    });
  };

  useEffect(() => {
    if (!loading) {
      setDateChanging(false);
    }
  }, [loading]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-950" style={appTheme}>
      <div className="flex min-h-screen">
        <aside className="fixed inset-y-0 left-0 z-40 hidden w-[300px] overflow-y-auto border-r border-slate-200 bg-white lg:block">
          <div className="flex min-h-full flex-col p-7">
            <div className="text-center">
              <img className="mx-auto h-16 w-auto object-contain" src={HELogo} alt="Hari Electronics" />
              <h1 className="mt-5 break-words text-xl font-bold leading-snug text-slate-950">{settings.businessName}</h1>
              <p className="mt-2 break-words text-sm text-slate-500">{settings.businessSubtitle}</p>
            </div>

            <nav className="mt-12 space-y-2">
              <NavItem
                icon={LayoutDashboard}
                label="Dashboard"
                active={activeTab === "list"}
                onClick={showList}
              />
              <NavItem
                icon={FileText}
                label="Invoices"
                active={activeTab === "create"}
                onClick={() => {
                  setEditingInvoice(null);
                  setShowInvoiceForm(false);
                  setActiveTab("create");
                }}
              />
              <NavItem
                icon={BookOpenText}
                label="Cashbook"
                active={activeTab === "cashbook"}
                onClick={() => setActiveTab("cashbook")}
              />
              <NavItem
                icon={Users}
                label="Customers"
                active={activeTab === "customers"}
                onClick={() => setActiveTab("customers")}
              />
              <NavItem
                icon={Package}
                label="Items & Services"
                active={activeTab === "items"}
                onClick={() => setActiveTab("items")}
              />
              <NavItem
                icon={WalletCards}
                label="Payments"
                active={activeTab === "payments"}
                onClick={() => setActiveTab("payments")}
              />
              <NavItem
                icon={BarChart3}
                label="Reports"
                active={activeTab === "reports"}
                onClick={() => setActiveTab("reports")}
              />
              <NavItem
                icon={Settings}
                label="Settings"
                active={activeTab === "settings"}
                onClick={() => setActiveTab("settings")}
              />
            </nav>

            <div className="mt-auto pt-6">
              <div className="flex items-center gap-3 border-t border-slate-100 pt-6">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-violet-100 text-sm font-bold text-violet-600">
                  HE
                </div>
                <div className="min-w-0 flex-1">
                  <p className="break-words text-sm font-bold leading-snug text-slate-950">{settings.ownerName}</p>
                  <p className="text-sm text-slate-500">Owner</p>
                </div>
                <ChevronDown className="h-4 w-4 text-slate-500" />
              </div>
            </div>
          </div>
        </aside>

        <div className="min-w-0 flex-1 lg:pl-[300px]">
          <header className="sticky top-0 z-30 border-b border-slate-200 bg-slate-50/90 px-4 py-4 backdrop-blur-xl sm:px-6 xl:px-8">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div>
                <p className="text-2xl font-bold text-slate-950 sm:text-3xl">
                  {activeTab === "create"
                    ? editingInvoice
                      ? "Edit invoice"
                      : "Create invoice"
                    : getPageTitle(activeTab)}
                </p>
                <p className="mt-2 text-sm text-slate-500">
                  {activeTab === "list"
                    ? "Here's what's happening with your business today."
                    : "Manage Hari Electronics billing operations."}
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="grid grid-cols-2 gap-2 rounded-lg border border-slate-200 bg-white p-2 shadow-sm lg:hidden">
                  <MiniMetric label="Today In" value={formatCurrency(cashbook.summary.todayIn)} />
                  <MiniMetric label="Today Out" value={formatCurrency(cashbook.summary.todayOut)} />
                </div>
                <label className="relative">
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(event) => handleSelectedDateChange(event.target.value)}
                    className="h-12 w-full rounded-lg border border-slate-200 bg-white px-4 pl-11 pr-10 text-sm font-semibold text-slate-700 shadow-sm outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-100 sm:w-[180px]"
                    aria-label="Select business date"
                  />
                  <CalendarDays className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-600" />
                  {(dateChanging || loading) && (
                    <span className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin rounded-full border-2 border-orange-500 border-t-transparent" />
                  )}
                </label>
                <Button onClick={startCreate} className="h-12 gap-3 bg-orange-500 px-6 hover:bg-orange-600">
                  <Plus className="h-5 w-5" />
                  New Invoice
                  <ChevronDown className="h-4 w-4" />
                </Button>
                <Button variant="outline" className="relative h-12 w-12 p-0" aria-label="Notifications">
                  <Bell className="h-5 w-5" />
                  <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-orange-500 px-1 text-[10px] font-bold text-white">
                    3
                  </span>
                </Button>
              </div>
            </div>
            <nav className="mt-4 grid grid-cols-4 gap-2 lg:hidden">
              <MobileNavItem icon={LayoutDashboard} label="Home" active={activeTab === "list"} onClick={showList} />
              <MobileNavItem icon={BookOpenText} label="Cash" active={activeTab === "cashbook"} onClick={() => setActiveTab("cashbook")} />
              <MobileNavItem icon={Users} label="Users" active={activeTab === "customers"} onClick={() => setActiveTab("customers")} />
              <MobileNavItem icon={BarChart3} label="Reports" active={activeTab === "reports"} onClick={() => setActiveTab("reports")} />
            </nav>
          </header>

          <main className="relative px-4 py-6 sm:px-6 xl:px-8">
            {activeTab !== "create" && (dateChanging || loading) && (
              <div className="absolute inset-x-4 top-4 z-20 rounded-lg border border-orange-100 bg-white/95 px-4 py-3 shadow-lg shadow-slate-950/10 sm:inset-x-6 xl:inset-x-8">
                <div className="flex items-center gap-3 text-sm font-semibold text-slate-800">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-orange-500 border-t-transparent" />
                  Loading selected date data...
                </div>
              </div>
            )}
            {activeTab === "create" ? (
              showInvoiceForm ? (
                <InvoiceForm
                  onSave={handleInvoiceSaved}
                  showToast={showToast}
                  editingInvoice={editingInvoice}
                  onCancelEdit={showRecentInvoices}
                  customers={customers}
                  defaultItems={defaultItems}
                />
              ) : (
                <RecentInvoices
                  invoices={invoices}
                  onRefresh={handleRefreshInvoices}
                  onViewInvoice={setSelectedInvoice}
                  onCreateInvoice={startCreate}
                  page={page}
                  pageSize={pageSize}
                  total={total}
                  onPageChange={setPage}
                  search={search}
                  onSearchChange={setSearch}
                  filters={filters}
                  onFiltersChange={setFilters}
                  filterLabel="Recent Invoices"
                />
              )
            ) : activeTab === "list" ? (
              <InvoiceList
                invoices={invoices}
                loading={loading}
                error={error}
                onRefresh={handleRefreshInvoices}
                onViewInvoice={setSelectedInvoice}
                page={page}
                pageSize={pageSize}
                total={total}
                onPageChange={setPage}
                search={search}
                onSearchChange={setSearch}
                filters={filters}
                onFiltersChange={setFilters}
                summary={summary}
                onCreateInvoice={startCreate}
              />
            ) : activeTab === "cashbook" ? (
              <Cashbook
                entries={cashbook.entries}
                summary={cashbook.summary}
                selectedDate={selectedDate}
                loading={cashbook.loading}
                syncing={cashbook.syncing}
                error={cashbook.error}
                onRefresh={cashbook.refresh}
                onAddEntry={cashbook.addEntry}
                onRemoveEntry={cashbook.removeEntry}
              />
            ) : activeTab === "customers" ? (
              <CustomersView customers={customers} onCustomersChange={updateCustomers} />
            ) : activeTab === "items" ? (
              <ItemsView items={defaultItems} onItemsChange={updateItems} />
            ) : activeTab === "payments" ? (
              <PaymentsView invoices={invoices} summary={summary} selectedDate={selectedDate} />
            ) : activeTab === "reports" ? (
              <ReportsView invoices={invoices} summary={summary} selectedDate={selectedDate} />
            ) : (
              <SettingsView settings={settings} onSettingsChange={updateSettings} />
            )}
          </main>
        </div>
      </div>

      <InvoiceDetailModal
        invoice={selectedInvoice}
        onClose={() => setSelectedInvoice(null)}
        onMarkPaid={handleMarkPaid}
        onEdit={handleEditInvoice}
      />

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <style>{`
        @media print {
          aside,
          header {
            display: none !important;
          }
          main {
            padding: 0 !important;
            background: white !important;
          }
          body {
            background: white !important;
          }
          .print-invoice {
            width: 100% !important;
            max-width: 100% !important;
            max-height: none !important;
            border-radius: 0 !important;
            box-shadow: none !important;
            overflow: visible !important;
          }
          .print-invoice .sticky {
            position: static !important;
          }
          .print-invoice table {
            width: 100% !important;
            border-collapse: collapse !important;
          }
          .print-invoice th,
          .print-invoice td {
            padding: 8px 6px !important;
          }
          .print-invoice .print\\:grid-cols-2 {
            grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
          }
          .print-invoice .print\\:gap-4 {
            gap: 0.25rem !important;
          }
          .print\\:hidden {
            display: none !important;
          }
          .print\\:text-left {
            text-align: left !important;
          }
          .print\\:space-y-4 > * + * {
            margin-top: 0.25rem !important;
          }
        }
      `}</style>
    </div>
  );
}

export default App;

const NavItem = ({
  icon: Icon,
  label,
  active = false,
  onClick,
}: {
  icon: typeof LayoutDashboard;
  label: string;
  active?: boolean;
  onClick?: () => void;
}) => (
  <button
    type="button"
    onClick={onClick}
    className={`relative flex h-12 w-full items-center gap-4 rounded-lg px-4 text-left text-sm font-semibold transition ${
      active
        ? "bg-orange-50 text-orange-600"
        : "text-slate-700 hover:bg-slate-50 hover:text-slate-950"
    }`}
  >
    {active && <span className="absolute -left-7 top-0 h-12 w-1 rounded-r-full bg-orange-500" />}
    <Icon className="h-5 w-5" />
    {label}
  </button>
);

const MiniMetric = ({ label, value }: { label: string; value: string }) => (
  <div className="rounded-md px-2 py-1">
    <span className="block text-[11px] font-semibold uppercase text-slate-500">{label}</span>
    <span className="block truncate text-sm font-bold text-slate-950">{value}</span>
  </div>
);

const MobileNavItem = ({
  icon: Icon,
  label,
  active,
  onClick,
}: {
  icon: typeof LayoutDashboard;
  label: string;
  active: boolean;
  onClick: () => void;
}) => (
  <button
    type="button"
    onClick={onClick}
    className={`flex min-h-14 flex-col items-center justify-center gap-1 rounded-lg border px-1 text-[11px] font-semibold ${
      active
        ? "border-orange-200 bg-orange-50 text-orange-600"
        : "border-slate-200 bg-white text-slate-600"
    }`}
  >
    <Icon className="h-4 w-4" />
    <span className="max-w-full truncate">{label}</span>
  </button>
);

const getPageTitle = (activeTab: ActiveTab) => {
  const titles: Record<ActiveTab, string> = {
    create: "Create invoice",
    list: "Good morning, Hari!",
    cashbook: "Cashbook",
    customers: "Customers",
    items: "Items & Services",
    payments: "Payments",
    reports: "Reports",
    settings: "Settings",
  };

  return titles[activeTab];
};
