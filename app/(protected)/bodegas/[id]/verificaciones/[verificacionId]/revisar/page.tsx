'use client';

import { useState, use, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronsRight,
  FileText,
  ImageIcon,
  Info,
  Loader2,
  Maximize2,
  Pencil,
  ShieldCheck,
  XCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Container } from '@/components/common/container';
import {
  Toolbar,
  ToolbarActions,
  ToolbarHeading,
  ToolbarTitle,
} from '@/components/common/toolbar';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/providers/auth-provider';
import { useVerificacionDetalle, useRevisarVerificacion } from '../../../../_hooks/use-verificaciones';
import { useFotografiasConfig, useFotografiasConConfig } from '../../../../_hooks/use-bodegas';
import type { TVerificacionResultado } from '@/types/verificaciones';
import type { IFotografia, IFotografiaConfig } from '@/types/bodegas';
import { formatDateOnly } from '@/lib/helpers';

interface RevisarPageProps {
  params: Promise<{ id: string; verificacionId: string }>;
}

function valorDisplay(value: React.ReactNode) {
  if (value === '' || value == null) return <span className="text-muted-foreground italic">Sin captura</span>;
  return value;
}

function DataRow({ label, value, noBorder }: { label: string; value: React.ReactNode; noBorder?: boolean }) {
  return (
    <div className={`flex flex-col gap-0.5 py-2 ${noBorder ? '' : 'border-b border-border last:border-0'}`}>
      <dt className="text-xs font-medium text-muted-foreground">{label}</dt>
      <dd className="text-sm text-foreground">{valorDisplay(value)}</dd>
    </div>
  );
}

function MedidasFechaRow({
  pregunta,
  medidas,
  fecha,
  noBorder,
}: {
  pregunta: string;
  medidas: string | null | undefined;
  fecha: string | null | undefined;
  noBorder?: boolean;
}) {
  const medidasTxt = medidas ? medidas.trim() : '';
  const fechaTxt = fecha ? fecha.trim() : '';
  const sinMedidas = medidasTxt === '';
  const sinFecha = fechaTxt === '';

  let fechaFmt = '';
  if (!sinFecha) {
    fechaFmt = formatDateOnly(fechaTxt, 'es-MX');
    // Fallback: si la cadena no es parseable como fecha, mostrarla tal cual.
    if (!fechaFmt) fechaFmt = fechaTxt;
  }

  return (
    <div className={`flex flex-col gap-1 py-2 ${noBorder ? '' : 'border-b border-border last:border-0'}`}>
      <dt className="text-xs font-medium text-muted-foreground">{pregunta}</dt>
      <dd className="text-sm text-foreground whitespace-pre-line">
        {sinMedidas ? <span className="text-muted-foreground italic">Sin captura</span> : medidasTxt}
      </dd>
      <dd className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Calendar className="size-3.5" />
        <span className="font-medium">Fecha:</span>
        <span className={sinFecha ? 'italic' : 'text-foreground'}>{sinFecha ? 'Sin captura' : fechaFmt}</span>
      </dd>
    </div>
  );
}

// ─── Sección de fotografías de verificación (solo lectura) ────────────────────

const ETAPA_MOMENTO_LABEL_VER: Record<string, string> = {
  Antes:     'Antes',
  Durante:   'Durante',
  Posterior: 'Posterior',
};

const ORDEN_MOMENTO_VER: Record<string, number> = { Antes: 0, Durante: 1, Posterior: 2 };

function CollapseCard({
  title,
  icon,
  expanded,
  onToggle,
  children,
  badge,
}: {
  title: string;
  icon: React.ReactNode;
  expanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  badge?: React.ReactNode;
}) {
  return (
    <Card>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={expanded}
        className="w-full px-4 py-3 flex items-center gap-2 border-b border-border bg-muted/20 hover:bg-muted/30 transition-colors text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      >
        {expanded
          ? <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          : <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
        }
        <span className="text-muted-foreground shrink-0">{icon}</span>
        <h3 className="text-sm font-semibold text-foreground flex-1">{title}</h3>
        {badge}
      </button>
      {expanded && <CardContent className="p-0">{children}</CardContent>}
    </Card>
  );
}



// ─── Vista previa de 3 momentos simultáneos ────────────────────────────────

interface VistaPreviaMomento {
  momento: string;            // 'Antes' | 'Durante' | 'Posterior'
  config: IFotografiaConfig | null;
  fotos: IFotografia[];       // todas las fotos del momento (vacío si no hay)
}

