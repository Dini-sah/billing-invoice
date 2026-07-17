import { LayoutDashboard } from "lucide-react";

export interface NavItemProps {
  icon: typeof LayoutDashboard;
  label: string;
  active?: boolean;
  onClick?: () => void;
}

export const NavItem = ({ icon: Icon, label, active = false, onClick }: NavItemProps) => (
  <button
    type="button"
    onClick={onClick}
    className={`relative flex h-12 w-full items-center gap-4 rounded-lg px-4 text-left text-sm font-semibold transition ${
      active
        ? "bg-orange-50 text-orange-600"
        : "text-slate-700 hover:bg-slate-50 hover:text-slate-950"
    }`}
  >
    {active && <span className="absolute -left-7 top-0 h-12 w-1 rounded-r-full bg-orange-500" />}
    <Icon className="h-5 w-5" />
    {label}
  </button>
);
