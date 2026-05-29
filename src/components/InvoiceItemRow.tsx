import { InvoiceItem } from "../types/invoice";
import { Minus, Plus, X } from "lucide-react";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
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

  const itemTotal = item.quantity * item.price;
  const taxAmount = item.taxable ? itemTotal * 0.035 : 0;

  return (
    <div className="space-y-3 p-4 bg-gray-50 rounded-lg">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
        <div className="flex-1 space-y-3">
          <div className="flex flex-col gap-2 sm:flex-row">
            <Select
              value={item.category}
              onValueChange={(value) =>
                updateItem({
                  category: value as "sale" | "service",
                  productType: "",
                })
              }
            >
              <SelectTrigger className="w-full sm:w-[180px]">
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
              <SelectTrigger className="w-full sm:w-[200px]">
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
              placeholder="Description (e.g., iPhone Screen Replacement)"
              value={item.description}
              onChange={(e) => updateItem({ description: e.target.value })}
              className="font-medium"
            />
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            {/* <select
              value={item.type}
              onChange={(e) => updateItem({ type: e.target.value as 'product' | 'service' })}
              className="px-3 py-2 border rounded-md text-sm bg-white"
            >
              <option value="product">Product</option>
              <option value="service">Service</option>
            </select> */}

            <div className="flex items-center gap-2 flex-1">
              <label className="text-sm text-gray-600">Qty:</label>
              <div className="flex items-center gap-1">
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
                  className="w-20 h-8 text-center"
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

            <div className="flex items-center gap-2 flex-1">
              <label className="text-sm text-gray-600">Price:</label>
              <Input
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={item.price || ""}
                onChange={(e) =>
                  updateItem({ price: parseFloat(e.target.value) || 0 })
                }
                className="w-full sm:w-28 h-8"
              />
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={item.taxable}
                onChange={(e) => updateItem({ taxable: e.target.checked })}
                className="w-4 h-4 text-green-600 rounded focus:ring-green-500"
              />
              <span className="text-sm text-gray-700">Apply 3.5% tax</span>
            </label>

            <div className="text-right">
              <div className="text-sm text-gray-600">Item Total:</div>
              <div className="font-semibold text-lg">
                ₹{itemTotal.toFixed(2)}
              </div>
              {item.taxable && (
                <div className="text-sm text-green-600">
                  + Tax: ₹{taxAmount.toFixed(2)}
                </div>
              )}
            </div>
          </div>
        </div>

        {canRemove && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onRemove}
            className="text-red-500 hover:text-red-700 hover:bg-red-50"
          >
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>
    </div>
  );
};
