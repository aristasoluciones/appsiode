'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import axios from 'axios';
import {
  AlertCircle,
  ArrowDown,
  ArrowUp,
  CheckCircle2,
  ChevronDown,
  Download,
  FileText,
  History,
  Info,
  Loader2,
  Plus,
  Save,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import {
  ACTA_LIMITES,
  type IActaApartadoPayload,
  type IActaConfiguracionApartado,
  type IActaConfiguracionVersion,
  type IActaMarcador,
  type IActaPlantillaValidacion,
} from '@/types/material-electoral';
import { formatFechaHora } from '@/lib/fechas';
import { Alert, AlertIcon, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  useActaConfiguracion,
  useActaMarcadores,
  useDescargarPlantillaActa,
  useGuardarApartadosActa,
  useSubirPlantillaActa,
  useValidarPlantillaActa,
} from '../_hooks/use-actas-configuracion';

/** Mensaje del API ante un rechazo; se muestra tal cual. */
function mensajeDeError(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error)) {
    const m = error.response?.data?.message as string | undefined;
    if (m) return m;
  }
  return fallback;
}

/** La validación rechazada (400) viene con el detalle de marcadores en `data`. */
function validacionDeError(error: unknown): IActaPlantillaValidacion | null {
  if (!axios.isAxiosError(error)) return null;
  const data = error.response?.data?.data as
    | IActaPlantillaValidacion
    | undefined;
  return data && Array.isArray(data.faltantes) ? data : null;
}

function tamano(bytes: number) {
  return bytes >= 1024 * 1024
    ? `${(bytes / (1024 * 1024)).toFixed(1)} MB`
    : `${Math.ceil(bytes / 1024)} KB`;
}

const TIPO_MARCADOR: Record<IActaMarcador['tipo'], string> = {
  TEXTO: 'Texto',
  TABLA: 'Tabla',
  FOTOGRAFIAS: 'Fotografías',
};

/**
 * Configuración del acta circunstanciada del proceso activo: plantilla Word
 * (subir o reemplazar, con la lista de marcadores a la vista) y los apartados
 * de fotografías. Cada cambio crea una versión nueva que aplica
 * a las actas que se generen o regeneren a partir de entonces.
 */
