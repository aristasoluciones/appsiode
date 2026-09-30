'use client';

import { useState } from 'react';
import {
  CheckCircle2,
  CircleAlert,
  FileArchive,
  LoaderCircleIcon,
  Paperclip,
} from 'lucide-react';
import type {
  ICedulaDocumento,
  ICedulasDocumentosResultado,
  ICedulasDocumentosValidacion,
} from '@/types/mecanismos';
import { getFirstBackendError } from '@/lib/helpers';
import { Alert, AlertIcon, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { SelectorArchivo } from '@/components/common/selector-archivo';
import {
  useImportarCedulas,
  useValidarImportacionCedulas,
} from '../_hooks/use-mecanismos-importaciones';
import { MECANISMOS_LIMITES } from '../_lib/limites';
import { CargaResumen, EfectoBadge } from './carga-resumen';

type TPaso = 'archivo' | 'previa' | 'resultado';

const ZIP = {
  extensiones: ['.zip'] as const,
  bytes: MECANISMOS_LIMITES.zip.bytes,
};

/** Cada PDF del zip con el mecanismo al que se emparejó por número y su efecto. */
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
              <TableCell>
                {d.tiene_cedula == null ? '—' : d.tiene_cedula ? 'Sí' : 'No'}
              </TableCell>
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
 * existe). Se revisa completo y se aplican los válidos.
 */
export function ImportarCedulasTab() {
  const [paso, setPaso] = useState<TPaso>('archivo');
  const [archivo, setArchivo] = useState<File | null>(null);
  const [validacion, setValidacion] =
    useState<ICedulasDocumentosValidacion | null>(null);
  const [resultado, setResultado] =
    useState<ICedulasDocumentosResultado | null>(null);
  const [error, setError] = useState<string | null>(null);

  const validar = useValidarImportacionCedulas();
  const importar = useImportarCedulas();
  const ocupado = validar.isPending || importar.isPending;

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

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-muted-foreground">
        {paso === 'archivo' &&
          'Sube un zip con los PDF nombrados con el número de mecanismo; cada uno se empareja con su mecanismo por ese número.'}
        {paso === 'previa' &&
          'Esto es lo que trae el zip. Los rechazados no se aplican; el resto se carga o reemplaza la cédula del mecanismo.'}
        {paso === 'resultado' &&
          'Carga aplicada. Los consejos ya pueden consultar las cédulas desde sus mecanismos.'}
      </p>

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
              Puedes subir un PDF con la cédula de cada mecanismo o, si una
              cédula del INE agrupa varios mecanismos, repetir el mismo PDF una
              vez por cada número de mecanismo (toma en cuenta que así los PDF
              se duplican y el zip crece). El zip puede pesar hasta 200 MB en
              total y traer hasta{' '}
              {MECANISMOS_LIMITES.zip.entradas.toLocaleString('es-MX')} PDF, y
              cada PDF hasta 10 MB; si rebasas cualquiera de los dos topes del
              zip, cárgalo por partes. Un PDF de un mecanismo que ya tiene
              cédula la reemplaza; el nombre del archivo no se conserva.
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
              { etiqueta: 'Archivos', valor: validacion.total_archivos },
              { etiqueta: 'Válidos', valor: validacion.validos, tono: 'exito' },
              { etiqueta: 'Cédulas nuevas', valor: validacion.cargan },
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
                etiqueta: 'Quedarán sin cédula',
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
              Carga #{resultado.id} aplicada: {resultado.aplicados} cédulas (
              {resultado.reemplazados} reemplazos, {resultado.creados}{' '}
              mecanismos nuevos) y {resultado.rechazados} rechazadas.
            </AlertTitle>
          </Alert>
          <DocumentosTabla documentos={resultado.items} />
        </>
      )}

      <div className="flex flex-wrap justify-end gap-2">
        {paso === 'previa' && (
          <Button variant="outline" onClick={reiniciar} disabled={ocupado}>
            <Paperclip />
            Cambiar el archivo
          </Button>
        )}
        {paso === 'resultado' && (
          <Button variant="outline" onClick={reiniciar}>
            Cargar otro zip
          </Button>
        )}
        {paso === 'archivo' && (
          <Button onClick={revisar} disabled={!archivo || ocupado}>
            {validar.isPending && <LoaderCircleIcon className="animate-spin" />}
            Revisar el zip
          </Button>
        )}
        {paso === 'previa' && validacion && (
          <Button
            onClick={cargar}
            disabled={validacion.validos === 0 || ocupado}
          >
            {importar.isPending && (
              <LoaderCircleIcon className="animate-spin" />
            )}
            Aplicar {validacion.validos} cédulas
          </Button>
        )}
      </div>
    </div>
  );
}
