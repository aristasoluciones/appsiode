'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  AlertTriangle,
  ArrowLeft,
  FileText,
  Pencil,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/providers/auth-provider';
import { useBodegaDetalle } from '../../components/bodegas-data';
import { UploadAcuerdo } from './upload-acuerdo';
import { FotografiasCard } from './fotografias-card';
import type { TStatusBodega } from '@/types/bodegas';

// ─── Badge de status ──────────────────────────────────────────────────────────

const STATUS_STYLES: Record<TStatusBodega, string> = {
  'En captura':    'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  Registrada:      'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  Observada:       'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400',
  Validada:        'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  Verificada:      'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  Informada:       'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400',
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
      <dd className="text-sm text-foreground">{value ?? '—'}</dd>
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
  const { hasPermission } = useAuth();
  const canEditar = hasPermission('bodegas.ver');

  const { data: bodega, isLoading, isError, refetch } = useBodegaDetalle(id);

  // ── Loading ──
  if (isLoading) {
    return (
      <div
        className="grid grid-cols-1 lg:grid-cols-12 gap-5"
        aria-busy="true"
        aria-label="Cargando detalle"
      >
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
    );
  }

  // ── Error ──
  if (isError || !bodega) {
    return (
      <div
        className="flex flex-col items-center justify-center py-14 text-center"
        role="alert"
      >
        <div className="w-14 h-14 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
          <AlertTriangle className="h-6 w-6 text-destructive" aria-hidden="true" />
        </div>
        <h2 className="text-base font-semibold text-foreground mb-1">
          Error al cargar la bodega
        </h2>
        <p className="text-sm text-muted-foreground mb-5">
          No se pudo obtener la información. Verifica el ID e intenta nuevamente.
        </p>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => router.push('/bodegas')}>
            <ArrowLeft className="h-4 w-4" />
            Volver
          </Button>
          <Button size="sm" onClick={() => refetch()}>Reintentar</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">

      {/* ── Encabezado ─────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-x-4 gap-y-2 flex-wrap">
        {/* Izquierda: status + metadatos */}
        <div className="flex items-center gap-2.5 flex-wrap">
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

        {/* Derecha: acciones */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={() => router.push('/bodegas')}
            aria-label="Regresar a la lista"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Regresar
          </Button>
          {canEditar && (
            <Link href={`/bodegas/${bodega.id}/editar`}>
              <Button size="sm" className="gap-1.5">
                <Pencil className="h-4 w-4" aria-hidden="true" />
                Editar
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* ── Grid principal ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">

        {/* ── Columna izquierda (datos) ──────────────────────────────────────── */}
        <div className="lg:col-span-8 space-y-5">

          {/* Datos generales */}
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
                      value={bodega.id_consejo != null ? `#${bodega.id_consejo}` : null}
                    />
                  </>
                )}
                <DataRow label="Entidad Federativa" value="Chiapas" />
                <DataRow label="Órgano Competente" value={bodega.organo_competente} />
                {bodega.organo_competente === 'Otro' && (
                  <DataRow label="Especificación" value={bodega.otro_organo_competente} />
                )}
              </dl>
            </CardContent>
          </Card>

          {/* Fotografías */}
          <FotografiasCard idBodega={bodega.id} />
        </div>

        {/* ── Columna derecha ────────────────────────────────────────────────── */}
        <div className="lg:col-span-4 space-y-5">

          {/* Características de la Bodega */}
          <Card>
            <CardHeader className="pb-2">
              <h2 className="text-sm font-semibold text-foreground">
                Características de la Bodega
              </h2>
            </CardHeader>
            <CardContent>
              <dl>
                <DataRow
                  label="Ubicada en inmueble"
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
                    label="Descripción del espacio"
                    value={bodega.espacio_no_inmueble}
                  />
                )}
                <DataRow
                  label="Superficie"
                  value={bodega.superficie_m2 != null ? `${bodega.superficie_m2} m²` : null}
                />
                <DataRow label="Paquetes estimados" value={bodega.num_paquetes_estimados} />
                <DataRow
                  label="Espacio para materiales"
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
                    label="Medidas (falta de espacio)"
                    value={bodega.medidas_no_espacio}
                  />
                )}
                {bodega.observaciones && (
                  <DataRow label="Observaciones" value={bodega.observaciones} />
                )}
              </dl>
            </CardContent>
          </Card>

          {/* Acuerdo — Drag & Drop */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center gap-1.5">
                <FileText className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
                <h2 className="text-sm font-semibold text-foreground">Acuerdo</h2>
              </div>
            </CardHeader>
            <CardContent>
              <UploadAcuerdo idBodega={bodega.id} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
