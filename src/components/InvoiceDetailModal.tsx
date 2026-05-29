import { useEffect, useRef, useState } from "react";
import { Invoice } from "../types/invoice";
import { Button } from "./ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Download, Printer, Share2, User, X } from "lucide-react";
import { formatDateTime } from "../utils/date";
import { createPdfBlob, savePdf } from "../utils/pdf";
import { useInvoicePrint } from "../hooks/useInvoicePrint";
import {
  InfoBlock,
  InvoiceItemsTable,
  InvoiceTotals,
} from "./invoice/InvoiceBlocks";
import { PrintableInvoice } from "./invoice/PrintableInvoice";
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
  const { isPrintMode, printInvoice } = useInvoicePrint();

  const displayInvoice =
    paidMethodOverride && invoice.status === "pending"
      ? { ...invoice, status: "paid" as const, paymentMethod: paidMethodOverride }
      : invoice;

  const filename = `${invoice.id || "invoice"}.pdf`;

  useEffect(() => {
    setPaymentMethod(invoice.paymentMethod || "cash");
    setPaidMethodOverride(undefined);
  }, [invoice.id, invoice.paymentMethod]);

  const shareInvoicePdf = async () => {
    if (!pdfRef.current) return false;

    setIsSharing(true);
    try {
      const blob = await createPdfBlob(pdfRef.current, filename);
      const file = new File([blob], filename, { type: "application/pdf" });
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

      await savePdf(pdfRef.current, filename);
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

    setIsDownloading(true);
    try {
      await savePdf(pdfRef.current, filename);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-950/60 p-3 backdrop-blur-sm print:hidden sm:p-4">
        <div
          ref={pdfRef}
          className="print-invoice w-full max-w-2xl overflow-y-auto rounded-lg bg-white shadow-2xl max-h-[90vh]"
        >
          <ModalHeader
            isBusy={isDownloading || isSharing}
            onClose={onClose}
          />

          <div className="relative space-y-6 p-4 sm:p-6">
            <InvoiceWatermark />
            <InvoiceBrandHeader />
            <InvoiceMetaGrid displayInvoice={displayInvoice} />
            <CustomerInfo invoice={invoice} />
            <InvoiceItemsTable invoice={invoice} />
            <InvoiceTotals invoice={invoice} />
            <InvoiceActions
              invoice={invoice}
              paymentMethod={paymentMethod}
              isDownloading={isDownloading}
              isSharing={isSharing}
              onPaymentMethodChange={setPaymentMethod}
              onMarkPaidAndShare={handleMarkPaidAndShare}
              onPrint={printInvoice}
              onDownload={handleDownloadPdf}
              onShare={shareInvoicePdf}
              onClose={onClose}
            />
          </div>
        </div>
      </div>

      <PrintableInvoice
        invoice={invoice}
        displayInvoice={displayInvoice}
        screenVisible={isPrintMode}
      />
    </>
  );
};

const ModalHeader = ({
  isBusy,
  onClose,
}: {
  isBusy: boolean;
  onClose: () => void;
}) => (
  <div
    className={`sticky top-0 z-30 flex items-center justify-between border-b border-gray-200 bg-white/95 p-4 backdrop-blur print:hidden ${
      isBusy ? "hidden" : ""
    }`}
  >
    <h3 className="text-lg font-bold text-gray-950">Invoice Details</h3>
    <Button variant="ghost" size="sm" onClick={onClose}>
      <X className="w-5 h-5" />
    </Button>
  </div>
);

const InvoiceWatermark = () => (
  <div
    className="pointer-events-none absolute z-20 w-[82%] opacity-[.18]"
    style={{
      top: "34%",
      left: "50%",
      transform: "translate(-50%, -50%)",
    }}
  >
    <img src={HELogoBlack} alt="Hari Electronics" />
  </div>
);

const InvoiceBrandHeader = () => (
  <div className="relative z-10 text-center">
    <h1 className="mb-2 text-2xl font-bold text-gray-950">Hari Electronics</h1>
    <p className="text-gray-500">Professional Mobile Device Services</p>
  </div>
);

const InvoiceMetaGrid = ({ displayInvoice }: { displayInvoice: Invoice }) => (
  <div className="relative z-10 grid grid-cols-1 gap-4 rounded-lg border border-gray-200 bg-gray-50 p-4 sm:grid-cols-2">
    <InfoBlock label="Invoice #" value={displayInvoice.id} />
    <InfoBlock
      label="Date"
      value={formatDateTime(displayInvoice.createdAt || displayInvoice.date)}
    />
    <InfoBlock label="Type" value={displayInvoice.type} capitalize />
    <InfoBlock label="Status" value={displayInvoice.status} capitalize />
    <InfoBlock
      label="Payment Method"
      value={displayInvoice.paymentMethod || "Not recorded"}
      capitalize
    />
  </div>
);

const CustomerInfo = ({ invoice }: { invoice: Invoice }) => (
  <div className="relative z-10 space-y-2">
    <h3 className="flex items-center gap-2 font-semibold text-gray-950">
      <User className="w-4 h-4" />
      Customer Information
    </h3>
    <div className="grid grid-cols-1 gap-4 rounded-lg border border-gray-200 bg-gray-50 p-4 md:grid-cols-2">
      <InfoBlock label="Name" value={invoice.customerName} />
      <InfoBlock label="Phone" value={invoice.phoneNumber} />
    </div>
  </div>
);

const InvoiceActions = ({
  invoice,
  paymentMethod,
  isDownloading,
  isSharing,
  onPaymentMethodChange,
  onMarkPaidAndShare,
  onPrint,
  onDownload,
  onShare,
  onClose,
}: {
  invoice: Invoice;
  paymentMethod: NonNullable<Invoice["paymentMethod"]>;
  isDownloading: boolean;
  isSharing: boolean;
  onPaymentMethodChange: (value: NonNullable<Invoice["paymentMethod"]>) => void;
  onMarkPaidAndShare: () => void;
  onPrint: () => void;
  onDownload: () => void;
  onShare: () => void;
  onClose: () => void;
}) => (
  <div
    className={`relative z-10 border-t border-gray-200 pt-4 ${
      isDownloading || isSharing ? "hidden" : ""
    }`}
  >
    {invoice.status === "pending" && (
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-[minmax(150px,1fr)_auto] sm:items-center">
        <Select
          value={paymentMethod}
          onValueChange={(value) =>
            onPaymentMethodChange(value as NonNullable<Invoice["paymentMethod"]>)
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
          onClick={onMarkPaidAndShare}
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
        onClick={onShare}
        className="w-full"
        disabled={invoice.status === "pending" || isSharing}
      >
        <Share2 className="w-4 h-4 mr-2" />
        Share PDF
      </Button>
      <Button
        disabled={invoice.status === "pending" || isDownloading}
        onClick={onPrint}
        className="w-full"
      >
        <Printer className="w-4 h-4 mr-2" />
        Print Invoice
      </Button>
      <Button
        variant="outline"
        onClick={onDownload}
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
);
