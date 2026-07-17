import { BarChart3, BookOpenText, FileText, LayoutDashboard, Users } from "lucide-react";
import type { ActiveTab } from "./types";

interface MobileNavProps {
  activeTab: ActiveTab;
  onNavigate: (tab: ActiveTab) => void;
}

const NAV_ITEMS: { tab: ActiveTab; icon: typeof LayoutDashboard; label: string }[] = [
  { tab: "list", icon: LayoutDashboard, label: "Home" },
  { tab: "create", icon: FileText, label: "Invoice" },
  { tab: "cashbook", icon: BookOpenText, label: "Cash" },
  { tab: "customers", icon: Users, label: "Users" },
  { tab: "reports", icon: BarChart3, label: "Reports" },
];

export const MobileNav = ({ activeTab, onNavigate }: MobileNavProps) => (
  <nav className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 lg:hidden">
    <div className="flex items-center gap-0.5 rounded-2xl border border-white/20 bg-white/95 p-1 shadow-xl shadow-slate-950/15 backdrop-blur-xl sm:gap-1 sm:p-1.5">
      {NAV_ITEMS.map((item) => {
        const isActive = activeTab === item.tab;
        return (
          <button
            key={item.tab}
            type="button"
            onClick={() => onNavigate(item.tab)}
            className={`flex items-center gap-1 rounded-xl py-2 text-xs font-semibold transition-all sm:px-3 sm:py-2.5 sm:text-xs ${
              isActive
                ? "bg-orange-500 text-white shadow-md shadow-orange-500/30"
                : "text-slate-500 hover:bg-slate-100 hover:text-slate-800"
            } px-2.5`}
          >
            <item.icon className="h-4 w-4 flex-shrink-0" />
            <span className="hidden sm:inline">{item.label}</span>
          </button>
        );
      })}
    </div>
  </nav>
);