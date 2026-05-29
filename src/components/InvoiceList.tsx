import { Invoice } from "../types/invoice";
import { Card, CardContent } from "../components/ui/card";
import { useEffect, useState } from "react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Eye, RefreshCw, Calendar, Smartphone } from "lucide-react";
import { getRelativeDate } from "../utils/date";

interface InvoiceListProps {
  invoices: Invoice[];
  loading: boolean;
  error: string | null;
  onRefresh: () => void;
  onViewInvoice: (invoice: Invoice) => void;
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  search: string;
  onSearchChange: (value: string) => void;
}

export const InvoiceList = ({
  invoices,
  loading,
  error,
  onRefresh,
  onViewInvoice,
  page,
  pageSize,
  total,
  onPageChange,
  search,
  onSearchChange,
}: InvoiceListProps) => {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const [searchInput, setSearchInput] = useState(search);

  useEffect(() => {
    setSearchInput(search);
  }, [search]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-4 sm:p-6">
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-2 border-green-600 border-t-transparent rounded-full animate-spin" />
          <span className="ml-3 text-gray-600">Loading invoices...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto p-4 sm:p-6">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-6">
            <p className="text-red-700 mb-4">{error}</p>
            <Button
              onClick={onRefresh}
              variant="outline"
              className="text-red-600 border-red-600"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (invoices.length === 0) {
    return (
      <div className="max-w-4xl mx-auto p-4 sm:p-6">
        <Card>
          <CardContent className="p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Calendar className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No invoices yet
            </h3>
            <p className="text-gray-600">
              Create your first invoice to get started
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }
  // console.log(sortedInvoices);
  
  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6">
      <div className="flex flex-col gap-4 mb-6 md:flex-row md:items-center md:justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Recent Invoices</h2>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Input
            placeholder="Search by invoice, customer, phone, item..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full sm:w-72"
          />
          <Button
            onClick={() => onSearchChange(searchInput)}
            variant="outline"
            size="sm"
            className="w-full sm:w-auto"
          >
            Search
          </Button>
          <Button onClick={onRefresh} variant="outline" size="sm" className="w-full sm:w-auto">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        {invoices.map((invoice) => (
          <Card key={invoice.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-0">
              <div className="p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-lg text-gray-900">
                      {invoice.id}
                    </h3>
                    <p className="text-sm text-gray-600 capitalize">
                      {invoice.customerName}
                    </p>
                    <p className="text-sm text-gray-600">
                      {invoice.phoneNumber}
                    </p>
                  </div>
                  <div className="text-left sm:text-right">
                    <span
                      className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${
                        invoice.type === "sale"
                          ? "bg-blue-100 text-blue-700"
                          : invoice.type === "service"
                          ? "bg-purple-100 text-purple-700"
                          : "bg-amber-100 text-amber-700"
                      }`}
                    >
                      {invoice.type}
                    </span>
                    <p className="text-sm text-gray-600 mt-1">
                      {getRelativeDate(invoice.date)}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600">
                    <span className="flex items-center gap-1">
                      <Smartphone className="w-4 h-4" />
                      {invoice.items.length}{" "}
                      {invoice.items.length === 1 ? "item" : "items"}
                    </span>
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        invoice.status === "paid"
                          ? "bg-green-100 text-green-700"
                          : "bg-yellow-100 text-yellow-700"
                      }`}
                    >
                      {invoice.status}
                    </span>
                    {invoice.status === "paid" && (
                      <span className="px-2 py-1 rounded bg-gray-100 text-xs font-medium text-gray-700 capitalize">
                        {invoice.paymentMethod || "not recorded"}
                      </span>
                    )}
                  </div>

                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
                    <div className="text-left sm:text-right">
                      <p className="text-sm text-gray-600">Total</p>
                      <p className="text-xl font-bold text-green-600">
                        ₹{invoice.total.toFixed(2)}
                      </p>
                    </div>
                    <Button
                      onClick={() => onViewInvoice(invoice)}
                      variant="outline"
                      size="sm"
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      View
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {total > 0 && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mt-6">
          <p className="text-sm text-gray-600">
            Showing {(page - 1) * pageSize + 1}-
            {Math.min(page * pageSize, total)} of {total}
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(Math.max(1, page - 1))}
              disabled={page <= 1}
            >
              Previous
            </Button>
            <span className="text-sm text-gray-600">
              Page {page} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(Math.min(totalPages, page + 1))}
              disabled={page >= totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
