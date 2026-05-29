export const generateInvoiceId = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const randomPart =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID().split('-')[0]
      : Math.random().toString(36).slice(2, 8);

  return `INV-${year}-${randomPart.toUpperCase()}`;
};

export const formatDate = (date: Date = new Date()): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};
