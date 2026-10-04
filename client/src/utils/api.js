// In development, Vite proxies /api to the local backend (see vite.config.js).
// In production, set VITE_API_URL to the deployed backend URL, e.g.
//   VITE_API_URL=https://your-backend.vercel.app/api
const API_BASE = import.meta.env.VITE_API_URL || '/api';

export const fetchApi = async (endpoint, options = {}) => {
  const token = localStorage.getItem('token');
  
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers
  };

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'An error occurred during API request.');
  }

  return data;
};
