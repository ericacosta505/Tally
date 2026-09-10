import React from 'react';
import { ALLOCATIONS, categoryTotals, inMonth, money, summarize } from '../lib/finance';
import Icon from './Icon';
import { SpendingChart, AllocationRing } from './Charts';
export function Merchant({ entry }) {
  const config = {
    'Whole Foods Market': ['W', 'forest'],
    'Trader Joe’s': ['TJ', 'red'],
    Spotify: ['≋', 'green'],
    Figma: ['F', 'purple'],
    Notion: ['N', 'ink'],
    Netflix: ['N', 'red'],
    Apple: ['A', 'neutral'],
    Adobe: ['A', 'red'],
    Uber: ['U', 'ink'],
    'Acme Studio': ['a', 'lime'],
    'Freelance project': ['↗', 'lime'],
  }[entry.description];
  return (
    <span
      className={`merchant-icon ${config?.[1] || (entry.expense_category === 'saving' ? 'lime' : 'neutral')}`}
    >
      {config ? (
        config[0]
      ) : (
        <Icon
          name={
            entry.category === 'Housing'
              ? 'home'
              : entry.category === 'Food & drink'
                ? 'coffee'
                : entry.category === 'Shopping' || entry.category === 'Groceries'
                  ? 'bag'
                  : entry.expense_category === 'saving'
                    ? 'spark'
                    : 'wallet'
          }
          size={18}
        />
      )}
    </span>
  );
}
export function Empty({
  title = 'A fresh start.',
  text = 'Add your first transaction to bring your money into focus.',
  action,
}) {
  return (
    <div className="empty-state">
      <span className="empty-icon">
        <Icon name="wallet" size={26} />
      </span>
      <h3>{title}</h3>
      <p>{text}</p>
      {action}
    </div>
  );
}
export function TransactionTable({ entries, onEdit, compact = false }) {
  if (!entries.length)
    return <Empty title="Nothing here just yet." text="Try another filter or add a transaction." />;
  return (
    <div className="table-scroll">
      <table className={`transaction-table ${compact ? 'compact' : ''}`}>
        <thead>
          <tr>
            <th>Transaction</th>
            <th>Category</th>
            <th>Date</th>
            <th className="amount-cell">Amount</th>
            <th>
              <span className="sr-only">Edit</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {entries.map((entry) => (
            <tr key={entry.id}>
              <td>
                <button className="merchant-button" onClick={() => onEdit(entry)}>
                  <Merchant entry={entry} />
                  <span>
                    <strong>{entry.description}</strong>
                    <small>
                      {entry.type === 'income'
                        ? 'Money in'
                        : entry.expense_category === 'saving'
                          ? 'Savings transfer'
                          : 'Personal expense'}
                    </small>
                  </span>
                </button>
              </td>
              <td>
                <span className="category-tag">{entry.category}</span>
              </td>
              <td className="date-cell">
                {new Date(`${entry.date}T12:00:00`).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                })}
              </td>
              <td className={`amount-cell ${entry.type === 'income' ? 'positive' : ''}`}>
                {entry.type === 'income' ? '+' : '−'}
                {money(entry.amount, 2)}
              </td>
              <td>
                <button
                  className="row-edit icon-button"
                  title={`Edit ${entry.description}`}
                  onClick={() => onEdit(entry)}
                >
                  <Icon name="chevron" size={15} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
export default function Overview({ ledger, month, navigate, onEdit, onAdd, onSettings }) {
  const entries = inMonth(ledger.entries, month);
  const previousMonth = new Date(month.getFullYear(), month.getMonth() - 1, 1);
  const previous = inMonth(ledger.entries, previousMonth);
  const totals = summarize(entries);
  const prevTotals = summarize(
    previous.filter(
      (e) =>
        Number(e.date.slice(8)) <=
        (new Date().getMonth() === month.getMonth() &&
        new Date().getFullYear() === month.getFullYear()
          ? new Date().getDate()
          : 31),
    ),
  );
  const difference =
    prevTotals.spending > 0
      ? Math.round(((totals.spending - prevTotals.spending) / prevTotals.spending) * 100)
      : null;
  const categories = categoryTotals(entries);
  const recent = [...entries]
    .sort((a, b) => b.date.localeCompare(a.date) || String(b.id).localeCompare(String(a.id)))
    .slice(0, 5);
  return (
    <>
      <div className="metrics-grid">
        <div className="metric metric-featured">
          <div className="metric-label">
            Available this month <Icon name="wallet" size={18} />
          </div>
          <strong className="metric-value">{money(totals.available, 2)}</strong>
          <div className="metric-footer">
            <span className="metric-pip" /> After spending & savings
          </div>
        </div>
        <div className="metric">
          <div className="metric-label">
            Money in <Icon name="down" size={17} />
          </div>
          <strong className="metric-value">{money(totals.income, 2)}</strong>
          <div className="metric-footer">
            <span>
              From {entries.filter((e) => e.type === 'income').length} income{' '}
              {entries.filter((e) => e.type === 'income').length === 1 ? 'source' : 'sources'}
            </span>
          </div>
        </div>
        <div className="metric">
          <div className="metric-label">
            Money out <Icon name="up" size={17} />
          </div>
          <strong className="metric-value">{money(totals.spending, 2)}</strong>
          <div className="metric-footer">
            {difference !== null ? (
              <>
                <span className={`delta ${difference <= 0 ? 'good' : 'bad'}`}>
                  {difference <= 0 ? '↘' : '↗'} {Math.abs(difference)}%
                </span>
                <span>vs. prior month to date</span>
              </>
            ) : (
              <span>Excludes savings transfers</span>
            )}
          </div>
        </div>
        <div className="metric">
          <div className="metric-label">
            Set aside <Icon name="spark" size={17} />
          </div>
          <strong className="metric-value">{money(totals.savings, 2)}</strong>
          <div className="metric-footer">
            <span className="mini-progress">
              <i
                style={{
                  width: `${Math.min(100, totals.income ? (totals.savings / ((totals.income * ledger.settings.savings_percentage) / 100 || 1)) * 100 : 0)}%`,
                }}
              />
            </span>
            <span>
              {totals.income ? Math.round((totals.savings / totals.income) * 100) : 0}% of income
            </span>
          </div>
        </div>
      </div>
      <div className="overview-middle">
        <section className="panel spending-panel">
          <div className="panel-heading">
            <div>
              <h2>The bigger picture</h2>
              <p>A little perspective on your spending.</p>
            </div>
            <span className="subtle-tag">Cumulative spend</span>
          </div>
          {entries.length ? (
            <>
              <div className="chart-summary">
                <strong>{money(totals.spending, 2)}</strong>
                <span>spent this month</span>
                <div className="chart-legend">
                  <span>
                    <i />
                    This month
                  </span>
                  <span>
                    <i />
                    Last month
                  </span>
                </div>
              </div>
              <SpendingChart
                entries={entries}
                previous={previous}
                month={month}
                previousMonth={previousMonth}
              />
            </>
          ) : (
            <Empty
              action={
                <button className="button primary" onClick={onAdd}>
                  Add a transaction
                </button>
              }
            />
          )}
        </section>
        <section className="panel allocation-panel">
          <div className="panel-heading">
            <h2>Where it goes</h2>
            <button
              className="icon-button"
              title="View spending transactions"
              onClick={() => navigate('transactions', { spending: 'true' })}
            >
              <Icon name="up" size={18} />
            </button>
          </div>
          <AllocationRing spending={totals.spending} income={totals.income} />
          <div className="category-list">
            {categories.slice(0, 3).map((category, i) => (
              <button
                key={category.name}
                onClick={() =>
                  navigate('transactions', { category: category.name, spending: 'true' })
                }
              >
                <span>
                  <i style={{ background: ['#343c2d', '#b4c68e', '#bac4ec'][i] }} />
                  {category.name}
                </span>
                <strong>{money(category.amount)}</strong>
              </button>
            ))}
            {categories.length > 3 && (
              <button
                onClick={() =>
                  navigate('transactions', {
                    spending: 'true',
                    categories: categories
                      .slice(3)
                      .map((c) => c.name)
                      .join('|'),
                  })
                }
              >
                <span>
                  <i style={{ background: '#e1e4da' }} />
                  Everything else
                </span>
                <strong>{money(categories.slice(3).reduce((s, c) => s + c.amount, 0))}</strong>
              </button>
            )}
          </div>
        </section>
      </div>
      <div className="overview-bottom">
        <section className="panel recent-panel">
          <div className="panel-heading">
            <div>
              <h2>Life, lately</h2>
              <p>Your most recent transactions.</p>
            </div>
            <button className="text-button" onClick={() => navigate('transactions')}>
              View all <Icon name="arrow" size={16} />
            </button>
          </div>
          <TransactionTable entries={recent} onEdit={onEdit} compact />
        </section>
        <div className="right-stack">
          <section className="insight-card">
            <div className="eyebrow">
              <Icon name="spark" size={15} /> A LITTLE FORESIGHT
            </div>
            <h2>
              Good habits.
              <br />
              Better tomorrows.
            </h2>
            <p>See what your everyday spending means for the end of the month.</p>
            <button className="text-button" onClick={() => navigate('forecast')}>
              Explore your forecast <Icon name="arrow" size={17} />
            </button>
            <div className="insight-track" aria-hidden="true">
              <i />
              <i />
              <i />
              <i />
              <i />
              <i />
              <i />
              <i />
              <i />
              <i />
              <i />
              <i />
              <i />
              <i />
              <i />
              <i />
            </div>
          </section>
          <section className="panel mini-budget">
            <div className="panel-heading">
              <h2>A plan with balance</h2>
              <button className="icon-button" title="Edit budget allocation" onClick={onSettings}>
                <Icon name="settings" size={17} />
              </button>
            </div>
            <div className="allocation-bar">
              {ALLOCATIONS.map((a) => (
                <span
                  key={a.key}
                  style={{ width: `${ledger.settings[a.setting]}%`, background: a.color }}
                />
              ))}
            </div>
            <div className="allocation-labels">
              {ALLOCATIONS.map((a) => (
                <span key={a.key}>
                  {a.label}
                  <strong>{ledger.settings[a.setting]}%</strong>
                </span>
              ))}
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
