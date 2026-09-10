import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  ArcElement,
} from 'chart.js';
import { Line, Doughnut } from 'react-chartjs-2';
import { dailySpending, money, monthLabel } from '../lib/finance';
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  ArcElement,
);
export function SpendingChart({ entries, previous, month, previousMonth }) {
  const current = dailySpending(entries, month);
  const previousValues = dailySpending(previous, previousMonth);
  const data = {
    labels: current.map((_, i) => String(i + 1).padStart(2, '0')),
    datasets: [
      {
        label: monthLabel(month),
        data: current,
        borderColor: '#2f3930',
        borderWidth: 2.5,
        pointRadius: 0,
        pointHoverRadius: 5,
        pointHoverBackgroundColor: '#c6ed74',
        pointHoverBorderWidth: 3,
        tension: 0.2,
        fill: true,
        backgroundColor: (context) => {
          const chart = context.chart;
          if (!chart.chartArea) return 'rgba(198,237,116,.2)';
          const gradient = chart.ctx.createLinearGradient(
            0,
            chart.chartArea.top,
            0,
            chart.chartArea.bottom,
          );
          gradient.addColorStop(0, 'rgba(198,237,116,.38)');
          gradient.addColorStop(1, 'rgba(198,237,116,.01)');
          return gradient;
        },
      },
      {
        label: monthLabel(previousMonth),
        data: current.map((_, i) => previousValues[Math.min(i, previousValues.length - 1)]),
        borderColor: '#bcc0b6',
        borderWidth: 1.7,
        borderDash: [4, 5],
        pointRadius: 0,
        tension: 0.2,
      },
    ],
  };
  const options = {
    maintainAspectRatio: false,
    responsive: true,
    interaction: { mode: 'index', intersect: false },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#20251d',
        padding: 12,
        displayColors: true,
        callbacks: {
          title: (items) =>
            `${month.toLocaleDateString('en-US', { month: 'short' })} ${Number(items[0].label)}`,
          label: (item) => `${item.dataset.label}: ${money(item.parsed.y, 2)}`,
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        border: { display: false },
        ticks: { maxTicksLimit: 7, maxRotation: 0, color: '#8b8e86', font: { size: 11 } },
      },
      y: {
        beginAtZero: true,
        border: { display: false, dash: [3, 5] },
        grid: { color: '#ebede6', drawTicks: false },
        ticks: {
          count: 5,
          padding: 12,
          color: '#8b8e86',
          font: { size: 11 },
          callback: (value) => (value >= 1000 ? `$${value / 1000}k` : `$${value}`),
        },
      },
    },
  };
  return (
    <div className="spending-chart">
      <Line
        data={data}
        options={options}
        role="img"
        aria-label={`Cumulative spending for ${monthLabel(month)} compared with ${monthLabel(previousMonth)}`}
      />
    </div>
  );
}
export function AllocationRing({ spending, income }) {
  const percentage = income > 0 ? Math.round((spending / income) * 100) : 0;
  return (
    <div className="ring-wrap">
      <Doughnut
        data={{
          datasets: [
            {
              data: [Math.max(0, spending), Math.max(0, income - spending) || (spending ? 0 : 1)],
              backgroundColor: ['#c6ed74', '#edeFE8'],
              borderWidth: 0,
              borderRadius: 3,
              spacing: 4,
            },
          ],
        }}
        options={{
          cutout: '84%',
          rotation: -90,
          circumference: 180,
          maintainAspectRatio: false,
          plugins: { tooltip: { enabled: false } },
        }}
        role="img"
        aria-label={`${percentage}% of income spent`}
      />
      <div className="ring-label">
        <strong>
          {percentage}
          <span>%</span>
        </strong>
        <span>of income spent</span>
      </div>
    </div>
  );
}
