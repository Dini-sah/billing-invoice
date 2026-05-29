import { useEffect, useState } from "react";
import { flushSync } from "react-dom";

const waitForRender = () =>
  new Promise<void>((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
  });

export const useInvoicePrint = () => {
  const [isPrintMode, setIsPrintMode] = useState(false);

  useEffect(() => {
    const cleanupPrintMode = () => {
      document.body.classList.remove("printing-invoice");
      setIsPrintMode(false);
    };

    window.addEventListener("afterprint", cleanupPrintMode);
    return () => window.removeEventListener("afterprint", cleanupPrintMode);
  }, []);

  const printInvoice = async () => {
    document.body.classList.add("printing-invoice");
    flushSync(() => setIsPrintMode(true));
    await waitForRender();
    window.print();
  };

  return { isPrintMode, printInvoice };
};

