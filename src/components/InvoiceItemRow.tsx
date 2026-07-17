import { DefaultItem, InvoiceItem } from "../types/invoice";
import { Minus, Plus, Trash2, Sparkles } from "lucide-react";
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
import { cn } from "../utils/cn";

interface InvoiceItemRowProps {
  item: InvoiceItem;
  productTypeOptions: Record<"sale" | "service", string[]>;
  defaultItems: DefaultItem[];
  onChange: (item: InvoiceItem) => void;
  onRemove: () => void;
  canRemove: boolean;
  index: number;
}

export const InvoiceItemRow = ({
  item,
  productTypeOptions,
  defaultItems,
  onChange,
  onRemove,
  canRemove,
  index,
}: InvoiceItemRowProps) => {
  const updateItem = (updates: Partial<InvoiceItem>) => {
    onChange({ ...item, ...updates });
  };

  const matchingDefaults = defaultItems.filter(
    (defaultItem) => defaultItem.category === item.category
  );

  const applyDefaultItem = (defaultItemId: string) => {
    const defaultItem = defaultItems.find((entry) => entry.id === defaultItemId);
    if (!defaultItem) return;

    onChange({
      ...item,
      category: defaultItem.category,
      productType: defaultItem.productType,
      description: defaultItem.description,
      price: defaultItem.price,
      taxable: defaultItem.taxable,
    });
  };

  const itemTotal = getLineSubtotal(item);
  const taxAmount = getLineTax(item);
  const hasDescription = item.description.trim().length > 0;
  const hasPrice = item.price > 0;

  return (
    <div
      className={cn(
        "group relative rounded-xl border bg-white p-4 shadow-sm shadow-slate-900/[0.04] transition-all sm:p-5",
        "border-slate-200 hover:border-slate-300 hover:shadow-md hover:shadow-slate-900/[0.06]",
        item.taxable && "ring-1 ring-emerald-200/70"
      )}
    >
      {/* Item header */}
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span
            className={cn(
              "flex h-7 min-w-7 items-center justify-center rounded-md px-2 text-xs font-bold",
              item.category === "service"
                ? "bg-violet-100 text-violet-700"
                : "bg-sky-100 text-sky-700"
            )}
          >
            #{index + 1}
          </span>
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide",
              item.category === "service"
                ? "bg-violet-50 text-violet-700"
                : "bg-sky-50 text-sky-700"
            )}
          >
            {item.category}
          </span>
        </div>
        {canRemove && (
          <button
            type="button"
            onClick={onRemove}
            aria-label="Remove item"
            className="flex h-8 w-8 items-center justify-center rounded-md text-slate-400 transition hover:bg-rose-50 hover:text-rose-600"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Row 1: Category, Product type, Quick fill, Description */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-12">
        <div className="md:col-span-3">
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
            Category
          </label>
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
        </div>

        <div className="md:col-span-3">
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
            Product type
          </label>
          <Select
            value={item.productType}
            onValueChange={(value) => updateItem({ productType: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              {productTypeOptions[item.category].map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="md:col-span-3">
          <label className="mb-1.5 flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
            <Sparkles className="h-3 w-3" />
            Quick fill
          </label>
          <Select value="" onValueChange={applyDefaultItem}>
            <SelectTrigger>
              <SelectValue placeholder="Default item" />
            </SelectTrigger>
            <SelectContent>
              {matchingDefaults.length === 0 ? (
                <SelectItem value="no-defaults" disabled>
                  No defaults saved
                </SelectItem>
              ) : (
                matchingDefaults.map((defaultItem) => (
                  <SelectItem key={defaultItem.id} value={defaultItem.id}>
                    {defaultItem.description}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>

        <div className="md:col-span-3">
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
            Description
          </label>
          <Input
            placeholder="e.g., iPhone 13 screen replacement"
            value={item.description}
            onChange={(e) => updateItem({ description: e.target.value })}
            className="font-medium"
          />
        </div>
      </div>

      {/* Row 2: Quantity, Unit price, Tax toggle, Line total */}
      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-12 sm:items-end">
        <div className="sm:col-span-3">
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
            Quantity
          </label>
          <div className="flex items-center gap-1.5">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                updateItem({ quantity: Math.max(1, item.quantity - 1) })
              }
              className="h-11 w-11 shrink-0 p-0"
              aria-label="Decrease quantity"
            >
              <Minus className="h-4 w-4" />
            </Button>
            <Input
              type="number"
              min="1"
              value={item.quantity}
              onChange={(e) =>
                updateItem({ quantity: parseInt(e.target.value) || 1 })
              }
              className="h-11 text-center font-semibold"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => updateItem({ quantity: item.quantity + 1 })}
              className="h-11 w-11 shrink-0 p-0"
              aria-label="Increase quantity"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="sm:col-span-3">
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
            Unit price
          </label>
          <div className="relative">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-400">
              ₹
            </span>
            <Input
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              value={item.price || ""}
              onChange={(e) =>
                updateItem({ price: parseFloat(e.target.value) || 0 })
              }
              className="h-11 pl-7 font-semibold"
            />
          </div>
        </div>

        <div className="sm:col-span-3">
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
            Tax
          </label>
          <label
            className={cn(
              "flex h-11 cursor-pointer items-center justify-between gap-2 rounded-lg border px-3 text-sm transition",
              item.taxable
                ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
            )}
          >
            <span className="font-medium">Apply 3.5%</span>
            <span
              className={cn(
                "relative inline-flex h-5 w-9 items-center rounded-full transition",
                item.taxable ? "bg-emerald-500" : "bg-slate-300"
              )}
            >
              <span
                className={cn(
                  "inline-block h-4 w-4 transform rounded-full bg-white shadow transition",
                  item.taxable ? "translate-x-4" : "translate-x-0.5"
                )}
              />
            </span>
            <input
              type="checkbox"
              checked={item.taxable}
              onChange={(e) => updateItem({ taxable: e.target.checked })}
              className="sr-only"
            />
          </label>
        </div>

        <div className="sm:col-span-3">
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
            Line total
          </label>
          <div
            className={cn(
              "flex h-11 items-center justify-between rounded-lg border px-3",
              hasPrice && hasDescription
                ? "border-slate-900 bg-slate-900 text-white"
                : "border-slate-200 bg-slate-50 text-slate-400"
            )}
          >
            <span className="text-[11px] font-semibold uppercase tracking-wide opacity-80">
              {item.quantity} × {formatCurrency(item.price)}
            </span>
            <span className="text-base font-bold">
              {formatCurrency(itemTotal)}
            </span>
          </div>
        </div>
      </div>

      {/* Tax breakdown */}
      {item.taxable && hasPrice && (
        <div className="mt-3 flex items-center justify-end gap-2 text-xs font-medium text-emerald-700">
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5">
            + Tax {formatCurrency(taxAmount)}
          </span>
        </div>
      )}
    </div>
  );
};
