import {
  BarChart3,
  BookOpenText,
  ChevronDown,
  FileText,
  LayoutDashboard,
  Package,
  Settings,
  Users,
  WalletCards,
} from "lucide-react";
import HELogo from "../../assets/images/HElogoBlack.webp";
import { NavItem } from "./NavItem";
import type { ActiveTab } from "./types";

interface SidebarProps {
  activeTab: ActiveTab;
  businessName: string;
  businessSubtitle: string;
  ownerName: string;
  onNavigate: (tab: ActiveTab) => void;
  onInvoicesClick: () => void;
}

const NAV_ITEMS: { tab: ActiveTab; icon: typeof LayoutDashboard; label: string }[] = [
  { tab: "list", icon: LayoutDashboard, label: "Dashboard" },
  { tab: "create", icon: FileText, label: "Invoices" },
  { tab: "cashbook", icon: BookOpenText, label: "Cashbook" },
  { tab: "customers", icon: Users, label: "Customers" },
  { tab: "items", icon: Package, label: "Items & Services" },
  { tab: "payments", icon: WalletCards, label: "Payments" },
  { tab: "reports", icon: BarChart3, label: "Reports" },
  { tab: "settings", icon: Settings, label: "Settings" },
];

export const Sidebar = ({
  activeTab,
  businessName,
  businessSubtitle,
  ownerName,
  onNavigate,
  onInvoicesClick,
}: SidebarProps) => (
  <aside className="fixed inset-y-0 left-0 z-40 hidden w-[300px] overflow-y-auto border-r border-slate-200 bg-white lg:block">
    <div className="flex min-h-full flex-col p-7">
      <div className="text-center">
        <img className="mx-auto h-16 w-auto object-contain" src={HELogo} alt="Hari Electronics" />
        <h1 className="mt-5 break-words text-xl font-bold leading-snug text-slate-950">
          {businessName}
        </h1>
        <p className="mt-2 break-words text-sm text-slate-500">{businessSubtitle}</p>
      </div>

      <nav className="mt-12 space-y-2">
        {NAV_ITEMS.map((item) =>
          item.tab === "create" ? (
            <NavItem
              key={item.tab}
              icon={item.icon}
              label={item.label}
              active={activeTab === "create"}
              onClick={onInvoicesClick}
            />
          ) : (
            <NavItem
              key={item.tab}
              icon={item.icon}
              label={item.label}
              active={activeTab === item.tab}
              onClick={() => onNavigate(item.tab)}
            />
          )
        )}
      </nav>

      <div className="mt-auto pt-6">
        <div className="flex items-center gap-3 border-t border-slate-100 pt-6">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-violet-100 text-sm font-bold text-violet-600">
            HE
          </div>
          <div className="min-w-0 flex-1">
            <p className="break-words text-sm font-bold leading-snug text-slate-950">{ownerName}</p>
            <p className="text-sm text-slate-500">Owner</p>
          </div>
          <ChevronDown className="h-4 w-4 text-slate-500" />
        </div>
      </div>
    </div>
  </aside>
);