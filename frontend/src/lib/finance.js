export const ALLOCATIONS = [
  {
    key: 'need',
    label: 'Needs',
    description: 'Your everyday essentials',
    setting: 'needs_percentage',
    color: '#232720',
  },
  {
    key: 'want',
    label: 'Wants',
    description: 'A little more of what you love',
    setting: 'wants_percentage',
    color: '#9caae8',
  },
  {
    key: 'saving',
    label: 'Savings',
    description: 'A head start on your future',
    setting: 'savings_percentage',
    color: '#c6ed74',
  },
];
export const CATEGORIES = [
  'Housing',
  'Groceries',
  'Food & drink',
  'Transport',
  'Shopping',
  'Subscriptions',
  'Health',
  'Travel',
  'Utilities',
  'Savings',
  'Salary',
  'Freelance',
  'Other',
];
export const DEFAULT_SETTINGS = {
  needs_percentage: 50,
  wants_percentage: 30,
  savings_percentage: 20,
};
export const cents = (value) => Math.round(Number(value) * 100);
export const money = (value, decimals = 0) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value || 0);
export const dateKey = (date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
export const monthKey = (date) => dateKey(date).slice(0, 7);
export const parseDate = (value) => new Date(`${value}T12:00:00`);
export const monthLabel = (date) =>
  date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
export const inMonth = (entries, month) =>
  entries.filter((entry) => entry.date.startsWith(monthKey(month)));
export const sum = (entries) =>
  entries.reduce((total, entry) => total + cents(entry.amount), 0) / 100;
export function summarize(entries) {
  const income = sum(entries.filter((e) => e.type === 'income'));
  const outflow = sum(entries.filter((e) => e.type === 'expense'));
  const savings = sum(
    entries.filter((e) => e.type === 'expense' && e.expense_category === 'saving'),
  );
  return {
    income,
    outflow,
    savings,
    spending: (cents(outflow) - cents(savings)) / 100,
    available: (cents(income) - cents(outflow)) / 100,
  };
}
export function categoryTotals(entries) {
  const groups = Object.create(null);
  entries
    .filter((e) => e.type === 'expense' && e.expense_category !== 'saving')
    .forEach((e) => {
      groups[e.category] = (groups[e.category] || 0) + cents(e.amount);
    });
  return Object.entries(groups)
    .map(([name, amount]) => ({ name, amount: amount / 100 }))
    .sort((a, b) => b.amount - a.amount);
}
export function dailySpending(entries, month, today = new Date()) {
  const days = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const cutoff = monthKey(month) === monthKey(today) ? today.getDate() : month < today ? days : 0;
  let total = 0;
  return Array.from({ length: days }, (_, i) => {
    total += entries
      .filter(
        (e) =>
          Number(e.date.slice(8, 10)) === i + 1 &&
          e.type === 'expense' &&
          e.expense_category !== 'saving',
      )
      .reduce((s, e) => s + cents(e.amount), 0);
    return i < cutoff ? total / 100 : null;
  });
}
export function recurringCharges(entries, asOf = new Date()) {
  const groups = Object.create(null);
  entries
    .filter(
      (e) => e.type === 'expense' && e.expense_category !== 'saving' && e.date <= dateKey(asOf),
    )
    .forEach((e) => {
      const key = `${e.description.trim().toLowerCase()}|${e.category}`;
      (groups[key] ||= []).push(e);
    });
  return Object.values(groups)
    .flatMap((charges) => {
      const sorted = charges.sort((a, b) => b.date.localeCompare(a.date));
      const last = sorted[0];
      const previous = sorted.find((e) => e.date.slice(0, 7) !== last.date.slice(0, 7));
      if (!previous) return [];
      const interval =
        (Date.parse(`${last.date}T00:00:00Z`) - Date.parse(`${previous.date}T00:00:00Z`)) /
        86400000;
      if (interval < 25 || interval > 35) return [];
      const lastDate = parseDate(last.date);
      const nextMonth = new Date(lastDate.getFullYear(), lastDate.getMonth() + 1, 1, 12);
      const nextDate = new Date(
        nextMonth.getFullYear(),
        nextMonth.getMonth(),
        Math.min(
          lastDate.getDate(),
          new Date(nextMonth.getFullYear(), nextMonth.getMonth() + 1, 0).getDate(),
        ),
        12,
      );
      if (nextDate < new Date(asOf.getFullYear(), asOf.getMonth(), asOf.getDate(), 0)) return [];
      return [
        {
          ...last,
          key: `${last.description}|${last.category}`,
          previousAmount: previous.amount,
          increase: (cents(last.amount) - cents(previous.amount)) / 100,
          nextDate: dateKey(nextDate),
          evidence: sorted.slice(0, 3),
        },
      ];
    })
    .sort((a, b) => a.nextDate.localeCompare(b.nextDate));
}
export function upcomingCharges(entries, month, today = new Date()) {
  return recurringCharges(entries, today).filter(
    (e) =>
      e.nextDate.startsWith(monthKey(month)) &&
      e.nextDate >= dateKey(today) &&
      !entries.some(
        (recorded) =>
          recorded.type === 'expense' &&
          recorded.expense_category !== 'saving' &&
          recorded.description.trim().toLowerCase() === e.description.trim().toLowerCase() &&
          recorded.category === e.category &&
          recorded.date.slice(0, 7) === e.nextDate.slice(0, 7),
      ),
  );
}
export function forecast(entries, month, settings, reduction = 0, today = new Date()) {
  const current = inMonth(entries, month);
  const totals = summarize(current);
  const recurring = recurringCharges(entries, today);
  const upcoming = upcomingCharges(entries, month, today);
  const committed = sum(upcoming);
  const days = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const elapsed = monthKey(month) === monthKey(today) ? today.getDate() : month < today ? days : 0;
  const recurringNames = new Set(recurring.map((e) => `${e.description}|${e.category}`));
  const variable = sum(
    current.filter(
      (e) =>
        e.date <= dateKey(today) &&
        e.type === 'expense' &&
        e.expense_category !== 'saving' &&
        !recurringNames.has(`${e.description}|${e.category}`),
    ),
  );
  const remaining = Math.max(0, days - elapsed);
  const baselineVariable = elapsed ? (variable / elapsed) * remaining : 0;
  const plannedVariable = sum(
    current.filter(
      (e) =>
        e.date > dateKey(today) &&
        e.type === 'expense' &&
        e.expense_category !== 'saving' &&
        !recurringNames.has(`${e.description}|${e.category}`),
    ),
  );
  const projectedVariable =
    Math.max(0, baselineVariable - plannedVariable) *
    (1 - Math.max(0, Math.min(100, reduction)) / 100);
  const projectedSpending =
    Math.round((totals.spending + committed + projectedVariable) * 100) / 100;
  return {
    ...totals,
    committed,
    upcoming,
    projectedVariable,
    projectedSpending,
    remaining,
    elapsed,
    potentialSavings:
      Math.round((Math.max(0, baselineVariable - plannedVariable) - projectedVariable) * 100) / 100,
    projectedBalance: Math.round((totals.income - projectedSpending - totals.savings) * 100) / 100,
    hasData: current.length > 0,
  };
}
export function csvFor(entries) {
  const escape = (value) => {
    let text = String(value ?? '');
    if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`;
    return `"${text.replace(/"/g, '""')}"`;
  };
  return [
    ['Date', 'Description', 'Category', 'Type', 'Allocation', 'Amount'],
    ...entries.map((e) => [
      e.date,
      e.description,
      e.category,
      e.type,
      e.expense_category || '',
      Number(e.amount).toFixed(2),
    ]),
  ]
    .map((row) => row.map(escape).join(','))
    .join('\r\n');
}
