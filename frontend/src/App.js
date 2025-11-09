import React, { useState, useEffect } from 'react';
import './App.css';
import BudgetForm from './components/BudgetForm';
import BudgetList from './components/BudgetList';
import BudgetSummary from './components/BudgetSummary';
import BudgetSettings from './components/BudgetSettings';
import { getEntries, createEntry, updateEntry, deleteEntry, getSummary } from './services/api';

function App() {
  const [entries, setEntries] = useState([]);
  const [summary, setSummary] = useState({ total_income: 0, total_expenses: 0, balance: 0 });
  const [editingEntry, setEditingEntry] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [entriesData, summaryData] = await Promise.all([
        getEntries(),
        getSummary()
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

  if (loading) {
    return (
      <div className="app">
        <div className="loading">Loading...</div>
      </div>
    );
  }

  return (
    <div className="app">
      <div className="container">
        <div className="app-header">
          <h1 className="app-title">💰 Budget Tracker</h1>
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

export default App;

