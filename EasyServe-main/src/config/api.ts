import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// ⚠️ CHANGE THIS BASED ON YOUR SETUP
const getBaseURL = () => {
  if (Platform.OS === 'android') {
    // For Android Emulator
    return 'http://192.168.100.6:5000/api';
  }
  else if (Platform.OS === 'ios') {
    // For iOS Simulator
    return 'http://localhost:5000/api';
  }
  else {
    // For web
    return 'http://localhost:5000/api';
  }
};

// 🔥 FOR PHYSICAL DEVICE (VERY IMPORTANT!)
// Find your computer's IP address and use it:
// Windows: Run `ipconfig` in cmd, look for "IPv4 Address"
// Mac/Linux: Run `ifconfig` or `ip addr`, look for "inet"
// Example: export const API_BASE_URL = 'http://192.168.1.5:5000/api';

export const API_BASE_URL = getBaseURL();
// 👆 OR manually set: export const API_BASE_URL = 'http://YOUR_IP:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 second timeout
});

// Add token to requests automatically
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('userToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    console.log('📤 API Request:', config.method?.toUpperCase(), config.url);
    return config;
  },
  (error) => {
    console.error('❌ Request Error:', error);
    return Promise.reject(error);
  }
);

// Handle response errors
api.interceptors.response.use(
  (response) => {
    console.log('✅ API Response:', response.config.url, response.status);
    return response;
  },
  async (error) => {
    console.error('❌ API Error:', error.config?.url, error.message);

    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
    } else if (error.request) {
      console.error('No response received:', error.request);
    }

    if (error.response?.status === 401) {
      // Token expired or invalid
      await AsyncStorage.removeItem('userToken');
      await AsyncStorage.removeItem('userData');
    }
    return Promise.reject(error);
  }
);

export default api;