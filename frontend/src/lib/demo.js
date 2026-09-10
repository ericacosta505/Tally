import { dateKey, DEFAULT_SETTINGS, parseDate } from './finance';
const template = [
  [1, 'Acme Studio', 6250, 'Salary', 'income'],
  [1, 'Parkside Apartments', 1850, 'Housing', 'expense', 'need'],
  [2, 'Future you', 800, 'Savings', 'expense', 'saving'],
  [2, 'Whole Foods Market', 86.42, 'Groceries', 'expense', 'need'],
  [3, 'Figma', 15, 'Subscriptions', 'expense', 'want'],
  [3, 'Blue Bottle Coffee', 7.5, 'Food & drink', 'expense', 'want'],
  [4, 'Spotify', 11.99, 'Subscriptions', 'expense', 'want'],
  [4, 'CTA Ventra', 25, 'Transport', 'expense', 'need'],
  [5, 'Freelance project', 2000, 'Freelance', 'income'],
  [5, 'Trader Joe’s', 64.83, 'Groceries', 'expense', 'need'],
  [6, 'Apple', 2.99, 'Subscriptions', 'expense', 'want'],
  [6, 'Sweetgreen', 18.45, 'Food & drink', 'expense', 'want'],
  [7, 'ComEd', 72.36, 'Utilities', 'expense', 'need'],
  [7, 'Uniqlo', 89.9, 'Shopping', 'expense', 'want'],
  [8, 'Future you', 300, 'Savings', 'expense', 'saving'],
  [8, 'Intelligentsia', 12.75, 'Food & drink', 'expense', 'want'],
  [9, 'Whole Foods Market', 92.18, 'Groceries', 'expense', 'need'],
  [9, 'Uber', 24.6, 'Transport', 'expense', 'want'],
  [10, 'Notion', 12, 'Subscriptions', 'expense', 'want'],
  [10, 'Lula Cafe', 42.8, 'Food & drink', 'expense', 'want'],
  [12, 'Netflix', 17.99, 'Subscriptions', 'expense', 'want'],
  [13, 'Trader Joe’s', 72.6, 'Groceries', 'expense', 'need'],
  [14, 'Warby Parker', 95, 'Shopping', 'expense', 'want'],
  [15, 'AT&T', 65, 'Utilities', 'expense', 'need'],
  [16, 'Blue Bottle Coffee', 8.5, 'Food & drink', 'expense', 'want'],
  [18, 'Whole Foods Market', 97.24, 'Groceries', 'expense', 'need'],
  [19, 'Adobe', 22.99, 'Subscriptions', 'expense', 'want'],
  [20, 'Sweetgreen', 16.85, 'Food & drink', 'expense', 'want'],
  [21, 'Walgreens', 34.6, 'Health', 'expense', 'need'],
  [22, 'Allbirds', 110, 'Shopping', 'expense', 'want'],
  [24, 'Trader Joe’s', 68.93, 'Groceries', 'expense', 'need'],
  [25, 'CTA Ventra', 25, 'Transport', 'expense', 'need'],
  [26, 'Theater on the Lake', 68, 'Food & drink', 'expense', 'want'],
  [28, 'Whole Foods Market', 79.12, 'Groceries', 'expense', 'need'],
];
export function createDemo(today = new Date()) {
  const entries = [];
  for (let offset = 2; offset >= 0; offset--) {
    const month = new Date(today.getFullYear(), today.getMonth() - offset, 1);
    template.forEach(([day, description, amount, category, type, expense_category], index) => {
      if (offset === 0 && day > today.getDate()) return;
      let adjusted = amount;
      if (description === 'Notion' && offset > 0) adjusted = 10;
      if (offset > 0 && ['Food & drink', 'Shopping', 'Groceries'].includes(category))
        adjusted = Math.round(amount * (offset === 1 ? 1.19 : 1.08) * 100) / 100;
      entries.push({
        id: `demo-${offset}-${index}`,
        description,
        amount: adjusted,
        category,
        type,
        expense_category: expense_category || null,
        date: dateKey(new Date(month.getFullYear(), month.getMonth(), day)),
      });
    });
  }
  return { version: 1, entries, settings: { ...DEFAULT_SETTINGS } };
}
export function loadDemo() {
  try {
    const value = JSON.parse(localStorage.getItem('tally-demo-v1'));
    const validSettings =
      value?.settings &&
      Object.keys(DEFAULT_SETTINGS).every(
        (key) =>
          typeof value.settings[key] === 'number' &&
          Number.isFinite(value.settings[key]) &&
          value.settings[key] >= 0 &&
          value.settings[key] <= 100,
      ) &&
      Math.abs(
        Object.keys(DEFAULT_SETTINGS).reduce((total, key) => total + value.settings[key], 0) - 100,
      ) < 0.001;
    const validEntries =
      Array.isArray(value?.entries) &&
      value.entries.every(
        (e) =>
          e &&
          (typeof e.id === 'string' || typeof e.id === 'number') &&
          typeof e.date === 'string' &&
          /^\d{4}-\d{2}-\d{2}$/.test(e.date) &&
          Number.isFinite(parseDate(e.date).getTime()) &&
          dateKey(parseDate(e.date)) === e.date &&
          typeof e.description === 'string' &&
          e.description.trim() &&
          typeof e.category === 'string' &&
          e.category.trim() &&
          Number.isFinite(e.amount) &&
          e.amount > 0 &&
          e.amount <= 999999999.99 &&
          Math.abs(e.amount * 100 - Math.round(e.amount * 100)) < 0.0001 &&
          ['income', 'expense'].includes(e.type) &&
          (e.type === 'income' || ['need', 'want', 'saving'].includes(e.expense_category)),
      ) &&
      new Set(value.entries.map((e) => e.id)).size === value.entries.length;
    if (value?.version === 1 && validSettings && validEntries) return value;
  } catch (_) {
    /* Recover safely from unavailable or invalid local storage. */
  }
  return createDemo();
}