function VistaPreviaTresMomentosDialog({
  open,
  onOpenChange,
  subcategoria,
  categoria,
  momentos,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subcategoria: string;
  categoria: string;
  momentos: VistaPreviaMomento[];
}) {
  const [indexByMomento, setIndexByMomento] = useState<Record<string, number>>({});

  // Al cambiar de subcategoría (o reabrir) reiniciamos los índices a 0
  useEffect(() => {
    if (open) setIndexByMomento({});
  }, [open, subcategoria]);

  function getIndex(momento: string, total: number) {
    const v = indexByMomento[momento] ?? 0;
    return Math.min(Math.max(v, 0), Math.max(total - 1, 0));
  }

  function prev(momento: string, total: number) {
    setIndexByMomento((prevMap) => ({
      ...prevMap,
      [momento]: (getIndex(momento, total) - 1 + total) % total,
    }));
  }

  function next(momento: string, total: number) {
    setIndexByMomento((prevMap) => ({
      ...prevMap,
      [momento]: (getIndex(momento, total) + 1) % total,
    }));
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl w-full">
        <DialogHeader>
          <DialogTitle>{subcategoria}</DialogTitle>
          <DialogDescription>
            Vista comparativa del Antes, Durante y Después
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {momentos.map((m) => {
            const total = m.fotos.length;
            const idx = getIndex(m.momento, total);
            const currentFoto = total > 0 ? m.fotos[idx] : null;
            const label = ETAPA_MOMENTO_LABEL_VER[m.momento] ?? m.momento;
            return (
              <div key={m.momento} className="flex flex-col gap-2 rounded-md border border-border bg-muted/30 p-2">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-semibold uppercase tracking-wider text-foreground">
                    {label}
                  </span>
                  {total > 1 && (
                    <span className="text-[10px] text-muted-foreground">
                      {idx + 1}/{total}
                    </span>
                  )}
                </div>
                {currentFoto ? (
                  <div className="group/carousel relative aspect-square w-full rounded overflow-hidden border border-border">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={currentFoto.url}
                      alt={`${label} - ${subcategoria}`}
                      className="w-full h-full object-cover"
                    />
                    {total > 1 && (
                      <>
                        <button
                          type="button"
                          onClick={() => prev(m.momento, total)}
                          aria-label={`Foto anterior de ${label}`}
                          className="absolute left-1 top-1/2 -translate-y-1/2 inline-flex items-center justify-center h-7 w-7 rounded-full bg-black/60 text-white opacity-0 group-hover/carousel:opacity-100 focus-visible:opacity-100 hover:bg-black/80 transition-all"
                        >
                          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                        </button>
                        <button
                          type="button"
                          onClick={() => next(m.momento, total)}
                          aria-label={`Foto siguiente de ${label}`}
                          className="absolute right-1 top-1/2 -translate-y-1/2 inline-flex items-center justify-center h-7 w-7 rounded-full bg-black/60 text-white opacity-0 group-hover/carousel:opacity-100 focus-visible:opacity-100 hover:bg-black/80 transition-all"
                        >
                          <ChevronRight className="h-4 w-4" aria-hidden="true" />
                        </button>
                        <a
                          href={currentFoto.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="absolute bottom-1 right-1 inline-flex items-center justify-center h-6 w-6 rounded-full bg-black/60 text-white opacity-0 group-hover/carousel:opacity-100 focus-visible:opacity-100 hover:bg-black/80 transition-all"
                          title="Abrir imagen en nueva pestaña"
                          aria-label="Abrir imagen en nueva pestaña"
                        >
                          <Maximize2 className="h-3 w-3" aria-hidden="true" />
                        </a>
                        <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-1">
                          {m.fotos.map((_, i) => (
                            <span
                              key={i}
                              className={`block h-1.5 rounded-full transition-all ${
                                i === idx ? 'w-4 bg-white' : 'w-1.5 bg-white/40'
                              }`}
                            />
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                ) : (
                  <div className="aspect-square w-full rounded border border-dashed border-border flex flex-col items-center justify-center text-muted-foreground gap-1.5">
                    <ImageIcon className="h-8 w-8" aria-hidden="true" />
                    <span className="text-[11px] italic">Sin fotografía</span>
                  </div>
                )}
                {m.config?.descripcion && (
                  <p className="text-[10px] italic text-muted-foreground leading-snug">
                    {m.config.descripcion}
                  </p>
                )}
              </div>
            );
          })}
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" size="sm" onClick={() => onOpenChange(false)}>
            Cerrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Slot por momento en el listado ──────────────────────────────────────────

function MomentoSlot({
  momento,
  foto,
  total,
  onClick,
}: {
  momento: string;
  foto: IFotografia | null;
  total: number;
  onClick: () => void;
}) {
  const label = ETAPA_MOMENTO_LABEL_VER[momento] ?? momento;
  const more = total - 1;
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex flex-col items-stretch gap-1 text-left rounded-md border border-border bg-card hover:border-primary/60 hover:bg-muted/30 transition-colors overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      title={foto ? `Ver ${total} foto(s) de ${label}` : `Sin fotografía - ${label}`}
    >
      <span className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground bg-muted/40 border-b border-border">
        {label}
      </span>
      {foto ? (
        <div className="relative">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={foto.url}
            alt={label}
            className="w-full h-24 object-cover"
            loading="lazy"
          />
          {more > 0 && (
            <span className="absolute top-1 right-1 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-black/70 text-white text-[10px] font-semibold">
              +{more}
            </span>
          )}
        </div>
      ) : (
        <div className="h-24 flex flex-col items-center justify-center text-muted-foreground gap-1 px-2">
          <ImageIcon className="h-5 w-5" aria-hidden="true" />
          <span className="text-[10px] italic">Sin fotografía</span>
        </div>
      )}
    </button>
  );
}

function FotografiasVerificacion({ idBodega }: { idBodega: number }) {
  const { data: configs = [], isLoading: loadingConfig } = useFotografiasConfig();
  const { data: fotos = [], isLoading: loadingFotos } = useFotografiasConConfig(idBodega);

  const [vistaPrevia, setVistaPrevia] = useState<{
    subcategoria: string;
    categoria: string;
    momentos: VistaPreviaMomento[];
  } | null>(null);

  const isLoading = loadingConfig || loadingFotos;

  const configsVerificacion = configs.filter((c) => c.etapa === 'Verificacion');
  const categorias = Array.from(new Set(configsVerificacion.map((c) => c.categoria)));

  function buildMomentos(subcategoria: string, configsGrupo: IFotografiaConfig[]): VistaPreviaMomento[] {
    const momentosOrden: ('Antes' | 'Durante' | 'Posterior')[] = ['Antes', 'Durante', 'Posterior'];
    return momentosOrden.map((m) => {
      const cfg = configsGrupo.find((c) => c.momento === m) ?? null;
      const fotosMomento = cfg ? fotos.filter((f) => f.id_config === cfg.id) : [];
      return {
        momento: m,
        config: cfg,
        fotos: fotosMomento,
      };
    });
  }

  return (
    <div className="max-h-[calc(100vh-16rem)] overflow-y-auto pr-1">
      {isLoading ? (
        <div className="p-4 space-y-3">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      ) : configsVerificacion.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-center text-muted-foreground">
          <ImageIcon className="h-6 w-6 mb-2" />
          <p className="text-sm">Sin configuración de fotografías de verificación.</p>
        </div>
      ) : (
        <div className="divide-y divide-border">
          {categorias.map((categoria) => {
            const slotsCat = configsVerificacion.filter((c) => c.categoria === categoria);
            const gruposMap = new Map<string, IFotografiaConfig[]>();
            for (const cfg of slotsCat) {
              const key = cfg.subcategoria ?? `__sin_subcat_${cfg.id}`;
              if (!gruposMap.has(key)) gruposMap.set(key, []);
              gruposMap.get(key)!.push(cfg);
            }
            return (
              <div key={categoria}>
                <div className="px-4 py-2 bg-muted/20 border-b border-border">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    {categoria}
                  </span>
                </div>
                {Array.from(gruposMap.entries()).map(([key, configsGrupo]) => {
                  // Si no hay subcategoría, mostramos fallback simple
                  if (key.startsWith('__sin_subcat_')) {
                    return (
                      <div key={key} className="px-4 py-2 space-y-1.5">
                        {configsGrupo.map((cfg) => {
                          const fotosMomento = fotos.filter((f) => f.id_config === cfg.id);
                          return (
                            <div key={cfg.id} className="text-xs">
                              <span className="font-semibold">{ETAPA_MOMENTO_LABEL_VER[cfg.momento] ?? cfg.momento}:</span>{' '}
                              {fotosMomento.length > 0
                                ? <span className="text-muted-foreground">{fotosMomento.length} foto(s)</span>
                                : <span className="italic text-muted-foreground">Sin fotografía</span>}
                            </div>
                          );
                        })}
                      </div>
                    );
                  }
                  const momentos = buildMomentos(key, configsGrupo);
                  const fotosPorMomento = {
                    Antes: momentos[0].total,
                    Durante: momentos[1].total,
                    Posterior: momentos[2].total,
                  };
                  return (
                    <div key={key} className="px-4 py-3 space-y-2">
                      <h4 className="text-sm font-semibold text-foreground">{key}</h4>
                      <div className="grid grid-cols-3 gap-2">
                        {momentos.map((m) => (
                          <MomentoSlot
                            key={m.momento}
                            momento={m.momento}
                            foto={m.fotos[0] ?? null}
                            total={m.fotos.length}
                            onClick={() => setVistaPrevia({ subcategoria: key, categoria, momentos })}
                          />
                        ))}
                      </div>
                      {(fotosPorMomento.Antes + fotosPorMomento.Durante + fotosPorMomento.Posterior) === 0 && (
                        <p className="text-[10px] italic text-muted-foreground text-center pt-1">
                          Sin fotografías en ningún momento
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      )}

      <VistaPreviaTresMomentosDialog
        open={vistaPrevia !== null}
        onOpenChange={(open) => { if (!open) setVistaPrevia(null); }}
        subcategoria={vistaPrevia?.subcategoria ?? ''}
        categoria={vistaPrevia?.categoria ?? ''}
        momentos={vistaPrevia?.momentos ?? []}
      />
    </div>
  );
}

function GridRow({ children }: { children: React.ReactNode }) {
  return <div className="md:grid md:grid-cols-2 md:gap-x-4">{children}</div>;
}

function InlineRow({ children, cols = 4 }: { children: React.ReactNode; cols?: 2 | 3 | 4 | 5 }) {
  const colsMap: Record<number, string> = { 2: 'md:grid-cols-2', 3: 'md:grid-cols-3', 4: 'md:grid-cols-4', 5: 'md:grid-cols-5' };
  return <div className={`grid grid-cols-2 ${colsMap[cols]} gap-3 py-2`}>{children}</div>;
}

function InlineCell({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-xs font-medium text-muted-foreground">{label}</dt>
      <dd className="text-sm text-foreground truncate">{value ?? '—'}</dd>
    </div>
  );
}

function SectionCard({ title, children, defaultExpanded = true }: { title: string; children: React.ReactNode; defaultExpanded?: boolean }) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  return (
    <Card>
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
        className="w-full px-4 py-3 flex items-center gap-2 border-b border-border bg-muted/20 hover:bg-muted/30 transition-colors text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      >
        {expanded
          ? <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          : <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
        }
        <h3 className="text-sm font-semibold text-foreground flex-1">{title}</h3>
      </button>
      {expanded && (
        <CardContent className="space-y-0 pt-3">
          {children}
        </CardContent>
      )}
    </Card>
  );
}

function SiNoReadonly({ value }: { value: boolean | undefined | null }) {
  if (value == null) return <span className="text-muted-foreground">—</span>;
  return value
    ? <span className="text-emerald-600 font-medium">Sí</span>
    : <span className="text-rose-600 font-medium">No</span>;
}

export default function RevisarPage({ params }: RevisarPageProps) {
  const { id, verificacionId } = use(params);
  const router = useRouter();
  const { hasPermission } = useAuth();
  const idBodega = Number(id);
  const idVerif = Number(verificacionId);
  const canEditar = hasPermission('bodegas.be.actualizarverificacion');
  const canRevisar = hasPermission('bodegas.be.actualizarverificacion');
  const canFinalizar = hasPermission('bodegas.be.finalizarverificacion');

  const { data: detalle, isLoading } = useVerificacionDetalle(idBodega, idVerif, true);
  const verificacion = detalle?.data ?? null;
  const metaData = detalle?.meta ?? null;
  const { mutate: revisar, isPending: revisando } = useRevisarVerificacion(idBodega);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [resultado, setResultado] = useState<TVerificacionResultado | null>(null);
  // null = sin selección (solo válido cuando resultado === 'Rechazada');
  // true/false = selección explícita. Cuando resultado === 'Aceptada' se ignora
  // y siempre se envía true en finalizar_proceso.
  const [finalizarProceso, setFinalizarProceso] = useState<boolean | null>(null);
  const [cedulaExpanded, setCedulaExpanded] = useState(true);
  const [fotosExpanded, setFotosExpanded] = useState(true);

  const isRevisada = verificacion?.status === 'Revisada';
  const cedulaUrl = verificacion?.urlCedula || (verificacion?.cedulaRutaArchivo
    ? `${process.env.NEXT_PUBLIC_API_URL ?? ''}/uploads/${verificacion.cedulaRutaArchivo}`
    : null);

  function resetDialogState() {
    setResultado(null);
    setFinalizarProceso(null);
  }

  // Determina si el botón Finalizar debe estar habilitado.
  const canFinalizarRev = (() => {
    if (!resultado) return false;
    if (resultado === 'Aceptada') return true;
    // Rechazada: requiere selección explícita de finalizar_proceso
    return finalizarProceso !== null;
  })();

  function handleFinalizarRevision() {
    if (!resultado || !verificacion) return;
    const finalizar = resultado === 'Aceptada' ? true : (finalizarProceso ?? false);
    revisar({ id: verificacion.id, resultado, finalizar_proceso: finalizar });
    setDialogOpen(false);
    resetDialogState();
  }

  if (!canRevisar) {
    return (
      <Container>
        <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-12 text-center">
          <ShieldCheck className="h-10 w-10 text-destructive mx-auto mb-3" />
          <p className="text-sm font-medium text-destructive">No tienes permiso para revisar verificaciones.</p>
        </div>
      </Container>
    );
  }

  return (
    <Container>
      <Toolbar>
        <ToolbarHeading>
          <ToolbarTitle>Revisar Verificación</ToolbarTitle>
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem><BreadcrumbLink href="/">Inicio</BreadcrumbLink></BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem><BreadcrumbLink href="/bodegas">Bodegas Electorales</BreadcrumbLink></BreadcrumbItem>
              {metaData?.bodega?.tipo === 'Consejo' && metaData?.consejo && (
                  <>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                      <BreadcrumbLink
                        href={`/bodegas/consejos/${metaData.consejo.tipo_consejo === 'D' ? 'distritales' : 'municipales'}`}
                      >
                        {metaData.consejo.tipo_consejo_desc}
                      </BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                      <BreadcrumbLink
                        href={`/bodegas/consejos/${metaData.consejo.tipo_consejo === 'D' ? 'distritales' : 'municipales'}/${metaData.consejo.id}`}
                      >
                        {metaData.consejo.claveConsejo}. {metaData.consejo.consejo}
                      </BreadcrumbLink>
                    </BreadcrumbItem>
                  </>
                )}

                {metaData?.bodega?.tipo === 'Oficina central' && (
                  <>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                      <BreadcrumbLink href="/bodegas/oficina-central">Oficina Central</BreadcrumbLink>
                    </BreadcrumbItem>
                  </>
                )}

              <BreadcrumbSeparator />
              <BreadcrumbItem><BreadcrumbLink href={`/bodegas/${idBodega}`}>Bodega #{idBodega}</BreadcrumbLink></BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem><BreadcrumbLink href={`/bodegas/${idBodega}/verificaciones`}>Verificaciones</BreadcrumbLink></BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem><BreadcrumbPage>Revisar #{idVerif}</BreadcrumbPage></BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </ToolbarHeading>
        <ToolbarActions>
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => router.push(`/bodegas/${idBodega}/verificaciones`)}>
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Volver
          </Button>
          {canEditar && !isRevisada && (
            <Link href={`/bodegas/${idBodega}/verificaciones/${idVerif}`}>
              <Button size="sm" className="gap-1.5" variant="outline">
                <Pencil className="h-4 w-4" aria-hidden="true" />
                Editar revisión
              </Button>
            </Link>
          )}
          {canRevisar && canFinalizar && !isRevisada && (
            <Button size="sm" className="gap-1.5" onClick={() => setDialogOpen(true)}>
              <ShieldCheck className="h-4 w-4" aria-hidden="true" />
              Finalizar revisión
            </Button>
          )}
          {isRevisada && (
            <Badge variant="success" appearance="light" size="sm" className="gap-1">
              <CheckCircle2 className="h-3.5 w-3.5" />
              {verificacion?.resultado ?? 'Revisada'}
            </Badge>
          )}
        </ToolbarActions>
      </Toolbar>

      {isLoading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5" aria-busy="true">
          <div className="space-y-5">
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="p-5 space-y-3">
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </CardContent>
              </Card>
            ))}
          </div>
          <Card>
            <CardContent className="p-5">
              <Skeleton className="h-[600px] w-full" />
            </CardContent>
          </Card>
        </div>
      ) : !verificacion ? (
        <div className="text-center py-12 text-muted-foreground">No se encontró la verificación.</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Columna izquierda: Detalle en modo lectura */}
          <div className="space-y-5 overflow-y-auto max-h-[calc(100vh-12rem)] pr-1">
            {/* Datos generales — 2 columnas en md+ */}
            <SectionCard title="Datos generales">
              <GridRow>
                <DataRow noBorder label="Nombre del verificador" value={verificacion.nombreVerificador} />
                <DataRow noBorder label="Cargo del verificador" value={verificacion.cargoVerificador} />
                <DataRow noBorder label="Fecha de verificación" value={
                  verificacion.fechaVerificacion
                    ? formatDateOnly(verificacion.fechaVerificacion, 'es-MX')
                    : '—'
                } />
                <DataRow noBorder label="Estatus" value={
                  <Badge variant={isRevisada ? 'success' : 'secondary'} appearance="light" size="sm">
                    {verificacion.status}
                  </Badge>
                } />
                {verificacion.resultado && (
                  <div className="md:col-span-2">
                    <DataRow noBorder label="Resultado" value={
                      <Badge variant={verificacion.resultado === 'Aceptada' ? 'success' : 'destructive'} appearance="light" size="sm">
                        {verificacion.resultado}
                      </Badge>
                    } />
                  </div>
                )}
              </GridRow>
            </SectionCard>

            {/* Participantes OPL */}
            {verificacion.participantesOpl && (
              <SectionCard title="Participantes OPL">
                <InlineRow>
                  <InlineCell label="Consejero Presidente del órgano competente" value={<SiNoReadonly value={verificacion.participantesOpl.consejeroParticipa} />} />
                  <InlineCell label="Secretario del órgano competente" value={<SiNoReadonly value={verificacion.participantesOpl.secretarioParticipa} />} />
                  <InlineCell label="Número de consejeros del órgano competente" value={verificacion.participantesOpl.numConsejeros} />
                  <InlineCell label="Otras personas del órgano competente" value={verificacion.participantesOpl.numOtrasPersonas} />
                </InlineRow>
                <DataRow label="Nombres de consejeros del órgano competente" value={
                  Array.isArray(verificacion.participantesOpl.nombresConsejeros) && verificacion.participantesOpl.nombresConsejeros.length > 0
                    ? verificacion.participantesOpl.nombresConsejeros.map((n, i) => (
                        <span key={i} className="inline-block mr-1 after:content-[','] last:after:content-none">{n}</span>
                      ))
                    : '—'
                } />
              </SectionCard>
            )}

            {/* Participantes INE */}
            {verificacion.participantesIne && (
              <SectionCard title="Participantes INE">
                <InlineRow cols={2}>
                  <InlineCell label="Consejero Presidente del órgano competente del INE" value={<SiNoReadonly value={verificacion.participantesIne.consejeroIneParticipa} />} />
                  <InlineCell label="Secretario del órgano competente del INE" value={<SiNoReadonly value={verificacion.participantesIne.secretarioIneParticipa} />} />
                  <InlineCell label="Número de consejeros del órgano competente del INE" value={verificacion.participantesIne.numConsejerosIne} />
                  <InlineCell label="Otras personas del órgano competente del INE" value={verificacion.participantesIne.numOtrasPersonasIne} />
                </InlineRow>
                <DataRow label="Nombres consejeros del órgano competente del INE" value={
                  Array.isArray(verificacion.participantesIne.nombresConsejerosIne) && verificacion.participantesIne.nombresConsejerosIne.length > 0
                    ? verificacion.participantesIne.nombresConsejerosIne.map((n, i) => (
                        <span key={i} className="inline-block mr-1 after:content-[','] last:after:content-none">{n}</span>
                      ))
                    : '—'
                } />
                <GridRow>
                  <DataRow noBorder label="Órgano desconcentrado" value={verificacion.participantesIne.organoDesconcentrado} />
                  <DataRow noBorder label="Junta distrital" value={verificacion.participantesIne.numJuntaDistrital} />
                </GridRow>
                <InlineRow cols={2}>
                  <InlineCell label="Vocalía Ejecutiva (VE) del INE" value={<SiNoReadonly value={verificacion.participantesIne.veParticipa} />} />
                  <InlineCell label="Vocalía Secretaria (VS) del INE" value={<SiNoReadonly value={verificacion.participantesIne.vsParticipa} />} />
                  <InlineCell label="Vocalía Operativa Electoral (VOE) del INE" value={<SiNoReadonly value={verificacion.participantesIne.voeParticipa} />} />
                  <InlineCell label="Vocalía de Registro Federal de Electores (VRFE) del INE" value={<SiNoReadonly value={verificacion.participantesIne.vrfeParticipa} />} />
                  <InlineCell label="Vocalía de Capacitación y Educación Cívica (VCEYEC) del INE" value={<SiNoReadonly value={verificacion.participantesIne.vceyecParticipa} />} />
                </InlineRow>
              </SectionCard>
            )}

            {/* Características BE */}
            {verificacion.caracteristicasBe && (
              <SectionCard title="Características de la Bodega Electoral">
                <GridRow>
                  <DataRow noBorder label="Número de paquetes a resguardar" value={verificacion.caracteristicasBe.numPaquetes} />
                  <DataRow noBorder label="Superficie en m²" value={verificacion.caracteristicasBe.superficieM2} />
                </GridRow>
                <DataRow label="¿La Bodega Electoral se ubica dentro del inmueble sede del órgano competente y/o central del OPL?" value={<SiNoReadonly value={verificacion.caracteristicasBe.ubicadaEnSede} />} />
                {verificacion.caracteristicasBe.ubicadaEnSede === false && (
                  <DataRow label="Motivo por el cual no se encuentra en la sede" value={verificacion.caracteristicasBe.motivoNoSede} />
                )}
                <DataRow label="¿La Bodega Electoral tiene el espacio suficiente para el resguardo de la documentación, las boletas y los paquetes electorales?" value={<SiNoReadonly value={verificacion.caracteristicasBe.espacioSuficiente} />} />
                {verificacion.caracteristicasBe.espacioSuficiente === false && (
                  <MedidasFechaRow
                    pregunta="¿Qué medidas se adoptarán para el resguardo de la documentación, las boletas y los paquetes electorales y en qué fecha se contará con el espacio?"
                    medidas={verificacion.caracteristicasBe.medidasEspacio}
                    fecha={verificacion.caracteristicasBe.fechaMedidasEspacio}
                    noBorder
                  />
                )}
                <DataRow label="¿La Bodega Electoral tiene espacio para el resguardo de los Materiales Electorales?" value={<SiNoReadonly value={verificacion.caracteristicasBe.espacioMateriales} />} />
                {verificacion.caracteristicasBe.espacioMateriales === false && (
                  <MedidasFechaRow
                    pregunta="¿Qué medidas se tomarán y en qué fecha se solucionará?"
                    medidas={verificacion.caracteristicasBe.medidasMateriales}
                    fecha={verificacion.caracteristicasBe.fechaEspacioMateriales}
                    noBorder
                  />
                )}
              </SectionCard>
            )}

            {/* Ubicación */}
            {verificacion.ubicacion && (
              <SectionCard title="Ubicación">
                <DataRow label="¿Está alejada de fuentes potenciales que provoquen incendios?" value={<SiNoReadonly value={verificacion.ubicacion.alejadaIncendios} />} />
                {verificacion.ubicacion.alejadaIncendios === false && (
                  <MedidasFechaRow
                    pregunta="¿Qué medidas se tomarán y en qué fecha se solucionará?"
                    medidas={verificacion.ubicacion.medidasIncendios}
                    fecha={verificacion.ubicacion.fechaMedidasIncendios}
                    noBorder
                  />
                )}
                <DataRow label="¿Está retirada de cuerpos de agua como ríos, presas, lagunas, etc.?" value={<SiNoReadonly value={verificacion.ubicacion.retiradaAgua} />} />
                {verificacion.ubicacion.retiradaAgua === false && (
                  <MedidasFechaRow
                    pregunta="¿Qué medidas se tomarán y en qué fecha se solucionará?"
                    medidas={verificacion.ubicacion.medidasAgua}
                    fecha={verificacion.ubicacion.fechaMedidasAgua}
                    noBorder
                  />
                )}
                <DataRow label="¿Está provista de un buen sistema de drenaje?" value={<SiNoReadonly value={verificacion.ubicacion.drenaje} />} />
                {verificacion.ubicacion.drenaje === false && (
                  <MedidasFechaRow
                    pregunta="¿Qué medidas se tomarán y en qué fecha se solucionará?"
                    medidas={verificacion.ubicacion.medidasDrenaje}
                    fecha={verificacion.ubicacion.fechaMedidasDrenaje}
                    noBorder
                  />
                )}
                <DataRow label="¿El nivel del piso interior de la Bodega Electoral se ubica por arriba del nivel del piso exterior?" value={<SiNoReadonly value={verificacion.ubicacion.pisosSuperiores} />} />
                {verificacion.ubicacion.pisosSuperiores === false && (
                  <MedidasFechaRow
                    pregunta="¿Qué medidas se tomarán y en qué fecha se solucionará?"
                    medidas={verificacion.ubicacion.medidasSuperiores}
                    fecha={verificacion.ubicacion.fechaMedidasSuperiores}
                    noBorder
                  />
                )}
                <DataRow noBorder label="Observaciones" value={verificacion.ubicacion.observacionesUbicacion} />
              </SectionCard>
            )}

            {/* Acondicionamiento */}
            {verificacion.acondicionamiento && (
              <SectionCard title="Acondicionamiento">
                <DataRow label="¿Cuenta con instalaciones eléctricas adecuadas?" value={<SiNoReadonly value={verificacion.acondicionamiento.instalacionElectrica} />} />
                {verificacion.acondicionamiento.instalacionElectrica === false && (
                  <MedidasFechaRow
                    pregunta="¿Qué medidas se tomarán y en qué fecha se solucionará?"
                    medidas={verificacion.acondicionamiento.medidasElectrica}
                    fecha={verificacion.acondicionamiento.fechaMedidasElectrica}
                    noBorder
                  />
                )}
                <DataRow label="¿Cuenta con techos en buen estado?" value={<SiNoReadonly value={verificacion.acondicionamiento.techos} />} />
                {verificacion.acondicionamiento.techos === false && (
                  <MedidasFechaRow
                    pregunta="¿Qué medidas se tomarán y en qué fecha se solucionará?"
                    medidas={verificacion.acondicionamiento.medidasTechos}
                    fecha={verificacion.acondicionamiento.fechaMedidasTechos}
                    noBorder
                  />
                )}
                <DataRow label="¿Cuenta con drenaje pluvial adecuado?" value={<SiNoReadonly value={verificacion.acondicionamiento.drenajePluvial} />} />
                {verificacion.acondicionamiento.drenajePluvial === false && (
                  <MedidasFechaRow
                    pregunta="¿Qué medidas se tomarán y en qué fecha se solucionará?"
                    medidas={verificacion.acondicionamiento.medidasDrenajePluvial}
                    fecha={verificacion.acondicionamiento.fechaMedidasDrenajePluvial}
                    noBorder
                  />
                )}
                <DataRow label="¿Se tienen instalaciones sanitarias adecuadas en el inmueble? (Desde una visión que pudiera afectar a la Bodega Electoral)" value={<SiNoReadonly value={verificacion.acondicionamiento.instalacionesSanitarias} />} />
                {verificacion.acondicionamiento.instalacionesSanitarias === false && (
                  <MedidasFechaRow
                    pregunta="¿Qué medidas se tomarán y en qué fecha se solucionará?"
                    medidas={verificacion.acondicionamiento.medidasSanitarias}
                    fecha={verificacion.acondicionamiento.fechaMedidasSanitarias}
                    noBorder
                  />
                )}
                <DataRow label="¿Cuenta con ventanas adecuadas?" value={<SiNoReadonly value={verificacion.acondicionamiento.ventanas} />} />
                {verificacion.acondicionamiento.ventanas === false && (
                  <MedidasFechaRow
                    pregunta="¿Qué medidas se tomarán y en qué fecha se solucionará?"
                    medidas={verificacion.acondicionamiento.medidasVentanas}
                    fecha={verificacion.acondicionamiento.fechaMedidasVentanas}
                    noBorder
                  />
                )}
                <DataRow label="¿Cuenta con muros y paredes adecuados?" value={<SiNoReadonly value={verificacion.acondicionamiento.muros} />} />
                {verificacion.acondicionamiento.muros === false && (
                  <MedidasFechaRow
                    pregunta="¿Qué medidas se tomarán y en qué fecha se solucionará?"
                    medidas={verificacion.acondicionamiento.medidasMuros}
                    fecha={verificacion.acondicionamiento.fechaMedidasMuros}
                    noBorder
                  />
                )}
                <DataRow label="¿Cuenta con cerraduras adecuadas?" value={<SiNoReadonly value={verificacion.acondicionamiento.cerraduras} />} />
                {verificacion.acondicionamiento.cerraduras === false && (
                  <MedidasFechaRow
                    pregunta="¿Qué medidas se tomarán y en qué fecha se solucionará?"
                    medidas={verificacion.acondicionamiento.medidasCerraduras}
                    fecha={verificacion.acondicionamiento.fechaMedidasCerraduras}
                    noBorder
                  />
                )}
                <DataRow label="¿Cuenta con pisos en buen estado?" value={<SiNoReadonly value={verificacion.acondicionamiento.pisos} />} />
                {verificacion.acondicionamiento.pisos === false && (
                  <MedidasFechaRow
                    pregunta="¿Qué medidas se tomarán y en qué fecha se solucionará?"
                    medidas={verificacion.acondicionamiento.medidasPisos}
                    fecha={verificacion.acondicionamiento.fechaMedidasPisos}
                    noBorder
                  />
                )}
                <DataRow label="Observaciones" value={verificacion.acondicionamiento.observacionesAcondicionamiento} />
              </SectionCard>
            )}

            {/* Equipamiento */}
            {verificacion.equipamiento && (
              <SectionCard title="Equipamiento">
                <DataRow label="¿Cuenta con tarimas?" value={<SiNoReadonly value={verificacion.equipamiento.tarimas} />} />
                {verificacion.equipamiento.tarimas === false && (
                  <MedidasFechaRow
                    pregunta="¿Qué medidas se tomarán y en qué fecha se solucionará?"
                    medidas={verificacion.equipamiento.medidasTarimas}
                    fecha={verificacion.equipamiento.fechaMedidasTarimas}
                    noBorder
                  />
                )}
                <DataRow label="¿Cuenta con lámparas de emergencia?" value={<SiNoReadonly value={verificacion.equipamiento.lamparasEmergencia} />} />
                {verificacion.equipamiento.lamparasEmergencia === false && (
                  <MedidasFechaRow
                    pregunta="¿Qué medidas se tomarán y en qué fecha se solucionará?"
                    medidas={verificacion.equipamiento.medidasLamparasEmergencia}
                    fecha={verificacion.equipamiento.fechaMedidasLamparasEmergencia}
                    noBorder
                  />
                )}
                <DataRow label="¿Cuenta con señalización?" value={<SiNoReadonly value={verificacion.equipamiento.senializacion} />} />
                {verificacion.equipamiento.senializacion === false && (
                  <MedidasFechaRow
                    pregunta="¿Qué medidas se tomarán y en qué fecha se solucionará?"
                    medidas={verificacion.equipamiento.medidasSenializacion}
                    fecha={verificacion.equipamiento.fechaMedidasSenializacion}
                    noBorder
                  />
                )}
                <DataRow label="¿Cuenta con anaqueles?" value={<SiNoReadonly value={verificacion.equipamiento.anaqueles} />} />
                {verificacion.equipamiento.anaqueles === false && (
                  <MedidasFechaRow
                    pregunta="¿Qué medidas se tomarán y en qué fecha se solucionará?"
                    medidas={verificacion.equipamiento.medidasAnaqueles}
                    fecha={verificacion.equipamiento.fechaMedidasAnaqueles}
                    noBorder
                  />
                )}
              </SectionCard>
            )}

            {/* Generales */}
            {verificacion.generales && (
              <SectionCard title="Observaciones excepcionales">
                <DataRow label="Observaciones excepcionales" value={verificacion.generales.observacionesExcepcionales} />
              </SectionCard>
            )}
          </div>

          {/* Columna derecha: Cédula y Fotografías (colapsables) */}
          <div className="sticky top-0 self-start space-y-4">
            <CollapseCard
              title="Cédula de verificación"
              icon={<FileText className="h-4 w-4" />}
              expanded={cedulaExpanded}
              onToggle={() => setCedulaExpanded((v) => !v)}
            >
              {cedulaUrl ? (
                <iframe
                  src={cedulaUrl}
                  className="w-full h-[calc(100vh-16rem)] border-0"
                  title="Previsualización de cédula"
                />
              ) : (
                <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground">
                  <XCircle className="h-10 w-10 mb-3" />
                  <p className="text-sm">No hay cédula disponible</p>
                </div>
              )}
            </CollapseCard>

            <CollapseCard
              title="Fotografías de verificación"
              icon={<ImageIcon className="h-4 w-4" />}
              expanded={fotosExpanded}
              onToggle={() => setFotosExpanded((v) => !v)}
            >
              <FotografiasVerificacion idBodega={idBodega} />
            </CollapseCard>
          </div>
        </div>
      )}

      {/* Dialog unificado: selección de resultado + finalizar proceso + finalizar */}
      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            setDialogOpen(false);
            resetDialogState();
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-primary" />
              Finalizar revisión
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-sm text-muted-foreground">Selecciona el resultado de la revisión:</p>
            <div className="grid grid-cols-2 gap-3">
              <Button
                type="button"
                variant={resultado === 'Aceptada' ? 'primary' : 'outline'}
                size="lg"
                className={`h-20 gap-2 ${resultado === 'Aceptada' ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : ''}`}
                onClick={() => setResultado('Aceptada')}
              >
                <CheckCircle2 className="h-6 w-6" />
                <div className="text-left">
                  <p className="font-semibold">Aceptada</p>
                  <p className="text-[10px] opacity-70">Verificación válida</p>
                </div>
              </Button>
              <Button
                type="button"
                variant={resultado === 'Rechazada' ? 'primary' : 'outline'}
                size="lg"
                className={`h-20 gap-2 ${resultado === 'Rechazada' ? 'bg-rose-600 hover:bg-rose-700 text-white' : ''}`}
                onClick={() => setResultado('Rechazada')}
              >
                <XCircle className="h-6 w-6" />
                <div className="text-left">
                  <p className="font-semibold">Rechazada</p>
                  <p className="text-[10px] opacity-70">Verificación no válida</p>
                </div>
              </Button>
            </div>

            {/* Leyenda cuando se selecciona Aceptada */}
            {resultado === 'Aceptada' && (
              <div className="flex items-start gap-2 rounded-md border border-emerald-200 bg-emerald-50 dark:border-emerald-900/40 dark:bg-emerald-950/30 px-3 py-2 text-xs text-emerald-800 dark:text-emerald-300">
                <Info className="h-3.5 w-3.5 shrink-0 mt-0.5" aria-hidden="true" />
                <p className="text-justify">
                  Al confirmar, el estatus de la bodega cambiará a <strong>Aceptada</strong> y el proceso se dará por finalizado.
                </p>
              </div>
            )}

            {/* Selector Sí/No cuando se selecciona Rechazada */}
            {resultado === 'Rechazada' && (
              <div className="space-y-3 rounded-lg border border-border p-3">
                <p className="text-sm font-medium text-foreground">¿Finalizar el proceso?</p>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    type="button"
                    variant={finalizarProceso === true ? 'primary' : 'outline'}
                    size="sm"
                    className={finalizarProceso === true ? 'gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white' : 'gap-1.5'}
                    onClick={() => setFinalizarProceso(true)}
                  >
                    Sí
                  </Button>
                  <Button
                    type="button"
                    variant={finalizarProceso === false ? 'primary' : 'outline'}
                    size="sm"
                    className={finalizarProceso === false ? 'gap-1.5 bg-rose-600 hover:bg-rose-700 text-white' : 'gap-1.5'}
                    onClick={() => setFinalizarProceso(false)}
                  >
                    No
                  </Button>
                </div>
                {finalizarProceso === true && (
                  <div className="flex items-start gap-2 rounded-md border border-rose-200 bg-rose-50 dark:border-rose-900/40 dark:bg-rose-950/30 px-3 py-2 text-xs text-rose-800 dark:text-rose-300">
                    <Info className="h-3.5 w-3.5 shrink-0 mt-0.5" aria-hidden="true" />
                    <p className="text-justify">
                      Al confirmar, el estatus de la bodega cambiará a <strong>Rechazada</strong> y el proceso se dará por finalizado. Esta acción es irreversible: una vez aplicada no podrá modificarse.
                    </p>
                  </div>
                )}
                {finalizarProceso === false && (
                  <div className="flex items-start gap-2 rounded-md border border-border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
                    <Info className="h-3.5 w-3.5 shrink-0 mt-0.5" aria-hidden="true" />
                    <p className="text-justify">El proceso NO se finalizará; la bodega quedará en el estatus previo.</p>
                  </div>
                )}
              </div>
            )}
          </div>
          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setDialogOpen(false);
                resetDialogState();
              }}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              size="sm"
              className={`gap-1.5 ${resultado === 'Aceptada' ? 'bg-emerald-600 hover:bg-emerald-700' : resultado === 'Rechazada' ? 'bg-rose-600 hover:bg-rose-700' : ''}`}
              disabled={!canFinalizarRev || revisando}
              onClick={handleFinalizarRevision}
            >
              {revisando && <Loader2 className="h-4 w-4 animate-spin" />}
              Finalizar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Container>
  );
}
