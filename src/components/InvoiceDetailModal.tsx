import { useEffect, useRef, useState } from "react";
import html2pdf from "html2pdf.js";
import { Invoice } from "../types/invoice";
import { Button } from "../components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { X, Printer, FileText, User, Download, Share2 } from "lucide-react";
import { formatDateTime } from "../utils/date";
import HELogoBlack from "../assets/images/HElogoBlack.webp";

interface InvoiceDetailModalProps {
  invoice: Invoice | null;
  onClose: () => void;
  onMarkPaid: (
    invoiceId: string,
    paymentMethod: Invoice["paymentMethod"]
  ) => Promise<boolean>;
}

export const InvoiceDetailModal = ({
  invoice,
  onClose,
  onMarkPaid,
}: InvoiceDetailModalProps) => {
  if (!invoice) return null;

  const pdfRef = useRef<HTMLDivElement | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [paidMethodOverride, setPaidMethodOverride] =
    useState<Invoice["paymentMethod"]>();
  const [paymentMethod, setPaymentMethod] =
    useState<NonNullable<Invoice["paymentMethod"]>>("cash");

  const displayInvoice =
    paidMethodOverride && invoice.status === "pending"
      ? { ...invoice, status: "paid" as const, paymentMethod: paidMethodOverride }
      : invoice;

  useEffect(() => {
    setPaymentMethod(invoice.paymentMethod || "cash");
    setPaidMethodOverride(undefined);
  }, [invoice.id, invoice.paymentMethod]);

  const handlePrint = () => {
    window.print();
  };

  const waitForRender = () =>
    new Promise<void>((resolve) => {
      requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
    });

  const createPdfBlob = async () => {
    if (!pdfRef.current) return null;
    return html2pdf()
      .set({
        filename: `${invoice.id || "invoice"}.pdf`,
        margin: [10, 10, 10, 10],
        html2canvas: { scale: 2 },
        jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
      })
      .from(pdfRef.current)
      .toPdf()
      .outputPdf("blob");
  };

  const shareInvoicePdf = async () => {
    setIsSharing(true);
    try {
      await waitForRender();
      const blob = await createPdfBlob();
      if (!blob) return false;

      const file = new File([blob], `${invoice.id || "invoice"}.pdf`, {
        type: "application/pdf",
      });
      const shareData = {
        title: `Invoice ${invoice.id}`,
        text: `Hari Electronics invoice ${invoice.id} for ${
          invoice.customerName
        }. Total: Rs ${invoice.total.toFixed(2)}.`,
        files: [file],
      };

      if (navigator.canShare?.(shareData)) {
        await navigator.share(shareData);
        return true;
      }

      await html2pdf()
        .set({
          filename: `${invoice.id || "invoice"}.pdf`,
          margin: [10, 10, 10, 10],
          html2canvas: { scale: 2 },
          jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
        })
        .from(pdfRef.current)
        .save();
      return false;
    } finally {
      setIsSharing(false);
    }
  };

  const handleMarkPaidAndShare = async () => {
    setPaidMethodOverride(paymentMethod);
    const markedPaid = await onMarkPaid(invoice.id, paymentMethod);
    if (!markedPaid) {
      setPaidMethodOverride(undefined);
      return;
    }
    await shareInvoicePdf();
  };

  const handleDownloadPdf = async () => {
    if (!pdfRef.current) return;
    const filename = `${invoice.id || "invoice"}.pdf`;
    setIsDownloading(true);
    try {
      await waitForRender();
      await html2pdf()
        .set({
          filename,
          margin: [10, 10, 10, 10],
          html2canvas: { scale: 2 },
          jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
        })
        .from(pdfRef.current)
        .save();
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-950/60 p-3 backdrop-blur-sm sm:p-4 print:fixed print:inset-0">
      <div
        ref={pdfRef}
        className="print-invoice w-full max-w-2xl overflow-y-auto rounded-lg bg-white shadow-2xl max-h-[90vh]"
      >
        <div
          className={`sticky top-0 z-30 flex items-center justify-between border-b border-gray-200 bg-white/95 p-4 backdrop-blur print:hidden ${
            isDownloading || isSharing ? "hidden" : ""
          }`}
        >
          <h3 className="text-lg font-bold text-gray-950">Invoice Details</h3>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        <div className="relative space-y-6 p-4 print:space-y-4 sm:p-6">
          {/* Header */}
          <div
            className="pointer-events-none absolute z-20 w-[82%] opacity-[.18]"
            style={{
              top: "34%",
              left: "50%",
              transform: "translate(-50%, -50%)",
            }}
          >
            <img src={HELogoBlack} alt="Hari Electronics" className="" />
          </div>
          <div className="relative z-10 text-center print:text-left">
            <h1 className="mb-2 text-2xl font-bold text-gray-950">
              Hari Electronics
            </h1>
            <p className="text-gray-500">Professional Mobile Device Services</p>
          </div>

          {/* Invoice Info */}
          <div className="relative z-10 grid grid-cols-1 gap-4 rounded-lg border border-gray-200 bg-gray-50 p-4 sm:grid-cols-2">
            <div>
              <p className="text-xs font-semibold uppercase text-gray-500">Invoice #</p>
              <p className="font-semibold text-gray-950">{displayInvoice.id}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase text-gray-500">Date</p>
              <p className="font-semibold text-gray-950">
                {formatDateTime(displayInvoice.createdAt || displayInvoice.date)}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase text-gray-500">Type</p>
              <p className="font-semibold capitalize text-gray-950">{displayInvoice.type}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase text-gray-500">Status</p>
              <p className="font-semibold capitalize text-gray-950">{displayInvoice.status}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase text-gray-500">Payment Method</p>
              <p className="font-semibold capitalize text-gray-950">
                {displayInvoice.paymentMethod || "Not recorded"}
              </p>
            </div>
          </div>

          {/* Customer Info */}
          <div className="relative z-10 space-y-2">
            <h3 className="flex items-center gap-2 font-semibold text-gray-950">
              <User className="w-4 h-4 print:hidden" />
              Customer Information
            </h3>
            <div className="grid grid-cols-1 gap-4 rounded-lg border border-gray-200 bg-gray-50 p-4 print:grid-cols-2 print:gap-4 md:grid-cols-2">
              <div>
                <p className="text-xs font-semibold uppercase text-gray-500">Name</p>
                <p className="font-medium text-gray-950">{invoice.customerName}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase text-gray-500">Phone</p>
                <p className="font-medium text-gray-950">{invoice.phoneNumber}</p>
              </div>
            </div>
          </div>

          {/* Items */}
          <div className="relative z-10 space-y-2">
            <h3 className="flex items-center gap-2 font-semibold text-gray-950">
              <FileText className="w-4 h-4" />
              Items & Services
            </h3>
            <div className="overflow-hidden rounded-lg border border-gray-200">
              <div className="w-full overflow-x-auto">
                <table className="w-full min-w-[560px]">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="p-3 text-left text-xs font-semibold uppercase text-gray-500">
                        Description
                      </th>
                      <th className="p-3 text-center text-xs font-semibold uppercase text-gray-500">
                        Type
                      </th>
                      <th className="p-3 text-center text-xs font-semibold uppercase text-gray-500">
                        Qty
                      </th>
                      <th className="p-3 text-right text-xs font-semibold uppercase text-gray-500">
                        Price
                      </th>
                      <th className="p-3 text-right text-xs font-semibold uppercase text-gray-500">
                        Total
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoice.items.map((item, index) => {
                      const itemTotal = item.quantity * item.price;
                      return (
                        <tr key={index} className="border-t">
                          <td className="p-3">{item.description}</td>
                          <td className="p-3 text-center capitalize">
                            {item.productType}
                          </td>
                          <td className="p-3 text-center">{item.quantity}</td>
                          <td className="p-3 text-right">
                            ₹{item.price.toFixed(2)}
                          </td>
                          <td className="p-3 text-right font-semibold text-gray-950">
                            ₹{itemTotal.toFixed(2)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Totals */}
          <div className="relative z-10 ml-auto max-w-md space-y-2 rounded-lg border border-gray-200 bg-gray-50 p-4">
            <div className="flex justify-between text-sm text-gray-600">
              <span>Subtotal</span>
              <span className="font-medium text-gray-900">
                ₹{invoice.subtotal.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between text-sm text-gray-600">
              <span>Tax (3.5%)</span>
              <span className="font-medium text-gray-900">
                ₹{invoice.taxTotal.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between border-t border-gray-200 pt-3 text-xl font-bold text-gray-950">
              <span>Total Amount</span>
              <span className="text-emerald-700">
                ₹{invoice.total.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div
            className={`border-t border-gray-200 pt-4 print:hidden ${
              isDownloading || isSharing ? "hidden" : ""
            } relative z-10`}
          >
            {invoice.status === "pending" && (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-[minmax(150px,1fr)_auto] sm:items-center">
                <Select
                  value={paymentMethod}
                  onValueChange={(value) =>
                    setPaymentMethod(value as NonNullable<Invoice["paymentMethod"]>)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Payment method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="gpay">GPay</SelectItem>
                    <SelectItem value="card">Card</SelectItem>
                    <SelectItem value="bank transfer">Bank Transfer</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  onClick={handleMarkPaidAndShare}
                  className="w-full sm:w-28"
                  disabled={isSharing}
                >
                  {isSharing ? "Sharing..." : "Mark Paid"}
                </Button>
              </div>
            )}
            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-4">
              <Button
                variant="outline"
                onClick={shareInvoicePdf}
                className="w-full"
                disabled={invoice.status === "pending" || isSharing}
              >
                <Share2 className="w-4 h-4 mr-2" />
                Share PDF
              </Button>
              <Button
                disabled={invoice.status === "pending" || isDownloading}
                onClick={handlePrint}
                className="w-full"
              >
                <Printer className="w-4 h-4 mr-2" />
                Print Invoice
              </Button>
              <Button
                variant="outline"
                onClick={handleDownloadPdf}
                className="w-full"
                disabled={isDownloading}
              >
                <Download className="w-4 h-4 mr-2" />
                Download PDF
              </Button>
              <Button variant="outline" onClick={onClose} className="w-full">
                Close
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
