import axios from "axios";

// URL base del backend FastAPI.
// Si en algún momento cambia (despliegue, otro puerto, etc.),
// solo se modifica en este único lugar.
const API_BASE_URL = "http://127.0.0.1:8000";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// INTERCEPTOR DE REQUEST
// Antes de cada petición, si existe un token guardado, agregarlo
// automáticamente al header Authorization.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// INTERCEPTOR DE RESPONSE
// Si el backend responde 401 (token vencido o inválido),
// limpiar la sesión guardada y mandar al login.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("usuario");
      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export default api;