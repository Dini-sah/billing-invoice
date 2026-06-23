import { useState } from "react";
import { Invoice } from "./types/invoice";
import { useInvoices } from "./hooks/useInvoices";
import { InvoiceForm } from "./components/InvoiceForm";
import { InvoiceList } from "./components/InvoiceList";
import { InvoiceDetailModal } from "./components/InvoiceDetailModal";
import { Toast } from "./components/Toast";
import { Button } from "./components/ui/button";
import { Plus, List } from "lucide-react";
import { updateInvoiceStatus } from "./utils/googleSheets";
import HELogo from "./assets/images/HElogoBlack.webp"

function App() {
  const [activeTab, setActiveTab] = useState<"create" | "list">("create");
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
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

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type });
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
    refresh(); // Refresh the list when a new invoice is saved
    setActiveTab("list"); // Switch to list view to show the new invoice
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,#ecfdf5_0,#f6f7f9_34%,#f3f4f6_100%)]">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-gray-200/80 bg-white/90 shadow-sm backdrop-blur">
        <div className="max-w-6xl mx-auto px-4 py-3 sm:px-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-14 w-24 items-center justify-center rounded-lg border border-gray-200 bg-white shadow-sm">
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
            <div className="grid w-full grid-cols-2 rounded-lg border border-gray-200 bg-gray-100 p-1 sm:w-auto sm:min-w-64">
              <Button
                onClick={() => setActiveTab("create")}
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
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-4 py-6 sm:px-6 sm:py-8">
        {activeTab === "create" ? (
          <InvoiceForm onSave={handleInvoiceSaved} showToast={showToast} />
        ) : (
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
            onCreateInvoice={() => setActiveTab("create")}
          />
        )}
      </main>

      {/* Invoice Detail Modal */}
      <InvoiceDetailModal
        invoice={selectedInvoice}
        onClose={() => setSelectedInvoice(null)}
        onMarkPaid={handleMarkPaid}
      />

      {/* Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

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
