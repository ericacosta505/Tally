import React, { useState, useEffect } from 'react';
import './BudgetSettings.css';
import { getSettings, updateSettings } from '../services/api';

const BudgetSettings = ({ onUpdate }) => {
  const [settings, setSettings] = useState({
    needs_percentage: 50,
    wants_percentage: 30,
    savings_percentage: 20
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const data = await getSettings();
      setSettings({
        needs_percentage: data.needs_percentage || 50,
        wants_percentage: data.wants_percentage || 30,
        savings_percentage: data.savings_percentage || 20
      });
    } catch (error) {
      console.error('Error loading settings:', error);
      setMessage('Error loading settings');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field, value) => {
    const numValue = parseFloat(value) || 0;
    setSettings(prev => ({
      ...prev,
      [field]: numValue
    }));
    setMessage('');
  };

  const handleBlur = () => {
    // Auto-adjust to ensure sum is 100
    const total = settings.needs_percentage + settings.wants_percentage + settings.savings_percentage;
    if (Math.abs(total - 100) > 0.01) {
      // Distribute the difference proportionally
      const diff = 100 - total;
      const needs = settings.needs_percentage + (diff * (settings.needs_percentage / total));
      const wants = settings.wants_percentage + (diff * (settings.wants_percentage / total));
      const savings = settings.savings_percentage + (diff * (settings.savings_percentage / total));
      
      setSettings({
        needs_percentage: Math.round(needs * 100) / 100,
        wants_percentage: Math.round(wants * 100) / 100,
        savings_percentage: Math.round(savings * 100) / 100
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const total = settings.needs_percentage + settings.wants_percentage + settings.savings_percentage;
    
    if (Math.abs(total - 100) > 0.01) {
      setMessage('Percentages must sum to 100%');
      return;
    }

    try {
      setSaving(true);
      setMessage('');
      await updateSettings(settings);
      setMessage('Settings saved successfully!');
      if (onUpdate) {
        onUpdate();
      }
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Error saving settings:', error);
      setMessage(error.response?.data?.error || 'Error saving settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="budget-settings">
        <div className="loading">Loading settings...</div>
      </div>
    );
  }

  const total = settings.needs_percentage + settings.wants_percentage + settings.savings_percentage;
  const isValid = Math.abs(total - 100) < 0.01;

  return (
    <div className="budget-settings">
      <h2>Budget Settings</h2>
      <p className="settings-description">
        Set the percentage of your income you want to allocate to Needs, Wants, and Savings.
        The percentages must sum to 100%.
      </p>
      
      <form onSubmit={handleSubmit} className="settings-form">
        <div className="settings-inputs">
          <div className="setting-group needs">
            <label htmlFor="needs_percentage">Needs (%)</label>
            <input
              type="number"
              id="needs_percentage"
              value={settings.needs_percentage}
              onChange={(e) => handleChange('needs_percentage', e.target.value)}
              onBlur={handleBlur}
              min="0"
              max="100"
              step="0.1"
              className="setting-input"
            />
          </div>
          
          <div className="setting-group wants">
            <label htmlFor="wants_percentage">Wants (%)</label>
            <input
              type="number"
              id="wants_percentage"
              value={settings.wants_percentage}
              onChange={(e) => handleChange('wants_percentage', e.target.value)}
              onBlur={handleBlur}
              min="0"
              max="100"
              step="0.1"
              className="setting-input"
            />
          </div>
          
          <div className="setting-group savings">
            <label htmlFor="savings_percentage">Savings (%)</label>
            <input
              type="number"
              id="savings_percentage"
              value={settings.savings_percentage}
              onChange={(e) => handleChange('savings_percentage', e.target.value)}
              onBlur={handleBlur}
              min="0"
              max="100"
              step="0.1"
              className="setting-input"
            />
          </div>
        </div>
        
        <div className="settings-total">
          <span className={`total-label ${isValid ? 'valid' : 'invalid'}`}>
            Total: {total.toFixed(1)}%
          </span>
        </div>
        
        {message && (
          <div className={`settings-message ${message.includes('Error') ? 'error' : 'success'}`}>
            {message}
          </div>
        )}
        
        <button 
          type="submit" 
          className="btn-save-settings"
          disabled={!isValid || saving}
        >
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
      </form>
    </div>
  );
};

export default BudgetSettings;

