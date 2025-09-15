// backendConfig.js (or globals.js)

export const BACKEND_URL =
  import.meta.env.VITE_BACKEND_API_URL || "https://tfeye-prod.onrender.com";

export const globals = {
  BASE_URL: BACKEND_URL,
};
