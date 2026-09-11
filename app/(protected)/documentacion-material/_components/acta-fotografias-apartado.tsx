'use client';

import { useMemo, useRef, useState } from 'react';
import {
  Check,
  ChevronLeft,
  ChevronRight,
  ImageIcon,
  Loader2,
  Trash2,
  Upload,
} from 'lucide-react';
import type {
  IActaApartado,
  IActaFotografia,
} from '@/types/material-electoral';
import { ACTA_LIMITES } from '@/types/material-electoral';
import { toastError } from '@/lib/toast';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  useEliminarFotografiaActa,
  useReordenarFotografiasActa,
  useSubirFotografiaActa,
} from '../_hooks/use-actas';
import { FotoZoom } from './foto-zoom';

const TIPOS_ACEPTADOS = ACTA_LIMITES.foto.tipos.join(',');

interface ActaFotografiasApartadoProps {
  idActa: number;
  apartado: IActaApartado;
  /** Fotografías del acta que pertenecen a este apartado, ya ordenadas. */
  fotografias: IActaFotografia[];
  readOnly: boolean;
}

/**
 * Un apartado de fotografías del acta: su mínimo y su contador, subida
 * múltiple con miniaturas, quitar y reordenar. Cada fotografía se sube de
 * inmediato al acta, así el borrador conserva lo cargado aunque se cierre.
 */
