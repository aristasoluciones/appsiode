'use client';

import { useEffect, useState } from 'react';
import {
  CheckCircle2,
  CircleAlert,
  FileArchive,
  History,
  LoaderCircleIcon,
  Paperclip,
  Upload,
} from 'lucide-react';
import type {
  ICedulaDocumento,
  ICedulasDocumentosResultado,
  ICedulasDocumentosValidacion,
} from '@/types/mecanismos';
import { getFirstBackendError } from '@/lib/helpers';
import { useAuth } from '@/providers/auth-provider';
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SelectorArchivo } from '@/components/common/selector-archivo';
import {
  useImportarDocumentosCedulas,
  useValidarDocumentosCedulas,
} from '../_hooks/use-cedulas';
import { MECANISMOS_LIMITES } from '../_lib/limites';
import { CargaResumen, EfectoBadge } from './carga-resumen';
import { ImportacionesHistorial } from './importaciones-historial';

type TPaso = 'archivo' | 'previa' | 'resultado';
type TApartado = 'cargar' | 'historial';

const ZIP = {
  extensiones: ['.zip'] as const,
  bytes: MECANISMOS_LIMITES.zip.bytes,
};

function DocumentosTabla({ documentos }: { documentos: ICedulaDocumento[] }) {
  return (
    <div className="max-h-72 overflow-auto rounded-md border border-border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Archivo</TableHead>
            <TableHead>Mecanismo</TableHead>
            <TableHead>Cédula actual</TableHead>
            <TableHead>Efecto</TableHead>
            <TableHead>Observaciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {documentos.map((d) => (
            <TableRow key={d.archivo}>
              <TableCell className="max-w-[260px] truncate" title={d.archivo}>
                {d.archivo}
              </TableCell>
              <TableCell className="whitespace-nowrap">
                {d.id_df
                  ? `DF${d.id_df} · ${d.tipo ?? '?'} ${d.numero ?? '?'}`
                  : '—'}
              </TableCell>
              <TableCell>{d.cedula_estatus ?? '—'}</TableCell>
              <TableCell>
                <EfectoBadge efecto={d.efecto} />
              </TableCell>
              <TableCell className="text-destructive">
                {d.error ?? ''}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

/**
 * Carga masiva de los PDF de cédula en un zip: cada archivo se empareja con su
 * mecanismo por el nombre que entrega el INE (se crea el mecanismo cuando no
 * existe). Se revisa completo y se aplican los válidos. Solo roles administrador.
 */
export function CedulasDocumentosDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { hasPermission } = useAuth();
  const puedeImportar = hasPermission('mecanismos.importar');

  const [apartado, setApartado] = useState<TApartado>('cargar');
  const [paso, setPaso] = useState<TPaso>('archivo');
  const [archivo, setArchivo] = useState<File | null>(null);
  const [validacion, setValidacion] =
    useState<ICedulasDocumentosValidacion | null>(null);
  const [resultado, setResultado] =
    useState<ICedulasDocumentosResultado | null>(null);
  const [error, setError] = useState<string | null>(null);

  const validar = useValidarDocumentosCedulas();
  const importar = useImportarDocumentosCedulas();
  const ocupado = validar.isPending || importar.isPending;

  useEffect(() => {
    if (!open) return;
    setApartado('cargar');
    setPaso('archivo');
    setArchivo(null);
    setValidacion(null);
    setResultado(null);
    setError(null);
  }, [open]);

  function reiniciar() {
    setPaso('archivo');
    setArchivo(null);
    setValidacion(null);
    setResultado(null);
    setError(null);
  }

  function revisar() {
    if (!archivo) return;
    setError(null);
    validar.mutate(archivo, {
      onSuccess: (d) => {
        setValidacion(d);
        setPaso('previa');
      },
      onError: (err) =>
        setError(
          getFirstBackendError(err) ??
            'No se pudo revisar el zip. Intenta nuevamente.',
        ),
    });
  }

  function cargar() {
    if (!archivo) return;
    setError(null);
    importar.mutate(archivo, {
      onSuccess: (d) => {
        setResultado(d);
        setPaso('resultado');
      },
      onError: (err) =>
        setError(
          getFirstBackendError(err) ??
            'No se pudo aplicar la carga. Intenta nuevamente.',
        ),
    });
  }

  const enCarga = apartado === 'cargar';

  return (
    <Dialog open={open} onOpenChange={(v) => !ocupado && onOpenChange(v)}>
      <DialogContent
        className="max-w-[95vw] sm:max-w-5xl"
        onEscapeKeyDown={(e) => ocupado && e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>Cargar documentos de cédula</DialogTitle>
          <DialogDescription>
            {!enCarga && 'Cargas de PDF de cédula hechas en el proceso.'}
            {enCarga &&
              paso === 'archivo' &&
              'Sube un zip con los PDF tal como los nombra el INE; cada uno se empareja con su mecanismo.'}
            {enCarga &&
              paso === 'previa' &&
              'Esto es lo que trae el zip. Los rechazados no se aplican; el resto queda como propuesta.'}
            {enCarga &&
              paso === 'resultado' &&
              'Carga aplicada. Los consejos ya pueden informar las cédulas propuestas.'}
          </DialogDescription>
        </DialogHeader>

        <DialogBody className="flex flex-col gap-4 min-h-0">
          {!puedeImportar ? (
            <Alert variant="destructive" appearance="light" close={false}>
              <AlertIcon>
                <CircleAlert />
              </AlertIcon>
              <AlertTitle>
                La carga por zip es solo para roles administrador.
              </AlertTitle>
            </Alert>
          ) : (
            <Tabs
              value={apartado}
              onValueChange={(v) => !ocupado && setApartado(v as TApartado)}
            >
              <TabsList>
                <TabsTrigger value="cargar" disabled={ocupado}>
                  <Upload className="h-4 w-4" />
                  Cargar el zip
                </TabsTrigger>
                <TabsTrigger value="historial" disabled={ocupado}>
                  <History className="h-4 w-4" />
                  Historial de cargas
                </TabsTrigger>
              </TabsList>

              <TabsContent value="cargar" className="flex flex-col gap-4 mt-4">
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
                        Zip de hasta 200 MB con máximo{' '}
                        {MECANISMOS_LIMITES.zip.entradas.toLocaleString(
                          'es-MX',
                        )}{' '}
                        PDF de 10 MB cada uno; se puede cargar por partes. Un
                        PDF de un mecanismo que ya tiene propuesta la reemplaza
                        y los consejos vuelven a informar; el nombre del INE no
                        se conserva.
                      </AlertTitle>
                    </Alert>
                    <SelectorArchivo
                      archivo={archivo}
                      onChange={(f) => {
                        setArchivo(f);
                        setValidacion(null);
                      }}
                      onError={setError}
                      limites={ZIP}
                      etiqueta="Selecciona el zip con los PDF"
                      descripcion="Archivo .zip de hasta 200 MB"
                      disabled={ocupado}
                      icono={<FileArchive />}
                    />
                  </>
                )}

                {paso === 'previa' && validacion && (
                  <>
                    <CargaResumen
                      cifras={[
                        {
                          etiqueta: 'Archivos',
                          valor: validacion.total_archivos,
                        },
                        {
                          etiqueta: 'Válidos',
                          valor: validacion.validos,
                          tono: 'exito',
                        },
                        {
                          etiqueta: 'Propuestas nuevas',
                          valor: validacion.proponen,
                        },
                        {
                          etiqueta: 'Reemplazos',
                          valor: validacion.reemplazan,
                          tono: 'advertencia',
                        },
                        {
                          etiqueta: 'Mecanismos nuevos',
                          valor: validacion.mecanismos_nuevos,
                        },
                        {
                          etiqueta: 'Rechazados',
                          valor: validacion.rechazados,
                          tono: 'peligro',
                        },
                        { etiqueta: 'Omitidos', valor: validacion.omitidos },
                        {
                          etiqueta: 'Mecanismos sin cédula',
                          valor: validacion.mecanismos_sin_cedula,
                        },
                      ]}
                    />
                    <DocumentosTabla documentos={validacion.documentos} />
                  </>
                )}

                {paso === 'resultado' && resultado && (
                  <>
                    <Alert variant="success" appearance="light" close={false}>
                      <AlertIcon>
                        <CheckCircle2 />
                      </AlertIcon>
                      <AlertTitle>
                        Carga #{resultado.id} aplicada: {resultado.aplicados}{' '}
                        cédulas propuestas ({resultado.creados} mecanismos
                        nuevos) y {resultado.rechazados} rechazadas.
                      </AlertTitle>
                    </Alert>
                    <DocumentosTabla documentos={resultado.items} />
                  </>
                )}
              </TabsContent>

              <TabsContent value="historial" className="mt-4">
                <ImportacionesHistorial
                  tipo="CEDULAS"
                  activo={open && !enCarga}
                />
              </TabsContent>
            </Tabs>
          )}
        </DialogBody>

        <DialogFooter>
          {puedeImportar && enCarga && paso === 'previa' && (
            <Button variant="outline" onClick={reiniciar} disabled={ocupado}>
              <Paperclip />
              Cambiar el archivo
            </Button>
          )}
          {puedeImportar && enCarga && paso === 'resultado' && (
            <Button variant="outline" onClick={reiniciar}>
              Cargar otro zip
            </Button>
          )}
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={ocupado}
          >
            Cerrar
          </Button>
          {puedeImportar && enCarga && paso === 'archivo' && (
            <Button onClick={revisar} disabled={!archivo || ocupado}>
              {validar.isPending && (
                <LoaderCircleIcon className="animate-spin" />
              )}
              Revisar el zip
            </Button>
          )}
          {puedeImportar && enCarga && paso === 'previa' && validacion && (
            <Button
              onClick={cargar}
              disabled={validacion.validos === 0 || ocupado}
            >
              {importar.isPending && (
                <LoaderCircleIcon className="animate-spin" />
              )}
              Aplicar {validacion.validos} documentos
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
