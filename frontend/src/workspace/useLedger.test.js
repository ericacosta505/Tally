import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import useLedger from './useLedger';
import * as api from '../services/api';
import { DEFAULT_SETTINGS } from '../lib/finance';
jest.mock('../services/api', () => ({
  getEntries: jest.fn(),
  getSettings: jest.fn(),
  createEntry: jest.fn(),
  updateEntry: jest.fn(),
  deleteEntry: jest.fn(),
  updateSettings: jest.fn(),
}));
let root, container, ledger;
const auth = { isAuthenticated: true, loading: false, token: 'alice-token' };
const demoAuth = { isAuthenticated: false, loading: false, token: null };
const makeEntry = (id) => ({
  id,
  description: `Private ${id}`,
  amount: 10,
  category: 'Other',
  type: 'expense',
  expense_category: 'want',
  date: '2026-09-10',
});
function Harness({ identity }) {
  ledger = useLedger(identity);
  return <span>{ledger.entries.length}</span>;
}
const render = (identity) =>
  act(async () => {
    root.render(<Harness identity={identity} />);
  });
beforeEach(() => {
  global.IS_REACT_ACT_ENVIRONMENT = true;
  localStorage.clear();
  jest.resetAllMocks();
  api.getEntries.mockResolvedValue([makeEntry(1)]);
  api.getSettings.mockResolvedValue(DEFAULT_SETTINGS);
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});
afterEach(async () => {
  await act(async () => root.unmount());
  container.remove();
});
test('late account saves cannot repopulate a signed-out demo', async () => {
  await render(auth);
  let resolve;
  api.createEntry.mockImplementation(
    () =>
      new Promise((done) => {
        resolve = done;
      }),
  );
  let pending;
  await act(async () => {
    pending = ledger.saveEntry(makeEntry(2));
  });
  await render(demoAuth);
  await act(async () => {
    resolve(makeEntry(2));
    await pending;
  });
  expect(ledger.entries.every((e) => typeof e.id === 'string' && e.id.startsWith('demo-'))).toBe(
    true,
  );
  expect(localStorage.getItem('tally-demo-v1')).toBeNull();
});
test('concurrent saves preserve both completed mutations and settings', async () => {
  await render(auth);
  const resolves = [];
  api.createEntry.mockImplementation(() => new Promise((done) => resolves.push(done)));
  api.updateSettings.mockResolvedValue({
    needs_percentage: 60,
    wants_percentage: 20,
    savings_percentage: 20,
  });
  let first, second;
  await act(async () => {
    first = ledger.saveEntry(makeEntry(2));
    second = ledger.saveEntry(makeEntry(3));
    await ledger.saveSettings({
      needs_percentage: 60,
      wants_percentage: 20,
      savings_percentage: 20,
    });
  });
  await act(async () => {
    resolves[1](makeEntry(3));
    await second;
    resolves[0](makeEntry(2));
    await first;
  });
  expect(ledger.entries.map((e) => e.id).sort()).toEqual([1, 2, 3]);
  expect(ledger.settings.needs_percentage).toBe(60);
});
test('demo mutations persist locally without calling account APIs', async () => {
  await render(demoAuth);
  await act(async () => ledger.saveEntry({ ...makeEntry('new'), description: 'Demo edit' }));
  expect(
    JSON.parse(localStorage.getItem('tally-demo-v1')).entries.some(
      (e) => e.description === 'Demo edit',
    ),
  ).toBe(true);
  expect(api.createEntry).not.toHaveBeenCalled();
  expect(api.getEntries).not.toHaveBeenCalled();
});
