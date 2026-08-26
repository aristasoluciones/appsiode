'use client';

import { useEffect, useRef, useState } from 'react';
import {
  CircleAlert,
  Download,
  FileSpreadsheet,
  LoaderCircleIcon,
  Paperclip,
  TriangleAlert,
  Upload,
  X,
} from 'lucide-react';
import { Alert, AlertIcon, AlertTitle } from '@/components/ui/alert';
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
import { getFirstBackendError } from '@/lib/helpers';
import {
  MASIVO_LIMITES,
  type IMasivoResultado,
  type IMasivoValidacion,
} from '@/types/usuarios-masivo';
import {
  descargarAcuse,
  useDescargarLayoutMasivo,
  useProcesarCargaMasiva,
  useValidarCargaMasiva,
} from './usuarios-masivo-data';
import { UsuariosMasivoPrevia } from './usuarios-masivo-previa';
import { UsuariosMasivoResultado } from './usuarios-masivo-resultado';

type TPaso = 'archivo' | 'previa' | 'resultado';

const ACEPTA = MASIVO_LIMITES.extensiones.join(',');

function pesoLegible(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Generar cuentas desde un archivo: descarga del formato de captura,
 * vista previa de lo que se creará y acuse con las contraseñas iniciales.
 *
 * La ventana solo se cierra con su botón —no con Escape ni haciendo clic
 * fuera— para que nadie pierda el acuse por accidente.
 */
export function UsuariosMasivoDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [paso, setPaso] = useState<TPaso>('archivo');
  const [archivo, setArchivo] = useState<File | null>(null);
  const [validacion, setValidacion] = useState<IMasivoValidacion | null>(null);
  const [resultado, setResultado] = useState<IMasivoResultado | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirmandoCierre, setConfirmandoCierre] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const layoutMutation = useDescargarLayoutMasivo();
  const validarMutation = useValidarCargaMasiva();
  const procesarMutation = useProcesarCargaMasiva();

  const ocupado =
    validarMutation.isPending ||
    procesarMutation.isPending ||
    layoutMutation.isPending;

  // Cada apertura arranca limpia.
  useEffect(() => {
    if (!open) return;
    setPaso('archivo');
    setArchivo(null);
    setValidacion(null);
    setResultado(null);
    setError(null);
    setConfirmandoCierre(false);
  }, [open]);

  function limpiarInput() {
    if (inputRef.current) inputRef.current.value = '';
  }

  function seleccionarArchivo(file: File | null | undefined) {
    limpiarInput();
    if (!file) return;

    const extension = file.name.slice(file.name.lastIndexOf('.')).toLowerCase();
    if (!MASIVO_LIMITES.extensiones.includes(extension as '.xlsx' | '.csv')) {
      setArchivo(null);
      setError(
        `El archivo debe ser Excel (${MASIVO_LIMITES.extensiones.join(' o ')}).`,
      );
      return;
    }
    if (file.size > MASIVO_LIMITES.bytes) {
      setArchivo(null);
      setError(
        `El archivo pesa ${pesoLegible(file.size)} y el máximo permitido es ${pesoLegible(MASIVO_LIMITES.bytes)}.`,
      );
      return;
    }

    setError(null);
    setValidacion(null);
    setArchivo(file);
  }

  function validar() {
    if (!archivo) return;
    setError(null);
    validarMutation.mutate(archivo, {
      onSuccess: (data) => {
        setValidacion(data);
        setPaso('previa');
      },
      onError: (err) =>
        setError(
          getFirstBackendError(err) ??
            'No se pudo revisar el archivo. Intenta nuevamente.',
        ),
    });
  }

  function crear() {
    if (!archivo) return;
    setError(null);
    procesarMutation.mutate(archivo, {
      onSuccess: (data) => {
        setResultado(data);
        setPaso('resultado');
        // El acuse se descarga solo, para que nadie se quede sin él.
        descargarAcuse(data.acuse);
      },
      onError: (err) =>
        setError(
          getFirstBackendError(err) ??
            'No se pudieron crear las cuentas. Intenta nuevamente.',
        ),
    });
  }

  function volverAlArchivo() {
    setPaso('archivo');
    setValidacion(null);
    setError(null);
  }

  function cerrar() {
    if (ocupado) return;
    // En el resultado se advierte antes de cerrar: las contraseñas no vuelven.
    if (paso === 'resultado' && !confirmandoCierre) {
      setConfirmandoCierre(true);
      return;
    }
    onOpenChange(false);
  }

  return (
    <Dialog open={open}>
      <DialogContent
        className="max-w-[95vw] sm:max-w-5xl"
        showCloseButton={false}
        onEscapeKeyDown={(e) => e.preventDefault()}
        onPointerDownOutside={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>Generar cuentas</DialogTitle>
          <DialogDescription>
            {paso === 'archivo' &&
              'Descarga el formato de captura, llénalo y súbelo para revisarlo antes de crear las cuentas.'}
            {paso === 'previa' &&
              'Esto es lo que se creará. Revisa las observaciones y confirma para dar de alta las cuentas.'}
            {paso === 'resultado' &&
              'Proceso terminado. El acuse en Excel contiene las contraseñas iniciales.'}
          </DialogDescription>
        </DialogHeader>

        <DialogBody className="flex flex-col gap-4 min-h-0">
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
              <Alert appearance="light" close={false}>
                <AlertIcon>
                  <FileSpreadsheet className="text-primary" />
                </AlertIcon>
                <AlertTitle className="text-accent-foreground">
                  El formato de captura trae las columnas y las listas de tipo de
                  consejo, consejo y rol. Se admite Excel (.xlsx) o csv, hasta{' '}
                  {pesoLegible(MASIVO_LIMITES.bytes)} y {MASIVO_LIMITES.filas}{' '}
                  cuentas por archivo.
                </AlertTitle>
              </Alert>

              <div>
                <Button
                  variant="outline"
                  onClick={() => layoutMutation.mutate()}
                  disabled={layoutMutation.isPending}
                >
                  {layoutMutation.isPending ? (
                    <LoaderCircleIcon className="animate-spin" />
                  ) : (
                    <Download />
                  )}
                  Descargar el formato de captura
                </Button>
              </div>

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
                    <p className="text-sm font-medium truncate">{archivo.name}</p>
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
                    Selecciona el archivo con las cuentas
                  </span>
                  <span className="text-xs text-muted-foreground">
                    Excel (.xlsx) o csv
                  </span>
                </button>
              )}
            </>
          )}

          {paso === 'previa' && validacion && (
            <UsuariosMasivoPrevia validacion={validacion} />
          )}

          {paso === 'resultado' && resultado && (
            <UsuariosMasivoResultado
              resultado={resultado}
              onDescargarAcuse={() => descargarAcuse(resultado.acuse)}
            />
          )}

          {confirmandoCierre && (
            <Alert variant="warning" appearance="light" close={false}>
              <AlertIcon>
                <TriangleAlert />
              </AlertIcon>
              <AlertTitle>
                Si cierras la ventana ya no podrás recuperar las contraseñas
                iniciales. Asegúrate de tener el acuse guardado.
              </AlertTitle>
            </Alert>
          )}
        </DialogBody>

        <DialogFooter>
          {paso === 'previa' && (
            <Button
              variant="outline"
              onClick={volverAlArchivo}
              disabled={ocupado}
            >
              <Paperclip />
              Cambiar el archivo
            </Button>
          )}

          {confirmandoCierre ? (
            <>
              <Button
                variant="outline"
                onClick={() => setConfirmandoCierre(false)}
              >
                Seguir aquí
              </Button>
              <Button variant="destructive" onClick={cerrar}>
                Cerrar de todos modos
              </Button>
            </>
          ) : (
            <Button variant="outline" onClick={cerrar} disabled={ocupado}>
              Cerrar
            </Button>
          )}

          {paso === 'archivo' && (
            <Button
              onClick={validar}
              disabled={!archivo || validarMutation.isPending}
            >
              {validarMutation.isPending && (
                <LoaderCircleIcon className="animate-spin" />
              )}
              Revisar el archivo
            </Button>
          )}

          {paso === 'previa' && validacion && (
            <Button
              onClick={crear}
              disabled={validacion.validas === 0 || procesarMutation.isPending}
            >
              {procesarMutation.isPending && (
                <LoaderCircleIcon className="animate-spin" />
              )}
              Crear {validacion.validas}{' '}
              {validacion.validas === 1 ? 'cuenta' : 'cuentas'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
