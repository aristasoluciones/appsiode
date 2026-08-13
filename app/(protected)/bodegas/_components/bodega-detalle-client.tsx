'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Camera,
  CheckCircle2,
  ClipboardCheck,
  FileText,
  Info,
  Loader2,
  MessageSquare,
  Pencil,
  Plus,
  Send,
  ShieldCheck,
  Trash2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import {
  Toolbar,
  ToolbarActions,
  ToolbarHeading,
  ToolbarTitle,
} from '@/components/common/toolbar';
import { useAuth } from '@/providers/auth-provider';
import { formatDateOnly } from '@/lib/helpers';
import { useBodegaDetalle, useObservacionesBodega, useAcuerdoBodega, useEliminarBodega, useFotografiasConfig, useSolicitarValidacionBodega } from '../_hooks/use-bodegas';
import { useVerificaciones } from '../_hooks/use-verificaciones';
import { UploadAcuerdo } from './upload-acuerdo';
import { FotografiasCard, type FotosState } from './fotografias-card';
import { BodegaValidacionActions } from './bodega-validacion-actions';
import type { TStatusBodega } from '@/types/bodegas';
import { AccessDenied } from '@/components/common/access-denied';
import { ErrorState } from '@/components/common/error-state';

// ─── Badge de status ──────────────────────────────────────────────────────────

const STATUS_STYLES: Record<TStatusBodega, string> = {
  'En captura':    'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  Capturada:      'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  Observada:       'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400',
  Determinada:        'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  Verificada:      'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  Aceptada:       'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  Rechazada:     'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};

