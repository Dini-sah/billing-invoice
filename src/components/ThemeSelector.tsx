import { useState } from "react";
import { Check, Palette, X } from "lucide-react";
import { AppTheme, appThemes, ThemeId } from "../utils/themes";

interface ThemeSelectorProps {
  activeTheme: AppTheme;
  onThemeChange: (themeId: ThemeId) => void;
}

export const ThemeSelector = ({
  activeTheme,
  onThemeChange,
}: ThemeSelectorProps) => {
  const [open, setOpen] = useState(false);

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end gap-3 print:hidden sm:bottom-6 sm:right-6">
      {open && (
        <div className="w-[min(calc(100vw-2rem),340px)] rounded-lg border border-gray-200 bg-white/95 p-3 shadow-2xl shadow-gray-950/15 backdrop-blur">
          <div className="mb-3 flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-bold text-gray-950">Theme</p>
              <p className="text-xs text-gray-500">{activeTheme.name}</p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 transition hover:bg-gray-100 hover:text-gray-950"
              aria-label="Close theme selector"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="grid gap-2">
            {appThemes.map((theme) => {
              const selected = theme.id === activeTheme.id;

              return (
                <button
                  key={theme.id}
                  type="button"
                  onClick={() => {
                    onThemeChange(theme.id);
                    setOpen(false);
                  }}
                  className={`grid grid-cols-[56px_1fr_auto] items-center gap-3 rounded-lg border p-2 text-left transition hover:border-gray-300 hover:bg-gray-50 ${
                    selected
                      ? "border-gray-950 bg-gray-50"
                      : "border-gray-200 bg-white"
                  }`}
                  aria-label={`Use ${theme.name} theme`}
                  aria-pressed={selected}
                >
                  <span className="flex h-9 overflow-hidden rounded-md border border-white shadow-sm">
                    {theme.swatches.map((swatch) => (
                      <span
                        key={swatch}
                        className="flex-1"
                        style={{ backgroundColor: swatch }}
                      />
                    ))}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold text-gray-950">
                      {theme.name}
                    </span>
                    <span className="block truncate text-xs text-gray-500">
                      {theme.description}
                    </span>
                  </span>
                  {selected && (
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-950 text-white">
                      <Check className="h-3.5 w-3.5" />
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--theme-primary)] text-white shadow-xl shadow-gray-950/20 transition hover:-translate-y-0.5 hover:bg-[var(--theme-primary-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-primary)] focus-visible:ring-offset-2"
        aria-label="Open theme selector"
        aria-expanded={open}
      >
        <Palette className="h-5 w-5" />
      </button>
    </div>
  );
};
