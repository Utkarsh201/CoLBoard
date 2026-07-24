import axios from "axios";

const baseURL = import.meta.env.VITE_BACKEND_URL;


export const apiClient = axios.create({
  baseURL,
  withCredentials: true,
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers = config.headers || {};     
    if (!config.headers.Authorization) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

let isRefreshing = false;
let refreshQueue = [];
let tokenListeners = [];

export const addTokenListener = (cb) => {
  tokenListeners.push(cb);
  return () => {
    tokenListeners = tokenListeners.filter((listener) => listener !== cb);
  };
};

const notifyTokenListeners = (token) => {
  tokenListeners.forEach((cb) => {
    try {
      cb(token);
    } catch (err) {
      console.error("Failed to notify token listener:", err);
    }
  });
};

function resolveRefreshQueue(error, token) {
  refreshQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error);
    else resolve(token);
  });
  refreshQueue = [];
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const status = error?.response?.status;
    const originalRequest = error?.config;

    if (!originalRequest || status !== 401) {
      return Promise.reject(error);
    }

    const url = originalRequest?.url || "";
    if (url.includes("/user/refresh")) {
      return Promise.reject(error);
    }

    if (originalRequest._retry) {
      return Promise.reject(error);
    }
    originalRequest._retry = true;

    if (!baseURL) {
      return Promise.reject(error);
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        refreshQueue.push({ resolve, reject });
      }).then((newToken) => {
        originalRequest.headers = originalRequest.headers || {};
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return apiClient(originalRequest);
      });
    }

    isRefreshing = true;
    try {
      const refreshResponse = await axios.post(
        `${baseURL}/user/refresh`,
        {},
        { withCredentials: true }
      );

      const newToken = refreshResponse?.data?.data?.access_token;
      if (!newToken) {
        throw new Error("Refresh succeeded but no access_token returned");
      }

      localStorage.setItem("token", newToken);
      notifyTokenListeners(newToken);
      resolveRefreshQueue(null, newToken);

      originalRequest.headers = originalRequest.headers || {};
      originalRequest.headers.Authorization = `Bearer ${newToken}`;
      return apiClient(originalRequest);
    } catch (refreshError) {
      localStorage.removeItem("token");
      notifyTokenListeners("");
      resolveRefreshQueue(refreshError, null);
      window.location.href = "/login";
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);
