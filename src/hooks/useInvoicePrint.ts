import { useCallback, useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";

const waitForRender = () =>
  new Promise<void>((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
  });

const delay = (ms: number) =>
  new Promise<void>((resolve) => window.setTimeout(resolve, ms));

export const useInvoicePrint = () => {
  const [isPrintMode, setIsPrintMode] = useState(false);
  const cleanupTimerRef = useRef<number | null>(null);

  const cleanupPrintMode = useCallback(() => {
    if (cleanupTimerRef.current) {
      window.clearTimeout(cleanupTimerRef.current);
      cleanupTimerRef.current = null;
    }
    document.body.classList.remove("printing-invoice");
    setIsPrintMode(false);
  }, []);

  useEffect(() => {
    const scheduleCleanup = () => {
      cleanupTimerRef.current = window.setTimeout(cleanupPrintMode, 800);
    };

    window.addEventListener("afterprint", scheduleCleanup);
    window.addEventListener("focus", scheduleCleanup);
    return () => {
      window.removeEventListener("afterprint", scheduleCleanup);
      window.removeEventListener("focus", scheduleCleanup);
      if (cleanupTimerRef.current) {
        window.clearTimeout(cleanupTimerRef.current);
      }
    };
  }, [cleanupPrintMode]);

  const printInvoice = async () => {
    document.body.classList.add("printing-invoice");
    flushSync(() => setIsPrintMode(true));
    await waitForRender();
    await delay(500);
    window.print();
  };

  return { isPrintMode, printInvoice, cleanupPrintMode };
};
