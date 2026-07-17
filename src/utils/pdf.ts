import html2pdf from "html2pdf.js";

const waitForRender = () =>
  new Promise<void>((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
  });

const createPdfSourceElement = (sourceElement: HTMLElement) => {
  const pdfWidth = 720;
  const wrapper = document.createElement("div");
  wrapper.style.position = "absolute";
  wrapper.style.left = "0";
  wrapper.style.top = "0";
  wrapper.style.width = `${pdfWidth}px`;
  wrapper.style.background = "#ffffff";
  wrapper.style.opacity = "0.01";
  wrapper.style.pointerEvents = "none";
  wrapper.style.zIndex = "-9999";

  const clone = sourceElement.cloneNode(true) as HTMLElement;
  clone.style.width = `${pdfWidth}px`;
  clone.style.maxWidth = `${pdfWidth}px`;
  clone.style.maxHeight = "none";
  clone.style.overflow = "visible";
  clone.style.boxShadow = "none";
  clone.style.borderRadius = "0";

  clone.querySelectorAll<HTMLElement>(".overflow-x-auto").forEach((node) => {
    node.style.overflow = "visible";
  });
  clone.querySelectorAll<HTMLElement>("table").forEach((table) => {
    table.style.width = "100%";
    table.style.minWidth = "0";
    table.style.tableLayout = "fixed";
  });

  wrapper.appendChild(clone);
  document.body.appendChild(wrapper);

  return {
    element: clone,
    cleanup: () => wrapper.remove(),
  };
};

const pdfOptions = (filename: string) => ({
  filename,
  margin: [8, 8, 8, 8] as [number, number, number, number],
  html2canvas: {
    scale: 2,
    useCORS: true,
    width: 720,
    windowWidth: 720,
    scrollX: 0,
    scrollY: 0,
  },
  jsPDF: { unit: "mm" as const, format: "a4" as const, orientation: "portrait" as const },
  pagebreak: { mode: ["avoid-all", "css", "legacy"] as const },
});

export const createPdfBlob = async (
  sourceElement: HTMLElement,
  filename: string
) => {
  await waitForRender();
  const source = createPdfSourceElement(sourceElement);
  try {
    return await html2pdf()
      .set(pdfOptions(filename))
      .from(source.element)
      .toPdf()
      .outputPdf("blob");
  } finally {
    source.cleanup();
  }
};

export const savePdf = async (sourceElement: HTMLElement, filename: string) => {
  await waitForRender();
  const source = createPdfSourceElement(sourceElement);
  try {
    await html2pdf().set(pdfOptions(filename)).from(source.element).save();
  } finally {
    source.cleanup();
  }
};
