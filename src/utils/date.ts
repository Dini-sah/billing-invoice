const parseDateInput = (dateString: string) => {
  const dateOnlyMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateString);
  if (dateOnlyMatch) {
    const year = Number(dateOnlyMatch[1]);
    const month = Number(dateOnlyMatch[2]) - 1;
    const day = Number(dateOnlyMatch[3]);
    return new Date(year, month, day);
  }

  return new Date(dateString);
};

export const getRelativeDate = (dateString: string) => {
  if (!dateString) return '-';

  const now = new Date();
  const past = parseDateInput(dateString);
  if (Number.isNaN(past.getTime())) return dateString;

  const diffTime = now.getTime() - past.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;

  return past.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
};

export const formatDateTime = (dateString: string) => {
  if (!dateString) return '-';
  const date = parseDateInput(dateString);
  if (Number.isNaN(date.getTime())) return dateString;

  return date.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
};
