import { Invoice } from "../../types/invoice";
import { formatDateTime } from "../../utils/date";
import { formatCurrency, getLineSubtotal } from "../../utils/invoiceMath";
import HELogoBlack from "../../assets/images/HElogoBlack.webp";

export const PrintableInvoice = ({
  invoice,
  displayInvoice,
  screenVisible = false,
}: {
  invoice: Invoice;
  displayInvoice: Invoice;
  screenVisible?: boolean;
}) => (
  <div className={screenVisible ? "invoice-print-screen" : "invoice-print-only"}>
    <style>{`
      @page { size: A4; margin: 12mm; }
      @media print {
        body { background: #fff !important; }
        .invoice-print-page {
          color: #111827;
          font-family: Arial, sans-serif;
          font-size: 12px;
          position: relative;
          width: 100%;
        }
        .invoice-print-watermark {
          position: absolute;
          top: 92mm;
          left: 50%;
          width: 130mm;
          transform: translateX(-50%);
          opacity: 0.11;
          z-index: 0;
        }
        .invoice-print-content { position: relative; z-index: 1; }
        .invoice-print-top {
          align-items: flex-start;
          border-bottom: 2px solid #111827;
          display: flex;
          justify-content: space-between;
          gap: 16px;
          margin-bottom: 18px;
          padding-bottom: 14px;
        }
        .invoice-print-title { font-size: 26px; font-weight: 800; margin: 0 0 6px; }
        .invoice-print-muted { color: #4b5563; }
        .invoice-print-id { line-height: 1.7; text-align: right; }
        .invoice-print-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 10px;
          margin-bottom: 18px;
        }
        .invoice-print-box {
          background: rgba(249, 250, 251, 0.92);
          border: 1px solid #d1d5db;
          border-radius: 6px;
          padding: 10px;
        }
        .invoice-print-label {
          color: #6b7280;
          font-size: 10px;
          font-weight: 700;
          margin-bottom: 4px;
          text-transform: uppercase;
        }
        .invoice-print-value { font-weight: 700; word-break: break-word; }
        .invoice-print-section { font-size: 14px; font-weight: 800; margin: 0 0 10px; }
        .invoice-print-table {
          border: 1px solid #d1d5db;
          border-collapse: collapse;
          table-layout: fixed;
          width: 100%;
        }
        .invoice-print-table th,
        .invoice-print-table td {
          border-bottom: 1px solid #e5e7eb;
          padding: 8px;
          word-break: break-word;
        }
        .invoice-print-table th {
          background: #f3f4f6;
          color: #374151;
          font-size: 10px;
          text-align: left;
          text-transform: uppercase;
        }
        .invoice-print-center { text-align: center !important; }
        .invoice-print-right { text-align: right !important; }
        .invoice-print-totals {
          background: rgba(249, 250, 251, 0.94);
          border: 1px solid #d1d5db;
          border-radius: 6px;
          margin-left: auto;
          margin-top: 18px;
          padding: 10px;
          width: 72mm;
        }
        .invoice-print-row {
          display: flex;
          justify-content: space-between;
          padding: 5px 0;
        }
        .invoice-print-grand {
          border-top: 1px solid #d1d5db;
          font-size: 16px;
          font-weight: 800;
          margin-top: 6px;
          padding-top: 9px;
        }
      }
    `}</style>
    <main className="invoice-print-page">
      <img className="invoice-print-watermark" src={HELogoBlack} alt="" />
      <section className="invoice-print-content">
        <div className="invoice-print-top">
          <div>
            <h1 className="invoice-print-title">Hari Electronics</h1>
            <div className="invoice-print-muted">
              Professional Mobile Device Services
            </div>
          </div>
          <div className="invoice-print-id">
            <div>
              <strong>Invoice:</strong> {displayInvoice.id}
            </div>
            <div>
              <strong>Date:</strong>{" "}
              {formatDateTime(displayInvoice.createdAt || displayInvoice.date)}
            </div>
          </div>
        </div>

        <div className="invoice-print-grid">
          <PrintBox label="Customer" value={invoice.customerName} />
          <PrintBox label="Phone" value={invoice.phoneNumber} />
          <PrintBox label="Type" value={displayInvoice.type} />
          <PrintBox label="Status" value={displayInvoice.status} />
          <PrintBox
            label="Payment Method"
            value={displayInvoice.paymentMethod || "Not recorded"}
          />
        </div>

        <h2 className="invoice-print-section">Items & Services</h2>
        <table className="invoice-print-table">
          <thead>
            <tr>
              <th style={{ width: "42%" }}>Description</th>
              <th style={{ width: "20%" }}>Type</th>
              <th className="invoice-print-center" style={{ width: "10%" }}>
                Qty
              </th>
              <th className="invoice-print-right" style={{ width: "14%" }}>
                Price
              </th>
              <th className="invoice-print-right" style={{ width: "14%" }}>
                Total
              </th>
            </tr>
          </thead>
          <tbody>
            {invoice.items.map((item, index) => {
              const itemTotal = getLineSubtotal(item);
              return (
                <tr key={index}>
                  <td>{item.description}</td>
                  <td>{item.productType}</td>
                  <td className="invoice-print-center">{item.quantity}</td>
                  <td className="invoice-print-right">{formatCurrency(item.price)}</td>
                  <td className="invoice-print-right">
                    <strong>{formatCurrency(itemTotal)}</strong>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        <div className="invoice-print-totals">
          <div className="invoice-print-row">
            <span>Subtotal</span>
            <strong>{formatCurrency(invoice.subtotal)}</strong>
          </div>
          <div className="invoice-print-row">
            <span>Tax (3.5%)</span>
            <strong>{formatCurrency(invoice.taxTotal)}</strong>
          </div>
          <div className="invoice-print-row invoice-print-grand">
            <span>Total</span>
            <span>{formatCurrency(invoice.total)}</span>
          </div>
        </div>
      </section>
    </main>
  </div>
);

const PrintBox = ({ label, value }: { label: string; value: string }) => (
  <div className="invoice-print-box">
    <div className="invoice-print-label">{label}</div>
    <div className="invoice-print-value">{value}</div>
  </div>
);
