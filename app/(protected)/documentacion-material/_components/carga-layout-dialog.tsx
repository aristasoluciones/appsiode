'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Building2,
  CircleAlert,
  Download,
  FileSpreadsheet,
  History,
  LoaderCircleIcon,
  MapPin,
  Paperclip,
  ShieldOff,
  Upload,
  X,
} from 'lucide-react';
import {
  LAYOUT_LIMITES,
  type ILayoutResultado,
  type ILayoutValidacion,
} from '@/types/material-electoral';
import { getFirstBackendError } from '@/lib/helpers';
import { useProceso } from '@/hooks/use-proceso';
import { useAuth } from '@/providers/auth-provider';
import { Alert, AlertIcon, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  useCargarLayout,
  useDescargarFormatoLayout,
  useTiposDocumentacion,
  useValidarLayout,
} from '../_hooks/use-carga-layout';
import { CargaLayoutHistorial } from './carga-layout-historial';
import { CargaLayoutPrevia } from './carga-layout-previa';
import { CargaLayoutResultado } from './carga-layout-resultado';

type TPaso = 'archivo' | 'previa' | 'resultado';
/** Apartados de la ventana: cargar un archivo o ver el historial de cargas. */
type TApartado = 'cargar' | 'historial';

const ACEPTA = LAYOUT_LIMITES.extensiones.join(',');

const ICONO_TIPO = { D: Building2, M: MapPin } as const;

