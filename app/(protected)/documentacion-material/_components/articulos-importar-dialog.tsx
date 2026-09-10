'use client';

import { useEffect, useRef, useState } from 'react';
import {
  CircleAlert,
  CircleCheck,
  Download,
  FileSpreadsheet,
  Layers,
  LoaderCircleIcon,
  Paperclip,
  Upload,
  X,
} from 'lucide-react';
import {
  ARTICULOS_LIMITES,
  type IArticuloFila,
  type IArticulosImportacionResultado,
  type IArticulosValidacion,
  type TArticuloEfecto,
} from '@/types/material-electoral';
import { getFirstBackendError } from '@/lib/helpers';
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
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  useDescargarFormatoArticulos,
  useImportarArticulos,
  useValidarImportacionArticulos,
} from '../_hooks/use-articulos';

type TPaso = 'archivo' | 'previa' | 'resultado';

const LIMITES = ARTICULOS_LIMITES.importacion;
const ACEPTA = LIMITES.extensiones.join(',');

const EFECTO: Record<
  TArticuloEfecto,
  { label: string; variant: 'success' | 'info' | 'secondary' }
> = {
  NUEVO: { label: 'Nuevo', variant: 'success' },
  ACTUALIZA: { label: 'Actualiza', variant: 'info' },
  SIN_CAMBIOS: { label: 'Sin cambios', variant: 'secondary' },
};

