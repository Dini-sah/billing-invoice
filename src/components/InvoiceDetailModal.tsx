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
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-3 sm:p-4 print:fixed print:inset-0">
      <div
        ref={pdfRef}
        className="print-invoice bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
      >
        <div
          className={`sticky top-0 z-20 bg-white border-b p-4 flex items-center justify-between print:hidden ${
            isDownloading || isSharing ? "hidden" : ""
          }`}
        >
          <h3 className="text-xl font-bold text-gray-900">Invoice Details</h3>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        <div className="p-4 sm:p-6 space-y-6 print:space-y-4 relative">
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
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Hari Electronics
            </h1>
            <p className="text-gray-600">Professional Mobile Device Services</p>
          </div>

          {/* Invoice Info */}
          <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
            <div>
              <p className="text-sm text-gray-600">Invoice #</p>
              <p className="font-semibold">{displayInvoice.id}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Date</p>
              <p className="font-semibold">
                {formatDateTime(displayInvoice.createdAt || displayInvoice.date)}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Type</p>
              <p className="font-semibold capitalize">{displayInvoice.type}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Status</p>
              <p className="font-semibold capitalize">{displayInvoice.status}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Payment Method</p>
              <p className="font-semibold capitalize">
                {displayInvoice.paymentMethod || "Not recorded"}
              </p>
            </div>
          </div>

          {/* Customer Info */}
          <div className="relative z-10 space-y-2">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <User className="w-4 h-4 print:hidden" />
              Customer Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 print:grid-cols-2 print:gap-4 p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="text-sm text-gray-600">Name</p>
                <p className="font-medium">{invoice.customerName}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Phone</p>
                <p className="font-medium">{invoice.phoneNumber}</p>
              </div>
            </div>
          </div>

          {/* Items */}
          <div className="relative z-10 space-y-2">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Items & Services
            </h3>
            <div className="border rounded-lg overflow-hidden">
              <div className="w-full overflow-x-auto">
                <table className="w-full min-w-[560px]">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left p-3 text-sm font-medium text-gray-700">
                        Description
                      </th>
                      <th className="text-center p-3 text-sm font-medium text-gray-700">
                        Type
                      </th>
                      <th className="text-center p-3 text-sm font-medium text-gray-700">
                        Qty
                      </th>
                      <th className="text-right p-3 text-sm font-medium text-gray-700">
                        Price
                      </th>
                      <th className="text-right p-3 text-sm font-medium text-gray-700">
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
                          <td className="p-3 text-right font-medium">
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
          <div className="relative z-10 border-t pt-4 space-y-2">
            <div className="flex justify-between text-gray-600">
              <span>Subtotal:</span>
              <span className="font-medium">
                ₹{invoice.subtotal.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Tax (3.5%):</span>
              <span className="font-medium">
                ₹{invoice.taxTotal.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between text-xl font-bold text-gray-900 pt-2 border-t">
              <span>Total Amount:</span>
              <span className="text-green-600">
                ₹{invoice.total.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div
            className={`border-t pt-4 print:hidden ${
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
