import React, { useState, useEffect } from 'react';
import './BudgetSettings.css';
import { getSettings, updateSettings } from '../services/api';

const BudgetSettings = ({ onUpdate }) => {
  const [settings, setSettings] = useState({
    needs_percentage: 50,
    wants_percentage: 30,
    savings_percentage: 20
  });
  const [inputValues, setInputValues] = useState({
    needs_percentage: '50',
    wants_percentage: '30',
    savings_percentage: '20'
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
      const needs = data.needs_percentage || 50;
      const wants = data.wants_percentage || 30;
      const savings = data.savings_percentage || 20;
      
      setSettings({
        needs_percentage: needs,
        wants_percentage: wants,
        savings_percentage: savings
      });
      setInputValues({
        needs_percentage: needs.toString(),
        wants_percentage: wants.toString(),
        savings_percentage: savings.toString()
      });
    } catch (error) {
      console.error('Error loading settings:', error);
      setMessage('Error loading settings');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field, value) => {
    // Allow empty string, single decimal point, or valid numbers
    if (value === '' || value === '.' || /^-?\d*\.?\d*$/.test(value)) {
      setInputValues(prev => ({
        ...prev,
        [field]: value
      }));
      
      // Update numeric value only if it's a valid number
      const numValue = value === '' || value === '.' ? null : parseFloat(value);
      if (numValue !== null && !isNaN(numValue)) {
        setSettings(prev => ({
          ...prev,
          [field]: numValue
        }));
      }
      setMessage('');
    }
  };

  const handleBlur = (field) => {
    // Get the current input value
    const inputValue = inputValues[field];
    
    // If empty or invalid, set to 0
    let numValue = 0;
    if (inputValue && inputValue !== '.' && inputValue !== '') {
      const parsed = parseFloat(inputValue);
      if (!isNaN(parsed)) {
        numValue = Math.max(0, Math.min(100, parsed)); // Clamp between 0 and 100
      }
    }
    
    // Update both input and numeric values (no auto-adjustment)
    setInputValues(prev => ({
      ...prev,
      [field]: numValue.toString()
    }));
    setSettings(prev => ({
      ...prev,
      [field]: numValue
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Normalize all fields before submitting
    const normalizedSettings = {};
    Object.keys(inputValues).forEach(field => {
      const inputValue = inputValues[field];
      let numValue = 0;
      if (inputValue && inputValue !== '.' && inputValue !== '') {
        const parsed = parseFloat(inputValue);
        if (!isNaN(parsed)) {
          numValue = Math.max(0, Math.min(100, parsed));
        }
      }
      normalizedSettings[field] = numValue;
    });
    
    // Update both state objects
    setSettings(normalizedSettings);
    setInputValues({
      needs_percentage: normalizedSettings.needs_percentage.toString(),
      wants_percentage: normalizedSettings.wants_percentage.toString(),
      savings_percentage: normalizedSettings.savings_percentage.toString()
    });
    
    const total = normalizedSettings.needs_percentage + normalizedSettings.wants_percentage + normalizedSettings.savings_percentage;
    
    if (Math.abs(total - 100) > 0.01) {
      setMessage('Percentages must sum to 100%');
      return;
    }

    try {
      setSaving(true);
      setMessage('');
      await updateSettings(normalizedSettings);
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

  // Calculate total from current input values for real-time feedback
  const calculateTotal = () => {
    let total = 0;
    Object.keys(inputValues).forEach(key => {
      const value = inputValues[key];
      if (value && value !== '' && value !== '.') {
        const num = parseFloat(value);
        if (!isNaN(num)) {
          total += num;
        }
      } else {
        // Use settings value if input is empty
        total += settings[key] || 0;
      }
    });
    return total;
  };
  
  const total = calculateTotal();
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
              type="text"
              id="needs_percentage"
              value={inputValues.needs_percentage}
              onChange={(e) => handleChange('needs_percentage', e.target.value)}
              onBlur={() => handleBlur('needs_percentage')}
              placeholder="0"
              className="setting-input"
            />
          </div>
          
          <div className="setting-group wants">
            <label htmlFor="wants_percentage">Wants (%)</label>
            <input
              type="text"
              id="wants_percentage"
              value={inputValues.wants_percentage}
              onChange={(e) => handleChange('wants_percentage', e.target.value)}
              onBlur={() => handleBlur('wants_percentage')}
              placeholder="0"
              className="setting-input"
            />
          </div>
          
          <div className="setting-group savings">
            <label htmlFor="savings_percentage">Savings (%)</label>
            <input
              type="text"
              id="savings_percentage"
              value={inputValues.savings_percentage}
              onChange={(e) => handleChange('savings_percentage', e.target.value)}
              onBlur={() => handleBlur('savings_percentage')}
              placeholder="0"
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

