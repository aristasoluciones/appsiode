'use client';

import { useEffect, useState } from 'react';
import {
  CheckCircle2,
  CircleAlert,
  FileSpreadsheet,
  History,
  LoaderCircleIcon,
  Paperclip,
  Upload,
} from 'lucide-react';
import type {
  IMecanismosImportacionResultado,
  IMecanismosImportacionValidacion,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SelectorArchivo } from '@/components/common/selector-archivo';
import { useCatalogosVerificacion } from '../_hooks/use-mecanismos';
import {
  useImportarMecanismos,
  useValidarImportacionMecanismos,
} from '../_hooks/use-mecanismos-importaciones';
import { MECANISMOS_LIMITES } from '../_lib/limites';
import { CargaResumen } from './carga-resumen';
import { ImportacionPrevia } from './importacion-previa';
import { ImportacionesHistorial } from './importaciones-historial';

type TPaso = 'archivo' | 'previa' | 'resultado';
type TApartado = 'cargar' | 'historial';

/**
 * Importación del archivo del INE (un renglón por casilla), en ventana: se
 * revisa completo, se confirma desde la vista previa y entra todo o nada. El
 * segundo apartado es el historial de cargas con la reversión de la más reciente.
 */
export function ImportarMecanismosDialog({
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
    useState<IMecanismosImportacionValidacion | null>(null);
  const [resultado, setResultado] =
    useState<IMecanismosImportacionResultado | null>(null);
  const [error, setError] = useState<string | null>(null);

  const validar = useValidarImportacionMecanismos();
  const importar = useImportarMecanismos();
  const { data: catalogos, error: errorCatalogos } = useCatalogosVerificacion(
    open && puedeImportar,
  );
  const faltantes = getFirstBackendError(errorCatalogos);

  const ocupado = validar.isPending || importar.isPending;

  useEffect(() => {
    if (!open) return;
    setApartado('cargar');
    reiniciar();
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

  const enCarga = apartado === 'cargar';

  return (
    <Dialog open={open} onOpenChange={(v) => !ocupado && onOpenChange(v)}>
      <DialogContent
        className="max-w-[95vw] sm:max-w-5xl"
        onEscapeKeyDown={(e) => ocupado && e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>Importar el archivo del INE</DialogTitle>
          <DialogDescription>
            {!enCarga &&
              'Cargas del archivo del INE hechas en el proceso. Solo se puede revertir la más reciente.'}
            {enCarga &&
              paso === 'archivo' &&
              'Sube el archivo del INE con un renglón por casilla; se revisa completo antes de cargar nada.'}
            {enCarga &&
              paso === 'previa' &&
              'Esto es lo que trae el archivo. Revisa las observaciones y confirma para importar.'}
            {enCarga &&
              paso === 'resultado' &&
              'Importación aplicada. Los consejos ya pueden informar sus mecanismos.'}
          </DialogDescription>
        </DialogHeader>

        <DialogBody className="flex flex-col gap-4 min-h-0">
          {!puedeImportar ? (
            <Alert variant="destructive" appearance="light" close={false}>
              <AlertIcon>
                <CircleAlert />
              </AlertIcon>
              <AlertTitle>
                La importación masiva es solo para roles administrador.
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
                  Cargar el archivo
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
                          Se aceptan las columnas del INE por nombre y en
                          cualquier orden. Excel (.xlsx) o csv, hasta 5 MB y{' '}
                          {MECANISMOS_LIMITES.excel.filas.toLocaleString(
                            'es-MX',
                          )}{' '}
                          renglones. Un mecanismo que ya existe se actualiza; si
                          un renglón tiene observaciones no se carga ninguno.
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
                      etiqueta="Selecciona el archivo del INE"
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
                        mecanismos nuevos, {resultado.actualizados} actualizados
                        y {resultado.sin_cambios} sin cambios.
                      </AlertTitle>
                    </Alert>
                    <CargaResumen
                      cifras={[
                        { etiqueta: 'Renglones', valor: resultado.total },
                        {
                          etiqueta: 'Nuevos',
                          valor: resultado.nuevos,
                          tono: 'exito',
                        },
                        {
                          etiqueta: 'Actualizados',
                          valor: resultado.actualizados,
                        },
                        {
                          etiqueta: 'Sin cambios',
                          valor: resultado.sin_cambios,
                        },
                      ]}
                    />
                  </>
                )}
              </TabsContent>

              <TabsContent value="historial" className="mt-4">
                <ImportacionesHistorial
                  tipo="MECANISMOS"
                  activo={open && !enCarga}
                  puedeRevertir
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
              Cargar otro archivo
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
            <Button
              onClick={revisar}
              disabled={!archivo || ocupado || !!faltantes}
            >
              {validar.isPending && (
                <LoaderCircleIcon className="animate-spin" />
              )}
              Revisar el archivo
            </Button>
          )}
          {puedeImportar && enCarga && paso === 'previa' && validacion && (
            <Button
              onClick={cargar}
              disabled={validacion.rechazadas > 0 || ocupado}
            >
              {importar.isPending && (
                <LoaderCircleIcon className="animate-spin" />
              )}
              Importar {validacion.mecanismos.toLocaleString('es-MX')}{' '}
              mecanismos
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
