import React, { useEffect, useRef, useState } from 'react';
import { ALLOCATIONS, CATEGORIES, dateKey, money } from '../lib/finance';
import Icon, { Brand } from './Icon';
import { Merchant } from './Overview';

export function Modal({ children, onClose, title, className = '' }) {
  const ref = useRef(null);
  useEffect(() => {
    const dialog = ref.current;
    dialog.showModal();
    const handler = (event) => {
      event.preventDefault();
      onClose();
    };
    dialog.addEventListener('cancel', handler);
    return () => {
      dialog.removeEventListener('cancel', handler);
      dialog.close();
    };
  }, [onClose]);
  return (
    <dialog
      ref={ref}
      className={`modal ${className}`}
      aria-label={title}
      onClick={(e) => {
        if (e.target === ref.current) {
          const rect = ref.current.getBoundingClientRect();
          if (
            e.clientX < rect.left ||
            e.clientX > rect.right ||
            e.clientY < rect.top ||
            e.clientY > rect.bottom
          )
            onClose();
        }
      }}
    >
      <div className="modal-header">
        <div>
          <span className="eyebrow">A LITTLE MORE INTENTIONAL</span>
          <h2>{title}</h2>
        </div>
        <button className="icon-button" aria-label="Close dialog" onClick={onClose}>
          <Icon name="close" />
        </button>
      </div>
      {children}
    </dialog>
  );
}
export function EntryDialog({ entry, month, ledger, onClose, notify }) {
  const [form, setForm] = useState(
    () =>
      entry || {
        description: '',
        amount: '',
        category: 'Food & drink',
        date: dateKey(
          new Date(
            month.getFullYear(),
            month.getMonth(),
            Math.min(
              new Date().getDate(),
              new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate(),
            ),
          ),
        ),
        type: 'expense',
        expense_category: 'want',
      },
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [deleting, setDeleting] = useState(false);
  const field = (e) => setForm({ ...form, [e.target.name]: e.target.value });
  const save = async (e) => {
    e.preventDefault();
    setError('');
    const amount = Number(form.amount);
    if (
      !form.description.trim() ||
      !Number.isFinite(amount) ||
      amount <= 0 ||
      amount > 999999999.99 ||
      Math.abs(amount * 100 - Math.round(amount * 100)) > 0.0001
    ) {
      setError('Enter a description and a positive amount with up to two decimal places.');
      return;
    }
    setBusy(true);
    try {
      await ledger.saveEntry(
        {
          description: form.description.trim(),
          amount,
          category: form.category,
          date: form.date,
          type: form.type,
          expense_category: form.type === 'expense' ? form.expense_category : null,
        },
        entry?.id,
      );
      notify(
        entry
          ? 'Transaction updated. Your money picture is up to date.'
          : 'Transaction added. A little more clarity.',
      );
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'We couldn’t save this transaction. Please try again.');
    } finally {
      setBusy(false);
    }
  };
  const remove = async () => {
    setBusy(true);
    setError('');
    try {
      await ledger.removeEntry(entry.id);
      notify('Transaction deleted. Your totals have been updated.');
      onClose();
    } catch (_) {
      setError('We couldn’t delete this transaction. Please try again.');
    } finally {
      setBusy(false);
    }
  };
  return (
    <Modal title={entry ? 'The details matter.' : 'Make it count.'} onClose={onClose}>
      <form onSubmit={save} className="entry-form">
        <div className="segmented type-segment">
          <button
            type="button"
            className={form.type === 'expense' ? 'selected' : ''}
            aria-pressed={form.type === 'expense'}
            onClick={() =>
              form.type !== 'expense' &&
              setForm({
                ...form,
                type: 'expense',
                category: 'Food & drink',
                expense_category: 'want',
              })
            }
          >
            <Icon name="up" size={16} />
            Money out
          </button>
          <button
            type="button"
            className={form.type === 'income' ? 'selected' : ''}
            aria-pressed={form.type === 'income'}
            onClick={() =>
              form.type !== 'income' &&
              setForm({ ...form, type: 'income', category: 'Salary', expense_category: null })
            }
          >
            <Icon name="down" size={16} />
            Money in
          </button>
        </div>
        <label className="form-field">
          Amount{' '}
          <span className="amount-input">
            <span>$</span>
            <input
              autoFocus
              name="amount"
              type="number"
              inputMode="decimal"
              min="0.01"
              max="999999999.99"
              step="0.01"
              required
              value={form.amount}
              onChange={field}
              placeholder="0.00"
            />
          </span>
        </label>
        <label className="form-field">
          Merchant or description
          <input
            name="description"
            value={form.description}
            onChange={field}
            required
            maxLength={200}
            placeholder={form.type === 'income' ? 'e.g. Monthly salary' : 'e.g. Sunday groceries'}
          />
        </label>
        <div className="form-columns">
          <label className="form-field">
            Category
            <select
              name="category"
              value={form.category}
              onChange={(e) =>
                setForm({
                  ...form,
                  category: e.target.value,
                  expense_category: e.target.value === 'Savings' ? 'saving' : form.expense_category,
                })
              }
            >
              {[...new Set([form.category, ...CATEGORIES])].filter(Boolean).map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </label>
          <label className="form-field">
            Date
            <input
              type="date"
              name="date"
              min="1900-01-01"
              max="9999-12-31"
              required
              value={form.date}
              onChange={field}
            />
          </label>
        </div>
        {form.type === 'expense' && (
          <fieldset className="allocation-fieldset">
            <legend>Which part of your plan?</legend>
            <div>
              {ALLOCATIONS.map((a) => (
                <label className={form.expense_category === a.key ? 'checked' : ''} key={a.key}>
                  <input
                    type="radio"
                    name="expense_category"
                    value={a.key}
                    checked={form.expense_category === a.key}
                    onChange={field}
                  />
                  <span className="allocation-dot" style={{ background: a.color }} />
                  {a.label}
                </label>
              ))}
            </div>
          </fieldset>
        )}
        {error && (
          <div className="form-error" role="alert">
            {error}
          </div>
        )}
        {deleting && (
          <div className="delete-confirmation">
            <p>
              Delete “{entry.description}” for {money(entry.amount, 2)}? This removes it from all
              your totals.
            </p>
            <button className="button danger" type="button" disabled={busy} onClick={remove}>
              Yes, delete transaction
            </button>
            <button
              className="text-button"
              type="button"
              disabled={busy}
              onClick={() => setDeleting(false)}
            >
              Keep it
            </button>
          </div>
        )}
        <div className="modal-footer">
          {entry && (
            <button
              type="button"
              className="icon-button delete-button"
              title="Delete transaction"
              disabled={busy}
              onClick={() => setDeleting(true)}
            >
              <Icon name="trash" size={18} />
            </button>
          )}
          <button type="button" className="button secondary" disabled={busy} onClick={onClose}>
            Cancel
          </button>
          <button className="button primary" disabled={busy}>
            {busy ? 'Saving…' : entry ? 'Save changes' : 'Add transaction'}
            <Icon name="check" size={16} />
          </button>
        </div>
      </form>
    </Modal>
  );
}
export function SettingsDialog({ ledger, onClose, notify }) {
  const [form, setForm] = useState({
    needs_percentage: ledger.settings.needs_percentage,
    wants_percentage: ledger.settings.wants_percentage,
    savings_percentage: ledger.settings.savings_percentage,
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const total = Object.values(form).reduce((s, v) => s + Number(v), 0);
  const valid =
    Object.values(form).every(
      (v) => v !== '' && Number.isFinite(Number(v)) && v >= 0 && v <= 100,
    ) && Math.abs(total - 100) < 0.001;
  const save = async (e) => {
    e.preventDefault();
    if (!valid) return;
    setBusy(true);
    setError('');
    try {
      await ledger.saveSettings(
        Object.fromEntries(Object.entries(form).map(([key, value]) => [key, Number(value)])),
      );
      notify('Your plan has a new balance.');
      onClose();
    } catch (_) {
      setError('We couldn’t save your budget. Please try again.');
    } finally {
      setBusy(false);
    }
  };
  return (
    <Modal title="Your money. Your balance." onClose={onClose}>
      <form className="settings-form" onSubmit={save}>
        <p className="modal-description">
          Choose how much of your recorded income goes to each part of life. Your allocations should
          add up to 100%.
        </p>
        {ALLOCATIONS.map((a) => (
          <label className="setting-row" key={a.key}>
            <span className="allocation-dot" style={{ background: a.color }} />
            <span>
              <strong>{a.label}</strong>
              <small>{a.description}</small>
            </span>
            <span className="percentage-input">
              <input
                aria-label={`${a.label} percentage`}
                type="number"
                min="0"
                max="100"
                step="1"
                required
                value={form[a.setting]}
                onChange={(e) => setForm({ ...form, [a.setting]: e.target.value })}
              />
              %
            </span>
          </label>
        ))}
        <div className={`allocation-total ${valid ? '' : 'warning-text'}`}>
          <span>Total allocation</span>
          <strong>
            {Number.isFinite(total) ? total : 0}% {valid && <Icon name="check" size={16} />}
          </strong>
        </div>
        <button
          type="button"
          className="text-button"
          onClick={() =>
            setForm({ needs_percentage: 50, wants_percentage: 30, savings_percentage: 20 })
          }
        >
          Use the 50 / 30 / 20 starting point
        </button>
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        <div className="modal-footer">
          <button className="button secondary" type="button" onClick={onClose}>
            Cancel
          </button>
          <button className="button primary" disabled={!valid || busy}>
            {busy ? 'Saving…' : 'Save your plan'}
            <Icon name="check" size={16} />
          </button>
        </div>
      </form>
    </Modal>
  );
}
export function CommandDialog({ ledger, onClose, navigate, onEdit, onAdd }) {
  const [q, setQ] = useState('');
  const matches = ledger.entries
    .filter((e) => q && `${e.description} ${e.category}`.toLowerCase().includes(q.toLowerCase()))
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 6);
  const routes = ['overview', 'transactions', 'budgets', 'subscriptions', 'forecast'].filter((v) =>
    `${v} ${v === 'subscriptions' ? 'recurring' : ''}`.includes(q.toLowerCase()),
  );
  return (
    <Modal title="Find your way." className="command-modal" onClose={onClose}>
      <label className="command-search">
        <Icon name="search" size={21} />
        <input
          autoFocus
          placeholder="Search transactions or jump to a page…"
          aria-label="Search workspace"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <kbd>esc</kbd>
      </label>
      <div className="command-results">
        {routes.length > 0 && <span className="nav-label">GO TO</span>}
        {routes.map((v) => (
          <button
            key={v}
            className="command-result"
            onClick={() => {
              onClose();
              navigate(v);
            }}
          >
            <Icon name={v} />
            <strong>{v === 'subscriptions' ? 'Recurring' : v[0].toUpperCase() + v.slice(1)}</strong>
            <Icon name="arrow" size={16} />
          </button>
        ))}
        {q && <span className="nav-label">MATCHING TRANSACTIONS · ALL MONTHS</span>}
        {matches.map((e) => (
          <button key={e.id} className="command-result" onClick={() => onEdit(e)}>
            <Merchant entry={e} />
            <span>
              <strong>{e.description}</strong>
              <small>{e.date}</small>
            </span>
            <strong>{money(e.amount, 2)}</strong>
          </button>
        ))}
        {q && !matches.length && (
          <p className="no-results">No matching transactions. Try a merchant or category.</p>
        )}
        <button className="command-result add-result" onClick={onAdd}>
          <Icon name="plus" />
          <strong>Add a transaction</strong>
          <kbd>N</kbd>
        </button>
      </div>
    </Modal>
  );
}
export function AboutDialog({ isDemo, reset, onClose, notify }) {
  const [confirm, setConfirm] = useState(false);
  return (
    <Modal title="A little clarity, every day." onClose={onClose}>
      <div className="about-content">
        <Brand />
        <p>
          Tally is a personal finance workspace for understanding where your money goes—and making
          room for what comes next.
        </p>
        <div className="about-feature">
          <Icon name="shield" />
          <div>
            <strong>{isDemo ? 'A safe place to try things.' : 'A workspace that’s yours.'}</strong>
            <p>
              {isDemo
                ? 'This demo uses sample data saved in this browser. It never connects to a bank or moves money. Creating an account starts a separate, empty workspace.'
                : 'Your account is backed by the Tally server. Entries and budget settings belong to your signed-in account.'}
            </p>
          </div>
        </div>
        <div className="keyboard-help">
          <span>
            Find anything <kbd>⌘ / Ctrl K</kbd>
          </span>
          <span>
            New transaction <kbd>N</kbd>
          </span>
          <span>
            Close a dialog <kbd>Esc</kbd>
          </span>
        </div>
        {isDemo && (
          <div className="reset-demo">
            <h3>A clean slate?</h3>
            <p>Resetting replaces all demo edits with a fresh sample workspace.</p>
            {confirm ? (
              <div className="inline-actions">
                <button
                  className="button danger"
                  onClick={() => {
                    reset();
                    notify('Demo reset. Ready for a fresh look.');
                    onClose();
                  }}
                >
                  Reset demo data
                </button>
                <button className="button secondary" onClick={() => setConfirm(false)}>
                  Keep my changes
                </button>
              </div>
            ) : (
              <button className="button secondary" onClick={() => setConfirm(true)}>
                <Icon name="subscriptions" size={16} />
                Reset demo
              </button>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
}
