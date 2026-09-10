import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { Simulate } from 'react-dom/test-utils';
import { EntryDialog, SettingsDialog, CommandDialog } from './Dialogs';
import { Transactions } from './Views';
import { DEFAULT_SETTINGS } from '../lib/finance';
let root, container;
const expense = {
  id: 7,
  description: 'Rent',
  amount: 1200,
  category: 'Housing',
  date: '2026-08-01',
  type: 'expense',
  expense_category: 'need',
};
const click = async (element) =>
  act(async () => element.dispatchEvent(new MouseEvent('click', { bubbles: true })));
const button = (text) =>
  Array.from(container.querySelectorAll('button')).find((b) => b.textContent.includes(text));
const render = (node) => act(async () => root.render(node));
beforeEach(() => {
  global.IS_REACT_ACT_ENVIRONMENT = true;
  HTMLDialogElement.prototype.showModal = function () {
    this.setAttribute('open', '');
  };
  HTMLDialogElement.prototype.close = function () {
    this.removeAttribute('open');
  };
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});
afterEach(async () => {
  await act(async () => root.unmount());
  container.remove();
});
test('clicking the selected expense type preserves category and allocation', async () => {
  const saveEntry = jest.fn().mockResolvedValue(undefined);
  await render(
    <EntryDialog
      entry={expense}
      month={new Date(2026, 7, 1)}
      ledger={{ saveEntry }}
      onClose={jest.fn()}
      notify={jest.fn()}
    />,
  );
  await click(button('Money out'));
  expect(container.querySelector('select[name="category"]').value).toBe('Housing');
  expect(container.querySelector('input[value="need"]').checked).toBe(true);
  await act(async () => Simulate.submit(container.querySelector('form')));
  expect(saveEntry).toHaveBeenCalledWith(
    expect.objectContaining({ category: 'Housing', expense_category: 'need', amount: 1200 }),
    7,
  );
});
test('failed transaction saves keep the dialog and expose an error', async () => {
  const onClose = jest.fn();
  await render(
    <EntryDialog
      entry={expense}
      month={new Date(2026, 7, 1)}
      ledger={{ saveEntry: jest.fn().mockRejectedValue(new Error('offline')) }}
      onClose={onClose}
      notify={jest.fn()}
    />,
  );
  await act(async () => Simulate.submit(container.querySelector('form')));
  expect(container.querySelector('[role="alert"]').textContent).toContain('couldn’t save');
  expect(onClose).not.toHaveBeenCalled();
});
test('invalid allocation totals cannot be submitted', async () => {
  const saveSettings = jest.fn();
  await render(
    <SettingsDialog
      ledger={{ settings: DEFAULT_SETTINGS, saveSettings }}
      onClose={jest.fn()}
      notify={jest.fn()}
    />,
  );
  const input = container.querySelector('input[aria-label="Needs percentage"]');
  await act(async () => Simulate.change(input, { target: { value: '80' } }));
  expect(button('Save your plan').disabled).toBe(true);
  await act(async () => Simulate.submit(container.querySelector('form')));
  expect(saveSettings).not.toHaveBeenCalled();
});
test('workspace search finds the visible Recurring label', async () => {
  const navigate = jest.fn();
  await render(
    <CommandDialog
      ledger={{ entries: [] }}
      navigate={navigate}
      onClose={jest.fn()}
      onEdit={jest.fn()}
      onAdd={jest.fn()}
    />,
  );
  await act(async () =>
    Simulate.change(container.querySelector('input'), { target: { value: 'recurring' } }),
  );
  await click(button('Recurring'));
  expect(navigate).toHaveBeenCalledWith('subscriptions');
});
test('spending drilldowns exclude income and savings but respect all-history scope', async () => {
  const entries = [
    expense,
    { ...expense, id: 8, type: 'income', amount: 500 },
    { ...expense, id: 9, expense_category: 'saving', amount: 20 },
  ];
  await render(
    <Transactions
      ledger={{ entries }}
      month={new Date(2026, 8, 1)}
      params={
        new URLSearchParams({
          view: 'transactions',
          spending: 'true',
          category: 'Housing',
          history: 'all',
        })
      }
      setParams={jest.fn()}
      onEdit={jest.fn()}
      onAdd={jest.fn()}
      notify={jest.fn()}
    />,
  );
  expect(container.querySelectorAll('tbody tr')).toHaveLength(1);
  expect(container.textContent).toContain('All history');
  expect(container.textContent).toContain('$1,200.00');
});
