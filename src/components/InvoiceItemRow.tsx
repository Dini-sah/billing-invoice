import { InvoiceItem } from "../types/invoice";
import { Minus, Plus, X } from "lucide-react";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { formatCurrency, getLineSubtotal, getLineTax } from "../utils/invoiceMath";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";

interface InvoiceItemRowProps {
  item: InvoiceItem;
  productTypeOptions: Record<"sale" | "service", string[]>;
  onChange: (item: InvoiceItem) => void;
  onRemove: () => void;
  canRemove: boolean;
}

export const InvoiceItemRow = ({
  item,
  productTypeOptions,
  onChange,
  onRemove,
  canRemove,
}: InvoiceItemRowProps) => {
  const updateItem = (updates: Partial<InvoiceItem>) => {
    onChange({ ...item, ...updates });
  };

  const itemTotal = getLineSubtotal(item);
  const taxAmount = getLineTax(item);

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-3 shadow-sm shadow-gray-950/[0.02] sm:p-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start">
        <div className="flex-1 space-y-3">
          <div className="grid grid-cols-1 gap-2 lg:grid-cols-[150px_190px_1fr]">
            <Select
              value={item.category}
              onValueChange={(value) =>
                updateItem({
                  category: value as "sale" | "service",
                  productType: "",
                })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sale">Sale</SelectItem>
                <SelectItem value="service">Service</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={item.productType}
              onValueChange={(value) => updateItem({ productType: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Product type" />
              </SelectTrigger>
              <SelectContent>
                {productTypeOptions[item.category].map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              placeholder="Description (e.g., iPhone screen replacement)"
              value={item.description}
              onChange={(e) => updateItem({ description: e.target.value })}
              className="font-medium"
            />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-center">
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase text-gray-500">
                Quantity
              </label>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    updateItem({ quantity: Math.max(1, item.quantity - 1) })
                  }
                  className="h-8 w-8 p-0"
                >
                  <Minus className="w-3 h-3" />
                </Button>
                <Input
                  type="number"
                  min="1"
                  value={item.quantity}
                  onChange={(e) =>
                    updateItem({ quantity: parseInt(e.target.value) || 1 })
                  }
                  className="h-8 w-20 text-center"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => updateItem({ quantity: item.quantity + 1 })}
                  className="h-8 w-8 p-0"
                >
                  <Plus className="w-3 h-3" />
                </Button>
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold uppercase text-gray-500">
                Price
              </label>
              <Input
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={item.price || ""}
                onChange={(e) =>
                  updateItem({ price: parseFloat(e.target.value) || 0 })
                }
                className="h-8"
              />
            </div>

            <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-right">
              <div className="text-xs font-semibold uppercase text-gray-500">
                Line Total
              </div>
              <div className="text-lg font-bold text-gray-950">
                {formatCurrency(itemTotal)}
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={item.taxable}
                onChange={(e) => updateItem({ taxable: e.target.checked })}
                className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
              />
              Apply 3.5% tax
            </label>
            {item.taxable && (
              <div className="text-sm font-medium text-emerald-700">
                Tax: {formatCurrency(taxAmount)}
              </div>
            )}
          </div>
        </div>

        {canRemove && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onRemove}
            className="self-end text-red-500 hover:bg-red-50 hover:text-red-700 lg:self-start"
          >
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>
    </div>
  );
};
