'use client';

import { useMemo, useRef, useState } from 'react';
import {
  Check,
  ChevronDown,
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
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
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
  /** El apartado se puede plegar para recorrer los demás; abre por omisión. */
  const [abierto, setAbierto] = useState(true);

  const ordenadas = useMemo(
    () => [...fotografias].sort((a, b) => a.orden - b.orden || a.id - b.id),
    [fotografias],
  );

  const cantidad = ordenadas.length;
  const completo = cantidad >= apartado.minimo;
  const ocupado = subir.isPending || eliminar.isPending || reordenar.isPending;
  const cupo = ACTA_LIMITES.foto.porApartado - cantidad;

  function handleInput(e: React.ChangeEvent<HTMLInputElement>) {
    const archivos = Array.from(e.target.files ?? []);
    e.target.value = '';
    void procesarArchivos(archivos);
  }

  /** Zona de arrastre: resalta al pasar por encima y sube lo que se suelte. */
  const [arrastrando, setArrastrando] = useState(false);
  const admiteSubida = !readOnly && !ocupado && cupo > 0;

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    if (!admiteSubida) return;
    e.dataTransfer.dropEffect = 'copy';
    if (!arrastrando) setArrastrando(true);
  }

  function handleDragLeave(e: React.DragEvent) {
    // Solo cuenta cuando el puntero sale de la zona, no al pasar entre hijos.
    if (e.currentTarget.contains(e.relatedTarget as Node | null)) return;
    setArrastrando(false);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setArrastrando(false);
    if (!admiteSubida) return;
    void procesarArchivos(Array.from(e.dataTransfer.files ?? []));
  }

  async function procesarArchivos(archivos: File[]) {
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
    <Collapsible open={abierto} onOpenChange={setAbierto} asChild>
      <section
        className="rounded-lg border border-border bg-card"
        aria-labelledby={`apartado-${apartado.clave}`}
      >
        <header
          className={[
            'flex flex-wrap items-start justify-between gap-2 px-4 py-3',
            abierto ? 'border-b border-border' : '',
          ].join(' ')}
        >
          <div className="min-w-0 flex items-start gap-2">
            <CollapsibleTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-7 w-7 shrink-0 -ml-1"
                aria-label={abierto ? 'Plegar apartado' : 'Desplegar apartado'}
              >
                <ChevronDown
                  className={[
                    'h-4 w-4 transition-transform motion-reduce:transition-none',
                    abierto ? '' : '-rotate-90',
                  ].join(' ')}
                  aria-hidden="true"
                />
              </Button>
            </CollapsibleTrigger>
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
            {progreso && (
              <span
                className="inline-flex items-center gap-1.5 text-xs text-muted-foreground"
                aria-live="polite"
              >
                <Loader2
                  className="h-3.5 w-3.5 animate-spin"
                  aria-hidden="true"
                />
                Subiendo {progreso.hechas}/{progreso.total}
              </span>
            )}
          </div>
        </header>

        {/* Todo el cuerpo del apartado recibe archivos arrastrados; la zona
          punteada además abre el selector al hacer clic. */}
        <CollapsibleContent>
          <div
            className={[
              'p-4 space-y-3 transition-colors motion-reduce:transition-none',
              arrastrando ? 'bg-primary/5' : '',
            ].join(' ')}
            onDragOver={handleDragOver}
            onDragEnter={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            {!readOnly && (
              <input
                ref={inputRef}
                type="file"
                accept={TIPOS_ACEPTADOS}
                multiple
                className="sr-only"
                aria-label={`Seleccionar fotografías de ${apartado.titulo}`}
                onChange={handleInput}
                disabled={!admiteSubida}
              />
            )}

            {/* Dos columnas al editar: la zona de arrastre a la izquierda y las
            miniaturas a la derecha; en solo lectura, las miniaturas a lo ancho. */}
            <div className={readOnly ? '' : 'grid gap-4 md:grid-cols-2'}>
              {!readOnly && (
                <button
                  type="button"
                  onClick={() => inputRef.current?.click()}
                  disabled={!admiteSubida}
                  aria-busy={subir.isPending}
                  className={[
                    'w-full min-h-40 h-full flex flex-col items-center justify-center rounded-lg border-2 border-dashed px-4 py-6 text-center transition-colors motion-reduce:transition-none',
                    'focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/30',
                    'disabled:opacity-60 disabled:cursor-not-allowed',
                    arrastrando
                      ? 'border-primary bg-primary/10'
                      : 'border-gray-200 dark:border-gray-700 hover:bg-muted/50',
                  ].join(' ')}
                >
                  {subir.isPending ? (
                    <Loader2
                      className="h-7 w-7 text-primary animate-spin mb-2"
                      aria-hidden="true"
                    />
                  ) : (
                    <Upload
                      className={[
                        'h-7 w-7 mb-2',
                        arrastrando
                          ? 'text-primary'
                          : 'text-gray-300 dark:text-gray-600',
                      ].join(' ')}
                      aria-hidden="true"
                    />
                  )}
                  <p className="text-sm font-medium text-foreground">
                    {arrastrando
                      ? 'Suelta las fotografías aquí'
                      : cupo <= 0
                        ? 'Este apartado ya tiene el máximo de fotografías'
                        : 'Arrastra las fotografías aquí o haz clic para elegirlas'}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {apartado.minimo > 0 && ordenadas.length < apartado.minimo
                      ? `Faltan ${apartado.minimo - ordenadas.length} para el mínimo · `
                      : ''}
                    JPG, PNG o WEBP · hasta 5 MB cada una
                  </p>
                </button>
              )}

              {ordenadas.length === 0 ? (
                <div className="flex flex-col items-center justify-center min-h-40 py-6 rounded-lg border border-border bg-muted/30 text-center">
                  <ImageIcon
                    className="h-7 w-7 text-gray-300 dark:text-gray-600 mb-2"
                    aria-hidden="true"
                  />
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {readOnly
                      ? 'Sin fotografías en este apartado.'
                      : 'Las fotografías que subas aparecerán aquí.'}
                  </p>
                </div>
              ) : (
                <ul
                  className="grid grid-cols-2 sm:grid-cols-3 gap-3 content-start"
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
                              <ChevronLeft
                                className="h-4 w-4"
                                aria-hidden="true"
                              />
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
                              <ChevronRight
                                className="h-4 w-4"
                                aria-hidden="true"
                              />
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
                            {eliminar.isPending &&
                            eliminar.variables === foto.id ? (
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
          </div>
        </CollapsibleContent>

        {ampliada && (
          <FotoAmpliadaDialog
            foto={ampliada}
            titulo={apartado.titulo}
            onClose={() => setAmpliada(null)}
          />
        )}
      </section>
    </Collapsible>
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
