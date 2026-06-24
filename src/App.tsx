import { useEffect, useState } from "react";
import { Invoice } from "./types/invoice";
import { useInvoices } from "./hooks/useInvoices";
import { InvoiceForm } from "./components/InvoiceForm";
import { InvoiceList } from "./components/InvoiceList";
import { Cashbook } from "./components/Cashbook";
import { InvoiceDetailModal } from "./components/InvoiceDetailModal";
import { Toast } from "./components/Toast";
import { Button } from "./components/ui/button";
import { ThemeSelector } from "./components/ThemeSelector";
import {
  ArrowDownLeft,
  ArrowUpRight,
  BookOpenText,
  List,
  Plus,
} from "lucide-react";
import { updateInvoiceStatus } from "./utils/googleSheets";
import { formatCurrency } from "./utils/invoiceMath";
import { useCashbook } from "./hooks/useCashbook";
import {
  getThemeById,
  THEME_STORAGE_KEY,
  ThemeId,
} from "./utils/themes";
import HELogo from "./assets/images/HElogoBlack.webp"

function App() {
  const [activeTab, setActiveTab] = useState<"create" | "list" | "cashbook">("create");
  const [theme, setTheme] = useState(() =>
    getThemeById(localStorage.getItem(THEME_STORAGE_KEY))
  );
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

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
    summary
  } = useInvoices();
  const cashbook = useCashbook(summary.todayTotal);

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type });
  };

  useEffect(() => {
    localStorage.setItem(THEME_STORAGE_KEY, theme.id);
  }, [theme.id]);

  const handleThemeChange = (themeId: ThemeId) => {
    setTheme(getThemeById(themeId));
  };

  const handleMarkPaid = async (
    invoiceId: string,
    paymentMethod: Invoice["paymentMethod"]
  ): Promise<boolean> => {
    const result = await updateInvoiceStatus(invoiceId, "paid", paymentMethod);
    if (result.success) {
      setSelectedInvoice((current) =>
        current && current.id === invoiceId
          ? { ...current, status: "paid", paymentMethod }
          : current
      );
      showToast("Invoice marked as paid", "success");
      refresh();
      return true;
    } else {
      showToast(result.error || "Failed to update status", "error");
      return false;
    }
  };

  const handleInvoiceSaved = (invoice: Invoice) => {
    setEditingInvoice(null);
    refresh(); // Refresh the list when a new invoice is saved
    setActiveTab("list"); // Switch to list view to show the new invoice
  };

  const handleEditInvoice = (invoice: Invoice) => {
    setSelectedInvoice(null);
    setEditingInvoice(invoice);
    setActiveTab("create");
  };

  return (
    <div
      className="min-h-screen bg-[var(--theme-page)] text-gray-950 transition-colors duration-300"
      style={theme.variables}
    >
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-gray-200/80 bg-white/85 shadow-sm shadow-gray-950/[0.03] backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-14 w-24 items-center justify-center rounded-lg border border-gray-200 bg-white shadow-sm shadow-gray-950/[0.04]">
                <img className="max-h-10 w-auto" src={HELogo} alt="Hari Electronics" />
              </div>
              <div className="min-w-0">
                <h1 className="truncate text-xl font-bold text-gray-950 sm:text-2xl">
                  Hari Electronics Billing
                </h1>
                <p className="text-sm text-gray-500">
                  Invoice management for mobile repair services
                </p>
              </div>
            </div>

            {/* Tab Navigation */}
            <div className="flex flex-col gap-3 md:flex-row md:items-center">
              <div className="grid grid-cols-2 gap-2 rounded-lg border border-gray-200 bg-gray-50 p-1">
                <MiniMetric
                  icon={ArrowDownLeft}
                  label="Today In"
                  value={formatCurrency(cashbook.summary.todayIn)}
                />
                <MiniMetric
                  icon={ArrowUpRight}
                  label="Today Out"
                  value={formatCurrency(cashbook.summary.todayOut)}
                />
              </div>
              <div className="grid w-full grid-cols-3 rounded-lg border border-gray-200 bg-gray-100/80 p-1 sm:w-auto sm:min-w-[25rem]">
                <Button
                  onClick={() => {
                    setEditingInvoice(null);
                    setActiveTab("create");
                  }}
                  variant={activeTab === "create" ? "default" : "ghost"}
                  className="h-10 gap-2 shadow-none"
                >
                  <Plus className="w-4 h-4" />
                  Create
                </Button>
                <Button
                  onClick={() => setActiveTab("list")}
                  variant={activeTab === "list" ? "default" : "ghost"}
                  className="h-10 gap-2 shadow-none"
                >
                  <List className="w-4 h-4" />
                  Invoices
                </Button>
                <Button
                  onClick={() => setActiveTab("cashbook")}
                  variant={activeTab === "cashbook" ? "default" : "ghost"}
                  className="h-10 gap-2 shadow-none"
                >
                  <BookOpenText className="w-4 h-4" />
                  Cashbook
                </Button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
        {activeTab === "create" ? (
          <InvoiceForm
            onSave={handleInvoiceSaved}
            showToast={showToast}
            editingInvoice={editingInvoice}
            onCancelEdit={() => {
              setEditingInvoice(null);
              setActiveTab("list");
            }}
          />
        ) : activeTab === "list" ? (
          <InvoiceList
            invoices={invoices}
            loading={loading}
            error={error}
            onRefresh={refresh}
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
            onCreateInvoice={() => {
              setEditingInvoice(null);
              setActiveTab("create");
            }}
          />
        ) : (
          <Cashbook
            entries={cashbook.entries}
            summary={cashbook.summary}
            loading={cashbook.loading}
            syncing={cashbook.syncing}
            error={cashbook.error}
            onRefresh={cashbook.refresh}
            onAddEntry={cashbook.addEntry}
            onRemoveEntry={cashbook.removeEntry}
          />
        )}
      </main>

      {/* Invoice Detail Modal */}
      <InvoiceDetailModal
        invoice={selectedInvoice}
        onClose={() => setSelectedInvoice(null)}
        onMarkPaid={handleMarkPaid}
        onEdit={handleEditInvoice}
      />

      {/* Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <ThemeSelector activeTheme={theme} onThemeChange={handleThemeChange} />

      {/* Print Styles */}
      <style jsx global>{`
        @media print {
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

const MiniMetric = ({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof ArrowUpRight;
  label: string;
  value: string;
}) => (
  <div className="flex min-w-32 items-center gap-2 rounded-md px-2.5 py-1.5">
    <span className="flex h-8 w-8 items-center justify-center rounded-md bg-white text-gray-700 shadow-sm">
      <Icon className="h-4 w-4" />
    </span>
    <span className="min-w-0">
      <span className="block text-[11px] font-semibold uppercase text-gray-500">{label}</span>
      <span className="block truncate text-sm font-bold text-gray-950">{value}</span>
    </span>
  </div>
);
