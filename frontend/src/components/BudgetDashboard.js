import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import BudgetForm from './BudgetForm';
import BudgetList from './BudgetList';
import BudgetSummary from './BudgetSummary';
import BudgetSettings from './BudgetSettings';
import { getEntries, createEntry, updateEntry, deleteEntry, getSummary } from '../services/api';
import './BudgetDashboard.css';

function BudgetDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  
  // Initialize with current month
  const getCurrentMonth = () => {
    const now = new Date();
    return { month: now.getMonth() + 1, year: now.getFullYear() };
  };

  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth());
  const [entries, setEntries] = useState([]);
  const [summary, setSummary] = useState({ total_income: 0, total_expenses: 0, balance: 0 });
  const [editingEntry, setEditingEntry] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Check if month has changed and update automatically
  useEffect(() => {
    const checkMonthChange = () => {
      const current = getCurrentMonth();
      setSelectedMonth(prev => {
        // Only update if the actual current month is different from what we're viewing
        if (current.month !== prev.month || current.year !== prev.year) {
          return current;
        }
        return prev;
      });
    };

    // Check on mount and set up interval to check periodically
    checkMonthChange();
    const interval = setInterval(checkMonthChange, 60000); // Check every minute

    return () => clearInterval(interval);
  }, []); // Empty dependency array - only run on mount

  useEffect(() => {
    loadData();
  }, [selectedMonth]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [entriesData, summaryData] = await Promise.all([
        getEntries(selectedMonth.month, selectedMonth.year),
        getSummary(selectedMonth.month, selectedMonth.year)
      ]);
      setEntries(entriesData);
      setSummary(summaryData);
    } catch (error) {
      console.error('Error loading data:', error);
      const errorMessage = error.response 
        ? `Error: ${error.response.status} - ${error.response.statusText}`
        : error.code === 'ECONNREFUSED' || error.message.includes('Network Error')
        ? 'Cannot connect to backend server. Make sure the Flask server is running on http://localhost:5000'
        : 'Error loading data. Please check the console for details.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const navigateMonth = (direction) => {
    setSelectedMonth(prev => {
      let newMonth = prev.month + direction;
      let newYear = prev.year;
      
      if (newMonth < 1) {
        newMonth = 12;
        newYear -= 1;
      } else if (newMonth > 12) {
        newMonth = 1;
        newYear += 1;
      }
      
      return { month: newMonth, year: newYear };
    });
  };

  const goToCurrentMonth = () => {
    setSelectedMonth(getCurrentMonth());
  };

  const formatMonthYear = (month, year) => {
    const date = new Date(year, month - 1);
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  const handleCreate = async (entryData) => {
    try {
      const newEntry = await createEntry(entryData);
      setEntries([newEntry, ...entries]);
      await loadData();
      return true;
    } catch (error) {
      console.error('Error creating entry:', error);
      alert('Error creating entry');
      return false;
    }
  };

  const handleUpdate = async (id, entryData) => {
    try {
      const updatedEntry = await updateEntry(id, entryData);
      setEntries(entries.map(entry => entry.id === id ? updatedEntry : entry));
      await loadData();
      setEditingEntry(null);
      return true;
    } catch (error) {
      console.error('Error updating entry:', error);
      alert('Error updating entry');
      return false;
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this entry?')) {
      try {
        await deleteEntry(id);
        setEntries(entries.filter(entry => entry.id !== id));
        await loadData();
      } catch (error) {
        console.error('Error deleting entry:', error);
        alert('Error deleting entry');
      }
    }
  };

  const handleEdit = (entry) => {
    setEditingEntry(entry);
  };

  const handleCancelEdit = () => {
    setEditingEntry(null);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="app">
        <div className="loading">Loading...</div>
      </div>
    );
  }

  const currentMonth = getCurrentMonth();
  const isCurrentMonth = selectedMonth.month === currentMonth.month && selectedMonth.year === currentMonth.year;

  return (
    <div className="app">
      <div className="container">
        <div className="app-header">
          <div className="header-left">
            <h1 className="app-title">💰 Budget Tracker</h1>
            {user && (
              <div className="user-info">
                <span className="user-name">{user.first_name} {user.last_name}</span>
                <button className="logout-btn" onClick={handleLogout}>Logout</button>
              </div>
            )}
          </div>
          <div className="month-navigation">
            <button 
              className="month-nav-btn" 
              onClick={() => navigateMonth(-1)}
              title="Previous month"
            >
              ←
            </button>
            <div className="month-display">
              <span className="month-text">{formatMonthYear(selectedMonth.month, selectedMonth.year)}</span>
              {!isCurrentMonth && (
                <button 
                  className="current-month-btn" 
                  onClick={goToCurrentMonth}
                  title="Go to current month"
                >
                  Today
                </button>
              )}
            </div>
            <button 
              className="month-nav-btn" 
              onClick={() => navigateMonth(1)}
              title="Next month"
            >
              →
            </button>
          </div>
        </div>
        
        {error && (
          <div className="error-banner">
            <strong>⚠️ Connection Error:</strong> {error}
            <div className="error-help">
              <p>To start the backend server:</p>
              <ol>
                <li>Open a terminal and navigate to the <code>backend</code> directory</li>
                <li>Activate your virtual environment: <code>source venv/bin/activate</code></li>
                <li>Run: <code>python app.py</code></li>
              </ol>
              <button onClick={loadData} className="btn-retry">Retry Connection</button>
            </div>
          </div>
        )}
        
        <div className="dashboard-grid">
          <div className="summary-full-width">
            <BudgetSummary summary={summary} />
          </div>
          
          <div className="form-container">
            <BudgetForm
              onSubmit={editingEntry ? (data) => handleUpdate(editingEntry.id, data) : handleCreate}
              editingEntry={editingEntry}
              onCancel={handleCancelEdit}
            />
          </div>
          
          <div className="entries-container">
            <BudgetList
              entries={entries}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          </div>
          
          <div className="settings-container">
            <BudgetSettings onUpdate={loadData} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default BudgetDashboard;

