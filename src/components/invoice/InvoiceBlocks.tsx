import { FileText } from "lucide-react";
import { Invoice } from "../../types/invoice";

export const InfoBlock = ({
  label,
  value,
  capitalize = false,
}: {
  label: string;
  value: string | number;
  capitalize?: boolean;
}) => (
  <div>
    <p className="text-xs font-semibold uppercase text-gray-500">{label}</p>
    <p className={`font-semibold text-gray-950 ${capitalize ? "capitalize" : ""}`}>
      {value}
    </p>
  </div>
);

export const InvoiceItemsTable = ({ invoice }: { invoice: Invoice }) => (
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
              <TableHead>Description</TableHead>
              <TableHead align="center">Type</TableHead>
              <TableHead align="center">Qty</TableHead>
              <TableHead align="right">Price</TableHead>
              <TableHead align="right">Total</TableHead>
            </tr>
          </thead>
          <tbody>
            {invoice.items.map((item, index) => {
              const itemTotal = item.quantity * item.price;
              return (
                <tr key={index} className="border-t">
                  <td className="p-3">{item.description}</td>
                  <td className="p-3 text-center capitalize">{item.productType}</td>
                  <td className="p-3 text-center">{item.quantity}</td>
                  <td className="p-3 text-right">₹{item.price.toFixed(2)}</td>
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
);

const TableHead = ({
  children,
  align = "left",
}: {
  children: string;
  align?: "left" | "center" | "right";
}) => (
  <th
    className={`p-3 text-${align} text-xs font-semibold uppercase text-gray-500`}
  >
    {children}
  </th>
);

export const InvoiceTotals = ({ invoice }: { invoice: Invoice }) => (
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
      <span className="text-emerald-700">₹{invoice.total.toFixed(2)}</span>
    </div>
  </div>
);

