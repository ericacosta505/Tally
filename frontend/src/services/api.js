import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const getEntries = async () => {
  const response = await api.get('/entries');
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

export const getSummary = async () => {
  const response = await api.get('/summary');
  return response.data;
};

export const healthCheck = async () => {
  const response = await api.get('/health');
  return response.data;
};