function pesoLegible(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Carga del layout de documentación y material, en ventana.
 *
 * Se lanza desde el tablero de oficina central: no tiene ruta ni entrada de
 * menú propias. La oficina central descarga el formato de captura de un tipo de
 * consejo, lo sube y confirma la carga desde la vista previa. El layout entra
 * completo o no entra: basta un renglón con observaciones para que la carga no
 * se pueda confirmar.
 *
 * La misma ventana tiene un segundo apartado, «Historial de importaciones»,
 * con las cargas del tipo de consejo elegido y la reversión de la más reciente
 * (permiso propio `documentacionymaterial.comprobaciones.layoutrevertir`).
 *
 * Quien monte la ventana debe ofrecerla solo a oficina central y con el permiso
 * `documentacionymaterial.comprobaciones.layout`; aquí se vuelve a comprobar
 * para que el componente no dependa de que el llamador lo haga.
 */
export function CargaLayoutDialog({
  open,
  onOpenChange,
  /** Se avisa cuando la carga terminó, para refrescar el tablero que la lanzó. */
  onCargado,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCargado?: (resultado: ILayoutResultado) => void;
}) {
  const { hasPermission, user } = useAuth();
  const { data: proceso } = useProceso();

  const [tipoElegido, setTipoElegido] = useState<'D' | 'M'>('D');
  const [apartado, setApartado] = useState<TApartado>('cargar');
  const [paso, setPaso] = useState<TPaso>('archivo');
  const [archivo, setArchivo] = useState<File | null>(null);
  const [validacion, setValidacion] = useState<ILayoutValidacion | null>(null);
  const [resultado, setResultado] = useState<ILayoutResultado | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const formatoMutation = useDescargarFormatoLayout();
  const validarMutation = useValidarLayout();
  const cargarMutation = useCargarLayout();
  // El catálogo solo hace falta con la ventana abierta.
  const { data: tipos } = useTiposDocumentacion(open);

  const puedeCargar = hasPermission(
    'documentacionymaterial.comprobaciones.layout',
  );
  const puedeRevertir = hasPermission(
    'documentacionymaterial.comprobaciones.layoutrevertir',
  );
  const esOficinaCentral = parseInt(user?.idConsejo ?? '0') === 0;

  // Tipos de consejo del proceso: solo se ofrecen los que tienen elecciones activas.
  const opciones = useMemo<{ value: 'D' | 'M'; label: string }[]>(() => {
    const vistos = new Map<'D' | 'M', string>();
    for (const eleccion of proceso?.elecciones ?? []) {
      if (!vistos.has(eleccion.consejo_tipo)) {
        vistos.set(eleccion.consejo_tipo, eleccion.consejo_tipo_text);
      }
    }
    if (vistos.size === 0) {
      if (proceso?.consejo_distrital) vistos.set('D', 'Distritales');
      if (proceso?.consejo_municipal) vistos.set('M', 'Municipales');
    }
    return Array.from(vistos, ([value, label]) => ({ value, label }));
  }, [proceso]);

  // Si el proceso no trabaja el tipo elegido, manda el primero que sí ofrece.
  const tipoConsejo =
    opciones.length > 0 && !opciones.some((op) => op.value === tipoElegido)
      ? opciones[0].value
      : tipoElegido;

  const ocupado = validarMutation.isPending || cargarMutation.isPending;

  // Cada apertura arranca limpia.
  useEffect(() => {
    if (!open) return;
    setApartado('cargar');
    setPaso('archivo');
    setArchivo(null);
    setValidacion(null);
    setResultado(null);
    setError(null);
    if (inputRef.current) inputRef.current.value = '';
  }, [open]);

  function limpiarInput() {
    if (inputRef.current) inputRef.current.value = '';
  }

  function reiniciar() {
    setPaso('archivo');
    setArchivo(null);
    setValidacion(null);
    setResultado(null);
    setError(null);
    limpiarInput();
  }

  function cambiarTipo(valor: 'D' | 'M') {
    if (valor === tipoConsejo) return;
    setTipoElegido(valor);
    // Cada formato es de un tipo de consejo: el archivo elegido deja de servir.
    reiniciar();
  }

  function seleccionarArchivo(file: File | null | undefined) {
    limpiarInput();
    if (!file) return;

    const extension = file.name.slice(file.name.lastIndexOf('.')).toLowerCase();
    if (!LAYOUT_LIMITES.extensiones.includes(extension as '.xlsx' | '.csv')) {
      setArchivo(null);
      setError(
        `El archivo debe ser Excel (${LAYOUT_LIMITES.extensiones.join(' o ')}).`,
      );
      return;
    }
    if (file.size > LAYOUT_LIMITES.bytes) {
      setArchivo(null);
      setError(
        `El archivo pesa ${pesoLegible(file.size)} y el máximo permitido es ${pesoLegible(LAYOUT_LIMITES.bytes)}.`,
      );
      return;
    }

    setError(null);
    setValidacion(null);
    setArchivo(file);
  }

  function revisar() {
    if (!archivo) return;
    setError(null);
    validarMutation.mutate(
      { archivo, tipoConsejo },
      {
        onSuccess: (data) => {
          setValidacion(data);
          setPaso('previa');
        },
        onError: (err) =>
          setError(
            getFirstBackendError(err) ??
              'No se pudo revisar el archivo. Intenta nuevamente.',
          ),
      },
    );
  }

  function cargar() {
    if (!archivo) return;
    setError(null);
    cargarMutation.mutate(
      { archivo, tipoConsejo },
      {
        onSuccess: (data) => {
          setResultado(data);
          setPaso('resultado');
          onCargado?.(data);
        },
        onError: (err) =>
          setError(
            getFirstBackendError(err) ??
              'No se pudo cargar el layout. Intenta nuevamente.',
          ),
      },
    );
  }

  function cerrar() {
    if (ocupado) return;
    onOpenChange(false);
  }

  const sinAcceso = !puedeCargar || !esOficinaCentral;
  const enCarga = apartado === 'cargar';

  // Selector del tipo de consejo. Es JSX en una variable, no un componente
  // local, para que no se remonte en cada render; se usa en los dos apartados.
  const selectorTipo = (
    <div
      role="radiogroup"
      aria-label="Tipo de consejo"
      className="flex flex-wrap gap-2"
    >
      {opciones.map((op) => {
        const activo = op.value === tipoConsejo;
        const Icono = ICONO_TIPO[op.value];
        return (
          <button
            key={op.value}
            type="button"
            role="radio"
            aria-checked={activo}
            onClick={() => cambiarTipo(op.value)}
            disabled={ocupado}
            className={[
              'inline-flex items-center gap-2 h-8.5 px-3 rounded-md border text-[0.8125rem] font-medium',
              'transition-colors duration-150 motion-reduce:transition-none',
              'focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/30 focus-visible:border-ring',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              activo
                ? 'bg-primary/10 border-primary text-primary'
                : 'bg-background border-input text-foreground hover:bg-accent',
            ].join(' ')}
          >
            <Icono className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>{op.label}</span>
          </button>
        );
      })}
    </div>
  );

  return (
    <Dialog
      open={open}
      onOpenChange={(valor) => !ocupado && onOpenChange(valor)}
    >
      <DialogContent
        className="max-w-[95vw] sm:max-w-5xl"
        onEscapeKeyDown={(e) => ocupado && e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>Carga de documentación y material</DialogTitle>
          <DialogDescription>
            {!enCarga &&
              'Cargas del layout hechas en el proceso, con sus conteos y quién las hizo. Solo se puede revertir la más reciente.'}
            {enCarga &&
              paso === 'archivo' &&
              'Descarga el formato de captura del tipo de consejo, llénalo y súbelo para revisarlo antes de cargar nada.'}
            {enCarga &&
              paso === 'previa' &&
              'Esto es lo que trae el archivo. Revisa las observaciones y confirma para cargar el layout.'}
            {enCarga &&
              paso === 'resultado' &&
              'Carga terminada. Los consejos ya pueden capturar su comprobación física.'}
          </DialogDescription>
        </DialogHeader>

        <DialogBody className="flex flex-col gap-4 min-h-0">
          {!sinAcceso && (
            <Tabs
              value={apartado}
              onValueChange={(valor) =>
                !ocupado && setApartado(valor as TApartado)
              }
            >
              <TabsList>
                <TabsTrigger value="cargar" disabled={ocupado}>
                  <Upload className="h-4 w-4" />
                  Cargar el layout
                </TabsTrigger>
                <TabsTrigger value="historial" disabled={ocupado}>
                  <History className="h-4 w-4" />
                  Historial de importaciones
                </TabsTrigger>
              </TabsList>
              <TabsContent
                value="historial"
                className="flex flex-col gap-4 mt-4"
              >
                {selectorTipo}
                <CargaLayoutHistorial
                  tipoConsejo={tipoConsejo}
                  activo={open && !enCarga}
                  puedeRevertir={puedeRevertir}
                />
              </TabsContent>
            </Tabs>
          )}

          {sinAcceso ? (
            <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-12 text-center space-y-3">
              <ShieldOff className="h-10 w-10 text-destructive mx-auto" />
              <p className="text-sm font-medium text-destructive">
                {puedeCargar
                  ? 'La carga del layout es trabajo de oficina central.'
                  : 'No tienes permiso para cargar el layout de documentación y material.'}
              </p>
            </div>
          ) : !enCarga ? null : (
            <>
              {error && (
                <Alert variant="destructive" appearance="light" close={false}>
                  <AlertIcon>
                    <CircleAlert />
                  </AlertIcon>
                  <AlertTitle>{error}</AlertTitle>
                </Alert>
              )}

              {paso === 'archivo' && (
                <>
                  {selectorTipo}

                  <Alert appearance="light" close={false}>
                    <AlertIcon>
                      <FileSpreadsheet className="text-primary" />
                    </AlertIcon>
                    <AlertTitle className="text-accent-foreground">
                      El formato de captura trae las columnas y las listas de
                      elección, consejo y tipo del proceso. Se admite Excel
                      (.xlsx) o csv, hasta {pesoLegible(LAYOUT_LIMITES.bytes)} y{' '}
                      {LAYOUT_LIMITES.filas.toLocaleString('es-MX')} renglones
                      por archivo. El layout se carga completo: si un renglón
                      tiene observaciones no se carga ninguno.
                    </AlertTitle>
                  </Alert>

                  <div>
                    <Button
                      variant="outline"
                      onClick={() => formatoMutation.mutate(tipoConsejo)}
                      disabled={formatoMutation.isPending || ocupado}
                    >
                      {formatoMutation.isPending ? (
                        <LoaderCircleIcon className="animate-spin" />
                      ) : (
                        <Download />
                      )}
                      Descargar el formato de captura
                    </Button>
                  </div>

                  {tipos && tipos.length > 0 && (
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs text-muted-foreground">
                        Tipos admitidos:
                      </span>
                      {tipos.map((t) => (
                        <Badge
                          key={t.clave}
                          variant="secondary"
                          appearance="light"
                        >
                          {t.clave} · {t.descripcion}
                        </Badge>
                      ))}
                    </div>
                  )}

                  <input
                    ref={inputRef}
                    type="file"
                    accept={ACEPTA}
                    className="hidden"
                    onChange={(e) => seleccionarArchivo(e.target.files?.[0])}
                  />

                  {archivo ? (
                    <div className="flex items-center gap-3 border border-border rounded-lg p-4">
                      <FileSpreadsheet className="h-8 w-8 text-primary shrink-0" />
                      <div className="min-w-0 grow">
                        <p className="text-sm font-medium truncate">
                          {archivo.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {pesoLegible(archivo.size)}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setArchivo(null);
                          setError(null);
                          limpiarInput();
                        }}
                        disabled={ocupado}
                        aria-label="Quitar el archivo"
                      >
                        <X />
                      </Button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => inputRef.current?.click()}
                      className="flex flex-col items-center justify-center gap-2 border border-dashed border-input rounded-lg py-10 text-center hover:bg-accent transition-colors cursor-pointer"
                    >
                      <Upload className="h-8 w-8 text-muted-foreground" />
                      <span className="text-sm font-medium">
                        Selecciona el archivo del layout
                      </span>
                      <span className="text-xs text-muted-foreground">
                        Excel (.xlsx) o csv
                      </span>
                    </button>
                  )}
                </>
              )}

              {paso === 'previa' && validacion && (
                <CargaLayoutPrevia validacion={validacion} />
              )}

              {paso === 'resultado' && resultado && (
                <CargaLayoutResultado resultado={resultado} />
              )}
            </>
          )}
        </DialogBody>

        <DialogFooter>
          {!sinAcceso && enCarga && paso === 'previa' && (
            <Button variant="outline" onClick={reiniciar} disabled={ocupado}>
              <Paperclip />
              Cambiar el archivo
            </Button>
          )}

          {!sinAcceso && enCarga && paso === 'resultado' && (
            <Button variant="outline" onClick={reiniciar}>
              Cargar otro layout
            </Button>
          )}

          <Button variant="outline" onClick={cerrar} disabled={ocupado}>
            Cerrar
          </Button>

          {!sinAcceso && enCarga && paso === 'archivo' && (
            <Button
              onClick={revisar}
              disabled={!archivo || validarMutation.isPending}
            >
              {validarMutation.isPending && (
                <LoaderCircleIcon className="animate-spin" />
              )}
              Revisar el archivo
            </Button>
          )}

          {!sinAcceso && enCarga && paso === 'previa' && validacion && (
            <Button
              onClick={cargar}
              disabled={validacion.rechazadas > 0 || cargarMutation.isPending}
            >
              {cargarMutation.isPending && (
                <LoaderCircleIcon className="animate-spin" />
              )}
              Cargar {validacion.validas.toLocaleString('es-MX')}{' '}
              {validacion.validas === 1 ? 'renglón' : 'renglones'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
