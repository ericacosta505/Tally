import {
  categoryTotals,
  csvFor,
  dailySpending,
  DEFAULT_SETTINGS,
  forecast,
  recurringCharges,
  summarize,
  upcomingCharges,
} from './finance';
import { createDemo, loadDemo } from './demo';
const today = new Date(2026, 8, 10, 9);
const month = new Date(2026, 8, 1);
const entry = (date, amount, extra = {}) => ({
  id: date,
  description: 'Netflix',
  amount,
  date,
  category: 'Subscriptions',
  type: 'expense',
  expense_category: 'want',
  ...extra,
});
const income = entry('2026-09-01', 1000, {
  id: 'income',
  type: 'income',
  expense_category: null,
  category: 'Salary',
});
afterEach(() => localStorage.clear());
test('money totals use cents and separate savings from spending', () => {
  const result = summarize([
    income,
    entry('2026-09-02', 0.1),
    entry('2026-09-03', 0.2),
    entry('2026-09-04', 50, { expense_category: 'saving' }),
  ]);
  expect(result).toEqual({
    income: 1000,
    outflow: 50.3,
    savings: 50,
    spending: 0.3,
    available: 949.7,
  });
});
test('prototype-named custom categories remain ordinary financial data', () => {
  expect(
    categoryTotals([
      entry('2026-09-01', 10, { category: 'constructor' }),
      entry('2026-09-02', 20, { category: '__proto__' }),
    ]),
  ).toEqual([
    { name: '__proto__', amount: 20 },
    { name: 'constructor', amount: 10 },
  ]);
});
test('recurrence requires a monthly interval, not repeated everyday purchases', () => {
  expect(recurringCharges([entry('2026-09-01', 10), entry('2026-09-03', 10)], today)).toEqual([]);
});
test('recurring estimates are invariant to time of day', () => {
  const entries = [entry('2026-08-10', 10), entry('2026-09-10', 12)];
  const morning = recurringCharges(entries, new Date(2026, 8, 10, 9));
  const evening = recurringCharges(entries, new Date(2026, 8, 10, 18));
  expect(morning).toEqual(evening);
  expect(morning[0].nextDate).toBe('2026-10-10');
  expect(morning[0].increase).toBe(2);
});
test('an unpaid recurring estimate due today is included', () => {
  const entries = [entry('2026-07-10', 10), entry('2026-08-10', 10)];
  expect(upcomingCharges(entries, month, today)).toHaveLength(1);
  expect(forecast([income, ...entries], month, DEFAULT_SETTINGS, 0, today).committed).toBe(10);
});
test('recorded future recurring charges are included only once', () => {
  const entries = [
    income,
    entry('2026-07-15', 10),
    entry('2026-08-15', 10),
    entry('2026-09-15', 10),
  ];
  const result = forecast(entries, month, DEFAULT_SETTINGS, 0, today);
  expect(result.committed).toBe(0);
  expect(result.projectedSpending).toBe(10);
  expect(result.projectedBalance).toBe(990);
});
test('future non-recurring entries do not inflate elapsed spending pace', () => {
  const result = forecast(
    [income, entry('2026-09-05', 100), entry('2026-09-20', 50)],
    month,
    DEFAULT_SETTINGS,
    0,
    today,
  );
  expect(result.projectedVariable).toBe(150);
  expect(result.projectedSpending).toBe(300);
});
test('scenarios change only projected variable spending', () => {
  const entries = [
    income,
    entry('2026-09-05', 100, { description: 'Groceries' }),
    entry('2026-09-04', 100, { expense_category: 'saving' }),
    entry('2026-07-15', 10),
    entry('2026-08-15', 10),
  ];
  const baseline = forecast(entries, month, DEFAULT_SETTINGS, 0, today);
  const scenario = forecast(entries, month, DEFAULT_SETTINGS, 50, today);
  expect(scenario.spending).toBe(baseline.spending);
  expect(scenario.savings).toBe(100);
  expect(scenario.committed).toBe(10);
  expect(scenario.projectedVariable).toBe(baseline.projectedVariable / 2);
  expect(scenario.potentialSavings).toBe(100);
});
test('recurring dates clamp to the next month end', () => {
  const charges = recurringCharges(
    [entry('2026-02-28', 10), entry('2026-03-31', 10)],
    new Date(2026, 2, 31, 18),
  );
  expect(charges[0].nextDate).toBe('2026-04-30');
});
test('completed months do not project extra variable spending', () => {
  const result = forecast(
    [entry('2026-08-10', 50)],
    new Date(2026, 7, 1),
    DEFAULT_SETTINGS,
    0,
    today,
  );
  expect(result.remaining).toBe(0);
  expect(result.projectedVariable).toBe(0);
});
test('the spending chart ends at today and excludes savings', () => {
  const values = dailySpending(
    [entry('2026-09-01', 10), entry('2026-09-02', 50, { expense_category: 'saving' })],
    month,
    today,
  );
  expect(values).toHaveLength(30);
  expect(values[9]).toBe(10);
  expect(values[10]).toBeNull();
});
test('CSV handles commas, quotes and spreadsheet formula injection', () => {
  const csv = csvFor([entry('2026-09-01', 12.4, { description: '=SUM(1,2) "test"' })]);
  expect(csv).toContain('"\'=SUM(1,2) ""test"""');
  expect(csv).toContain('"12.40"');
});
test('demo includes three months but no future transactions', () => {
  const demo = createDemo(today);
  expect(new Set(demo.entries.map((e) => e.date.slice(0, 7))).size).toBe(3);
  expect(demo.entries.every((e) => e.date <= '2026-09-10')).toBe(true);
});
test('demo load recovers from malformed financial storage', () => {
  for (const corrupt of [
    '{broken',
    JSON.stringify({
      ...createDemo(today),
      settings: { needs_percentage: -100, wants_percentage: 180, savings_percentage: 20 },
    }),
    JSON.stringify({ ...createDemo(today), entries: [entry('2026-02-30', -10)] }),
  ]) {
    localStorage.setItem('tally-demo-v1', corrupt);
    expect(loadDemo().entries.length).toBeGreaterThan(1);
    expect(loadDemo().settings).toEqual(DEFAULT_SETTINGS);
  }
});
test('valid demo edits survive reload', () => {
  const demo = createDemo(today);
  demo.entries[0].description = 'Edited locally';
  localStorage.setItem('tally-demo-v1', JSON.stringify(demo));
  expect(loadDemo().entries[0].description).toBe('Edited locally');
});