function pesoLegible(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** Tabla de renglones del archivo; con los motivos cuando vienen rechazados. */
function TablaFilas({
  filas,
  conMotivos,
}: {
  filas: IArticuloFila[];
  conMotivos: boolean;
}) {
  return (
    <div className="border border-border rounded-lg">
      <ScrollArea className="max-h-[45vh]">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16">Fila</TableHead>
              <TableHead>Código</TableHead>
              <TableHead>Descripción</TableHead>
              <TableHead>Tipo</TableHead>
              {conMotivos ? (
                <TableHead>Observaciones</TableHead>
              ) : (
                <TableHead>Efecto</TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filas.map((f) => (
              <TableRow
                key={f.fila}
                className={conMotivos ? 'bg-destructive/5' : undefined}
              >
                <TableCell className="text-muted-foreground">{f.fila}</TableCell>
                <TableCell className="font-medium">{f.codigo || '—'}</TableCell>
                <TableCell
                  className="max-w-[22rem] truncate"
                  title={f.descripcion}
                >
                  {f.descripcion || '—'}
                </TableCell>
                <TableCell>{f.tipo || '—'}</TableCell>
                {conMotivos ? (
                  <TableCell>
                    <ul className="list-disc ps-4 text-xs text-destructive space-y-0.5">
                      {f.errores.map((e, i) => (
                        <li key={i}>{e}</li>
                      ))}
                    </ul>
                  </TableCell>
                ) : (
                  <TableCell>
                    {f.efecto && (
                      <Badge
                        variant={EFECTO[f.efecto].variant}
                        appearance="light"
                        size="sm"
                      >
                        {EFECTO[f.efecto].label}
                      </Badge>
                    )}
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  );
}

/** Vista previa: qué se crearía, qué cambiaría y qué renglones traen observaciones. */
function Previa({ validacion }: { validacion: IArticulosValidacion }) {
  const conObservaciones = validacion.rechazadas > 0;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="secondary" appearance="light">
          {validacion.total} renglones en el archivo
        </Badge>
        <Badge variant="success" appearance="light">
          {validacion.nuevos} nuevos
        </Badge>
        <Badge variant="info" appearance="light">
          {validacion.actualizados} con cambios
        </Badge>
        <Badge variant="secondary" appearance="light">
          {validacion.sin_cambios} sin cambios
        </Badge>
        {conObservaciones && (
          <Badge variant="destructive" appearance="light">
            <CircleAlert />
            {validacion.rechazadas} con observaciones
          </Badge>
        )}
      </div>

      <Tabs defaultValue={conObservaciones ? 'observaciones' : 'muestra'}>
        <TabsList>
          {conObservaciones && (
            <TabsTrigger value="observaciones">
              Observaciones ({validacion.rechazadas})
            </TabsTrigger>
          )}
          <TabsTrigger value="muestra">Muestra del archivo</TabsTrigger>
        </TabsList>

        {conObservaciones && (
          <TabsContent value="observaciones" className="flex flex-col gap-2">
            <p className="text-sm text-muted-foreground">
              El catálogo se importa completo o no se importa: corrige estos
              renglones en el archivo y vuelve a subirlo.
            </p>
            <TablaFilas filas={validacion.filas_rechazadas} conMotivos />
            {validacion.rechazadas_omitidas > 0 && (
              <p className="text-xs text-muted-foreground">
                Se muestran los primeros {validacion.filas_rechazadas.length}{' '}
                renglones; hay {validacion.rechazadas_omitidas} más con
                observaciones.
              </p>
            )}
          </TabsContent>
        )}

        <TabsContent value="muestra" className="flex flex-col gap-2">
          <p className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
            <Layers className="h-4 w-4" />
            Primeros renglones sin observaciones, con lo que hará la
            importación en cada uno.
          </p>
          <TablaFilas filas={validacion.muestra} conMotivos={false} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Dato({ etiqueta, valor }: { etiqueta: string; valor: number }) {
  return (
    <div className="border border-border rounded-lg p-4">
      <p className="text-2xl font-semibold">{valor.toLocaleString('es-MX')}</p>
      <p className="text-sm font-medium">{etiqueta}</p>
    </div>
  );
}

function Resultado({
  resultado,
}: {
  resultado: IArticulosImportacionResultado;
}) {
  return (
    <div className="flex flex-col gap-4">
      <Alert variant="success" appearance="light" close={false}>
        <AlertIcon>
          <CircleCheck />
        </AlertIcon>
        <AlertTitle>
          Catálogo actualizado: {resultado.nuevos.toLocaleString('es-MX')}{' '}
          artículos nuevos y {resultado.actualizados.toLocaleString('es-MX')}{' '}
          actualizados de {resultado.total.toLocaleString('es-MX')} que traía el
          archivo.
        </AlertTitle>
      </Alert>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Dato etiqueta="Renglones del archivo" valor={resultado.total} />
        <Dato etiqueta="Nuevos" valor={resultado.nuevos} />
        <Dato etiqueta="Actualizados" valor={resultado.actualizados} />
        <Dato etiqueta="Sin cambios" valor={resultado.sin_cambios} />
      </div>
    </div>
  );
}

/**
 * Importación del catálogo de artículos desde Excel, en ventana. Se descarga
 * el formato con los artículos que ya existen, se sube el archivo y se
 * confirma desde la vista previa. Si el código existe se actualizan descripción
 * y tipo; si no, se registra. Nunca elimina ni inactiva.
 */
export function ArticulosImportarDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [paso, setPaso] = useState<TPaso>('archivo');
  const [archivo, setArchivo] = useState<File | null>(null);
  const [validacion, setValidacion] = useState<IArticulosValidacion | null>(
    null,
  );
  const [resultado, setResultado] =
    useState<IArticulosImportacionResultado | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const formatoMutation = useDescargarFormatoArticulos();
  const validarMutation = useValidarImportacionArticulos();
  const importarMutation = useImportarArticulos();

  const ocupado = validarMutation.isPending || importarMutation.isPending;

  // Cada apertura arranca limpia.
  useEffect(() => {
    if (!open) return;
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

  function seleccionarArchivo(file: File | null | undefined) {
    limpiarInput();
    if (!file) return;

    const extension = file.name.slice(file.name.lastIndexOf('.')).toLowerCase();
    if (!(LIMITES.extensiones as readonly string[]).includes(extension)) {
      setArchivo(null);
      setError(
        `El archivo debe ser Excel (${LIMITES.extensiones.join(' o ')}).`,
      );
      return;
    }
    if (file.size > LIMITES.bytes) {
      setArchivo(null);
      setError(
        `El archivo pesa ${pesoLegible(file.size)} y el máximo permitido es ${pesoLegible(LIMITES.bytes)}.`,
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

  function importar() {
    if (!archivo) return;
    setError(null);
    importarMutation.mutate(archivo, {
      onSuccess: (data) => {
        setResultado(data);
        setPaso('resultado');
      },
      onError: (err) =>
        setError(
          getFirstBackendError(err) ??
            'No se pudo importar el catálogo. Intenta nuevamente.',
        ),
    });
  }

  function cerrar() {
    if (ocupado) return;
    onOpenChange(false);
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(valor) => !ocupado && onOpenChange(valor)}
    >
      <DialogContent
        className="max-w-[95vw] sm:max-w-4xl"
        onEscapeKeyDown={(e) => ocupado && e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>Importar artículos</DialogTitle>
          <DialogDescription>
            {paso === 'archivo' &&
              'Descarga el formato con los artículos que ya existen, complétalo y súbelo para revisarlo antes de importar nada.'}
            {paso === 'previa' &&
              'Esto es lo que trae el archivo. Revisa las observaciones y confirma para actualizar el catálogo.'}
            {paso === 'resultado' &&
              'Importación terminada. El catálogo ya refleja los cambios.'}
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
                  El formato trae las columnas código, descripción y tipo con
                  los artículos que ya existen. Si el código existe se
                  actualizan su descripción y su tipo; si no, se registra.
                  Nunca elimina ni inactiva. Se admite Excel (.xlsx) o csv,
                  hasta {pesoLegible(LIMITES.bytes)} y{' '}
                  {LIMITES.filas.toLocaleString('es-MX')} renglones.
                </AlertTitle>
              </Alert>

              <div>
                <Button
                  variant="outline"
                  onClick={() => formatoMutation.mutate()}
                  disabled={formatoMutation.isPending || ocupado}
                >
                  {formatoMutation.isPending ? (
                    <LoaderCircleIcon className="animate-spin" />
                  ) : (
                    <Download />
                  )}
                  Descargar el formato
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
                    Selecciona el archivo de artículos
                  </span>
                  <span className="text-xs text-muted-foreground">
                    Excel (.xlsx) o csv
                  </span>
                </button>
              )}
            </>
          )}

          {paso === 'previa' && validacion && <Previa validacion={validacion} />}
          {paso === 'resultado' && resultado && (
            <Resultado resultado={resultado} />
          )}
        </DialogBody>

        <DialogFooter>
          {paso === 'previa' && (
            <Button variant="outline" onClick={reiniciar} disabled={ocupado}>
              <Paperclip />
              Cambiar el archivo
            </Button>
          )}
          {paso === 'resultado' && (
            <Button variant="outline" onClick={reiniciar}>
              Importar otro archivo
            </Button>
          )}

          <Button variant="outline" onClick={cerrar} disabled={ocupado}>
            Cerrar
          </Button>

          {paso === 'archivo' && (
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

          {paso === 'previa' && validacion && (
            <Button
              onClick={importar}
              disabled={
                validacion.rechazadas > 0 ||
                validacion.validas === 0 ||
                importarMutation.isPending
              }
            >
              {importarMutation.isPending && (
                <LoaderCircleIcon className="animate-spin" />
              )}
              Importar {validacion.validas.toLocaleString('es-MX')}{' '}
              {validacion.validas === 1 ? 'artículo' : 'artículos'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
