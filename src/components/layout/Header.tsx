import { CalendarDays, ChevronDown, Plus } from "lucide-react";
import { Button } from "../ui/button";
import type { ActiveTab } from "./types";

interface HeaderProps {
  activeTab: ActiveTab;
  editingInvoice: boolean;
  selectedDate: string;
  loading: boolean;
  dateChanging: boolean;
  onDateChange: (date: string) => void;
  onNewInvoice: () => void;
}

const PAGE_TITLES: Record<ActiveTab, string> = {
  create: "Create invoice",
  list: "Good morning, Hari!",
  cashbook: "Cashbook",
  customers: "Customers",
  items: "Items & Services",
  payments: "Payments",
  reports: "Reports",
  settings: "Settings",
};

export const Header = ({
  activeTab,
  editingInvoice,
  selectedDate,
  loading,
  dateChanging,
  onDateChange,
  onNewInvoice,
}: HeaderProps) => {
  const title =
    activeTab === "create"
      ? editingInvoice
        ? "Edit invoice"
        : "Create invoice"
      : PAGE_TITLES[activeTab];

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-slate-50/90 px-4 py-4 backdrop-blur-xl sm:px-6 xl:px-8">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-950 sm:text-3xl">{title}</h2>
          <p className="mt-1 text-sm text-slate-500">
            {activeTab === "list"
              ? "Here's what's happening with your business today."
              : "Manage Hari Electronics billing operations."}
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <label className="relative">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => onDateChange(e.target.value)}
              className="h-12 w-full rounded-lg border border-slate-200 bg-white px-4 pl-11 pr-10 text-sm font-semibold text-slate-700 shadow-sm outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-100 sm:w-[180px]"
              aria-label="Select business date"
            />
            <CalendarDays className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-600" />
            {(dateChanging || loading) && (
              <span className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin rounded-full border-2 border-orange-500 border-t-transparent" />
            )}
          </label>

          {/* Desktop: inline New Invoice button */}
          <Button
            onClick={onNewInvoice}
            className="hidden h-12 gap-3 bg-orange-500 px-5 hover:bg-orange-600 lg:flex"
          >
            <Plus className="h-5 w-5" />
            New Invoice
            <ChevronDown className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Mobile Bottom FAB */}
      <button
        type="button"
        onClick={onNewInvoice}
        aria-label="Create new invoice"
        className="fixed bottom-24 right-4 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-orange-500 shadow-lg shadow-orange-500/40 transition hover:bg-orange-600 hover:shadow-xl hover:shadow-orange-500/50 active:scale-95 sm:bottom-24 sm:right-5 sm:h-14 sm:w-14 lg:hidden"
      >
        <Plus className="h-5 w-5 text-white sm:h-6 sm:w-6" />
      </button>
    </header>
  );
};