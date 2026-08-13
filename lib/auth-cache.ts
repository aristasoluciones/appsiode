import type { AuthUser } from '@/types/auth';

/**
 * Caché en localStorage del perfil de usuario — SOLO datos de presentación
 * (nombre, rol, módulos, proceso). Los tokens viven en cookies HttpOnly y
 * nunca pasan por aquí. Sirve para pintar la app al instante en una carga
 * completa (recarga, nueva pestaña) mientras /Auth/perfil revalida en
 * segundo plano; la autorización real siempre es por request en el API.
 */
const CACHE_KEY = 'siode.perfil.v1';

export function readCachedUser(): AuthUser | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as AuthUser;
    // Validación mínima de shape por si la estructura cambió entre versiones
    if (!parsed?.id || !Array.isArray(parsed.modulos)) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function writeCachedUser(user: AuthUser): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(user));
  } catch {
    // storage lleno o bloqueado — el caché es opcional
  }
}

export function clearCachedUser(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(CACHE_KEY);
  } catch {
    // ignorar
  }
}
