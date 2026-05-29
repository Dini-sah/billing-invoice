import { Invoice } from "../types/invoice";
import { Card, CardContent } from "../components/ui/card";
import { useEffect, useState } from "react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import {
  Calendar,
  Eye,
  RefreshCw,
  Search,
  Smartphone,
  WalletCards,
} from "lucide-react";
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
      <div className="mx-auto max-w-5xl rounded-lg border border-gray-200 bg-white p-8 shadow-sm">
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 rounded-full border-2 border-emerald-600 border-t-transparent animate-spin" />
          <span className="ml-3 text-gray-600">Loading invoices...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-5xl">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-6">
            <p className="mb-4 font-medium text-red-700">{error}</p>
            <Button
              onClick={onRefresh}
              variant="outline"
              className="border-red-200 text-red-700 hover:bg-red-100"
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
      <div className="mx-auto max-w-5xl">
        <Card>
          <CardContent className="p-12 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-lg bg-gray-100">
              <Calendar className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="mb-2 text-lg font-semibold text-gray-950">
              No invoices yet
            </h3>
            <p className="text-gray-600">Create your first invoice to get started.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-5 rounded-lg border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-950">Recent Invoices</h2>
            <p className="text-sm text-gray-500">
              Showing saved sales and service invoices.
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Search invoice, customer, phone, item..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-full pl-9 sm:w-80"
              />
            </div>
            <Button
              onClick={() => onSearchChange(searchInput)}
              variant="outline"
              className="w-full sm:w-auto"
            >
              Search
            </Button>
            <Button onClick={onRefresh} variant="outline" className="w-full sm:w-auto">
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {invoices.map((invoice) => (
          <Card
            key={invoice.id}
            className="overflow-hidden transition hover:border-emerald-200 hover:shadow-md"
          >
            <CardContent className="p-0">
              <div className="grid gap-4 p-4 sm:p-5 lg:grid-cols-[1fr_auto] lg:items-center">
                <div className="min-w-0">
                  <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <h3 className="truncate text-base font-bold text-gray-950">
                        {invoice.id}
                      </h3>
                      <p className="text-sm font-medium capitalize text-gray-700">
                        {invoice.customerName}
                      </p>
                      <p className="text-sm text-gray-500">{invoice.phoneNumber}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${
                          invoice.type === "sale"
                            ? "bg-blue-50 text-blue-700"
                            : invoice.type === "service"
                            ? "bg-violet-50 text-violet-700"
                            : "bg-amber-50 text-amber-700"
                        }`}
                      >
                        {invoice.type}
                      </span>
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${
                          invoice.status === "paid"
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-yellow-50 text-yellow-700"
                        }`}
                      >
                        {invoice.status}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500">
                    <span className="inline-flex items-center gap-1.5">
                      <Calendar className="h-4 w-4" />
                      {getRelativeDate(invoice.date)}
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <Smartphone className="h-4 w-4" />
                      {invoice.items.length}{" "}
                      {invoice.items.length === 1 ? "item" : "items"}
                    </span>
                    {invoice.status === "paid" && (
                      <span className="inline-flex items-center gap-1.5 capitalize">
                        <WalletCards className="h-4 w-4" />
                        {invoice.paymentMethod || "not recorded"}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between gap-4 lg:justify-end">
                  <div className="text-left lg:text-right">
                    <p className="text-xs font-semibold uppercase text-gray-500">
                      Total
                    </p>
                    <p className="text-2xl font-bold text-emerald-700">
                      ₹{invoice.total.toFixed(2)}
                    </p>
                  </div>
                  <Button
                    onClick={() => onViewInvoice(invoice)}
                    variant="outline"
                    className="shrink-0"
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    View
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {total > 0 && (
        <div className="mt-5 flex flex-col gap-3 rounded-lg border border-gray-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
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
            <span className="text-sm font-medium text-gray-600">
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
