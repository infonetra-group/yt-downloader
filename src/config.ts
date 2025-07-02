// API Configuration
const isDevelopment = import.meta.env.DEV;

export const API_BASE_URL = isDevelopment 
  ? 'http://localhost:8000' 
  : 'https://your-railway-app-name.railway.app'; // Replace with your actual Railway URL

export const API_ENDPOINTS = {
  metadata: `${API_BASE_URL}/metadata`,
  download: `${API_BASE_URL}/download`,
  health: `${API_BASE_URL}/health`
};