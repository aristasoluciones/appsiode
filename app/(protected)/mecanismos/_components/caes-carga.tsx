'use client';

import { useEffect, useState } from 'react';
import {
  CheckCircle2,
  CircleAlert,
  Download,
  FileSpreadsheet,
  LoaderCircleIcon,
  Paperclip,
} from 'lucide-react';
import type {
  ICaesAsignacionResultado,
  ICaesImportacionResultado,
  IMecanismoSeguimiento,
} from '@/types/mecanismos';
import { getFirstBackendError } from '@/lib/helpers';
import { Alert, AlertIcon, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { SelectorArchivo } from '@/components/common/selector-archivo';
import {
  useAsignarCaes,
  useDescargarFormatoAsignacionCaes,
  useDescargarFormatoListadoCaes,
  useImportarListadoCaes,
  useValidarAsignacionCaes,
  useValidarListadoCaes,
} from '../_hooks/use-caes';
import { MECANISMOS_LIMITES } from '../_lib/limites';
import { CaesCargaItems } from './caes-carga-items';
import { CargaResumen, type ICargaCifra } from './carga-resumen';

type TPaso = 'archivo' | 'previa' | 'resultado';
type TResultado = ICaesImportacionResultado | ICaesAsignacionResultado;

interface CaesCargaProps {
  /** Listado de CAE (alta y actualización por folio) o asignación masiva a los mecanismos. */
  modo: 'listado' | 'asignacion';
  tipoConsejo: 'D' | 'M';
  /** Consejos del tipo, para acotar la asignación a uno. */
  consejos: IMecanismoSeguimiento[];
  disabled?: boolean;
  /** Avisa si hay una operación en curso, para bloquear el cierre de la ventana. */
  onOcupado: (ocupado: boolean) => void;
}

const TODOS = '__todos__';

function cifras(modo: CaesCargaProps['modo'], r: TResultado): ICargaCifra[] {
  if (modo === 'listado') {
    const x = r as ICaesImportacionResultado;
    return [
      { etiqueta: 'Renglones', valor: x.total },
      { etiqueta: 'Nuevos', valor: x.nuevos, tono: 'exito' },
      { etiqueta: 'Actualizados', valor: x.actualizados },
      { etiqueta: 'Sin cambios', valor: x.sin_cambios },
      { etiqueta: 'Rechazados', valor: x.rechazados, tono: 'peligro' },
    ];
  }
  const x = r as ICaesAsignacionResultado;
  return [
    { etiqueta: 'Renglones', valor: x.total },
    { etiqueta: 'Asignados', valor: x.asignados, tono: 'exito' },
    { etiqueta: 'Retirados', valor: x.retirados, tono: 'advertencia' },
    { etiqueta: 'Sin cambios', valor: x.sin_cambios },
    { etiqueta: 'Rechazados', valor: x.rechazados, tono: 'peligro' },
  ];
}

/** Descarga del formato, revisión con vista previa y aplicación, para las dos cargas de CAE. */
export function CaesCarga({
  modo,
  tipoConsejo,
  consejos,
  disabled,
  onOcupado,
}: CaesCargaProps) {
  const [paso, setPaso] = useState<TPaso>('archivo');
  const [archivo, setArchivo] = useState<File | null>(null);
  const [previa, setPrevia] = useState<TResultado | null>(null);
  const [resultado, setResultado] = useState<TResultado | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [idConsejo, setIdConsejo] = useState<string>(TODOS);

  const formatoListado = useDescargarFormatoListadoCaes();
  const formatoAsignacion = useDescargarFormatoAsignacionCaes();
  const validarListado = useValidarListadoCaes();
  const importarListado = useImportarListadoCaes();
  const validarAsignacion = useValidarAsignacionCaes();
  const asignar = useAsignarCaes();

  const ocupado =
    validarListado.isPending ||
    importarListado.isPending ||
    validarAsignacion.isPending ||
    asignar.isPending;
  useEffect(() => onOcupado(ocupado), [ocupado, onOcupado]);

  const consejoElegido = idConsejo === TODOS ? null : Number(idConsejo);

  function reiniciar() {
    setPaso('archivo');
    setArchivo(null);
    setPrevia(null);
    setResultado(null);
    setError(null);
  }

  function correr(aplicar: boolean) {
    if (!archivo) return;
    setError(null);
    const opciones = {
      onSuccess: (data: TResultado) => {
        if (aplicar) {
          setResultado(data);
          setPaso('resultado');
        } else {
          setPrevia(data);
          setPaso('previa');
        }
      },
      onError: (err: unknown) =>
        setError(
          getFirstBackendError(err) ??
            'No se pudo procesar el archivo. Intenta nuevamente.',
        ),
    };
    if (modo === 'listado') {
      (aplicar ? importarListado : validarListado).mutate(archivo, opciones);
    } else {
      (aplicar ? asignar : validarAsignacion).mutate(
        { archivo, tipoConsejo, idConsejo: consejoElegido },
        opciones,
      );
    }
  }

  const items = (paso === 'previa' ? previa : resultado)?.items ?? [];
  const aplicables = previa ? previa.total - previa.rechazados : 0;

  return (
    <div className="flex flex-col gap-4">
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
              {modo === 'listado'
                ? 'Descarga el formato con los CAE que ya existen, completa folio, categoría, nombre y consejo, y súbelo. El folio manda: nuevo se da de alta, existente se actualiza; lo que no venga no se toca.'
                : 'Descarga el formato con los mecanismos del tipo de consejo, captura el folio del CAE en cada renglón (vacío quita el CAE) y súbelo. Los mecanismos ya informados conservan su historial.'}
            </AlertTitle>
          </Alert>

          <div className="flex flex-wrap items-center gap-3">
            {modo === 'asignacion' && (
              <Select
                indicatorVisibility={false}
                value={idConsejo}
                onValueChange={setIdConsejo}
                disabled={disabled || ocupado}
              >
                <SelectTrigger
                  className="w-full sm:w-72"
                  aria-label="Acotar a un consejo"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={TODOS}>
                    Todos los consejos{' '}
                    {tipoConsejo === 'D' ? 'distritales' : 'municipales'}
                  </SelectItem>
                  {consejos.map((c) => (
                    <SelectItem key={c.id_consejo} value={String(c.id_consejo)}>
                      {c.id_consejo}. {c.consejo}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <Button
              variant="outline"
              onClick={() =>
                modo === 'listado'
                  ? formatoListado.mutate()
                  : formatoAsignacion.mutate({
                      tipoConsejo,
                      idConsejo: consejoElegido,
                    })
              }
              disabled={
                disabled ||
                ocupado ||
                formatoListado.isPending ||
                formatoAsignacion.isPending
              }
            >
              {formatoListado.isPending || formatoAsignacion.isPending ? (
                <LoaderCircleIcon className="animate-spin" />
              ) : (
                <Download />
              )}
              Descargar el formato
            </Button>
          </div>

          <SelectorArchivo
            archivo={archivo}
            onChange={setArchivo}
            onError={setError}
            limites={MECANISMOS_LIMITES.excel}
            etiqueta={
              modo === 'listado'
                ? 'Selecciona el listado de CAE'
                : 'Selecciona el Excel de asignación'
            }
            descripcion="Excel (.xlsx) o csv"
            disabled={disabled || ocupado}
            icono={<FileSpreadsheet />}
          />
        </>
      )}

      {(paso === 'previa' || paso === 'resultado') && (previa || resultado) && (
        <>
          {paso === 'resultado' ? (
            <Alert variant="success" appearance="light" close={false}>
              <AlertIcon>
                <CheckCircle2 />
              </AlertIcon>
              <AlertTitle>
                Carga aplicada y registrada en el historial.
              </AlertTitle>
            </Alert>
          ) : previa!.rechazados > 0 ? (
            <Alert variant="warning" appearance="light" close={false}>
              <AlertIcon>
                <CircleAlert />
              </AlertIcon>
              <AlertTitle>
                {previa!.rechazados} renglones tienen observaciones y no se
                aplicarán; los demás sí.
              </AlertTitle>
            </Alert>
          ) : null}

          <CargaResumen
            cifras={cifras(modo, (paso === 'previa' ? previa : resultado)!)}
          />

          <CaesCargaItems modo={modo} items={items} />
        </>
      )}

      <div className="flex flex-wrap justify-end gap-2">
        {paso === 'previa' && (
          <>
            <Button variant="outline" onClick={reiniciar} disabled={ocupado}>
              <Paperclip />
              Cambiar el archivo
            </Button>
            <Button
              onClick={() => correr(true)}
              disabled={aplicables === 0 || ocupado}
            >
              {(importarListado.isPending || asignar.isPending) && (
                <LoaderCircleIcon className="animate-spin" />
              )}
              Aplicar {aplicables} renglones
            </Button>
          </>
        )}
        {paso === 'resultado' && (
          <Button variant="outline" onClick={reiniciar}>
            Cargar otro archivo
          </Button>
        )}
        {paso === 'archivo' && (
          <Button
            onClick={() => correr(false)}
            disabled={!archivo || ocupado || disabled}
          >
            {(validarListado.isPending || validarAsignacion.isPending) && (
              <LoaderCircleIcon className="animate-spin" />
            )}
            Revisar el archivo
          </Button>
        )}
      </div>
    </div>
  );
}