function StatusBadge({ status }: { status: TStatusBodega }) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${STATUS_STYLES[status]}`}
    >
      {status}
    </span>
  );
}

// ─── Fila de dato ─────────────────────────────────────────────────────────────

function DataRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5 py-2.5 border-b border-border last:border-0">
      <dt className="text-xs font-medium text-muted-foreground">{label}</dt>
      <dd className="text-sm text-foreground text-justify">{value ?? '—'}</dd>
    </div>
  );
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface BodegaDetalleClientProps {
  id: string;
}

// ─── Componente principal ─────────────────────────────────────────────────────

export function BodegaDetalleClient({ id }: BodegaDetalleClientProps) {
  const router = useRouter();
  const { user, hasPermission } = useAuth();
  const canEditar = hasPermission('bodegas.be.actualizar');
  const canEliminar = hasPermission('bodegas.be.eliminar');
  const canVerificar = hasPermission('bodegas.be.verificaciones');
  const canRegistrarVerificacion = hasPermission('bodegas.be.registrarverificacion');
  const canFotografias = hasPermission('bodegas.be.fotografias');
  const canValidarFotografia = hasPermission('bodegas.be.validarfotografia');
  const canEliminarFotografia = hasPermission('bodegas.be.eliminarfotografia');
  const canAcuerdos = hasPermission('bodegas.be.acuerdos');
  const canValidarObservacion = hasPermission('bodegas.be.validarobservacion');
  const canEliminarObservacion = hasPermission('bodegas.be.eliminarobservacion');
  const canObservaciones = hasPermission('bodegas.be.observaciones');
  const canDeterminar = hasPermission('bodegas.be.determinar');

  const idBodega = Number(id);

  const { data: result, isLoading, isError, error, refetch } = useBodegaDetalle(idBodega);
  const bodega = result?.bodega;
  const meta = result?.meta;

  const isCapturista = parseInt(user?.idConsejo ?? '0') > 0;
  const hasAccess = !isCapturista || (
    bodega?.tipo_consejo?.toUpperCase() === user?.tipoConsejo.toUpperCase() &&
    bodega?.id_consejo === Number(user?.idConsejo)
  );

  const apiError = (error as any)?.response?.data;
  const apiErrorMessage = apiError?.message as string | undefined;
  const isForbidden = (error as any)?.response?.status === 403;
  const queriesEnabled = !!bodega && hasAccess;

  const esEnCaptura   = bodega?.status === 'En captura';
  const esCapturada  = bodega?.status === 'Capturada';
  const esObservada   = bodega?.status === 'Observada';
  const esDeterminada    = bodega?.status === 'Determinada';
  const esTerminal = ['Determinada', 'Verificada', 'Aceptada', 'Rechazada'].includes(bodega?.status ?? '');
  const modoValidacion = esCapturada || esObservada;
  // La bodega puede eliminarse únicamente hasta el estatus "Determinada".
  // Después de eso (Verificada, Aceptada, Rechazada) ya no es eliminable.
  const puedeEliminarBodega = canEliminar && (esEnCaptura || esCapturada || esObservada || esDeterminada);

  const [fotosState, setFotosState] = useState<FotosState>({
    allRequiredFilled: false,
    allProcessed: false,
    hasObservadas: false,
    allValidada: false,
  });

  const { data: acuerdo } = useAcuerdoBodega(idBodega, queriesEnabled);
  const { data: observaciones = [] } = useObservacionesBodega(idBodega, queriesEnabled);
  const { data: fotografiaConfigs = [] } = useFotografiasConfig(queriesEnabled);
  const { data: verificaciones = [] } = useVerificaciones(idBodega, queriesEnabled);
  const { mutate: eliminarBodega, isPending: eliminando } = useEliminarBodega();
  const { mutate: solicitarValidacion, isPending: solicitandoValidacion } = useSolicitarValidacionBodega();
  const [confirmDeleteBodega, setConfirmDeleteBodega] = useState(false);
  const [confirmTerminar, setConfirmTerminar] = useState(false);
  const [determinarOpen, setDeterminarOpen] = useState(false);
  const [requerirOpen, setRequerirOpen] = useState(false);

  const allPhotosValidada =
    fotosState.allRequiredFilled &&
    fotosState.allValidada;
  const hasAcuerdo = !!acuerdo;

  const obsFotosPendientes = useMemo(
    () => observaciones.filter(o => o.seccion === 'Fotografias' && o.status === 'Pendiente').length,
    [observaciones],
  );
  const obsAcuerdoPendientes = useMemo(
    () => observaciones.filter(o => o.seccion === 'Acuerdos' && o.status === 'Pendiente').length,
    [observaciones],
  );
  const obsFotosNoValidadas = useMemo(
    () => observaciones.filter(o => o.seccion === 'Fotografias' && o.status !== 'Validada').length,
    [observaciones],
  );
  const obsAcuerdoNoValidadas = useMemo(
    () => observaciones.filter(o => o.seccion === 'Acuerdos' && o.status !== 'Validada').length,
    [observaciones],
  );

  // Solo se puede eliminar fotos/acuerdo en "En captura" u "Observada"
  const puedeEliminarFotos = (esEnCaptura || esObservada) && canEliminarFotografia;
  const puedeEliminarAcuerdo = (esEnCaptura || esObservada) && hasPermission('bodegas.be.eliminaracuerdo');
  // Observaciones solo lectura en "Observada" y "Determinada"
  const soloLecturaObservaciones = esObservada || esTerminal;
  // Modo validar solo en "Capturada"
  const modoFotos = esCapturada ? 'validar' : 'upload';
  const modoAcuerdo = esCapturada ? 'validar' : 'upload';

  const backHref = useMemo(() => {
    if (!bodega) return '/bodegas';
    if (bodega.tipo === 'Oficina central') return '/bodegas/oficina-central';
    if (bodega.tipo_consejo === 'D') return `/bodegas/consejos/distritales/${bodega.id_consejo}`;
    if (bodega.tipo_consejo === 'M') return `/bodegas/consejos/municipales/${bodega.id_consejo}`;
    return '/bodegas';
  }, [bodega]);

  const consejoHref = useMemo(() => {
    if (!meta?.consejo) return undefined;
    const tipo = meta.consejo.tipo_consejo === 'D' ? 'distritales' : 'municipales';
    return `/bodegas/consejos/${tipo}/${meta.consejo.id}`;
  }, [meta]);

  // ── Loading skeleton ──
  if (isLoading) {
    return (
      <div className="space-y-5">
        <Toolbar>
          <ToolbarHeading>
            <ToolbarTitle>Detalle de Bodega</ToolbarTitle>
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem><BreadcrumbLink href="/">Inicio</BreadcrumbLink></BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem><span>Bodegas Electorales</span></BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem><BreadcrumbLink href="/bodegas">Bodegas</BreadcrumbLink></BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem><BreadcrumbPage>Bodega #{id}</BreadcrumbPage></BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </ToolbarHeading>
          <ToolbarActions>
            <Button variant="outline" size="sm" className="gap-1.5" onClick={() => router.push('/bodegas')}>
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              Volver
            </Button>
          </ToolbarActions>
        </Toolbar>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5" aria-busy="true" aria-label="Cargando detalle">
          <div className="lg:col-span-8 space-y-5">
            <Skeleton className="h-9 w-40" />
            <Card>
              <CardContent className="p-5 space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-8 w-full motion-reduce:animate-none" />
                ))}
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-5 space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-8 w-full motion-reduce:animate-none" />
                ))}
              </CardContent>
            </Card>
          </div>
          <div className="lg:col-span-4 space-y-5">
            {Array.from({ length: 3 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="p-5 space-y-2">
                  <Skeleton className="h-5 w-32 motion-reduce:animate-none" />
                  <Skeleton className="h-16 w-full motion-reduce:animate-none" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ── 403 (acceso denegado desde API) ──
  if (isForbidden) {
    return (
      <div className="space-y-5">
        <Toolbar>
          <ToolbarHeading>
            <ToolbarTitle>Detalle de Bodega</ToolbarTitle>
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem><BreadcrumbLink href="/">Inicio</BreadcrumbLink></BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem><span>Bodegas Electorales</span></BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem><BreadcrumbLink href="/bodegas">Bodegas</BreadcrumbLink></BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem><BreadcrumbPage>Bodega #{id}</BreadcrumbPage></BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </ToolbarHeading>
        </Toolbar>
        <AccessDenied description={apiErrorMessage} onBack={() => router.push('/bodegas')} />
      </div>
    );
  }

  // ── Error ──
  if (isError || !bodega) {
    return (
      <div className="space-y-5">
        <Toolbar>
          <ToolbarHeading>
            <ToolbarTitle>Detalle de Bodega</ToolbarTitle>
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem><BreadcrumbLink href="/">Inicio</BreadcrumbLink></BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem><span>Bodegas Electorales</span></BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem><BreadcrumbLink href="/bodegas">Bodegas</BreadcrumbLink></BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem><BreadcrumbPage>Bodega #{id}</BreadcrumbPage></BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </ToolbarHeading>
          <ToolbarActions>
            <Button variant="outline" size="sm" className="gap-1.5" onClick={() => router.push('/bodegas')}>
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              Volver
            </Button>
          </ToolbarActions>
        </Toolbar>
        <ErrorState
          title={apiErrorMessage ?? 'Error al cargar la bodega'}
          message="No se pudo obtener la información. Verifica el ID e intenta nuevamente."
          onRetry={refetch}
        />
      </div>
    );
  }

  // ── Acceso denegado (defensa frontend capturista) ──
  if (!hasAccess) {
    return (
      <div className="space-y-5">
        <Toolbar>
          <ToolbarHeading>
            <ToolbarTitle>Detalle de Bodega</ToolbarTitle>
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem><BreadcrumbLink href="/">Inicio</BreadcrumbLink></BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem><span>Bodegas Electorales</span></BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem><BreadcrumbPage>Bodegas</BreadcrumbPage></BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </ToolbarHeading>
        </Toolbar>
        <AccessDenied onBack={() => router.push('/bodegas')} />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* ── Toolbar con breadcrumb dinámico ────────────────────────────────── */}
      <Toolbar>
        <ToolbarHeading>
          <ToolbarTitle>Detalle de Bodega</ToolbarTitle>
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/">Inicio</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <span>Bodegas Electorales</span>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink href="/bodegas">Bodegas</BreadcrumbLink>
              </BreadcrumbItem>

              {bodega.tipo === 'Consejo' && meta?.consejo && consejoHref && (
                <>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <span>{meta.consejo.tipo_consejo_desc}</span>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <BreadcrumbLink href={consejoHref}>
                      {meta.consejo.clave_consejo}. {meta.consejo.consejo}
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                </>
              )}

              {bodega.tipo === 'Oficina central' && (
                <>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <BreadcrumbLink href="/bodegas/oficina-central">Oficina Central</BreadcrumbLink>
                  </BreadcrumbItem>
                </>
              )}

              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Bodega #{id}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </ToolbarHeading>
        <ToolbarActions>
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => router.push(backHref)}>
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Volver
          </Button>
          {canEditar && !esTerminal && bodega.status !== 'Observada' && (
            <Link href={`/bodegas/${bodega.id}/editar`}>
              <Button size="sm" className="gap-1.5">
                <Pencil className="h-4 w-4" aria-hidden="true" />
                Editar
              </Button>
            </Link>
          )}
          {puedeEliminarBodega && (
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5 text-destructive border-destructive/30 hover:bg-destructive/10 hover:text-destructive"
              onClick={() => setConfirmDeleteBodega(true)}
            >
              <Trash2 className="h-4 w-4" aria-hidden="true" />
              Eliminar
            </Button>
          )}
          {canValidarFotografia && bodega.status === 'Capturada' && (
            <BodegaValidacionActions
              idBodega={bodega.id}
              observaciones={observaciones}
              fotografiaConfigs={fotografiaConfigs}
              determinarOpen={determinarOpen}
              onDeterminarOpenChange={setDeterminarOpen}
              requerirOpen={requerirOpen}
              onRequerirOpenChange={setRequerirOpen}
            />
          )}
        </ToolbarActions>
      </Toolbar>

      {/* ── Encabezado ─────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5">

        {/* Izquierda: mensaje de observaciones */}
        {esCapturada && canValidarFotografia && (obsFotosNoValidadas > 0 || obsAcuerdoNoValidadas > 0) ? (
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-sky-50 dark:bg-sky-950/20 border border-sky-200 dark:border-sky-800/40 text-sky-700 dark:text-sky-300 text-sm">
            <Info className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span className="leading-snug">
              Hay observaciones por validar en:{' '}
              <span className="inline-flex items-center gap-1 font-medium">
                <MessageSquare className="h-3.5 w-3.5" aria-hidden="true" />
                Fotografías
                {obsFotosNoValidadas > 0 && (
                  <sup className="ml-0.5 inline-flex items-center justify-center h-4 min-w-[1rem] px-1 rounded-full bg-sky-600 dark:bg-sky-500 text-white text-[10px] font-bold leading-none">
                    {obsFotosNoValidadas}
                  </sup>
                )}
              </span>
              {obsAcuerdoNoValidadas > 0 && (
                <>
                  {' y '}
                  <span className="inline-flex items-center gap-1 font-medium">
                    <MessageSquare className="h-3.5 w-3.5" aria-hidden="true" />
                    Acuerdo
                    <sup className="ml-0.5 inline-flex items-center justify-center h-4 min-w-[1rem] px-1 rounded-full bg-sky-600 dark:bg-sky-500 text-white text-[10px] font-bold leading-none">
                      {obsAcuerdoNoValidadas}
                    </sup>
                  </span>
                </>
              )}
            </span>
          </div>
        ) : esObservada ? (
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/40 text-amber-700 dark:text-amber-300 text-sm">
            <Info className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span className="leading-snug">
              Revisa las observaciones en:{' '}
              <span className="inline-flex items-center gap-0.5 font-medium">
                <Camera className="h-3.5 w-3.5" aria-hidden="true" />
                Fotografías
                {obsFotosPendientes > 0 && (
                  <sup className="ml-0.5 inline-flex items-center justify-center h-4 min-w-[1rem] px-1 rounded-full bg-amber-600 dark:bg-amber-500 text-white text-[10px] font-bold leading-none">
                    {obsFotosPendientes}
                  </sup>
                )}
              </span>
              {obsAcuerdoPendientes > 0 && (
                <>
                  {' y '}
                  <span className="inline-flex items-center gap-0.5 font-medium">
                    <MessageSquare className="h-3.5 w-3.5" aria-hidden="true" />
                    Acuerdo
                    <sup className="ml-0.5 inline-flex items-center justify-center h-4 min-w-[1rem] px-1 rounded-full bg-amber-600 dark:bg-amber-500 text-white text-[10px] font-bold leading-none">
                      {obsAcuerdoPendientes}
                    </sup>
                  </span>
                </>
              )}
            </span>
          </div>
        ) : (
          <span />
        )}

        {/* Derecha: metadata */}
        <div className="flex items-center gap-2.5 flex-wrap sm:justify-end">
          <StatusBadge status={bodega.status} />
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span>
              Creado&nbsp;
              {new Date(bodega.created_at).toLocaleDateString('es-MX', {
                day: '2-digit', month: 'short', year: 'numeric',
              })}
            </span>
            <span aria-hidden="true">·</span>
            <span>
              Act.&nbsp;
              {new Date(bodega.updated_at).toLocaleDateString('es-MX', {
                day: '2-digit', month: 'short', year: 'numeric',
              })}
            </span>
          </div>
        </div>
      </div>

      {/* ── Grid principal ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-start">

        {/* ── Sidebar (móvil primero, md: derecha) ─────────────────────────────── */}
        <div className="md:col-span-4 space-y-5 md:order-last">
          <Card>
            <CardHeader className="pb-2">
              <h2 className="text-sm font-semibold text-foreground">Datos Generales</h2>
            </CardHeader>
            <CardContent>
              <dl>
                <DataRow label="Tipo de Bodega" value={bodega.tipo} />
                {bodega.tipo === 'Consejo' && (
                  <>
                    <DataRow
                      label="Tipo de Consejo"
                      value={bodega.tipo_consejo === 'D' ? 'Distrital' : 'Municipal'}
                    />
                    <DataRow
                      label="Consejo"
                      value={meta?.consejo != null ? `#${meta.consejo.id} ${meta.consejo.consejo}` : null}
                    />
                  </>
                )}
                <DataRow label="Órgano Competente" value={bodega.organo_competente} />
                {bodega.organo_competente === 'Otro' && (
                  <DataRow label="Función del Órgano Competente" value={bodega.otro_organo_competente || 'Sin captura'} />
                )}
              </dl>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <h2 className="text-sm font-semibold text-foreground">
                Características de la Bodega
              </h2>
            </CardHeader>
            <CardContent>
              <dl>
                <DataRow
                  label="¿Ubicada dentro del inmueble del Órgano Competente?"
                  value={
                    bodega.ubicada_en_inmueble == null
                      ? '—'
                      : bodega.ubicada_en_inmueble
                      ? 'Sí'
                      : 'No'
                  }
                />
                {bodega.ubicada_en_inmueble === false && (
                  <DataRow
                    label="Espacio donde se prevé instalar (falta de ubicación en inmueble)"
                    value={bodega.espacio_no_inmueble || 'Sin captura'}
                  />
                )}
                <DataRow
                  label="Superficie en metros cuadrados (m²)"
                  value={bodega.superficie_m2 != null ? `${bodega.superficie_m2} m²` : null}
                />
                <DataRow label="Número estimado de paquetes a resguardar" value={bodega.num_paquetes_estimados} />
                <DataRow
                  label="¿Cuenta con espacio para el resguardo de los materiales electorales?"
                  value={
                    bodega.espacio_materiales == null
                      ? '—'
                      : bodega.espacio_materiales
                      ? 'Sí'
                      : 'No'
                  }
                />
                {bodega.espacio_materiales === false && (
                  <DataRow
                    label="Medidas a tomar a falta de espacio para resguardo de materiales"
                    value={bodega.medidas_no_espacio || 'Sin captura'}
                  />
                )}
                <DataRow label="Observaciones excepcionales o diferentes a las referidas en los campos previamente requisitados" value={bodega.observaciones || 'Sin observaciones'} />
              </dl>
            </CardContent>
          </Card>

          {/* ── Card de Verificaciones ─────────────────────────────────────────── */}
          {(canVerificar && (bodega.status === 'Determinada' || bodega.status === 'Verificada' || bodega.status === 'Informada' || verificaciones.length > 0)) && (
            <Card>
              <CardHeader className="pb-2">
                <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <ClipboardCheck className="h-4 w-4 text-primary" aria-hidden="true" />
                  Verificaciones
                </h2>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Total</span>
                    <span className="text-sm font-semibold text-foreground">{verificaciones.length}</span>
                  </div>
                  {verificaciones.length > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">Última</span>
                      <span className="text-sm text-foreground">
                        {verificaciones[0].fechaVerificacion
                          ? formatDateOnly(verificaciones[0].fechaVerificacion, 'es-MX')
                          : '—'}
                      </span>
                    </div>
                  )}
                  <div className="pt-2 space-y-2">
                    {canRegistrarVerificacion && !esTerminal && (
                      <Button
                        size="sm"
                        className="w-full gap-1.5"
                        onClick={() => router.push(`/bodegas/${idBodega}/verificaciones/nueva`)}
                      >
                        <Plus className="h-4 w-4" aria-hidden="true" />
                        Nueva verificación
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full gap-1.5"
                      onClick={() => router.push(`/bodegas/${idBodega}/verificaciones`)}
                    >
                      Ver verificaciones
                      <ArrowRight className="h-4 w-4" aria-hidden="true" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* ── Contenido principal (móvil segundo, md: izquierda) ──────────────── */}
        <div className="md:col-span-8 space-y-5 md:order-first">
          <FotografiasCard
            idBodega={bodega.id}
            mode={modoFotos}
            onFotosStateChange={setFotosState}
            observaciones={observaciones}
            soloLecturaObservaciones={soloLecturaObservaciones}
            bodegaStatus={bodega.status}
            canFotografias={canFotografias}
            canValidarFotografia={canValidarFotografia}
            canObservaciones={canObservaciones}
            canValidarObservacion={canValidarObservacion}
            canEliminarObservacion={canEliminarObservacion}
            canEliminarFotografia={puedeEliminarFotos}
          />
          <UploadAcuerdo
            idBodega={bodega.id}
            mode={modoAcuerdo}
            observaciones={observaciones}
            soloLecturaObservaciones={soloLecturaObservaciones}
            bodegaStatus={bodega.status}
            canAcuerdos={canAcuerdos}
            canEliminarAcuerdo={puedeEliminarAcuerdo}
            canObservaciones={canObservaciones}
            canValidarObservacion={canValidarObservacion}
            canEliminarObservacion={canEliminarObservacion}
          />
        </div>
      </div>

      {/* Sticky footer: Terminar y enviar */}
      {hasAccess && (
        (bodega.status === 'En captura' && fotosState.allRequiredFilled && hasAcuerdo) ||
        (bodega.status === 'Observada' && fotosState.allRequiredFilled && observaciones.filter(o => o.status === 'Pendiente').length === 0)
      ) && (
        <div className="sticky bottom-0 z-10 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 py-3 bg-background border-t border-border mt-6 flex justify-end gap-2">
          <Button
            size="sm"
            className="gap-1.5 bg-pink-600 text-white hover:bg-pink-700"
            disabled={solicitandoValidacion}
            onClick={() => setConfirmTerminar(true)}
          >
            {solicitandoValidacion ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <CheckCircle2 className="h-4 w-4" />
            )}
            Terminar y enviar
          </Button>
        </div>
      )}

      {/* Sticky footer: Determinar bodega */}
      {canDeterminar && bodega.status === 'Capturada' && allPhotosValidada && hasAcuerdo && observaciones.filter(o => o.status !== 'Validada').length === 0 && (
        <div className="sticky bottom-0 z-10 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 py-3 bg-background border-t border-border mt-6 flex justify-end">
          <Button
            size="sm"
            className="gap-1.5"
            onClick={() => setDeterminarOpen(true)}
          >
            <ShieldCheck className="h-4 w-4" />
            Determinar bodega
          </Button>
        </div>
      )}

      {/* Sticky footer: Requerir */}
      {canValidarFotografia && bodega.status === 'Capturada' && observaciones.filter(o => o.status === 'Pendiente').length > 0 && (
        <div className="sticky bottom-0 z-10 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 py-3 bg-background border-t border-border mt-6 flex justify-end">
          <Button
            size="sm"
            variant="outline"
            className="gap-1.5 text-rose-600 border-rose-200 hover:bg-rose-50 hover:text-rose-700 dark:border-rose-900 dark:hover:bg-rose-950/30"
            onClick={() => setRequerirOpen(true)}
          >
            <Send className="h-4 w-4" />
            Requerir
          </Button>
        </div>
      )}

      {/* Confirmación eliminar bodega */}
      <AlertDialog open={confirmDeleteBodega} onOpenChange={setConfirmDeleteBodega}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" aria-hidden="true" />
              ¿Eliminar bodega?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará permanentemente la bodega <strong>#{bodega.id}</strong>. No se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={eliminando}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => eliminarBodega(bodega.id)}
              disabled={eliminando}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {eliminando && <Loader2 className="h-4 w-4 mr-1.5 animate-spin" aria-hidden="true" />}
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Confirmación terminar y enviar */}
      <AlertDialog open={confirmTerminar} onOpenChange={setConfirmTerminar}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-pink-500" />
              ¿Terminar y enviar?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Se cambiará el estatus de la bodega a <strong>Capturada</strong> para su determinación.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={solicitandoValidacion}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                solicitarValidacion(bodega.id);
                setConfirmTerminar(false);
              }}
              disabled={solicitandoValidacion}
              className="bg-pink-600 text-white hover:bg-pink-700"
            >
              {solicitandoValidacion && <Loader2 className="h-4 w-4 mr-1.5 animate-spin" aria-hidden="true" />}
              Terminar y enviar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
