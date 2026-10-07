import axios from "axios";

const API = axios.create({
  baseURL: "https://api.nakkyacademy.co.za/api",
  timeout: 120000,
});

export default API;