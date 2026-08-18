const pad = (value: number) => String(value).padStart(2, '0');

export const toDateKey = (date: Date) =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

export const fromDateKey = (key: string) => {
  const [year, month, day] = key.split('-').map(Number);
  return new Date(year, month - 1, day);
};

export const addDays = (date: Date, amount: number) => {
  const next = new Date(date);
  next.setDate(next.getDate() + amount);
  return next;
};

export const formatShortDate = (date: Date) =>
  date.toLocaleDateString('en-US', {month: 'short', day: 'numeric'});

export const monthTitle = (date: Date) =>
  date.toLocaleDateString('en-US', {month: 'long', year: 'numeric'});

export const getCalendarDays = (month: Date) => {
  const first = new Date(month.getFullYear(), month.getMonth(), 1);
  const days = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  return [
    ...Array.from({length: first.getDay()}, () => null),
    ...Array.from({length: days}, (_, index) => new Date(month.getFullYear(), month.getMonth(), index + 1)),
  ];
};
