import React from 'react';
import './BudgetSummary.css';

const BudgetSummary = ({ summary }) => {
  const { total_income, total_expenses, balance } = summary;
  const isPositive = balance >= 0;

  return (
    <div className="budget-summary">
      <h2>Summary</h2>
      <div className="summary-cards">
        <div className="summary-card income">
          <div className="card-label">Total Income</div>
          <div className="card-value income-value">${total_income.toFixed(2)}</div>
        </div>
        <div className="summary-card expense">
          <div className="card-label">Total Expenses</div>
          <div className="card-value expense-value">${total_expenses.toFixed(2)}</div>
        </div>
        <div className={`summary-card balance ${isPositive ? 'positive' : 'negative'}`}>
          <div className="card-label">Balance</div>
          <div className={`card-value ${isPositive ? 'positive-value' : 'negative-value'}`}>
            ${balance.toFixed(2)}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BudgetSummary;

