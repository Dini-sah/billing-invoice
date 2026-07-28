import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { CustomerRecord } from "../types/invoice";
import { Input } from "./ui/input";
import { Phone, Search, UserRound } from "lucide-react";

interface CustomerSearchSelectProps {
  customers: CustomerRecord[];
  onSelect: (customerId: string) => void;
  placeholder?: string;
}

export function CustomerSearchSelect({
  customers,
  onSelect,
  placeholder = "Search customer by name or phone…",
}: CustomerSearchSelectProps) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 0 });

  // Measure input position so the portal dropdown can be anchored to it,
  // escaping any overflow-hidden / rounded ancestor that would clip it.
  useLayoutEffect(() => {
    if (!open || !inputRef.current) return;
    const measure = () => {
      const r = inputRef.current!.getBoundingClientRect();
      setCoords({ top: r.bottom + window.scrollY + 4, left: r.left + window.scrollX, width: r.width });
    };
    measure();
    window.addEventListener("scroll", measure, true);
    window.addEventListener("resize", measure);
    return () => {
      window.removeEventListener("scroll", measure, true);
      window.removeEventListener("resize", measure);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node) &&
        listRef.current &&
        !listRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const filtered = query.trim()
    ? customers.filter(
        (c) =>
          c.name.toLowerCase().includes(query.toLowerCase()) ||
          c.phoneNumber.includes(query.trim()),
      )
    : customers;

  const handleSelect = (id: string) => {
    onSelect(id);
    setQuery("");
    setOpen(false);
  };

  return (
    <div ref={containerRef} className="mt-1">
      <div ref={inputRef} className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <Input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder={placeholder}
          className="h-11 rounded-xl pl-9"
        />
      </div>
      {open &&
        createPortal(
          <div
            ref={listRef}
            className="fixed z-[9999] max-h-72 overflow-y-auto overscroll-contain rounded-xl border border-slate-200 bg-white shadow-lg"
            style={{
              top: coords.top - window.scrollY,
              left: coords.left - window.scrollX,
              width: coords.width,
              WebkitOverflowScrolling: "touch",
            }}
          >
            {customers.length === 0 ? (
              <div className="px-3 py-2 text-sm text-slate-500">No customers saved</div>
            ) : filtered.length === 0 ? (
              <div className="px-3 py-2 text-sm text-slate-500">No matches found</div>
            ) : (
              filtered.map((customer) => (
                <button
                  key={customer.id}
                  type="button"
                  onClick={() => handleSelect(customer.id)}
                  className="flex w-full items-center justify-between gap-2 border-b border-slate-100 px-3 py-2.5 text-left text-sm last:border-b-0 hover:bg-orange-50 focus:bg-orange-50 focus:outline-none"
                >
                  <span className="flex items-center gap-2">
                    <UserRound className="h-4 w-4 shrink-0 text-slate-400" />
                    <span className="truncate">{customer.name}</span>
                  </span>
                  <span className="flex shrink-0 items-center gap-1 text-slate-500">
                    <Phone className="h-3.5 w-3.5" />
                    {customer.phoneNumber}
                  </span>
                </button>
              ))
            )}
          </div>,
          document.body,
        )}
    </div>
  );
}

export default CustomerSearchSelect;
