'use client';

import { useEffect, useRef, useState } from 'react';
import {
  CircleAlert,
  CircleCheck,
  FileArchive,
  ImageOff,
  LoaderCircleIcon,
  Paperclip,
  Upload,
  X,
} from 'lucide-react';
import {
  ARTICULOS_LIMITES,
  type IArticulosFotografiasResultado,
  type IArticulosFotografiasValidacion,
  type IFotografiaObservacion,
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
  useImportarFotografiasArticulos,
  useValidarFotografiasArticulos,
} from '../_hooks/use-articulos';

type TPaso = 'archivo' | 'previa' | 'resultado';

const LIMITES = ARTICULOS_LIMITES.zip;

function pesoLegible(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** Tabla de archivos que no se aplicarán, con el motivo. */
function TablaObservaciones({ filas }: { filas: IFotografiaObservacion[] }) {
  return (
    <div className="border border-border rounded-lg">
      <ScrollArea className="max-h-[45vh]">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Archivo</TableHead>
              <TableHead>Motivo</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filas.map((f, i) => (
              <TableRow key={`${f.archivo}-${i}`}>
                <TableCell className="font-medium">{f.archivo}</TableCell>
                <TableCell className="text-muted-foreground">{f.motivo}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  );
}

/** Vista previa: qué archivos se aplican, cuáles no y qué artículos seguirían sin fotografía. */
function Previa({ validacion }: { validacion: IArticulosFotografiasValidacion }) {
  const aplican = validacion.coincidencias.length;
  const sinArticulo = validacion.sin_articulo.length;
  const invalidos = validacion.invalidos.length;
  const sinFoto = validacion.articulos_sin_fotografia.length;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="secondary" appearance="light">
          {validacion.total_archivos} archivos en el zip
        </Badge>
        <Badge variant="success" appearance="light">
          <CircleCheck />
          {aplican} se aplican
        </Badge>
        {validacion.reemplazos > 0 && (
          <Badge variant="info" appearance="light">
            {validacion.reemplazos} reemplazan una fotografía
          </Badge>
        )}
        {sinArticulo > 0 && (
          <Badge variant="warning" appearance="light">
            {sinArticulo} sin artículo
          </Badge>
        )}
        {invalidos > 0 && (
          <Badge variant="destructive" appearance="light">
            <CircleAlert />
            {invalidos} no válidos
          </Badge>
        )}
        {validacion.omitidos > 0 && (
          <Badge variant="outline">
            {validacion.omitidos} carpetas o archivos del sistema omitidos
          </Badge>
        )}
      </div>

      {aplican === 0 && (
        <Alert variant="warning" appearance="light" close={false}>
          <AlertIcon>
            <CircleAlert />
          </AlertIcon>
          <AlertTitle>
            Ningún archivo del zip corresponde a un artículo del catálogo.
            Nombra cada imagen con el código del artículo (por ejemplo,
            DOC-01.jpg) y vuelve a subirlo.
          </AlertTitle>
        </Alert>
      )}

      <Tabs defaultValue={aplican > 0 ? 'aplican' : 'sin-articulo'}>
        <TabsList>
          <TabsTrigger value="aplican">Se aplican ({aplican})</TabsTrigger>
          {sinArticulo > 0 && (
            <TabsTrigger value="sin-articulo">
              Sin artículo ({sinArticulo})
            </TabsTrigger>
          )}
          {invalidos > 0 && (
            <TabsTrigger value="invalidos">No válidos ({invalidos})</TabsTrigger>
          )}
          {sinFoto > 0 && (
            <TabsTrigger value="sin-foto">
              Seguirán sin fotografía ({sinFoto})
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="aplican">
          <div className="border border-border rounded-lg">
            <ScrollArea className="max-h-[45vh]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Archivo</TableHead>
                    <TableHead>Código</TableHead>
                    <TableHead>Descripción</TableHead>
                    <TableHead>Efecto</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {validacion.coincidencias.map((c) => (
                    <TableRow key={c.archivo}>
                      <TableCell>{c.archivo}</TableCell>
                      <TableCell className="font-medium">
                        {c.codigo}
                        {!c.activo && (
                          <Badge
                            variant="secondary"
                            appearance="light"
                            size="sm"
                            className="ms-2"
                          >
                            Inactivo
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell
                        className="max-w-[22rem] truncate"
                        title={c.descripcion}
                      >
                        {c.descripcion}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={c.reemplaza ? 'info' : 'success'}
                          appearance="light"
                          size="sm"
                        >
                          {c.reemplaza ? 'Reemplaza' : 'Nueva'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          </div>
        </TabsContent>

        {sinArticulo > 0 && (
          <TabsContent value="sin-articulo" className="flex flex-col gap-2">
            <p className="text-sm text-muted-foreground">
              Estos archivos no corresponden a ningún código del catálogo y se
              pasarán por alto.
            </p>
            <TablaObservaciones filas={validacion.sin_articulo} />
          </TabsContent>
        )}

        {invalidos > 0 && (
          <TabsContent value="invalidos" className="flex flex-col gap-2">
            <p className="text-sm text-muted-foreground">
              Estos archivos no son imágenes válidas (JPG, PNG o WEBP de hasta 5
              MB) y se pasarán por alto.
            </p>
            <TablaObservaciones filas={validacion.invalidos} />
          </TabsContent>
        )}

        {sinFoto > 0 && (
          <TabsContent value="sin-foto" className="flex flex-col gap-2">
            <p className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
              <ImageOff className="h-4 w-4" />
              Artículos activos que seguirán sin fotografía después de aplicar
              el zip.
            </p>
            <div className="border border-border rounded-lg">
              <ScrollArea className="max-h-[45vh]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Código</TableHead>
                      <TableHead>Descripción</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {validacion.articulos_sin_fotografia.map((a) => (
                      <TableRow key={a.id_articulo}>
                        <TableCell className="font-medium">{a.codigo}</TableCell>
                        <TableCell>{a.descripcion}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <ScrollBar orientation="horizontal" />
              </ScrollArea>
            </div>
          </TabsContent>
        )}
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
  resultado: IArticulosFotografiasResultado;
}) {
  const fallidas = resultado.fallidas.length;

  return (
    <div className="flex flex-col gap-4">
      <Alert
        variant={fallidas > 0 ? 'warning' : 'success'}
        appearance="light"
        close={false}
      >
        <AlertIcon>{fallidas > 0 ? <CircleAlert /> : <CircleCheck />}</AlertIcon>
        <AlertTitle>
          Se aplicaron {resultado.aplicadas.toLocaleString('es-MX')}{' '}
          fotografías ({resultado.reemplazadas.toLocaleString('es-MX')}{' '}
          reemplazos)
          {fallidas > 0
            ? ` y ${fallidas} no se pudieron guardar.`
            : '.'}
        </AlertTitle>
      </Alert>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Dato etiqueta="Aplicadas" valor={resultado.aplicadas} />
        <Dato etiqueta="Reemplazadas" valor={resultado.reemplazadas} />
        <Dato etiqueta="Sin artículo" valor={resultado.sin_articulo} />
        <Dato
          etiqueta="Artículos activos sin fotografía"
          valor={resultado.articulos_sin_fotografia}
        />
      </div>

      {fallidas > 0 && (
        <div className="flex flex-col gap-2">
          <p className="text-sm text-muted-foreground">
            Estas fotografías no se pudieron guardar; el resto sí quedó.
            Súbelas de nuevo o hazlo desde el artículo.
          </p>
          <TablaObservaciones filas={resultado.fallidas} />
        </div>
      )}
    </div>
  );
}

/**
 * Importación de fotografías por zip, en ventana. Cada imagen va nombrada con
 * el código del artículo; primero se revisa el zip sin cambiar nada y después
 * se confirma. Las que fallan se informan por nombre sin detener el resto.
 */
export function ArticulosFotografiasDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [paso, setPaso] = useState<TPaso>('archivo');
  const [archivo, setArchivo] = useState<File | null>(null);
  const [validacion, setValidacion] =
    useState<IArticulosFotografiasValidacion | null>(null);
  const [resultado, setResultado] =
    useState<IArticulosFotografiasResultado | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const validarMutation = useValidarFotografiasArticulos();
  const importarMutation = useImportarFotografiasArticulos();

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
    if (extension !== '.zip') {
      setArchivo(null);
      setError('El archivo debe ser un zip.');
      return;
    }
    if (file.size > LIMITES.bytes) {
      setArchivo(null);
      setError(
        `El zip pesa ${pesoLegible(file.size)} y el máximo permitido es ${pesoLegible(LIMITES.bytes)}.`,
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
            'No se pudo revisar el zip. Intenta nuevamente.',
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
            'No se pudieron importar las fotografías. Intenta nuevamente.',
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
          <DialogTitle>Importar fotografías</DialogTitle>
          <DialogDescription>
            {paso === 'archivo' &&
              'Sube un zip con las fotografías de los artículos, cada una nombrada con el código del artículo, para revisarlo antes de aplicar nada.'}
            {paso === 'previa' &&
              'Esto es lo que trae el zip. Revisa qué fotografías se aplican y confirma.'}
            {paso === 'resultado' &&
              'Importación terminada. Las fotografías ya se ven en el catálogo.'}
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
                  <FileArchive className="text-primary" />
                </AlertIcon>
                <AlertTitle className="text-accent-foreground">
                  Nombra cada imagen con el código del artículo (por ejemplo,
                  DOC-01.jpg; la diagonal del código puede ir como guion). Se
                  admiten JPG, PNG o WEBP de hasta 5 MB cada una, en un zip de
                  hasta {pesoLegible(LIMITES.bytes)} y {LIMITES.archivos}{' '}
                  archivos. Si el artículo ya tiene fotografía, se reemplaza.
                </AlertTitle>
              </Alert>

              <input
                ref={inputRef}
                type="file"
                accept=".zip,application/zip,application/x-zip-compressed"
                className="hidden"
                onChange={(e) => seleccionarArchivo(e.target.files?.[0])}
              />

              {archivo ? (
                <div className="flex items-center gap-3 border border-border rounded-lg p-4">
                  <FileArchive className="h-8 w-8 text-primary shrink-0" />
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
                    Selecciona el zip de fotografías
                  </span>
                  <span className="text-xs text-muted-foreground">
                    Solo zip
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
              Importar otro zip
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
              Revisar el zip
            </Button>
          )}

          {paso === 'previa' && validacion && (
            <Button
              onClick={importar}
              disabled={
                validacion.coincidencias.length === 0 ||
                importarMutation.isPending
              }
            >
              {importarMutation.isPending && (
                <LoaderCircleIcon className="animate-spin" />
              )}
              Aplicar {validacion.coincidencias.length.toLocaleString('es-MX')}{' '}
              {validacion.coincidencias.length === 1
                ? 'fotografía'
                : 'fotografías'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
