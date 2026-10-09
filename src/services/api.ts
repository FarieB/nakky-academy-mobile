import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";

const API = axios.create({
  baseURL: "https://api.nakkyacademy.co.za/api",
  timeout: 120000,
  headers: {
    "Content-Type": "application/json",
  },
});

// =====================================================
// REQUEST INTERCEPTOR
// Automatically attach the saved authentication token
// to every API request.
// =====================================================

API.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem("token");

      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error(
        "API TOKEN ERROR:",
        error
      );
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// =====================================================
// RESPONSE INTERCEPTOR
// Keep API errors consistent and visible during testing.
// =====================================================

API.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response) {
      console.error(
        "API ERROR:",
        error.response.status,
        error.response.data
      );
    } else if (error.request) {
      console.error(
        "API REQUEST ERROR:",
        error.message
      );
    } else {
      console.error(
        "API ERROR:",
        error.message
      );
    }

    return Promise.reject(error);
  }
);

export default API;