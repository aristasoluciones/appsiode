import axios from 'axios';

let isRefreshing = false;
let refreshQueue: Array<(success: boolean) => void> = [];

function processQueue(success: boolean) {
  refreshQueue.forEach((cb) => cb(success));
  refreshQueue = [];
}

async function redirectToLogin() {
  if (typeof window === 'undefined') return;
  try {
    await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
  } catch { /* continuar aunque falle */ }
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';
  const currentPath = `${window.location.pathname}${window.location.search}`;
  window.location.replace(
    `${basePath}/signin?callbackUrl=${encodeURIComponent(currentPath)}`,
  );
}

const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
});

apiClient.interceptors.request.use((config) => {
  if (['post', 'put', 'delete', 'patch'].includes(config.method ?? '')) {
    const csrfToken = getCsrfToken();
    if (csrfToken) config.headers['X-CSRF-TOKEN'] = csrfToken;

    // Adjuntar dispositivo y mac a todo body de mutación
    const raw = config.data;
    const body = raw === undefined || raw === null
      ? {}
      : typeof raw === 'string'
        ? JSON.parse(raw)
        : raw;

    if (typeof body === 'object' && !Array.isArray(body)) {
      body.dispositivo = getDeviceName();
      body.mac = '';
      config.data = typeof raw === 'string' ? JSON.stringify(body) : body;
    }
  }
  return config;
});

// Unwrap the .NET API envelope: { status, message, data, isSuccess }
// After this interceptor, `response.data` is directly the payload (e.g. IRol[])
apiClient.interceptors.response.use((response) => {
  if (
    response.data !== null &&
    typeof response.data === 'object' &&
    'isSuccess' in response.data
  ) {
    response.data = response.data.data;
  }
  return response;
}, async (error) => {
  const originalRequest = error.config;

  if (
    error?.response?.status !== 401 ||
    originalRequest._retry
  ) {
    return Promise.reject(error);
  }

  // Si ya hay un refresh en curso, encolar y esperar
  if (isRefreshing) {
    return new Promise((resolve, reject) => {
      refreshQueue.push((success) => {
        if (success) resolve(apiClient(originalRequest));
        else reject(error);
      });
    });
  }

  originalRequest._retry = true;
  isRefreshing = true;

  try {
    const refreshRes = await fetch('/api/auth/refresh', { method: 'POST', credentials: 'include' });
    if (!refreshRes.ok) throw new Error('Refresh failed');
    processQueue(true);
    return apiClient(originalRequest);
  } catch {
    processQueue(false);
    await redirectToLogin();
    return Promise.reject(error);
  } finally {
    isRefreshing = false;
  }
});

function getCsrfToken(): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(/(?:^|;\s*)X-CSRF-TOKEN=([^;]*)/);
  return match ? decodeURIComponent(match[1]) : null;
}

/**
 * Devuelve el nombre del dispositivo.
 * Lee localStorage['dispositivo'] (resuelto por useDeviceName hook).
 * Si aún no está disponible, usa browser + plataforma como fallback.
 */
function getDeviceName(): string {
  if (typeof localStorage !== 'undefined') {
    const stored = localStorage.getItem('dispositivo');
    if (stored) return stored;
  }
  if (typeof navigator === 'undefined') return 'Servidor';
  const ua = navigator.userAgent;
  let browser = 'Navegador';
  if (ua.includes('Edg/'))          browser = 'Edge';
  else if (ua.includes('OPR/'))     browser = 'Opera';
  else if (ua.includes('Chrome/'))  browser = 'Chrome';
  else if (ua.includes('Firefox/')) browser = 'Firefox';
  else if (ua.includes('Safari/'))  browser = 'Safari';
  const platform = navigator.platform ?? '';
  return platform ? `${browser} (${platform})` : browser;
}

export default apiClient;