export function ActaConfiguracionSeccion() {
  const { data, isLoading, isError, refetch } = useActaConfiguracion();

  if (isLoading) {
    return (
      <div className="space-y-4" aria-busy="true">
        <Skeleton className="h-40 w-full rounded-lg" />
        <Skeleton className="h-64 w-full rounded-lg" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center">
        <AlertCircle className="h-8 w-8 text-destructive mb-3" />
        <p className="text-sm text-muted-foreground mb-3">
          No se pudo cargar la configuración del acta.
        </p>
        <Button size="sm" onClick={() => refetch()}>
          Reintentar
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <Alert variant="info" icon="info" appearance="light">
        <AlertIcon>
          <Info />
        </AlertIcon>
        <AlertTitle>
          Cada cambio crea una versión nueva y aplica a las actas que se generen
          o regeneren a partir de ese momento; las ya generadas conservan la
          versión que usaron.
        </AlertTitle>
      </Alert>

      {!data.lista && (
        <Alert variant="warning" icon="warning" appearance="light">
          <AlertIcon>
            <AlertCircle />
          </AlertIcon>
          <AlertTitle>
            Todavía no hay plantilla Word: los consejos no pueden generar actas
            hasta que subas una.
          </AlertTitle>
        </Alert>
      )}

      <PlantillaCard
        lista={data.lista}
        plantillaNombre={data.plantilla_nombre}
        plantillaVersion={data.plantilla_version}
        usuario={data.usuario}
        fecha={data.fecha_registro}
      />

      <ApartadosCard apartados={data.apartados} />

      {data.versiones.length > 0 && (
        <VersionesCard versiones={data.versiones} />
      )}
    </div>
  );
}

// ─── Plantilla ───────────────────────────────────────────────────────────────

function PlantillaCard({
  lista,
  plantillaNombre,
  plantillaVersion,
  usuario,
  fecha,
}: {
  lista: boolean;
  plantillaNombre: string | null;
  plantillaVersion: number;
  usuario: string | null;
  fecha: string | null;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const descargarVigente = useDescargarPlantillaActa();
  const validar = useValidarPlantillaActa();
  const subir = useSubirPlantillaActa();

  const [archivo, setArchivo] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [validacion, setValidacion] = useState<IActaPlantillaValidacion | null>(
    null,
  );
  const [marcadoresAbiertos, setMarcadoresAbiertos] = useState(false);

  const { data: marcadores = [], isLoading: cargandoMarcadores } =
    useActaMarcadores(marcadoresAbiertos);

  function limpiar() {
    setArchivo(null);
    setError(null);
    setValidacion(null);
  }

  // Al elegir el archivo se revisa en pantalla (tipo y tamaño) y luego la API
  // lo valida sin guardar: así se ve qué marcadores trae antes de reemplazar.
  function handleArchivo(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null;
    e.target.value = '';
    if (!f) return;

    const esWord =
      (ACTA_LIMITES.plantilla.tipos as readonly string[]).includes(f.type) ||
      /\.docx$/i.test(f.name);
    if (!esWord) {
      setArchivo(null);
      setValidacion(null);
      setError('La plantilla debe ser un archivo de Word (.docx).');
      return;
    }
    if (f.size > ACTA_LIMITES.plantilla.bytes) {
      setArchivo(null);
      setValidacion(null);
      setError(`El archivo pesa ${tamano(f.size)}; el máximo es 10 MB.`);
      return;
    }

    setError(null);
    setArchivo(f);
    setValidacion(null);
    validar.mutate(f, {
      onSuccess: (v) => setValidacion(v),
      onError: (err) => {
        const v = validacionDeError(err);
        setValidacion(v);
        setError(
          mensajeDeError(
            err,
            'No se pudo revisar la plantilla. Intenta de nuevo.',
          ),
        );
      },
    });
  }

  function handleGuardar() {
    if (!archivo) return;
    setError(null);
    subir.mutate(archivo, {
      onSuccess: limpiar,
      onError: (err) => {
        // Si falta un marcador la API lo dice tal cual, con la lista.
        const v = validacionDeError(err);
        if (v) setValidacion(v);
        setError(
          mensajeDeError(
            err,
            'No se pudo guardar la plantilla. Intenta de nuevo.',
          ),
        );
      },
    });
  }

  const ocupado = validar.isPending || subir.isPending;
  const puedeGuardar = !!archivo && !!validacion?.valida && !ocupado;

  return (
    <section className="rounded-lg border border-border">
      <header className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <FileText
            className="h-4 w-4 text-muted-foreground"
            aria-hidden="true"
          />
          <h3 className="text-sm font-semibold text-foreground">
            Plantilla Word
          </h3>
          {lista ? (
            <Badge variant="success" appearance="light" size="sm">
              Versión {plantillaVersion}
            </Badge>
          ) : (
            <Badge variant="warning" appearance="light" size="sm">
              Sin plantilla
            </Badge>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {lista && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => descargarVigente.mutate(undefined)}
              disabled={descargarVigente.isPending}
            >
              {descargarVigente.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : (
                <Download className="h-4 w-4" aria-hidden="true" />
              )}
              Plantilla vigente
            </Button>
          )}
        </div>
      </header>

      <div className="p-4 space-y-4">
        {lista && (
          <p className="text-sm text-muted-foreground">
            Vigente:{' '}
            <span className="text-foreground font-medium">
              {plantillaNombre || 'plantilla.docx'}
            </span>
            {usuario && ` · subida por ${usuario}`}
            {fecha && ` el ${formatFechaHora(fecha)}`}.
          </p>
        )}

        {/* Subir o reemplazar */}
        <div className="space-y-2">
          <input
            ref={inputRef}
            type="file"
            accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            className="sr-only"
            onChange={handleArchivo}
            disabled={ocupado}
          />
          {!archivo ? (
            <Button
              type="button"
              variant="outline"
              onClick={() => inputRef.current?.click()}
              disabled={ocupado}
            >
              <Upload className="h-4 w-4" aria-hidden="true" />
              {lista ? 'Reemplazar plantilla' : 'Subir plantilla'}
            </Button>
          ) : (
            <div className="flex flex-wrap items-center gap-2 rounded-md border border-border bg-muted/40 px-3 py-2">
              <FileText
                className="h-4 w-4 text-muted-foreground shrink-0"
                aria-hidden="true"
              />
              <span className="text-sm text-foreground truncate max-w-[16rem]">
                {archivo.name}
              </span>
              <span className="text-xs text-muted-foreground">
                {tamano(archivo.size)}
              </span>
              {validar.isPending && (
                <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                  <Loader2
                    className="h-3.5 w-3.5 animate-spin"
                    aria-hidden="true"
                  />
                  Revisando marcadores…
                </span>
              )}
              <button
                type="button"
                aria-label="Quitar archivo"
                onClick={limpiar}
                disabled={ocupado}
                className="ml-auto h-6 w-6 inline-flex items-center justify-center rounded-md hover:bg-muted disabled:opacity-50"
              >
                <X className="h-3.5 w-3.5 text-muted-foreground" />
              </button>
            </div>
          )}
          <p className="text-xs text-muted-foreground text-justify hyphens-auto">
            Archivo .docx de hasta 10 MB con los marcadores obligatorios. La API
            lo revisa antes de guardarlo y rechaza el que tenga faltantes.
          </p>
        </div>

        {error && (
          <Alert variant="destructive" icon="destructive" appearance="light">
            <AlertIcon>
              <AlertCircle />
            </AlertIcon>
            <AlertTitle>{error}</AlertTitle>
          </Alert>
        )}

        {validacion && <ResultadoValidacion validacion={validacion} />}

        {archivo && (
          <div className="flex justify-end">
            <Button onClick={handleGuardar} disabled={!puedeGuardar}>
              {subir.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : (
                <Save className="h-4 w-4" aria-hidden="true" />
              )}
              {lista ? 'Guardar como nueva versión' : 'Guardar plantilla'}
            </Button>
          </div>
        )}

        {/* Marcadores */}
        <Collapsible
          open={marcadoresAbiertos}
          onOpenChange={setMarcadoresAbiertos}
        >
          <CollapsibleTrigger asChild>
            <button
              type="button"
              className="flex items-center gap-2 text-sm font-medium text-foreground hover:text-primary"
            >
              <ChevronDown
                className={[
                  'h-4 w-4 transition-transform',
                  marcadoresAbiertos ? 'rotate-180' : '',
                ].join(' ')}
                aria-hidden="true"
              />
              Marcadores que puede llevar la plantilla
            </button>
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-3">
            {cargandoMarcadores ? (
              <Skeleton className="h-32 w-full rounded-md" />
            ) : (
              <TablaMarcadores marcadores={marcadores} />
            )}
          </CollapsibleContent>
        </Collapsible>
      </div>
    </section>
  );
}

function ResultadoValidacion({
  validacion,
}: {
  validacion: IActaPlantillaValidacion;
}) {
  return (
    <div className="rounded-md border border-border p-3 space-y-2 text-sm">
      <p className="flex items-center gap-2 font-medium">
        {validacion.valida ? (
          <>
            <CheckCircle2
              className="h-4 w-4 text-green-600 dark:text-green-400"
              aria-hidden="true"
            />
            La plantilla trae todos los marcadores obligatorios.
          </>
        ) : (
          <>
            <AlertCircle
              className="h-4 w-4 text-destructive"
              aria-hidden="true"
            />
            La plantilla no se puede guardar así.
          </>
        )}
      </p>
      {validacion.errores.length > 0 && (
        <ul className="list-disc pl-5 text-destructive space-y-0.5">
          {validacion.errores.map((e) => (
            <li key={e}>{e}</li>
          ))}
        </ul>
      )}
      {validacion.faltantes.length > 0 && (
        <ListaMarcadores
          titulo="Faltan (obligatorios)"
          items={validacion.faltantes}
          variant="destructive"
        />
      )}
      {validacion.desconocidos.length > 0 && (
        <ListaMarcadores
          titulo="No reconocidos (quedarán tal cual)"
          items={validacion.desconocidos}
          variant="warning"
        />
      )}
      {validacion.encontrados.length > 0 && (
        <ListaMarcadores
          titulo="Encontrados"
          items={validacion.encontrados}
          variant="success"
        />
      )}
    </div>
  );
}

function ListaMarcadores({
  titulo,
  items,
  variant,
}: {
  titulo: string;
  items: string[];
  variant: 'destructive' | 'warning' | 'success';
}) {
  return (
    <div>
      <p className="text-xs text-muted-foreground mb-1">{titulo}</p>
      <div className="flex flex-wrap gap-1">
        {items.map((m) => (
          <Badge key={m} variant={variant} appearance="light" size="sm">
            [{m}]
          </Badge>
        ))}
      </div>
    </div>
  );
}

function TablaMarcadores({ marcadores }: { marcadores: IActaMarcador[] }) {
  if (marcadores.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No se pudo cargar la lista de marcadores.
      </p>
    );
  }
  return (
    <div className="rounded-md border border-border overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-muted/50 text-xs text-muted-foreground">
          <tr>
            <th className="px-3 py-2 text-left font-medium">Marcador</th>
            <th className="px-3 py-2 text-left font-medium">Tipo</th>
            <th className="px-3 py-2 text-left font-medium">Se llena con</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {marcadores.map((m) => (
            <tr key={m.marcador}>
              <td className="px-3 py-2 whitespace-nowrap align-top">
                <code className="text-xs font-mono">[{m.marcador}]</code>
                {m.obligatorio && (
                  <span className="text-destructive" title="Obligatorio">
                    {' '}
                    *
                  </span>
                )}
              </td>
              <td className="px-3 py-2 whitespace-nowrap align-top text-muted-foreground">
                {TIPO_MARCADOR[m.tipo] ?? m.tipo}
              </td>
              <td className="px-3 py-2 align-top">
                <p className="text-foreground text-justify hyphens-auto">
                  {m.descripcion}
                </p>
                {m.ejemplo && (
                  <p className="text-xs text-muted-foreground mt-0.5 text-justify hyphens-auto">
                    Ej.: {m.ejemplo}
                  </p>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="px-3 py-2 text-xs text-muted-foreground border-t border-border text-justify hyphens-auto">
        * Obligatorio. Los de tabla y fotografías van solos en su propio
        párrafo; desde [ANEXAR FOTOGRAFIAS] empiezan los apartados de
        fotografías.
      </p>
    </div>
  );
}

// ─── Apartados de fotografías ────────────────────────────────────────────────

/** Apartado en edición; los nuevos no tienen clave y la asigna el servidor. */
interface IApartadoEdicion {
  /** Llave local estable para React, no viaja al API. */
  llave: string;
  clave: string | null;
  titulo: string;
  descripcion: string;
  minimo: number;
  activo: boolean;
}

function aEdicion(apartados: IActaConfiguracionApartado[]): IApartadoEdicion[] {
  return [...apartados]
    .sort((a, b) => a.orden - b.orden)
    .map((a) => ({
      llave: a.clave,
      clave: a.clave,
      titulo: a.titulo,
      descripcion: a.descripcion ?? '',
      minimo: a.minimo,
      activo: a.activo,
    }));
}

function aPayload(apartados: IApartadoEdicion[]): IActaApartadoPayload[] {
  return apartados.map((a) => ({
    clave: a.clave,
    titulo: a.titulo.trim(),
    descripcion: a.descripcion.trim() || null,
    minimo: a.minimo,
    activo: a.activo,
  }));
}

function ApartadosCard({
  apartados: apartadosProp,
}: {
  apartados: IActaConfiguracionApartado[];
}) {
  // Un refresco de la consulta (al recuperar el foco, por ejemplo) entrega un
  // arreglo nuevo aunque traiga lo mismo; se toma como cambio solo cuando el
  // contenido cambia, para no pisar lo que el usuario está editando.
  const firma = JSON.stringify(apartadosProp);
  const apartados = useMemo(
    () => JSON.parse(firma) as IActaConfiguracionApartado[],
    [firma],
  );

  const guardar = useGuardarApartadosActa();
  const [lista, setLista] = useState<IApartadoEdicion[]>(() =>
    aEdicion(apartados),
  );
  const [tocado, setTocado] = useState(false);

  // Cuando la API devuelve la versión nueva se retoma lo guardado.
  useEffect(() => {
    setLista(aEdicion(apartados));
    setTocado(false);
  }, [apartados]);

  const original = useMemo(
    () => JSON.stringify(aPayload(aEdicion(apartados))),
    [apartados],
  );
  const cambiado = JSON.stringify(aPayload(lista)) !== original;

  const errores = useMemo(() => {
    const e: string[] = [];
    if (lista.length === 0) e.push('Debe haber al menos un apartado.');
    if (lista.length > ACTA_LIMITES.apartado.maximo)
      e.push(`No se admiten más de ${ACTA_LIMITES.apartado.maximo} apartados.`);
    if (!lista.some((a) => a.activo))
      e.push('Debe quedar al menos un apartado activo.');
    lista.forEach((a, i) => {
      const t = a.titulo.trim();
      if (!t || t.length > ACTA_LIMITES.apartado.titulo.max)
        e.push(
          `El apartado ${i + 1} necesita un título de hasta 150 caracteres.`,
        );
      if (a.descripcion.trim().length > ACTA_LIMITES.apartado.descripcion.max)
        e.push(
          `La descripción del apartado ${i + 1} no debe superar 500 caracteres.`,
        );
      if (
        !Number.isInteger(a.minimo) ||
        a.minimo < ACTA_LIMITES.apartado.minimo.min ||
        a.minimo > ACTA_LIMITES.apartado.minimo.max
      )
        e.push(`El mínimo del apartado ${i + 1} debe estar entre 0 y 50.`);
    });
    return e;
  }, [lista]);

  function actualizar(llave: string, cambio: Partial<IApartadoEdicion>) {
    setLista((prev) =>
      prev.map((a) => (a.llave === llave ? { ...a, ...cambio } : a)),
    );
  }

  function mover(indice: number, delta: -1 | 1) {
    setLista((prev) => {
      const destino = indice + delta;
      if (destino < 0 || destino >= prev.length) return prev;
      const copia = [...prev];
      [copia[indice], copia[destino]] = [copia[destino], copia[indice]];
      return copia;
    });
  }

  function quitar(llave: string) {
    setLista((prev) => prev.filter((a) => a.llave !== llave));
  }

  function agregar() {
    setLista((prev) => [
      ...prev,
      {
        llave: `nuevo-${Date.now()}`,
        clave: null,
        titulo: '',
        descripcion: '',
        minimo: 1,
        activo: true,
      },
    ]);
  }

  function handleGuardar() {
    setTocado(true);
    if (errores.length > 0) return;
    guardar.mutate(aPayload(lista));
  }

  return (
    <section className="rounded-lg border border-border">
      <header className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 border-b border-border">
        <div>
          <h3 className="text-sm font-semibold text-foreground">
            Apartados de fotografías
          </h3>
          <p className="text-xs text-muted-foreground text-justify hyphens-auto">
            Cada apartado va al anexo del acta con su título; el mínimo es el
            número de fotografías que el consejo debe subir.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={agregar}
          disabled={
            guardar.isPending || lista.length >= ACTA_LIMITES.apartado.maximo
          }
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          Agregar apartado
        </Button>
      </header>

      <div className="p-4 space-y-3">
        {lista.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">
            Sin apartados. Agrega al menos uno.
          </p>
        )}

        {lista.map((a, i) => (
          <ApartadoFila
            key={a.llave}
            apartado={a}
            indice={i}
            total={lista.length}
            disabled={guardar.isPending}
            onCambio={(cambio) => actualizar(a.llave, cambio)}
            onMover={(delta) => mover(i, delta)}
            onQuitar={() => quitar(a.llave)}
          />
        ))}

        {tocado && errores.length > 0 && (
          <Alert variant="destructive" icon="destructive" appearance="light">
            <AlertIcon>
              <AlertCircle />
            </AlertIcon>
            <AlertTitle>
              <ul className="list-disc pl-4 space-y-0.5">
                {errores.map((e) => (
                  <li key={e}>{e}</li>
                ))}
              </ul>
            </AlertTitle>
          </Alert>
        )}

        <div className="flex flex-wrap items-center justify-end gap-2 pt-1">
          {cambiado && !guardar.isPending && (
            <span className="text-xs text-muted-foreground">
              Hay cambios sin guardar.
            </span>
          )}
          <Button
            onClick={handleGuardar}
            disabled={!cambiado || guardar.isPending}
            aria-busy={guardar.isPending}
          >
            {guardar.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <Save className="h-4 w-4" aria-hidden="true" />
            )}
            Guardar apartados
          </Button>
        </div>
      </div>
    </section>
  );
}

function ApartadoFila({
  apartado,
  indice,
  total,
  disabled,
  onCambio,
  onMover,
  onQuitar,
}: {
  apartado: IApartadoEdicion;
  indice: number;
  total: number;
  disabled: boolean;
  onCambio: (cambio: Partial<IApartadoEdicion>) => void;
  onMover: (delta: -1 | 1) => void;
  onQuitar: () => void;
}) {
  const idBase = `apartado-${apartado.llave}`;
  return (
    <div
      className={[
        'rounded-md border border-border p-3 space-y-3',
        apartado.activo ? '' : 'opacity-70 bg-muted/30',
      ].join(' ')}
    >
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-semibold text-muted-foreground tabular-nums w-6">
          {indice + 1}.
        </span>
        {apartado.clave ? (
          <code className="text-[0.6875rem] font-mono text-muted-foreground">
            {apartado.clave}
          </code>
        ) : (
          <Badge variant="primary" appearance="light" size="sm">
            Nuevo
          </Badge>
        )}
        <div className="ml-auto flex items-center gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => onMover(-1)}
                disabled={disabled || indice === 0}
                aria-label="Subir apartado"
              >
                <ArrowUp className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Subir</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => onMover(1)}
                disabled={disabled || indice === total - 1}
                aria-label="Bajar apartado"
              >
                <ArrowDown className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Bajar</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 text-destructive"
                onClick={onQuitar}
                disabled={disabled}
                aria-label="Quitar apartado"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Quitar</TooltipContent>
          </Tooltip>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-12">
        <div className="sm:col-span-8 space-y-1.5">
          <Label htmlFor={`${idBase}-titulo`}>
            Título <span className="text-destructive">*</span>
          </Label>
          <Input
            id={`${idBase}-titulo`}
            value={apartado.titulo}
            maxLength={ACTA_LIMITES.apartado.titulo.max}
            onChange={(e) => onCambio({ titulo: e.target.value })}
            placeholder="Recepción de la documentación electoral"
            disabled={disabled}
          />
        </div>
        <div className="sm:col-span-2 space-y-1.5">
          <Label htmlFor={`${idBase}-minimo`}>Mínimo</Label>
          <Input
            id={`${idBase}-minimo`}
            type="number"
            inputMode="numeric"
            min={ACTA_LIMITES.apartado.minimo.min}
            max={ACTA_LIMITES.apartado.minimo.max}
            value={apartado.minimo}
            onChange={(e) =>
              onCambio({ minimo: Number.parseInt(e.target.value, 10) || 0 })
            }
            disabled={disabled}
          />
        </div>
        <div className="sm:col-span-2 space-y-1.5">
          <Label htmlFor={`${idBase}-activo`}>Activo</Label>
          <div className="h-9 flex items-center">
            <Switch
              id={`${idBase}-activo`}
              checked={apartado.activo}
              onCheckedChange={(v) => onCambio({ activo: v })}
              disabled={disabled}
            />
          </div>
        </div>
        <div className="sm:col-span-12 space-y-1.5">
          <Label htmlFor={`${idBase}-descripcion`}>
            Descripción (opcional)
          </Label>
          <Textarea
            id={`${idBase}-descripcion`}
            rows={2}
            value={apartado.descripcion}
            maxLength={ACTA_LIMITES.apartado.descripcion.max}
            onChange={(e) => onCambio({ descripcion: e.target.value })}
            placeholder="Orientación para el consejo sobre qué fotografiar."
            disabled={disabled}
          />
        </div>
      </div>
    </div>
  );
}

// ─── Versiones ───────────────────────────────────────────────────────────────

const CAMBIO_LABEL: Record<string, string> = {
  INICIAL: 'Inicial',
  PLANTILLA: 'Plantilla',
  APARTADOS: 'Apartados',
};

function VersionesCard({
  versiones,
}: {
  versiones: IActaConfiguracionVersion[];
}) {
  const [abierto, setAbierto] = useState(false);
  const descargar = useDescargarPlantillaActa();

  return (
    <Collapsible open={abierto} onOpenChange={setAbierto}>
      <section className="rounded-lg border border-border">
        <CollapsibleTrigger asChild>
          <button
            type="button"
            className="flex w-full items-center gap-2 px-4 py-3 text-left"
          >
            <History
              className="h-4 w-4 text-muted-foreground"
              aria-hidden="true"
            />
            <span className="text-sm font-semibold text-foreground">
              Versiones
            </span>
            <Badge variant="secondary" appearance="light" size="sm">
              {versiones.length}
            </Badge>
            <ChevronDown
              className={[
                'ml-auto h-4 w-4 text-muted-foreground transition-transform',
                abierto ? 'rotate-180' : '',
              ].join(' ')}
              aria-hidden="true"
            />
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="border-t border-border overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-xs text-muted-foreground">
                <tr>
                  <th className="px-3 py-2 text-left font-medium">Versión</th>
                  <th className="px-3 py-2 text-left font-medium">Cambio</th>
                  <th className="px-3 py-2 text-left font-medium">Plantilla</th>
                  <th className="px-3 py-2 text-left font-medium">Registró</th>
                  <th className="px-3 py-2 text-right font-medium">Actas</th>
                  <th className="px-3 py-2" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {versiones.map((v) => (
                  <tr key={v.id} className={v.vigente ? 'bg-primary/5' : ''}>
                    <td className="px-3 py-2 whitespace-nowrap">
                      {v.version}
                      {v.vigente && (
                        <Badge
                          variant="success"
                          appearance="light"
                          size="sm"
                          className="ml-2"
                        >
                          Vigente
                        </Badge>
                      )}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      {CAMBIO_LABEL[v.cambio] ?? v.cambio}
                    </td>
                    <td className="px-3 py-2">
                      {v.plantilla ? (
                        <span className="text-foreground">
                          {v.plantilla_nombre || 'plantilla.docx'}
                          <span className="text-xs text-muted-foreground">
                            {' '}
                            · v{v.plantilla_version}
                          </span>
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-3 py-2">
                      <p className="text-foreground">{v.usuario || '—'}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatFechaHora(v.fecha_registro)}
                      </p>
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums">
                      {v.actas}
                    </td>
                    <td className="px-3 py-2 text-right">
                      {v.plantilla && (
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          aria-label={`Descargar la plantilla de la versión ${v.version}`}
                          onClick={() => descargar.mutate(v.id)}
                          disabled={descargar.isPending}
                        >
                          {descargar.isPending &&
                          descargar.variables === v.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Download className="h-4 w-4" />
                          )}
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CollapsibleContent>
      </section>
    </Collapsible>
  );
}
