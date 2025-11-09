import axios from 'axios';

const resolveDefaultBaseUrl = () => {
  if (process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL;
  }
  if (typeof window === 'undefined') {
    return 'http://127.0.0.1:5000/api';
  }

  const { protocol, port } = window.location;

  // When running via `npm start` (port 3000) talk to the Flask dev server directly via 127.0.0.1
  // so we avoid IPv6/localhost resolution quirks.
  if (port === '3000') {
    return `${protocol}//127.0.0.1:5000/api`;
  }

  // For production builds served alongside the backend, use a relative path.
  return '/api';
};

const API_BASE_URL = resolveDefaultBaseUrl().replace(/\/$/, '');

if (process.env.NODE_ENV !== 'production') {
  // Helpful when debugging connectivity issues locally.
  console.info(`[BudgetTracker] Using API base URL: ${API_BASE_URL}`);
}

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const getEntries = async (month = null, year = null) => {
  const params = {};
  if (month !== null && year !== null) {
    params.month = month;
    params.year = year;
  }
  const response = await api.get('/entries', { params });
  return response.data;
};

export const createEntry = async (entryData) => {
  const response = await api.post('/entries', entryData);
  return response.data;
};

export const updateEntry = async (id, entryData) => {
  const response = await api.put(`/entries/${id}`, entryData);
  return response.data;
};

export const deleteEntry = async (id) => {
  const response = await api.delete(`/entries/${id}`);
  return response.data;
};

export const getSummary = async (month = null, year = null) => {
  const params = {};
  if (month !== null && year !== null) {
    params.month = month;
    params.year = year;
  }
  const response = await api.get('/summary', { params });
  return response.data;
};

export const healthCheck = async () => {
  const response = await api.get('/health');
  return response.data;
};

export const getSettings = async () => {
  const response = await api.get('/settings');
  return response.data;
};

export const updateSettings = async (settingsData) => {
  const response = await api.put('/settings', settingsData);
  return response.data;
};
