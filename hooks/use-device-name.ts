'use client';

import { useEffect } from 'react';

const STORAGE_KEY = 'dispositivo';

/**
 * Detecta el nombre del navegador + plataforma como identificador del dispositivo.
 */
function getBrowserName(): string {
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

/**
 * Obtiene la IP del cliente consultando la ruta API de Next.js.
 * El servidor lee x-forwarded-for / x-real-ip, que son fiables
 * a diferencia de WebRTC (Chrome bloquea la IP local con mDNS).
 */
async function resolveDeviceName(): Promise<string> {
  try {
    const res = await fetch('/api/device');
    if (!res.ok) throw new Error('fetch failed');
    const data = (await res.json()) as { ip?: string };
    const ip = data.ip;
    const browser = getBrowserName();
    return ip ? `${browser} (${ip})` : browser;
  } catch {
    return getBrowserName();
  }
}

/**
 * Hook que resuelve el nombre del dispositivo una vez por sesión
 * y lo almacena en localStorage para que el interceptor de axios lo use.
 */
export function useDeviceName() {
  useEffect(() => {
    if (localStorage.getItem(STORAGE_KEY)) return; // ya resuelto

    resolveDeviceName().then((name) => {
      if (name) localStorage.setItem(STORAGE_KEY, name);
    });
  }, []);
}
