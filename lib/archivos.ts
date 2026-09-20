// Utilidades transversales para archivos: descargas, URL firmadas y multipart con auditoría.
import { getDataAuditoria } from './auditoria';

/** Cabecera para enviar un `FormData` con archivo. */
export const MULTIPART = {
  headers: { 'Content-Type': 'multipart/form-data' },
} as const;

export const TIPO_EXCEL =
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

/** Dispara la descarga de un archivo ya en memoria. */
export function descargar(contenido: Blob, nombreArchivo: string) {
  const url = window.URL.createObjectURL(contenido);
  const enlace = document.createElement('a');
  enlace.href = url;
  enlace.download = nombreArchivo;
  enlace.click();
  window.URL.revokeObjectURL(url);
}

/** Abre una URL firmada en otra pestaña; el navegador decide si la muestra o la descarga. */
export function abrirEnPestana(url: string) {
  window.open(url, '_blank', 'noopener,noreferrer');
}

/**
 * Arma el multipart para el API: el archivo (si lo hay), los campos extra y
 * la auditoría. Los campos nulos o vacíos no se envían.
 */
export function armarFormData(
  archivo: File | null | undefined,
  extra: Record<string, string | number | null | undefined> = {},
) {
  const { dispositivo, mac } = getDataAuditoria();
  const form = new FormData();
  if (archivo) form.append('archivo', archivo);
  form.append('dispositivo', dispositivo);
  form.append('mac', mac);
  for (const [k, v] of Object.entries(extra)) {
    if (v == null || v === '') continue;
    form.append(k, String(v));
  }
  return form;
}

/**
 * Lee el mensaje de error de una respuesta pedida como blob (Excel, Word,
 * PDF): el API responde el archivo, pero un rechazo llega como JSON.
 */
export async function mensajeDeBlob(error: unknown): Promise<string | null> {
  const data = (error as { response?: { data?: unknown } })?.response?.data;
  if (!(data instanceof Blob)) return null;
  try {
    const json = JSON.parse(await data.text()) as { message?: string };
    return json?.message ?? null;
  } catch {
    return null;
  }
}

/** Nombre del archivo que propone el API en `Content-Disposition`, o el de respaldo. */
export function nombreDeRespuesta(
  headers: Record<string, unknown>,
  respaldo: string,
): string {
  const disposition = String(headers['content-disposition'] ?? '');
  const utf8 = /filename\*=UTF-8''([^;]+)/i.exec(disposition);
  if (utf8) return decodeURIComponent(utf8[1]);
  const simple = /filename="?([^";]+)"?/i.exec(disposition);
  return simple ? simple[1] : respaldo;
}
