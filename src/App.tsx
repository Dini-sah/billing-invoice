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
    setSearch
  } = useInvoices();

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type });
  };

  const handleMarkPaid = async (invoiceId: string) => {
    const result = await updateInvoiceStatus(invoiceId, "paid");
    if (result.success) {
      setSelectedInvoice((current) =>
        current && current.id === invoiceId
          ? { ...current, status: "paid" }
          : current
      );
      showToast("Invoice marked as paid", "success");
      refresh();
    } else {
      showToast(result.error || "Failed to update status", "error");
    }
  };

  const handleInvoiceSaved = (invoice: Invoice) => {
    refresh(); // Refresh the list when a new invoice is saved
    setActiveTab("list"); // Switch to list view to show the new invoice
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-col items-center gap-3 text-center sm:flex-row sm:text-left">
              <div>
                <img className="w-[120px]" src={HELogo} alt="Hari Electronis" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Hari Electronics Billing
                </h1>
                <p className="text-sm text-gray-600">
                  Invoice management for mobile repair services
                </p>
              </div>
            </div>

            {/* Tab Navigation */}
            <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
              <Button
                onClick={() => setActiveTab("create")}
                variant={activeTab === "create" ? "default" : "outline"}
                className="flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Create
              </Button>
              <Button
                onClick={() => setActiveTab("list")}
                variant={activeTab === "list" ? "default" : "outline"}
                className="flex items-center justify-center gap-2"
              >
                <List className="w-4 h-4" />
                Invoices
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="py-8">
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
