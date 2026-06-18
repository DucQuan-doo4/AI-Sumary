import axios from "axios";

const axiosClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:8000",
});

axiosClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

axiosClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("access_token");
      localStorage.removeItem("current_user");
      if (window.location.pathname !== "/login") {
        window.location.assign("/login");
      }
    }
    return Promise.reject(error);
  },
);

export default axiosClient;