export function ActaFotografiasApartado({
  idActa,
  apartado,
  fotografias,
  readOnly,
}: ActaFotografiasApartadoProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const subir = useSubirFotografiaActa(idActa);
  const eliminar = useEliminarFotografiaActa(idActa);
  const reordenar = useReordenarFotografiasActa(idActa);

  /** Progreso de una subida múltiple: cuántas van de cuántas. */
  const [progreso, setProgreso] = useState<{
    hechas: number;
    total: number;
  } | null>(null);
  const [ampliada, setAmpliada] = useState<IActaFotografia | null>(null);

  const ordenadas = useMemo(
    () => [...fotografias].sort((a, b) => a.orden - b.orden || a.id - b.id),
    [fotografias],
  );

  const cantidad = ordenadas.length;
  const completo = cantidad >= apartado.minimo;
  const ocupado = subir.isPending || eliminar.isPending || reordenar.isPending;
  const cupo = ACTA_LIMITES.foto.porApartado - cantidad;

  async function handleArchivos(e: React.ChangeEvent<HTMLInputElement>) {
    const archivos = Array.from(e.target.files ?? []);
    e.target.value = '';
    if (archivos.length === 0) return;

    // Se revisan tipo y tamaño antes de enviar para no gastar subidas que la
    // API rechazaría; la validación autoritativa sigue siendo la del servidor.
    const validos: File[] = [];
    const rechazados: string[] = [];
    for (const archivo of archivos) {
      const tipoOk = (ACTA_LIMITES.foto.tipos as readonly string[]).includes(
        archivo.type,
      );
      const tamanoOk = archivo.size <= ACTA_LIMITES.foto.bytes;
      if (tipoOk && tamanoOk) validos.push(archivo);
      else rechazados.push(archivo.name);
    }
    if (rechazados.length > 0) {
      toastError(
        `Se omitieron ${rechazados.length} ${rechazados.length === 1 ? 'archivo' : 'archivos'}: solo se admiten JPG, PNG o WEBP de hasta 5 MB (${rechazados.slice(0, 3).join(', ')}${rechazados.length > 3 ? '…' : ''}).`,
      );
    }
    if (validos.length > cupo) {
      toastError(
        `El apartado admite ${ACTA_LIMITES.foto.porApartado} fotografías como máximo; solo se subirán ${Math.max(cupo, 0)}.`,
      );
      validos.splice(Math.max(cupo, 0));
    }
    if (validos.length === 0) return;

    // Una a una para que cada fotografía quede con su orden y el contador avance.
    setProgreso({ hechas: 0, total: validos.length });
    let fallidas = 0;
    for (let i = 0; i < validos.length; i++) {
      try {
        await subir.mutateAsync({
          archivo: validos[i],
          apartado: apartado.clave,
        });
      } catch (error) {
        fallidas += 1;
        const mensaje = (
          error as { response?: { data?: { message?: string } } }
        )?.response?.data?.message;
        toastError(
          mensaje ??
            `No se pudo subir «${validos[i].name}». Intenta nuevamente.`,
        );
      }
      setProgreso({ hechas: i + 1, total: validos.length });
    }
    setProgreso(null);
    if (fallidas > 0 && fallidas === validos.length) return;
  }

  function mover(indice: number, direccion: -1 | 1) {
    const destino = indice + direccion;
    if (destino < 0 || destino >= ordenadas.length) return;
    const ids = ordenadas.map((f) => f.id);
    [ids[indice], ids[destino]] = [ids[destino], ids[indice]];
    reordenar.mutate({ apartado: apartado.clave, ids });
  }

  return (
    <section
      className="rounded-lg border border-border bg-card"
      aria-labelledby={`apartado-${apartado.clave}`}
    >
      <header className="flex flex-wrap items-start justify-between gap-2 px-4 py-3 border-b border-border">
        <div className="min-w-0">
          <h4
            id={`apartado-${apartado.clave}`}
            className="text-sm font-semibold text-foreground"
          >
            {apartado.titulo}
          </h4>
          {apartado.descripcion && (
            <p className="text-xs text-muted-foreground mt-0.5">
              {apartado.descripcion}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Badge
            variant={
              completo
                ? 'success'
                : apartado.minimo > 0
                  ? 'warning'
                  : 'secondary'
            }
            appearance="light"
            size="sm"
          >
            {completo && <Check className="h-3 w-3" aria-hidden="true" />}
            {cantidad} / mín. {apartado.minimo}
          </Badge>
          {!readOnly && (
            <>
              <input
                ref={inputRef}
                type="file"
                accept={TIPOS_ACEPTADOS}
                multiple
                className="sr-only"
                aria-label={`Seleccionar fotografías de ${apartado.titulo}`}
                onChange={handleArchivos}
                disabled={ocupado || cupo <= 0}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => inputRef.current?.click()}
                disabled={ocupado || cupo <= 0}
                aria-busy={subir.isPending}
              >
                {subir.isPending ? (
                  <Loader2
                    className="h-4 w-4 animate-spin"
                    aria-hidden="true"
                  />
                ) : (
                  <Upload className="h-4 w-4" aria-hidden="true" />
                )}
                {progreso
                  ? `Subiendo ${progreso.hechas}/${progreso.total}`
                  : 'Agregar fotografías'}
              </Button>
            </>
          )}
        </div>
      </header>

      <div className="p-4">
        {ordenadas.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-6 rounded-lg border-2 border-dashed border-gray-200 dark:border-gray-700 text-center">
            <ImageIcon
              className="h-7 w-7 text-gray-300 dark:text-gray-600 mb-2"
              aria-hidden="true"
            />
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {readOnly
                ? 'Sin fotografías en este apartado.'
                : apartado.minimo > 0
                  ? `Agrega al menos ${apartado.minimo} ${apartado.minimo === 1 ? 'fotografía' : 'fotografías'}.`
                  : 'Este apartado es opcional.'}
            </p>
          </div>
        ) : (
          <ul
            className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3"
            aria-label={`Fotografías de ${apartado.titulo}`}
          >
            {ordenadas.map((foto, i) => (
              <li
                key={foto.id}
                className="group relative aspect-square rounded-lg overflow-hidden border border-border bg-muted"
              >
                <button
                  type="button"
                  className="w-full h-full"
                  onClick={() => setAmpliada(foto)}
                  aria-label={`Ampliar fotografía ${i + 1} de ${apartado.titulo}`}
                >
                  <img
                    src={foto.miniatura_url ?? foto.imagen_url ?? ''}
                    alt={`Fotografía ${i + 1} · ${apartado.titulo}`}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </button>
                <span className="absolute top-1.5 left-1.5 rounded bg-black/60 px-1.5 text-[11px] font-medium text-white">
                  {i + 1}
                </span>
                {!readOnly && (
                  <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-1 p-1 bg-black/55 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity motion-reduce:transition-none">
                    <div className="flex gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-white hover:bg-white/20"
                        aria-label="Mover antes"
                        disabled={i === 0 || ocupado}
                        onClick={() => mover(i, -1)}
                      >
                        <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-white hover:bg-white/20"
                        aria-label="Mover después"
                        disabled={i === ordenadas.length - 1 || ocupado}
                        onClick={() => mover(i, 1)}
                      >
                        <ChevronRight className="h-4 w-4" aria-hidden="true" />
                      </Button>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-white hover:bg-destructive/80"
                      aria-label="Quitar fotografía"
                      disabled={ocupado}
                      onClick={() => eliminar.mutate(foto.id)}
                    >
                      {eliminar.isPending && eliminar.variables === foto.id ? (
                        <Loader2
                          className="h-4 w-4 animate-spin"
                          aria-hidden="true"
                        />
                      ) : (
                        <Trash2 className="h-4 w-4" aria-hidden="true" />
                      )}
                    </Button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      {ampliada && (
        <FotoAmpliadaDialog
          foto={ampliada}
          titulo={apartado.titulo}
          onClose={() => setAmpliada(null)}
        />
      )}
    </section>
  );
}

function FotoAmpliadaDialog({
  foto,
  titulo,
  onClose,
}: {
  foto: IActaFotografia;
  titulo: string;
  onClose: () => void;
}) {
  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-4xl max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{titulo}</DialogTitle>
        </DialogHeader>
        <FotoZoom
          src={foto.imagen_url ?? foto.miniatura_url ?? ''}
          alt={`Fotografía · ${titulo}`}
          className="h-72 md:h-[70vh]"
        />
      </DialogContent>
    </Dialog>
  );
}
