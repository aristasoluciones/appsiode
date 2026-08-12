import axios from 'axios';
import { API_ENDPOINTS } from './endpoints';
import { getCsrfToken } from './axios-client';

// Cliente de autenticación: browser → API .NET directo (sin proxy BFF).
// Las cookies HttpOnly (AccessToken/RefreshToken) viajan con withCredentials;
// la API debe tener CORS con credenciales habilitado para el origen del frontend.
const authClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
});

authClient.interceptors.request.use((config) => {
  if (['post', 'put', 'delete', 'patch'].includes(config.method ?? '')) {
    const csrfToken = getCsrfToken();
    if (csrfToken) config.headers['X-CSRF-TOKEN'] = csrfToken;
  }
  return config;
});

let isRefreshing = false;
let refreshQueue: Array<(success: boolean) => void> = [];

function processQueue(success: boolean) {
  refreshQueue.forEach((cb) => cb(success));
  refreshQueue = [];
}

authClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Solo reintentar en 401, una sola vez, y no en llamadas de auth propias
    if (
      error?.response?.status !== 401 ||
      originalRequest._retry ||
      originalRequest.url === API_ENDPOINTS.AUTH.REFRESH ||
      originalRequest.url === API_ENDPOINTS.AUTH.PERFIL
    ) {
      return Promise.reject(error);
    }

    // Si ya hay un refresh en curso, encolar y esperar
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        refreshQueue.push((success) => {
          if (success) resolve(authClient(originalRequest));
          else reject(error);
        });
      });
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      await authClient.post(API_ENDPOINTS.AUTH.REFRESH);
      processQueue(true);
      return authClient(originalRequest);
    } catch {
      // El refresh falló — dejar que el llamador (auth-provider) maneje
      // el estado de sesión. No redirigir aquí para no colisionar con el router.
      processQueue(false);
      return Promise.reject(error);
    } finally {
      isRefreshing = false;
    }
  },
);

export default authClient;
