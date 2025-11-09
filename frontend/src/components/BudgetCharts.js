import React from 'react';
import { Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend
} from 'chart.js';
import './BudgetCharts.css';

// Register Chart.js components
ChartJS.register(ArcElement, Tooltip, Legend);

const BudgetCharts = ({ summary }) => {
  const {
    needs_expenses = 0,
    wants_expenses = 0,
    savings_expenses = 0,
    uncategorized_expenses = 0,
    needs_target = 0,
    wants_target = 0,
    savings_target = 0,
    total_expenses = 0
  } = summary;

  // Calculate consumption amounts (how much of each target has been consumed)
  const needsConsumed = needs_target > 0 ? Math.min(needs_expenses, needs_target) : 0;
  const wantsConsumed = wants_target > 0 ? Math.min(wants_expenses, wants_target) : 0;
  const savingsConsumed = savings_target > 0 ? Math.min(savings_expenses, savings_target) : 0;
  
  // Calculate overspending (amounts over target)
  const needsOverspent = Math.max(0, needs_expenses - needs_target);
  const wantsOverspent = Math.max(0, wants_expenses - wants_target);
  const savingsOverspent = Math.max(0, savings_expenses - savings_target);
  
  // Calculate remaining amounts
  const needsRemaining = Math.max(0, needs_target - needs_expenses);
  const wantsRemaining = Math.max(0, wants_target - wants_expenses);
  const savingsRemaining = Math.max(0, savings_target - savings_expenses);

  // Data for actual spending breakdown pie chart
  const spendingData = {
    labels: ['Needs', 'Wants', 'Savings', 'Uncategorized'],
    datasets: [
      {
        label: 'Spending Breakdown',
        data: [
          needs_expenses,
          wants_expenses,
          savings_expenses,
          uncategorized_expenses
        ],
        backgroundColor: [
          'rgba(231, 76, 60, 0.8)',   // Red for Needs
          'rgba(243, 156, 18, 0.8)',  // Orange for Wants
          'rgba(39, 174, 96, 0.8)',   // Green for Savings
          'rgba(149, 165, 166, 0.8)'  // Gray for Uncategorized
        ],
        borderColor: [
          'rgba(231, 76, 60, 1)',
          'rgba(243, 156, 18, 1)',
          'rgba(39, 174, 96, 1)',
          'rgba(149, 165, 166, 1)'
        ],
        borderWidth: 2
      }
    ]
  };

  // Create data for individual category consumption charts
  const createCategoryChartData = (consumed, remaining, overspent, target, categoryName, color) => {
    const labels = [];
    const data = [];
    const backgroundColor = [];
    const borderColor = [];
    
    // If there's overspending, show consumed (up to target) and overspent
    if (overspent > 0) {
      if (consumed > 0) {
        labels.push('Consumed');
        data.push(consumed);
        backgroundColor.push(color);
        borderColor.push(color.replace('0.8', '1'));
      }
      labels.push('Overspent');
      data.push(overspent);
      backgroundColor.push('rgba(192, 57, 43, 0.8)');  // Dark red for overspending
      borderColor.push('rgba(192, 57, 43, 1)');
    } else {
      // No overspending - show consumed and remaining
      if (consumed > 0) {
        labels.push('Consumed');
        data.push(consumed);
        backgroundColor.push(color);
        borderColor.push(color.replace('0.8', '1'));
      }
      
      if (remaining > 0) {
        labels.push('Remaining');
        data.push(remaining);
        backgroundColor.push('rgba(236, 240, 241, 0.8)');
        borderColor.push('rgba(189, 195, 199, 1)');
      }
    }
    
    // If no data at all but target exists, show full target as remaining
    if (data.length === 0 && target > 0) {
      labels.push('Remaining');
      data.push(target);
      backgroundColor.push('rgba(236, 240, 241, 0.8)');
      borderColor.push('rgba(189, 195, 199, 1)');
    }
    
    return {
      labels,
      datasets: [{
        label: `${categoryName} Budget`,
        data,
        backgroundColor,
        borderColor,
        borderWidth: 2
      }]
    };
  };

  // Create chart data for each category
  const needsChartData = createCategoryChartData(
    needsConsumed,
    needsRemaining,
    needsOverspent,
    needs_target,
    'Needs',
    'rgba(231, 76, 60, 0.8)'
  );

  const wantsChartData = createCategoryChartData(
    wantsConsumed,
    wantsRemaining,
    wantsOverspent,
    wants_target,
    'Wants',
    'rgba(243, 156, 18, 0.8)'
  );

  const savingsChartData = createCategoryChartData(
    savingsConsumed,
    savingsRemaining,
    savingsOverspent,
    savings_target,
    'Savings',
    'rgba(39, 174, 96, 0.8)'
  );

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          padding: 15,
          color: 'white',
          font: {
            size: 12
          },
          generateLabels: function(chart) {
            const data = chart.data;
            if (data.labels.length && data.datasets.length) {
              return data.labels.map((label, i) => {
                const value = data.datasets[0].data[i];
                const total = data.datasets[0].data.reduce((a, b) => a + b, 0);
                const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                
                return {
                  text: `${label}: $${value.toFixed(2)} (${percentage}%)`,
                  fillStyle: data.datasets[0].backgroundColor[i],
                  strokeStyle: data.datasets[0].borderColor[i],
                  lineWidth: data.datasets[0].borderWidth,
                  fontColor: '#ffffff',
                  color: '#ffffff',
                  hidden: false,
                  index: i
                };
              });
            }
            return [];
          }
        }
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            const label = context.label || '';
            const value = context.parsed || 0;
            const total = context.dataset.data.reduce((a, b) => a + b, 0);
            const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
            return `${label}: $${value.toFixed(2)} (${percentage}%)`;
          }
        }
      }
    }
  };

  // Options for category consumption charts
  const categoryChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          padding: 10,
          color: 'white',
          font: {
            size: 11
          },
          generateLabels: function(chart) {
            const data = chart.data;
            if (data.labels.length && data.datasets.length) {
              const total = data.datasets[0].data.reduce((a, b) => a + b, 0);
              return data.labels.map((label, i) => {
                const value = data.datasets[0].data[i];
                const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                
                return {
                  text: `${label}: $${value.toFixed(2)} (${percentage}%)`,
                  fillStyle: data.datasets[0].backgroundColor[i],
                  strokeStyle: data.datasets[0].borderColor[i],
                  lineWidth: data.datasets[0].borderWidth,
                  fontColor: '#ffffff',
                  color: '#ffffff',
                  hidden: false,
                  index: i
                };
              });
            }
            return [];
          }
        }
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            const label = context.label || '';
            const value = context.parsed || 0;
            const total = context.dataset.data.reduce((a, b) => a + b, 0);
            const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
            return `${label}: $${value.toFixed(2)} (${percentage}%)`;
          }
        }
      }
    }
  };

  // Don't show charts if there's no data
  if (total_expenses === 0 && needs_target === 0 && wants_target === 0 && savings_target === 0) {
    return null;
  }

  return (
    <div className="budget-charts">
      <h3>Spending Visualization</h3>
      <div className="charts-container">
        <div className="chart-wrapper">
          <h4>Actual Spending Breakdown</h4>
          <div className="chart-container">
            {total_expenses > 0 ? (
              <Pie data={spendingData} options={chartOptions} />
            ) : (
              <div className="no-data-message">No expenses recorded yet</div>
            )}
          </div>
        </div>
        
        {(needs_target > 0 || wants_target > 0 || savings_target > 0) && (
          <div className="chart-wrapper category-charts-wrapper">
            <h4>Budget Category Consumption</h4>
            <div className="category-charts-container">
              {needs_target > 0 && (
                <div className="category-chart-wrapper">
                  <h5>Needs</h5>
                  <div className="category-chart-info">
                    <span className="category-target">Target: ${needs_target.toFixed(2)}</span>
                    <span className="category-spent">Spent: ${needs_expenses.toFixed(2)}</span>
                  </div>
                  <div className="chart-container">
                    <Pie data={needsChartData} options={categoryChartOptions} />
                  </div>
                </div>
              )}
              
              {wants_target > 0 && (
                <div className="category-chart-wrapper">
                  <h5>Wants</h5>
                  <div className="category-chart-info">
                    <span className="category-target">Target: ${wants_target.toFixed(2)}</span>
                    <span className="category-spent">Spent: ${wants_expenses.toFixed(2)}</span>
                  </div>
                  <div className="chart-container">
                    <Pie data={wantsChartData} options={categoryChartOptions} />
                  </div>
                </div>
              )}
              
              {savings_target > 0 && (
                <div className="category-chart-wrapper">
                  <h5>Savings</h5>
                  <div className="category-chart-info">
                    <span className="category-target">Target: ${savings_target.toFixed(2)}</span>
                    <span className="category-spent">Spent: ${savings_expenses.toFixed(2)}</span>
                  </div>
                  <div className="chart-container">
                    <Pie data={savingsChartData} options={categoryChartOptions} />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BudgetCharts;

