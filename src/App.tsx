import { CSSProperties, useEffect, useMemo, useState } from "react";
import { AppSettings, CustomerRecord, DefaultItem, Invoice } from "./types/invoice";
import { useInvoices } from "./hooks/useInvoices";
import { InvoiceForm } from "./components/InvoiceForm";
import { InvoiceList } from "./components/InvoiceList";
import { RecentInvoices } from "./components/RecentInvoices";
import { Cashbook } from "./components/Cashbook";
import { InvoiceDetailModal } from "./components/InvoiceDetailModal";
import { Toast } from "./components/Toast";
import { updateInvoiceStatus } from "./utils/googleSheets";
import { useCashbook } from "./hooks/useCashbook";
import { getTodayDateInputValue } from "./utils/date";
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
import { Header, MobileNav, Sidebar } from "./components/layout";
import type { ActiveTab } from "./components/layout/types";

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
    setShowInvoiceForm(true);
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
        <Sidebar
          activeTab={activeTab}
          businessName={settings.businessName}
          businessSubtitle={settings.businessSubtitle}
          ownerName={settings.ownerName}
          onNavigate={setActiveTab}
          onInvoicesClick={() => {
            setEditingInvoice(null);
            setShowInvoiceForm(false);
            setActiveTab("create");
          }}
        />

        <div className="min-w-0 flex-1 lg:pl-[300px]">
          <Header
            activeTab={activeTab}
            editingInvoice={!!editingInvoice}
            selectedDate={selectedDate}
            loading={loading}
            dateChanging={dateChanging}
            onDateChange={handleSelectedDateChange}
            onNewInvoice={startCreate}
          />

          <MobileNav activeTab={activeTab} onNavigate={setActiveTab} />

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
