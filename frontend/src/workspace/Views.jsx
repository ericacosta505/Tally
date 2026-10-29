import React, { useMemo, useState } from 'react';
import {
  ALLOCATIONS,
  CATEGORIES,
  cents,
  csvFor,
  forecast,
  inMonth,
  money,
  monthLabel,
  recurringCharges,
  sum,
  summarize,
  upcomingCharges,
} from '../lib/finance';
import Icon from './Icon';
import { Empty, Merchant, TransactionTable } from './Overview';

export function Transactions({ ledger, month, params, setParams, onEdit, onAdd, notify }) {
  const search = params.get('q') || '';
  const category = params.get('category') || '';
  const type = params.get('type') || '';
  const allocation = params.get('allocation') || '';
  const sort = params.get('sort') || 'newest';
  const history = params.get('history') === 'all';
  const spendingOnly = params.get('spending') === 'true';
  const categorySetValue = params.get('categories') || '';
  const categorySet = useMemo(
    () => (categorySetValue ? categorySetValue.split('|') : null),
    [categorySetValue],
  );
  const update = (changes) => {
    const next = new URLSearchParams(params);
    Object.entries(changes).forEach(([key, value]) =>
      value ? next.set(key, value) : next.delete(key),
    );
    setParams(next, { replace: true });
  };
  const filtered = useMemo(
    () =>
      (history ? ledger.entries : inMonth(ledger.entries, month))
        .filter(
          (e) =>
            (!spendingOnly || (e.type === 'expense' && e.expense_category !== 'saving')) &&
            (!categorySet || categorySet.includes(e.category)) &&
            (!search ||
              `${e.description} ${e.category} ${e.amount}`
                .toLowerCase()
                .includes(search.toLowerCase())) &&
            (!category || e.category === category) &&
            (!type || e.type === type) &&
            (!allocation || e.expense_category === allocation),
        )
        .sort((a, b) =>
          sort === 'highest'
            ? b.amount - a.amount
            : sort === 'oldest'
              ? a.date.localeCompare(b.date)
              : b.date.localeCompare(a.date),
        ),
    [
      ledger.entries,
      month,
      search,
      category,
      type,
      allocation,
      sort,
      history,
      spendingOnly,
      categorySet,
    ],
  );
  const totals = summarize(filtered);
  const download = () => {
    const url = URL.createObjectURL(
      new Blob(['\uFEFF', csvFor(filtered)], { type: 'text/csv;charset=utf-8;' }),
    );
    const a = document.createElement('a');
    a.href = url;
    a.download = `tally-transactions-${history ? 'all-history-' : ''}${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, '0')}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    notify(`Exported ${filtered.length} transactions.`);
  };
  const hasFilters = search || category || type || allocation || spendingOnly || categorySet;
  return (
    <>
      <section className="panel transaction-workbench">
        <div className="workbench-header">
          <div>
            <h2>Every detail, accounted for.</h2>
            <p>Find it, understand it, make it yours.</p>
          </div>
          <button className="button secondary" onClick={download} disabled={!filtered.length}>
            <Icon name="download" size={16} />
            Export CSV
          </button>
        </div>
        <div className="filter-bar">
          <label className="search-input">
            <Icon name="search" size={18} />
            <input
              aria-label="Search transactions"
              placeholder="Search merchants, categories, amounts…"
              value={search}
              onChange={(e) => update({ q: e.target.value })}
            />
            {search && (
              <button
                className="icon-button"
                aria-label="Clear search"
                onClick={() => update({ q: '' })}
              >
                <Icon name="close" size={14} />
              </button>
            )}
          </label>
          <select
            aria-label="Filter by category"
            value={category}
            onChange={(e) => update({ category: e.target.value })}
          >
            <option value="">All categories</option>
            {CATEGORIES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
          <select
            aria-label="Filter by transaction type"
            value={type}
            onChange={(e) => update({ type: e.target.value })}
          >
            <option value="">Money in & out</option>
            <option value="income">Money in</option>
            <option value="expense">Money out</option>
          </select>
          <select
            aria-label="Transaction date range"
            value={history ? 'all' : 'month'}
            onChange={(e) => update({ history: e.target.value === 'all' ? 'all' : '' })}
          >
            <option value="month">Selected month</option>
            <option value="all">All history</option>
          </select>
          <select
            aria-label="Sort transactions"
            value={sort}
            onChange={(e) => update({ sort: e.target.value })}
          >
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
            <option value="highest">Largest amount</option>
          </select>
        </div>
        <div className="table-context">
          <span>
            {filtered.length} transactions <span className="context-separator">/</span>{' '}
            {history ? 'All history' : monthLabel(month)}
            {spendingOnly && <span className="filter-chip">Spending only</span>}
            {allocation && (
              <span className="filter-chip">
                {ALLOCATIONS.find((a) => a.key === allocation)?.label}
                <button title="Remove allocation filter" onClick={() => update({ allocation: '' })}>
                  <Icon name="close" size={12} />
                </button>
              </span>
            )}
          </span>
          {hasFilters && (
            <button className="text-button" onClick={() => setParams({ view: 'transactions' })}>
              Clear filters
            </button>
          )}
        </div>
        {filtered.length ? (
          <TransactionTable entries={filtered} onEdit={onEdit} />
        ) : (
          <Empty
            title={
              hasFilters ? 'No matches. Try a little less specific.' : 'Your month starts here.'
            }
            text={
              hasFilters
                ? 'Change your search or clear the filters to see more transactions.'
                : 'Add an income, an expense, or a little something for your future.'
            }
            action={
              <button className="button primary" onClick={onAdd}>
                <Icon name="plus" size={16} />
                Add transaction
              </button>
            }
          />
        )}
        <div className="table-totals">
          <span>Filtered totals</span>
          <span>
            In <strong className="positive">{money(totals.income, 2)}</strong>
          </span>
          <span>
            Out <strong>{money(totals.outflow, 2)}</strong>
          </span>
          <span>
            Net <strong>{money(totals.available, 2)}</strong>
          </span>
        </div>
      </section>
      <div className="quiet-note">
        <Icon name="info" size={15} />
        <span>
          Savings transfers count as money out here. On your overview, they’re shown separately from
          spending.
        </span>
      </div>
    </>
  );
}

export function Budgets({ ledger, month, onSettings, navigate }) {
  const entries = inMonth(ledger.entries, month);
  const totals = summarize(entries);
  const next = upcomingCharges(ledger.entries, month);
  return (
    <>
      <section className="budget-intro">
        <div className="budget-intro-copy">
          <span className="eyebrow">A PLAN FOR REAL LIFE</span>
          <h2>
            Give every dollar
            <br />a little direction.
          </h2>
          <p>Your essentials, your good times, your future. Build a balance that works for you.</p>
          <button className="button primary" onClick={onSettings}>
            <Icon name="settings" size={16} />
            Customize your plan
          </button>
        </div>
        <div className="budget-allocation-visual">
          <div className="big-allocation-bar">
            {ALLOCATIONS.map((a) => (
              <span key={a.key} style={{ flex: ledger.settings[a.setting], background: a.color }}>
                {ledger.settings[a.setting] > 10 ? `${ledger.settings[a.setting]}%` : ''}
              </span>
            ))}
          </div>
          <div className="budget-legend">
            {ALLOCATIONS.map((a) => (
              <span key={a.key}>
                <i style={{ background: a.color }} />
                {a.label} <strong>{ledger.settings[a.setting]}%</strong>
              </span>
            ))}
          </div>
          <div className="plan-total">
            <span>Built around this month’s income</span>
            <strong>{money(totals.income, 2)}</strong>
          </div>
        </div>
      </section>
      <div className="budget-grid">
        {ALLOCATIONS.map((a) => {
          const spent = sum(
            entries.filter((e) => e.type === 'expense' && e.expense_category === a.key),
          );
          const target =
            Math.round((cents(totals.income) * ledger.settings[a.setting]) / 100) / 100;
          const committed = sum(next.filter((e) => e.expense_category === a.key));
          const remaining = (cents(target) - cents(spent) - cents(committed)) / 100;
          const percent = target ? Math.round((spent / target) * 100) : spent ? 100 : 0;
          const saving = a.key === 'saving';
          const status = !totals.income
            ? 'Add income to set a target'
            : !target
              ? 'No income allocated'
              : saving
                ? spent >= target
                  ? 'Target reached'
                  : 'Building your future'
                : remaining < 0
                  ? 'Over your plan'
                  : (spent + committed) / target >= 0.8
                    ? 'Getting close'
                    : 'Room to breathe';
          return (
            <section className="panel budget-card" key={a.key}>
              <div className="budget-card-header">
                <span
                  className="budget-symbol"
                  style={{ background: a.color, color: a.key === 'need' ? '#fff' : '#364429' }}
                >
                  <Icon
                    name={a.key === 'need' ? 'home' : a.key === 'want' ? 'coffee' : 'spark'}
                    size={22}
                  />
                </span>
                <span className="subtle-tag">{ledger.settings[a.setting]}% allocation</span>
              </div>
              <h2>{a.label}</h2>
              <p>{a.description}</p>
              <div className="budget-spent">
                <strong>{money(spent, 2)}</strong>
                <span>of {money(target, 2)}</span>
              </div>
              <div className="budget-progress">
                <i
                  style={{
                    width: `${Math.min(100, percent)}%`,
                    background: !saving && remaining < 0 ? '#c78262' : a.color,
                  }}
                />
              </div>
              <div className="budget-status">
                <span className={!saving && remaining < 0 ? 'warning-text' : ''}>{status}</span>
                <strong>{percent}%</strong>
              </div>
              <div className="budget-detail">
                <span>{saving ? 'Left to set aside' : 'Upcoming recurring'}</span>
                <strong>{money(saving ? Math.max(0, target - spent) : committed, 2)}</strong>
              </div>
              {!saving && (
                <div className="budget-detail">
                  <span>Left after upcoming</span>
                  <strong className={remaining < 0 ? 'warning-text' : ''}>
                    {money(remaining, 2)}
                  </strong>
                </div>
              )}
              <button
                className="text-button"
                onClick={() => navigate('transactions', { allocation: a.key, type: 'expense' })}
              >
                Explore transactions <Icon name="arrow" size={16} />
              </button>
            </section>
          );
        })}
      </div>
      <div className="quiet-note">
        <Icon name="info" size={16} />
        <span>
          Targets use recorded income for the selected month. Upcoming amounts are estimates from
          repeat charges, not scheduled bank payments.
        </span>
      </div>
    </>
  );
}

export function Recurring({ ledger, navigate }) {
  const [tab, setTab] = useState('all');
  const [expanded, setExpanded] = useState(null);
  const charges = recurringCharges(ledger.entries);
  const filtered = charges.filter((e) => tab === 'all' || e.category === 'Subscriptions');
  const monthly = sum(charges);
  const subscriptions = sum(charges.filter((e) => e.category === 'Subscriptions'));
  const increases = charges.filter((e) => e.increase > 0);
  return (
    <>
      <div className="recurring-summary">
        <div className="panel">
          <span className="eyebrow">THE EVERY-MONTH KIND</span>
          <strong>
            {money(monthly, 2)}
            <small>/ month</small>
          </strong>
          <p>Estimated from {charges.length} recurring merchants</p>
        </div>
        <div className="panel">
          <span className="eyebrow">THE SMALL THINGS ADD UP</span>
          <strong>
            {money(subscriptions * 12, 2)}
            <small>/ year</small>
          </strong>
          <p>Annualized subscription spending</p>
        </div>
        <div className="panel recurring-insight">
          <Icon name="spark" size={22} />
          <h3>
            {increases.length
              ? `${increases.length} price ${increases.length === 1 ? 'change' : 'changes'} worth a look.`
              : 'No price increases spotted.'}
          </h3>
          <p>
            {increases.length
              ? 'Your latest charge is higher than the previous month. Open a merchant to see the details.'
              : 'We compare the latest monthly charges so you can spot a change early.'}
          </p>
        </div>
      </div>
      <section className="panel">
        <div className="recurring-toolbar">
          <div className="segmented" role="group" aria-label="Recurring charge type">
            <button
              className={tab === 'all' ? 'selected' : ''}
              aria-pressed={tab === 'all'}
              onClick={() => setTab('all')}
            >
              All recurring <span>{charges.length}</span>
            </button>
            <button
              className={tab === 'subscriptions' ? 'selected' : ''}
              aria-pressed={tab === 'subscriptions'}
              onClick={() => setTab('subscriptions')}
            >
              Subscriptions{' '}
              <span>{charges.filter((e) => e.category === 'Subscriptions').length}</span>
            </button>
          </div>
          <span className="secondary-text">Next expected charge</span>
        </div>
        {!filtered.length ? (
          <Empty
            title="Patterns take a little time."
            text="Add similar monthly charges across two months. Tally looks for the same merchant and category, 25–35 days apart."
          />
        ) : (
          <div className="recurring-list">
            {filtered.map((e) => (
              <div className="recurring-item" key={e.key}>
                <button
                  className="recurring-row"
                  onClick={() => setExpanded(expanded === e.key ? null : e.key)}
                  aria-expanded={expanded === e.key}
                >
                  <Merchant entry={e} />
                  <span className="recurring-merchant">
                    <strong>{e.description}</strong>
                    <small>{e.category}</small>
                  </span>
                  {e.increase > 0 && <span className="price-alert">+{money(e.increase, 2)}</span>}
                  <span className="next-charge">
                    {new Date(`${e.nextDate}T12:00:00`).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                    })}
                    <small>Estimated</small>
                  </span>
                  <strong className="recurring-amount">
                    {money(e.amount, 2)}
                    <small>/ month</small>
                  </strong>
                  <Icon
                    name="chevronDown"
                    size={16}
                    className={expanded === e.key ? 'rotated' : ''}
                  />
                </button>
                {expanded === e.key && (
                  <div className="recurring-evidence">
                    <div>
                      <h4>Why this looks recurring</h4>
                      <p>
                        The same merchant and category appeared 25–35 days apart. Your next date is
                        estimated from the most recent charge.
                      </p>
                      {e.increase > 0 && (
                        <p className="warning-text">
                          Up from {money(e.previousAmount, 2)} to {money(e.amount, 2)}. This may be
                          a price change or a one-off charge.
                        </p>
                      )}
                    </div>
                    <div className="evidence-charges">
                      {e.evidence.map((entry) => (
                        <span key={entry.id}>
                          <time dateTime={entry.date}>
                            {new Date(`${entry.date}T12:00:00`).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })}
                          </time>
                          <strong>{money(entry.amount, 2)}</strong>
                        </span>
                      ))}
                    </div>
                    <button
                      className="text-button"
                      onClick={() => navigate('transactions', { q: e.description, history: 'all' })}
                    >
                      View matching transactions <Icon name="arrow" size={16} />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
      <div className="quiet-note">
        <Icon name="info" size={16} />
        <span>
          These are detected patterns, not connected subscriptions. Tally doesn’t cancel services or
          move money. Confirm charges with the merchant.
        </span>
      </div>
    </>
  );
}

export function Forecast({ ledger, month }) {
  const [reduction, setReduction] = useState(0);
  const projection = forecast(ledger.entries, month, ledger.settings, reduction);
  const baseline = forecast(ledger.entries, month, ledger.settings, 0);
  if (!projection.hasData)
    return (
      <section className="panel">
        <Empty
          title="First, a little history."
          text="Record income and spending for this month to see a projection based on your actual activity."
        />
      </section>
    );
  const max = Math.max(
    Math.abs(projection.available),
    Math.abs(baseline.projectedBalance),
    Math.abs(projection.projectedBalance),
    1,
  );
  const y = (value) => Math.max(30, Math.min(170, 100 - (value / max) * 70));
  return (
    <>
      <div className="forecast-layout">
        <section className="panel forecast-main">
          <div className="panel-heading">
            <div>
              <span className="eyebrow">YOUR NEXT CHAPTER, IN NUMBERS</span>
              <h2>A little foresight. A lot more freedom.</h2>
            </div>
            <span className="subtle-tag">{projection.remaining} days ahead</span>
          </div>
          <div className="forecast-value">
            <span>Projected month-end available</span>
            <strong className={projection.projectedBalance < 0 ? 'warning-text' : ''}>
              {money(projection.projectedBalance, 2)}
            </strong>
            <p>
              {reduction
                ? `${money(projection.potentialSavings, 2)} more breathing room with your scenario.`
                : 'Based on your recorded income, spending pace, and recurring charges.'}
            </p>
          </div>
          <div className="forecast-visual">
            <svg
              viewBox="0 0 600 210"
              role="img"
              aria-label={`Available now ${money(projection.available)}. Baseline month-end ${money(baseline.projectedBalance)}. Scenario month-end ${money(projection.projectedBalance)}.`}
            >
              <defs>
                <linearGradient id="forecast-fill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#d7eeac" stopOpacity=".6" />
                  <stop offset="100%" stopColor="#d7eeac" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path d="M20 45H580M20 100H580M20 160H580" stroke="#e7ecdf" strokeDasharray="3 5" />
              <path
                d={`M20 ${y(projection.available)} L570 ${y(projection.projectedBalance)} L570 185 L20 185Z`}
                fill="url(#forecast-fill)"
              />
              <path
                d={`M20 ${y(projection.available)} L570 ${y(baseline.projectedBalance)}`}
                stroke="#b7bda9"
                strokeWidth="2"
                strokeDasharray="5 5"
              />
              <path
                d={`M20 ${y(projection.available)} L570 ${y(projection.projectedBalance)}`}
                stroke="#657f44"
                strokeWidth="3"
              />
              <circle cx="20" cy={y(projection.available)} r="5" fill="#394b2b" />
              <circle
                cx="570"
                cy={y(projection.projectedBalance)}
                r="6"
                fill="#c6ed74"
                stroke="#657f44"
                strokeWidth="2"
              />
              <text x="20" y="208" fontSize="12" fill="#939d86">
                Recorded balance
              </text>
              <text x="490" y="208" fontSize="12" fill="#939d86">
                Month end
              </text>
            </svg>
          </div>
          <div className="forecast-key">
            <span>
              <i />
              Your scenario
            </span>
            <span>
              <i />
              Current pace
            </span>
          </div>
          <div className="forecast-breakdown">
            <div>
              <span>Available now</span>
              <strong>{money(projection.available, 2)}</strong>
            </div>
            <span>−</span>
            <div>
              <span>Upcoming recurring</span>
              <strong>{money(projection.committed, 2)}</strong>
            </div>
            <span>−</span>
            <div>
              <span>Projected other spending</span>
              <strong>{money(projection.projectedVariable, 2)}</strong>
            </div>
          </div>
        </section>
        <section className="scenario-card">
          <span className="scenario-icon">
            <Icon name="settings" size={23} />
          </span>
          <span className="eyebrow">THE WHAT-IF CORNER</span>
          <h2>
            Small shifts.
            <br />
            Real possibilities.
          </h2>
          <p>
            What if you spent a little less on the non-recurring things for the rest of the month?
          </p>
          <label className="slider-label" htmlFor="reduction">
            Reduce future variable spending <strong>{reduction}%</strong>
          </label>
          <input
            id="reduction"
            type="range"
            min="0"
            max="50"
            step="5"
            value={reduction}
            disabled={!projection.remaining}
            onChange={(e) => setReduction(Number(e.target.value))}
          />
          <div className="range-labels">
            <span>Same pace</span>
            <span>50% less</span>
          </div>
          <div className="scenario-saving">
            <span>You could keep an extra</span>
            <strong>{money(projection.potentialSavings, 2)}</strong>
            <small>by the end of this month</small>
          </div>
          <button
            className="button secondary"
            disabled={reduction === 0}
            onClick={() => setReduction(0)}
          >
            Reset scenario
          </button>
        </section>
      </div>
      <details className="panel assumptions" open>
        <summary>
          <Icon name="info" size={18} />A forecast you can understand
        </summary>
        <div>
          <p>
            <strong>Recorded income only.</strong> We don’t assume more income is coming. Savings
            already set aside stay separate.
          </p>
          <p>
            <strong>Known patterns + your daily pace.</strong> We add estimated recurring charges
            due this month, then project other spending using the average from {projection.elapsed}{' '}
            elapsed {projection.elapsed === 1 ? 'day' : 'days'}. Already entered future charges are
            included once; future non-recurring entries reduce the amount still projected. The
            slider changes only unrecorded future spending.
          </p>
          <p>
            <strong>A scenario, not a prediction.</strong> The line connects today’s recorded
            balance to the month-end estimate; it isn’t a daily balance forecast. Early-month
            averages and irregular purchases can skew the result. No money is moved.
          </p>
        </div>
      </details>
    </>
  );
}
