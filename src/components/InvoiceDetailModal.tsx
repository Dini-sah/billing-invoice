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
    const printWindow = window.open("", "_blank", "width=900,height=1200");
    if (!printWindow) {
      window.print();
      return;
    }

    const escapeHtml = (value: unknown) =>
      String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

    const itemsRows = invoice.items
      .map((item) => {
        const itemTotal = item.quantity * item.price;
        return `
          <tr>
            <td>${escapeHtml(item.description)}</td>
            <td>${escapeHtml(item.productType)}</td>
            <td class="center">${escapeHtml(item.quantity)}</td>
            <td class="right">₹${item.price.toFixed(2)}</td>
            <td class="right strong">₹${itemTotal.toFixed(2)}</td>
          </tr>
        `;
      })
      .join("");

    printWindow.document.write(`
      <!doctype html>
      <html>
        <head>
          <title>${invoice.id}</title>
          <style>
            @page {
              size: A4;
              margin: 12mm;
            }
            * {
              box-sizing: border-box;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            html,
            body {
              margin: 0;
              padding: 0;
              background: #fff;
              color: #111827;
              font-family: Arial, sans-serif;
            }
            body {
              width: 186mm;
              margin: 0 auto;
              font-size: 12px;
            }
            img {
              max-width: 100%;
            }
            .invoice {
              position: relative;
              min-height: 260mm;
              padding: 0;
            }
            .watermark {
              position: absolute;
              top: 92mm;
              left: 50%;
              width: 130mm;
              transform: translateX(-50%);
              opacity: 0.11;
              z-index: 0;
            }
            .content {
              position: relative;
              z-index: 1;
            }
            .top {
              display: flex;
              justify-content: space-between;
              gap: 16px;
              border-bottom: 2px solid #111827;
              padding-bottom: 14px;
              margin-bottom: 18px;
            }
            h1 {
              margin: 0 0 6px;
              font-size: 26px;
              line-height: 1.1;
            }
            h2 {
              margin: 0 0 10px;
              font-size: 14px;
            }
            .muted {
              color: #4b5563;
            }
            .invoice-id {
              text-align: right;
              line-height: 1.7;
            }
            .grid {
              display: grid;
              grid-template-columns: repeat(2, minmax(0, 1fr));
              gap: 10px;
              margin-bottom: 18px;
            }
            .box {
              border: 1px solid #d1d5db;
              border-radius: 6px;
              padding: 10px;
              background: rgba(249, 250, 251, 0.92);
            }
            .label {
              margin-bottom: 4px;
              color: #6b7280;
              font-size: 10px;
              font-weight: 700;
              text-transform: uppercase;
            }
            .value {
              font-weight: 700;
              word-break: break-word;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              table-layout: fixed;
              margin-top: 8px;
              border: 1px solid #d1d5db;
            }
            th,
            td {
              border-bottom: 1px solid #e5e7eb;
              padding: 8px;
              word-break: break-word;
            }
            th {
              background: #f3f4f6;
              color: #374151;
              font-size: 10px;
              text-align: left;
              text-transform: uppercase;
            }
            .center {
              text-align: center;
            }
            .right {
              text-align: right;
            }
            .strong {
              font-weight: 700;
            }
            .totals {
              width: 72mm;
              margin-left: auto;
              margin-top: 18px;
              border: 1px solid #d1d5db;
              border-radius: 6px;
              padding: 10px;
              background: rgba(249, 250, 251, 0.94);
            }
            .total-row {
              display: flex;
              justify-content: space-between;
              padding: 5px 0;
            }
            .grand {
              margin-top: 6px;
              border-top: 1px solid #d1d5db;
              padding-top: 9px;
              font-size: 16px;
              font-weight: 800;
            }
            @media print {
              body {
                width: auto;
              }
            }
          </style>
        </head>
        <body>
          <main class="invoice">
            <img class="watermark" src="${HELogoBlack}" alt="" />
            <section class="content">
              <div class="top">
                <div>
                  <h1>Hari Electronics</h1>
                  <div class="muted">Professional Mobile Device Services</div>
                </div>
                <div class="invoice-id">
                  <div><strong>Invoice:</strong> ${escapeHtml(displayInvoice.id)}</div>
                  <div><strong>Date:</strong> ${escapeHtml(
                    formatDateTime(displayInvoice.createdAt || displayInvoice.date)
                  )}</div>
                </div>
              </div>

              <div class="grid">
                <div class="box">
                  <div class="label">Customer</div>
                  <div class="value">${escapeHtml(invoice.customerName)}</div>
                </div>
                <div class="box">
                  <div class="label">Phone</div>
                  <div class="value">${escapeHtml(invoice.phoneNumber)}</div>
                </div>
                <div class="box">
                  <div class="label">Type</div>
                  <div class="value">${escapeHtml(displayInvoice.type)}</div>
                </div>
                <div class="box">
                  <div class="label">Status</div>
                  <div class="value">${escapeHtml(displayInvoice.status)}</div>
                </div>
                <div class="box">
                  <div class="label">Payment Method</div>
                  <div class="value">${escapeHtml(
                    displayInvoice.paymentMethod || "Not recorded"
                  )}</div>
                </div>
              </div>

              <h2>Items & Services</h2>
              <table>
                <thead>
                  <tr>
                    <th style="width: 42%">Description</th>
                    <th style="width: 20%">Type</th>
                    <th style="width: 10%" class="center">Qty</th>
                    <th style="width: 14%" class="right">Price</th>
                    <th style="width: 14%" class="right">Total</th>
                  </tr>
                </thead>
                <tbody>${itemsRows}</tbody>
              </table>

              <div class="totals">
                <div class="total-row">
                  <span>Subtotal</span>
                  <strong>₹${invoice.subtotal.toFixed(2)}</strong>
                </div>
                <div class="total-row">
                  <span>Tax (3.5%)</span>
                  <strong>₹${invoice.taxTotal.toFixed(2)}</strong>
                </div>
                <div class="total-row grand">
                  <span>Total</span>
                  <span>₹${invoice.total.toFixed(2)}</span>
                </div>
              </div>
            </section>
          </main>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  const waitForRender = () =>
    new Promise<void>((resolve) => {
      requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
    });

  const createPdfSourceElement = () => {
    if (!pdfRef.current) return null;

    const pdfWidth = 720;
    const wrapper = document.createElement("div");
    wrapper.style.position = "absolute";
    wrapper.style.left = "0";
    wrapper.style.top = "0";
    wrapper.style.width = `${pdfWidth}px`;
    wrapper.style.background = "#ffffff";
    wrapper.style.opacity = "0.01";
    wrapper.style.pointerEvents = "none";
    wrapper.style.zIndex = "-9999";

    const clone = pdfRef.current.cloneNode(true) as HTMLElement;
    clone.style.width = `${pdfWidth}px`;
    clone.style.maxWidth = `${pdfWidth}px`;
    clone.style.maxHeight = "none";
    clone.style.overflow = "visible";
    clone.style.boxShadow = "none";
    clone.style.borderRadius = "0";

    clone.querySelectorAll<HTMLElement>(".overflow-x-auto").forEach((node) => {
      node.style.overflow = "visible";
    });
    clone.querySelectorAll<HTMLElement>("table").forEach((table) => {
      table.style.width = "100%";
      table.style.minWidth = "0";
      table.style.tableLayout = "fixed";
    });

    wrapper.appendChild(clone);
    document.body.appendChild(wrapper);

    return {
      element: clone,
      cleanup: () => wrapper.remove(),
    };
  };

  const pdfOptions = (filename: string) => ({
    filename,
    margin: [8, 8, 8, 8],
    html2canvas: {
      scale: 2,
      useCORS: true,
      width: 720,
      windowWidth: 720,
      scrollX: 0,
      scrollY: 0,
    },
    jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
    pagebreak: { mode: ["avoid-all", "css", "legacy"] },
  });

  const createPdfBlob = async () => {
    const source = createPdfSourceElement();
    if (!source) return null;
    try {
      return await html2pdf()
        .set(pdfOptions(`${invoice.id || "invoice"}.pdf`))
        .from(source.element)
        .toPdf()
        .outputPdf("blob");
    } finally {
      source.cleanup();
    }
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

      const source = createPdfSourceElement();
      if (!source) return false;
      try {
        await html2pdf()
          .set(pdfOptions(`${invoice.id || "invoice"}.pdf`))
          .from(source.element)
          .save();
      } finally {
        source.cleanup();
      }
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
      const source = createPdfSourceElement();
      if (!source) return;
      try {
        await html2pdf().set(pdfOptions(filename)).from(source.element).save();
      } finally {
        source.cleanup();
      }
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
