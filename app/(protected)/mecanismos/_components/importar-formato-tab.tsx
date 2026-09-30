'use client';

import { useState } from 'react';
import {
  CheckCircle2,
  CircleAlert,
  FileSpreadsheet,
  LoaderCircleIcon,
  Paperclip,
} from 'lucide-react';
import type {
  IMecanismosImportacionResultado,
  IMecanismosImportacionValidacion,
} from '@/types/mecanismos';
import { getFirstBackendError } from '@/lib/helpers';
import { Alert, AlertIcon, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { SelectorArchivo } from '@/components/common/selector-archivo';
import { useCatalogosVerificacion } from '../_hooks/use-mecanismos';
import {
  useImportarMecanismos,
  useValidarImportacionMecanismos,
} from '../_hooks/use-mecanismos-importaciones';
import { MECANISMOS_LIMITES } from '../_lib/limites';
import { CargaResumen } from './carga-resumen';
import { ImportacionPrevia } from './importacion-previa';

type TPaso = 'archivo' | 'previa' | 'resultado';

/**
 * Importación del formato (un renglón por casilla), el formato que se arma a
 * partir de las cédulas que entrega el INE: se revisa completo, se confirma
 * desde la vista previa y entra todo o nada.
 */
export function ImportarFormatoTab({ activo }: { activo: boolean }) {
  const [paso, setPaso] = useState<TPaso>('archivo');
  const [archivo, setArchivo] = useState<File | null>(null);
  const [validacion, setValidacion] =
    useState<IMecanismosImportacionValidacion | null>(null);
  const [resultado, setResultado] =
    useState<IMecanismosImportacionResultado | null>(null);
  const [error, setError] = useState<string | null>(null);

  const validar = useValidarImportacionMecanismos();
  const importar = useImportarMecanismos();
  const { data: catalogos, error: errorCatalogos } =
    useCatalogosVerificacion(activo);
  const faltantes = getFirstBackendError(errorCatalogos);
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

  function cargar() {
    if (!archivo) return;
    setError(null);
    importar.mutate(archivo, {
      onSuccess: (data) => {
        setResultado(data);
        setPaso('resultado');
      },
      onError: (err) =>
        setError(
          getFirstBackendError(err) ??
            'No se pudo importar el archivo. Intenta nuevamente.',
        ),
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-muted-foreground">
        {paso === 'archivo' &&
          'Sube el formato de importación, un renglón por casilla; se revisa completo antes de cargar nada.'}
        {paso === 'previa' &&
          'Esto es lo que trae el archivo. Revisa las observaciones y confirma para importar.'}
        {paso === 'resultado' &&
          'Importación aplicada. Los consejos ya pueden informar sus mecanismos.'}
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
          {faltantes ? (
            <Alert variant="warning" appearance="light" close={false}>
              <AlertIcon>
                <CircleAlert />
              </AlertIcon>
              <AlertTitle>{faltantes}</AlertTitle>
            </Alert>
          ) : (
            <Alert appearance="light" close={false}>
              <AlertIcon>
                <FileSpreadsheet className="text-primary" />
              </AlertIcon>
              <AlertTitle className="text-accent-foreground">
                El formato se arma a partir de las cédulas que entrega el INE;
                sus columnas se aceptan por nombre y en cualquier orden. Excel
                (.xlsx) o csv, hasta 5 MB y{' '}
                {MECANISMOS_LIMITES.excel.filas.toLocaleString('es-MX')}{' '}
                renglones. Un mecanismo que ya existe se actualiza; si un
                renglón tiene observaciones no se carga ninguno.
                {catalogos?.avisos?.length
                  ? ` ${catalogos.avisos.join(' ')}`
                  : ''}
              </AlertTitle>
            </Alert>
          )}

          <SelectorArchivo
            archivo={archivo}
            onChange={(f) => {
              setArchivo(f);
              setValidacion(null);
            }}
            onError={setError}
            limites={MECANISMOS_LIMITES.excel}
            etiqueta="Selecciona el formato de importación"
            descripcion="Excel (.xlsx) o csv"
            disabled={ocupado || !!faltantes}
            icono={<FileSpreadsheet />}
          />
        </>
      )}

      {paso === 'previa' && validacion && (
        <ImportacionPrevia validacion={validacion} />
      )}

      {paso === 'resultado' && resultado && (
        <>
          <Alert variant="success" appearance="light" close={false}>
            <AlertIcon>
              <CheckCircle2 />
            </AlertIcon>
            <AlertTitle>
              Importación #{resultado.id} aplicada: {resultado.nuevos}{' '}
              mecanismos nuevos, {resultado.actualizados} actualizados y{' '}
              {resultado.sin_cambios} sin cambios.
            </AlertTitle>
          </Alert>
          <CargaResumen
            cifras={[
              { etiqueta: 'Renglones', valor: resultado.total },
              { etiqueta: 'Nuevos', valor: resultado.nuevos, tono: 'exito' },
              { etiqueta: 'Actualizados', valor: resultado.actualizados },
              { etiqueta: 'Sin cambios', valor: resultado.sin_cambios },
            ]}
          />
        </>
      )}

      <div className="flex flex-wrap justify-end gap-2">
        {paso === 'previa' && (
          <Button variant="outline" onClick={reiniciar} disabled={ocupado}>
            <Paperclip />
            Cambiar el formato
          </Button>
        )}
        {paso === 'resultado' && (
          <Button variant="outline" onClick={reiniciar}>
            Cargar otro formato
          </Button>
        )}
        {paso === 'archivo' && (
          <Button
            onClick={revisar}
            disabled={!archivo || ocupado || !!faltantes}
          >
            {validar.isPending && <LoaderCircleIcon className="animate-spin" />}
            Revisar el formato
          </Button>
        )}
        {paso === 'previa' && validacion && (
          <Button
            onClick={cargar}
            disabled={validacion.rechazadas > 0 || ocupado}
          >
            {importar.isPending && (
              <LoaderCircleIcon className="animate-spin" />
            )}
            Importar {validacion.mecanismos.toLocaleString('es-MX')} mecanismos
          </Button>
        )}
      </div>
    </div>
  );
}
