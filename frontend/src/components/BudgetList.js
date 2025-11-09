import React from 'react';
import './BudgetList.css';

const BudgetList = ({ entries, onEdit, onDelete }) => {
  if (entries.length === 0) {
    return (
      <div className="budget-list">
        <h2>Entries</h2>
        <div className="empty-state">
          <p>No entries yet. Add your first income or expense above!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="budget-list">
      <h2>Entries</h2>
      <div className="entries-table">
        <div className="table-header">
          <div className="table-cell">Date</div>
          <div className="table-cell">Description</div>
          <div className="table-cell">Category</div>
          <div className="table-cell">Type</div>
          <div className="table-cell">Expense Category</div>
          <div className="table-cell amount">Amount</div>
          <div className="table-cell actions">Actions</div>
        </div>
        {entries.map(entry => (
          <div key={entry.id} className="table-row">
            <div className="table-cell">{entry.date}</div>
            <div className="table-cell">{entry.description}</div>
            <div className="table-cell">{entry.category}</div>
            <div className="table-cell">
              <span className={`type-badge ${entry.type}`}>
                {entry.type}
              </span>
            </div>
            <div className="table-cell">
              {entry.type === 'expense' && entry.expense_category ? (
                <span className={`expense-category-badge ${entry.expense_category}`}>
                  {entry.expense_category.charAt(0).toUpperCase() + entry.expense_category.slice(1)}
                </span>
              ) : (
                <span className="expense-category-badge empty">-</span>
              )}
            </div>
            <div className={`table-cell amount ${entry.type}`}>
              {entry.type === 'income' ? '+' : '-'}${entry.amount.toFixed(2)}
            </div>
            <div className="table-cell actions">
              <button
                onClick={() => onEdit(entry)}
                className="btn-edit"
                title="Edit"
              >
                ✏️
              </button>
              <button
                onClick={() => onDelete(entry.id)}
                className="btn-delete"
                title="Delete"
              >
                🗑️
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default BudgetList;

