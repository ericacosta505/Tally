import React from 'react';
import './BudgetSummary.css';

const BudgetSummary = ({ summary }) => {
  const { 
    total_income, 
    total_expenses, 
    balance,
    needs_expenses = 0,
    wants_expenses = 0,
    savings_expenses = 0,
    uncategorized_expenses = 0,
    needs_target = 0,
    wants_target = 0,
    savings_target = 0
  } = summary;
  const isPositive = balance >= 0;

  const getProgressPercentage = (actual, target) => {
    if (target === 0) return 0;
    return Math.min((actual / target) * 100, 100);
  };

  const needsProgress = getProgressPercentage(needs_expenses, needs_target);
  const wantsProgress = getProgressPercentage(wants_expenses, wants_target);
  const savingsProgress = getProgressPercentage(savings_expenses, savings_target);

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
      
      {total_income > 0 && (
        <div className="needs-wants-savings-breakdown">
          <h3>Needs / Wants / Savings Breakdown</h3>
          <div className="breakdown-cards">
            <div className="breakdown-card needs">
              <div className="breakdown-header">
                <span className="breakdown-label">Needs</span>
                <span className="breakdown-amount">${needs_expenses.toFixed(2)}</span>
              </div>
              <div className="breakdown-target">
                Target: ${needs_target.toFixed(2)}
              </div>
              <div className="progress-bar">
                <div 
                  className="progress-fill needs-progress" 
                  style={{ width: `${needsProgress}%` }}
                ></div>
              </div>
              <div className="progress-text">{needsProgress.toFixed(1)}%</div>
            </div>
            
            <div className="breakdown-card wants">
              <div className="breakdown-header">
                <span className="breakdown-label">Wants</span>
                <span className="breakdown-amount">${wants_expenses.toFixed(2)}</span>
              </div>
              <div className="breakdown-target">
                Target: ${wants_target.toFixed(2)}
              </div>
              <div className="progress-bar">
                <div 
                  className="progress-fill wants-progress" 
                  style={{ width: `${wantsProgress}%` }}
                ></div>
              </div>
              <div className="progress-text">{wantsProgress.toFixed(1)}%</div>
            </div>
            
            <div className="breakdown-card savings">
              <div className="breakdown-header">
                <span className="breakdown-label">Savings</span>
                <span className="breakdown-amount">${savings_expenses.toFixed(2)}</span>
              </div>
              <div className="breakdown-target">
                Target: ${savings_target.toFixed(2)}
              </div>
              <div className="progress-bar">
                <div 
                  className="progress-fill savings-progress" 
                  style={{ width: `${savingsProgress}%` }}
                ></div>
              </div>
              <div className="progress-text">{savingsProgress.toFixed(1)}%</div>
            </div>
          </div>
          
          {uncategorized_expenses > 0 && (
            <div className="uncategorized-warning">
              ⚠️ ${uncategorized_expenses.toFixed(2)} in uncategorized expenses
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default BudgetSummary;

