'use client';

import { useEffect, useRef, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Eye,
  ImageIcon,
  Info,
  Loader2,
  Maximize2,
  MessageSquare,
  PanelRightClose,
  ShieldCheck,
  Trash2,
  Upload,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import {
  useEliminarFotografia,
  useEliminarObservacionBodega,
  useFotografiasConfig,
  useFotografiasConConfig,
  useCrearObservacionBodega,
  useToggleStatusObservacionBodega,
  useSubirFotografias,
  useToggleStatusFotografia,
} from '../_hooks/use-bodegas';
import type { IFotografia, IFotografiaConfig, IObservacionBodega, TStatusBodega } from '@/types/bodegas';

// ─── Constantes ───────────────────────────────────────────────────────────────

const MAX_FILE_SIZE_MB    = 15;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
const ACCEPTED_TYPES      = new Set(['image/jpeg', 'image/png', 'image/webp']);
const ACCEPTED_ACCEPT     = 'image/jpeg,image/png,image/webp';

const ETAPA_LABEL: Record<string, string> = {
  Antes:     'Antes',
  Durante:   'Durante',
  Posterior: 'Posterior',
};

export interface FotografiasFiltro {
  etapa?: string[];
  categorias?: IFotografiaConfig['categoria'][];
  momentos?: IFotografiaConfig['momento'][];
}

const FILTRO_DEFAULT: Required<FotografiasFiltro> = {
  etapa: ['Registro'],
  categorias: ['Acondicionamiento'],
  momentos: ['Antes'],
};

function configsVisibles(
  configs: IFotografiaConfig[],
  filtro: FotografiasFiltro,
): IFotografiaConfig[] {
  const { etapa, categorias, momentos } = { ...FILTRO_DEFAULT, ...filtro };
  return configs.filter(
    (c) =>
      etapa.includes(c.etapa) &&
      categorias.includes(c.categoria) &&
      momentos.includes(c.momento),
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const MESES = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];

function formatFecha(iso: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return `${String(d.getUTCDate()).padStart(2,'0')} ${MESES[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

function validateFiles(files: File[]): { valid: File[]; error: string | null } {
  if (files.some((f) => !ACCEPTED_TYPES.has(f.type)))
    return { valid: [], error: 'Solo se permiten imágenes JPG, PNG o WEBP.' };
  if (files.some((f) => f.size > MAX_FILE_SIZE_BYTES))
    return { valid: [], error: `Cada archivo debe ser menor a ${MAX_FILE_SIZE_MB} MB.` };
  return { valid: files, error: null };
}

// ─── StatusBadge de foto ──────────────────────────────────────────────────────

const STATUS_FOTO_STYLE: Record<IFotografia['status_foto'], string> = {
  Pendiente: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  Observada: 'bg-rose-100   text-rose-700   dark:bg-rose-900/30   dark:text-rose-400',
  Validada:  'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
};

function FotoStatusBadge({ status }: { status: IFotografia['status_foto'] }) {
  return (
    <span
      className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium shrink-0 ${STATUS_FOTO_STYLE[status]}`}
    >
      {status}
    </span>
  );
}

// ─── Panel de vista previa ────────────────────────────────────────────────────

interface FotoPreviewPanelProps {
  foto:    IFotografia;
  config:  IFotografiaConfig | null;
  onClose: () => void;
}

function FotoPreviewPanel({ foto, config, onClose }: FotoPreviewPanelProps) {
  const [fullscreen, setFullscreen] = useState(false);

  return (
    <>
    <div className="w-full lg:w-1/2 flex flex-col border-t border-border lg:border-t-0 lg:border-l lg:sticky lg:top-4 min-h-[420px] lg:min-h-[520px] h-[60vh] lg:h-[calc(100vh-2rem)] shrink-0">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 px-4 py-2.5 border-b border-border bg-muted/30 shrink-0">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <ImageIcon className="h-4 w-4 text-muted-foreground shrink-0" />
          <div className="flex flex-col min-w-0">
            {config?.subcategoria && (
              <span className="text-sm font-semibold text-foreground truncate flex items-center gap-1.5">
                {config.subcategoria}
                {config.momento && (
                  <Badge variant="secondary" appearance="light" size="sm">
                    {ETAPA_LABEL[config.momento] ?? config.momento}
                  </Badge>
                )}
              </span>
            )}
            {config?.descripcion && (
              <span className="text-[11px] italic text-muted-foreground truncate">
                {config.descripcion}
              </span>
            )}
          </div>
          <FotoStatusBadge status={foto.status_foto} />
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={() => setFullscreen(true)}
            title="Ver en pantalla completa"
            className="inline-flex items-center justify-center h-7 w-7 rounded-md hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
          >
            <Maximize2 className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={onClose}
            title="Cerrar vista previa"
            className="inline-flex items-center justify-center h-7 w-7 rounded-md hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
          >
            <PanelRightClose className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Imagen */}
      <div className="flex-1 flex items-center justify-center bg-muted/20 p-2 min-h-0 overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={foto.url}
          alt="Vista previa"
          className="max-h-full max-w-full h-full w-full object-contain rounded-lg cursor-zoom-in"
          onClick={() => setFullscreen(true)}
        />
      </div>

    </div>

    {/* Dialog pantalla completa */}
    <Dialog open={fullscreen} onOpenChange={setFullscreen}>
      <DialogContent className="max-w-5xl w-full p-2 bg-black/90 border-none">
        <button
          type="button"
          onClick={() => setFullscreen(false)}
          className="absolute top-2 right-2 z-10 inline-flex items-center justify-center h-8 w-8 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
          title="Cerrar"
        >
          <PanelRightClose className="h-4 w-4" />
        </button>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={foto.url}
          alt="Vista completa"
          className="w-full h-auto max-h-[90vh] object-contain rounded"
        />
        <p className="text-center text-xs text-white/60 pb-1">
          {formatFecha(foto.created_at)} · {foto.status_foto}
        </p>
      </DialogContent>
    </Dialog>
    </>
  );
}

// ─── Dialog Observar ──────────────────────────────────────────────────────────

interface ObservarDialogProps {
  config:   IFotografiaConfig | null;
  onClose:  () => void;
  idBodega: number;
  observaciones?: IObservacionBodega[];
  soloLecturaObservaciones?: boolean;
  bodegaStatus?: TStatusBodega;
  canValidarObservacion?: boolean;
  canEliminarObservacion?: boolean;
}

function ObservarDialog({ config, onClose, idBodega, observaciones, soloLecturaObservaciones = false, bodegaStatus = 'Capturada', canValidarObservacion = true, canEliminarObservacion = true }: ObservarDialogProps) {
  const [texto, setTexto] = useState('');
  const { mutate: observar, isPending } = useCrearObservacionBodega(idBodega);
  const { mutate: eliminarObs, isPending: eliminandoObs } = useEliminarObservacionBodega(idBodega);
  const { mutate: toggleStatusObs, isPending: togglingStatus } = useToggleStatusObservacionBodega(idBodega);

  const obsConfig = config
    ? (observaciones?.filter((o) => o.seccion === 'Fotografias' && o.id_referencia === config.id) ?? [])
    : [];

  const modoSolventar = bodegaStatus === 'Observada' || bodegaStatus === 'Capturada';
  const isReadOnly = soloLecturaObservaciones;

  function handleSubmit() {
    if (!config || !texto.trim()) return;
    observar(
      { seccion: 'Fotografias', id_referencia: config.id, observacion: texto.trim() },
      {
        onSuccess: () => { setTexto(''); },
      },
    );
  }

  function handleOpenChange(open: boolean) {
    if (!open) { setTexto(''); onClose(); }
  }

  const charCount = texto.length;

  const dialogTitle = isReadOnly
    ? 'Observaciones'
    : bodegaStatus === 'Observada'
      ? 'Solventar observaciones'
      : 'Observar';

  return (
    <Dialog open={!!config} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{dialogTitle}</DialogTitle>
          <DialogDescription>
            {config?.descripcion ?? ETAPA_LABEL[config?.momento ?? ''] ?? config?.momento ?? 'Categoría'}
          </DialogDescription>
        </DialogHeader>

        {config && (
          <div className="space-y-4 overflow-y-auto pr-1">
            {/* Observaciones existentes */}
            {obsConfig.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-muted-foreground">
                  Observaciones ({obsConfig.length})
                </h4>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {obsConfig.map((obs) => (
                    <div
                      key={obs.id}
                      className="rounded-md border border-border bg-muted/20 p-2.5 space-y-2"
                    >
                      <p className="text-sm text-foreground">{obs.observacion}</p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span
                            className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider ${
                              obs.status === 'Pendiente'
                                ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                                : obs.status === 'Atendida'
                                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                                : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                            }`}
                          >
                            {obs.status}
                          </span>
                          <span className="text-[10px] text-muted-foreground">
                            {new Date(obs.created_at).toLocaleDateString('es-MX')}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          {canValidarObservacion && bodegaStatus === 'Capturada' && obs.status !== 'Validada' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
                              onClick={() => toggleStatusObs(obs.id)}
                              disabled={togglingStatus}
                              aria-label={obs.status === 'Pendiente' ? 'Marcar como atendida' : 'Validar'}
                            >
                              {togglingStatus ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                <CheckCircle2 className="h-3 w-3" />
                              )}
                            </Button>
                          )}
                          {canEliminarObservacion && bodegaStatus === 'Capturada' && obs.status !== 'Validada' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0 text-destructive hover:bg-destructive/10"
                              onClick={() => eliminarObs(obs.id)}
                              disabled={eliminandoObs}
                              aria-label="Eliminar observación"
                            >
                              {eliminandoObs ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                <Trash2 className="h-3 w-3" />
                              )}
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {bodegaStatus === 'Capturada' && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="observacion-txt">Nueva observación</Label>
                  <span className={`text-[11px] ${charCount > 5000 ? 'text-destructive' : 'text-muted-foreground'}`}>
                    {charCount}/5000
                  </span>
                </div>
                <Textarea
                  id="observacion-txt"
                  placeholder="Describe el motivo de la observación…"
                  rows={3}
                  value={texto}
                  maxLength={5000}
                  onChange={(e) => setTexto(e.target.value)}
                  disabled={isPending}
                />
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" size="sm" onClick={onClose} disabled={isPending || togglingStatus}>
            Cerrar
          </Button>
          {bodegaStatus === 'Capturada' && (
            <Button size="sm" onClick={handleSubmit} disabled={!texto.trim() || isPending}>
              {isPending && <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />}
              Guardar
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── FotoRow ──────────────────────────────────────────────────────────────────

type FotografiasMode = 'upload' | 'validar';

interface FotoRowProps {
  foto:         IFotografia;
  idBodega:     number;
  mode:         FotografiasMode;
  isPreviewing: boolean;
  onPreview:    (foto: IFotografia) => void;
  onEliminar:   (foto: IFotografia) => void;
  soloLecturaObservaciones?: boolean;
  bodegaStatus?: TStatusBodega;
  canValidarFotografia?: boolean;
  canEliminarFotografia?: boolean;
}

function FotoRow({ foto, idBodega, mode, isPreviewing, onPreview, onEliminar, soloLecturaObservaciones = false, bodegaStatus = 'Capturada', canValidarFotografia = true, canEliminarFotografia = true }: FotoRowProps) {
  const { mutate: toggleStatus, isPending: toggleando } = useToggleStatusFotografia(idBodega);

  return (
    <div
      className={`flex items-center gap-3 py-2.5 border-b border-border last:border-0 transition-colors ${
        isPreviewing ? 'bg-muted/40' : ''
      }`}
    >
      {/* Miniatura */}
      <button
        type="button"
        onClick={() => onPreview(foto)}
        className={`relative w-10 h-10 rounded-md overflow-hidden border-2 shrink-0 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
          isPreviewing
            ? 'border-primary'
            : foto.status_foto === 'Validada'
              ? 'border-emerald-500'
              : 'border-border hover:border-primary/60'
        }`}
        aria-label="Ver imagen"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={foto.url} alt="" className="w-full h-full object-cover" loading="lazy" />
        {foto.status_foto === 'Validada' && (
          <span className="absolute bottom-0 right-0 inline-flex items-center justify-center h-3.5 w-3.5 rounded-full bg-emerald-500 text-white ring-1 ring-white">
            <CheckCircle2 className="h-2.5 w-2.5" />
          </span>
        )}
      </button>

      {/* Meta */}
      <div className="flex-1 min-w-0">
        <p className="text-xs text-foreground tabular-nums">{formatFecha(foto.created_at)}</p>
      </div>

      {/* Status */}
      <FotoStatusBadge status={foto.status_foto} />

      {/* Botón ver */}
      <button
        type="button"
        onClick={() => onPreview(foto)}
        title="Vista previa"
        className={`inline-flex items-center justify-center h-7 w-7 rounded-md border transition-colors ${
          isPreviewing
            ? 'border-primary bg-primary/10 text-primary'
            : 'border-border hover:bg-muted text-muted-foreground hover:text-foreground'
        }`}
      >
        <Eye className="h-3.5 w-3.5" />
      </button>

      {canEliminarFotografia && (
        bodegaStatus === 'En captura' ||
        (bodegaStatus === 'Observada' && foto.status_foto !== 'Validada')
      ) && (
        <button
          type="button"
          onClick={() => onEliminar(foto)}
          title="Eliminar fotografía"
          className="inline-flex items-center justify-center h-7 w-7 rounded-md border border-border hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30 text-muted-foreground transition-colors"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      )}

      {canValidarFotografia && mode === 'validar' && !soloLecturaObservaciones && bodegaStatus !== 'Observada' && (
        <Button
          variant="ghost"
          size="sm"
          className={`h-7 w-7 p-0 ${
            foto.status_foto === 'Validada'
              ? 'text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/30'
              : 'text-muted-foreground hover:text-emerald-600 hover:bg-emerald-50'
          }`}
          aria-label={foto.status_foto === 'Validada' ? 'Quitar validación' : 'Validar foto'}
          disabled={toggleando}
          onClick={() => toggleStatus({ id: foto.id })}
        >
          {toggleando
            ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
            : <ShieldCheck className="h-3.5 w-3.5" />
          }
        </Button>
      )}
    </div>
  );
}

// ─── ConfigSection ────────────────────────────────────────────────────────────

interface ConfigSectionProps {
  config:       IFotografiaConfig;
  fotos:        IFotografia[];
  idBodega:     number;
  mode:         FotografiasMode;
  previewFotoId: number | null;
  onPreview:    (foto: IFotografia) => void;
  onEliminar:   (foto: IFotografia) => void;
  onObservar:   (config: IFotografiaConfig) => void;
  onVerObservaciones: (config: IFotografiaConfig, readOnly: boolean) => void;
  observaciones?: IObservacionBodega[];
  soloLecturaObservaciones?: boolean;
  bodegaStatus?: TStatusBodega;
  canFotografias?: boolean;
  canValidarFotografia?: boolean;
  canObservaciones?: boolean;
  canValidarObservacion?: boolean;
  canEliminarObservacion?: boolean;
  canEliminarFotografia?: boolean;
}

function ConfigSection({
  config,
  fotos,
  idBodega,
  mode,
  previewFotoId,
  onPreview,
  onEliminar,
  onObservar,
  onVerObservaciones,
  observaciones,
  soloLecturaObservaciones,
  bodegaStatus,
  canFotografias = true,
  canValidarFotografia = true,
  canObservaciones = true,
  canValidarObservacion = true,
  canEliminarObservacion = true,
  canEliminarFotografia = true,
}: ConfigSectionProps) {
  const inputRef                      = useRef<HTMLInputElement>(null);
  const { mutate: subir, isPending }  = useSubirFotografias(idBodega);
  const [isDragging, setIsDragging]   = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const isRequired = true;
  const count      = fotos.length;
  const hasMin     = count >= config.min_fotos;
  const showUpload = canFotografias && ((mode === 'upload' && bodegaStatus !== 'Determinada') || bodegaStatus === 'Observada');

  const obsConfig = observaciones?.filter(
    (o) => o.seccion === 'Fotografias' && o.id_referencia === config.id,
  ) ?? [];
  const obsConfigPendientes = obsConfig.filter((o) => o.status === 'Pendiente').length;

  const allFotosValidadas = fotos.length > 0 && fotos.every((f) => f.status_foto === 'Validada');
  const categoriaReadOnly = soloLecturaObservaciones || (allFotosValidadas && obsConfig.length > 0);

  function handleFiles(incoming: File[]) {
    setUploadError(null);
    const { valid, error: err } = validateFiles(incoming);
    if (err) { setUploadError(err); return; }
    if (valid.length === 0) return;
    subir({ files: valid, id_config: config.id }, {
      onSuccess: () => setUploadError(null),
      onError:   () => setUploadError('Error al subir las fotografías. Intenta de nuevo.'),
    });
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    handleFiles(Array.from(e.target.files ?? []));
    e.target.value = '';
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(Array.from(e.dataTransfer.files));
  }

  return (
    <div>
      {/* Encabezado de la config */}
      <div className="flex items-center gap-2 px-5 py-2.5 bg-muted/40 border-b border-border">
        <span className="text-xs font-semibold text-foreground">
          {config.descripcion ?? ETAPA_LABEL[config.momento] ?? config.momento}
        </span>
        {isRequired && (
          <Badge variant="destructive" appearance="light" size="sm">Requerida</Badge>
        )}

        <div className="ml-auto flex items-center gap-2 shrink-0">
          {/* Botón observar / ver observaciones a nivel config */}
          {canObservaciones && ((mode === 'validar' && !allFotosValidadas) || obsConfig.length > 0) && (
            <Button
              variant="ghost"
              size="sm"
              className="relative h-6 w-6 p-0 text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/30"
              aria-label={categoriaReadOnly ? 'Ver observaciones' : 'Observar categoría'}
              onClick={() =>
                categoriaReadOnly || !canValidarObservacion
                  ? onVerObservaciones(config, true)
                  : onObservar(config)
              }
            >
              <MessageSquare className="h-3.5 w-3.5" />
              {obsConfigPendientes > 0 && (
                <sup className="absolute -top-0.5 -right-0.5 flex h-3.5 min-w-[0.875rem] items-center justify-center rounded-full bg-rose-600 px-0.5 text-[9px] font-bold text-white leading-none">
                  {obsConfigPendientes}
                </sup>
              )}
            </Button>
          )}
          {!hasMin && (
            <span className="text-xs text-muted-foreground tabular-nums">
              {count}/{config.min_fotos} <span className="opacity-70">mín.</span>
            </span>
          )}
          {hasMin && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />}
        </div>
      </div>

      {/* Lista de fotos */}
      <div className="px-5">
        {fotos.length === 0 ? (
          <p className="py-3 text-xs text-muted-foreground italic">Sin fotografías cargadas.</p>
        ) : (
          <div>
            {fotos.map((foto) => (
              <FotoRow
                key={foto.id}
                foto={foto}
                idBodega={idBodega}
                mode={mode}
                isPreviewing={previewFotoId === foto.id}
                onPreview={onPreview}
                onEliminar={onEliminar}
                soloLecturaObservaciones={soloLecturaObservaciones}
                bodegaStatus={bodegaStatus}
                canValidarFotografia={canValidarFotografia}
                canEliminarFotografia={canEliminarFotografia}
              />
            ))}
          </div>
        )}
      </div>

      {/* Zona de carga */}
      {showUpload && (
        <div className="px-5 pb-3 space-y-2">
          <div
            role="button"
            tabIndex={0}
            aria-label={`Subir fotos ${ETAPA_LABEL[config.momento] ?? config.momento}`}
            onClick={() => inputRef.current?.click()}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') inputRef.current?.click(); }}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={(e) => { e.preventDefault(); setIsDragging(false); }}
            onDrop={handleDrop}
            className={[
              'flex items-center gap-3 rounded-lg border-2 border-dashed px-4 py-2.5 transition-colors',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
              isDragging
                ? 'border-primary bg-primary/5 cursor-copy'
                : 'border-border hover:border-primary/50 hover:bg-muted/20 cursor-pointer',
            ].join(' ')}
          >
            {isPending
              ? <Loader2 className="h-4 w-4 animate-spin text-muted-foreground shrink-0" />
              : <Upload className={`h-4 w-4 shrink-0 ${isDragging ? 'text-primary' : 'text-muted-foreground'}`} />
            }
            <div>
              <p className="text-xs font-medium text-foreground leading-none">
                {isDragging ? 'Suelta para agregar' : isPending ? 'Subiendo…' : 'Arrastra o haz clic para subir'}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                JPG, PNG, WEBP · máx. {MAX_FILE_SIZE_MB} MB
                {hasMin
                  ? ` · mínimo alcanzado`
                  : ` · ${config.min_fotos - count} foto${config.min_fotos - count !== 1 ? 's' : ''} más para alcanzar el mínimo`}
              </p>
            </div>
          </div>
          <input
            ref={inputRef}
            type="file"
            accept={ACCEPTED_ACCEPT}
            multiple
            className="sr-only"
            onChange={handleFileChange}
          />
          {uploadError && (
            <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2">
              <AlertCircle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
              <p className="text-xs text-destructive">{uploadError}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Miniatura de foto (para vista agrupada por descripción) ──────────────────

function FotoMiniatura({
  foto,
  onPreview,
  onEliminar,
  showStatus,
  canEliminar = true,
}: {
  foto: IFotografia;
  onPreview: (foto: IFotografia) => void;
  onEliminar: (foto: IFotografia) => void;
  showStatus: boolean;
  canEliminar?: boolean;
}) {
  return (
    <div className="group relative w-16 h-16 rounded-md overflow-hidden border border-border shrink-0">
      <button
        type="button"
        onClick={() => onPreview(foto)}
        aria-label="Ver imagen"
        className="absolute inset-0 w-full h-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={foto.url} alt="" className="w-full h-full object-cover" loading="lazy" />
      </button>
      {showStatus && (
        <div className="absolute top-0.5 left-0.5">
          <FotoStatusBadge status={foto.status_foto} />
        </div>
      )}
      {canEliminar && (
        <button
          type="button"
          onClick={() => onEliminar(foto)}
          title="Eliminar fotografía"
          aria-label="Eliminar fotografía"
          className="absolute top-0.5 right-0.5 inline-flex items-center justify-center h-5 w-5 rounded-full bg-black/60 text-white opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition-opacity"
        >
          <Trash2 className="h-3 w-3" />
        </button>
      )}
    </div>
  );
}

// ─── Zona de carga + galería por momento (etapa Verificación) ─────────────────

interface MomentoUploaderProps {
  config:        IFotografiaConfig;
  fotos:         IFotografia[];
  idBodega:      number;
  canFotografias: boolean;
  canEliminar:   boolean;
  showStatus:    boolean;
  onPreview:     (foto: IFotografia) => void;
  onEliminar:    (foto: IFotografia) => void;
}

function MomentoUploader({
  config,
  fotos,
  idBodega,
  canFotografias,
  canEliminar,
  showStatus,
  onPreview,
  onEliminar,
}: MomentoUploaderProps) {
  const inputRef                      = useRef<HTMLInputElement>(null);
  const { mutate: subir, isPending }  = useSubirFotografias(idBodega);
  const [isDragging, setIsDragging]   = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const count  = fotos.length;
  const hasMin = count >= config.min_fotos;

  function handleFiles(incoming: File[]) {
    setUploadError(null);
    const { valid, error: err } = validateFiles(incoming);
    if (err) { setUploadError(err); return; }
    if (valid.length === 0) return;
    subir({ files: valid, id_config: config.id }, {
      onSuccess: () => setUploadError(null),
      onError:   () => setUploadError('Error al subir las fotografías. Intenta de nuevo.'),
    });
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    handleFiles(Array.from(e.target.files ?? []));
    e.target.value = '';
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(Array.from(e.dataTransfer.files));
  }

  return (
    <div className="rounded-lg border border-border bg-card p-3 space-y-2.5">
      {/* Encabezado del momento */}
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-semibold text-foreground">
          {ETAPA_LABEL[config.momento] ?? config.momento}
        </span>
        {!hasMin ? (
          <span className="text-[11px] text-muted-foreground tabular-nums">
            {count}/{config.min_fotos} <span className="opacity-70">mín.</span>
          </span>
        ) : (
          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
        )}
      </div>

      {/* Descripción: aparece antes de la zona de carga */}
      {config.descripcion && (
        <p className="text-[11px] italic text-muted-foreground leading-snug">
          {config.descripcion}
        </p>
      )}

      {/* Drag & drop */}
      {canFotografias && (
        <div
          role="button"
          tabIndex={0}
          aria-label={`Subir fotos ${ETAPA_LABEL[config.momento] ?? config.momento}`}
          onClick={() => inputRef.current?.click()}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') inputRef.current?.click(); }}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={(e) => { e.preventDefault(); setIsDragging(false); }}
          onDrop={handleDrop}
          className={[
            'flex flex-col items-center justify-center gap-1.5 rounded-md border-2 border-dashed py-3 px-2 text-center transition-colors',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
            isDragging
              ? 'border-primary bg-primary/5 cursor-copy'
              : 'border-border hover:border-primary/50 hover:bg-muted/20 cursor-pointer',
          ].join(' ')}
        >
          {isPending
            ? <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            : <Upload className={`h-4 w-4 ${isDragging ? 'text-primary' : 'text-muted-foreground'}`} />
          }
          <p className="text-[11px] font-medium text-foreground leading-none">
            {isDragging ? 'Suelta para agregar' : isPending ? 'Subiendo…' : 'Arrastra o haz clic para subir'}
          </p>
          <p className="text-[10px] text-muted-foreground leading-none">
            JPG, PNG, WEBP · máx. {MAX_FILE_SIZE_MB} MB
          </p>
        </div>
      )}
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_ACCEPT}
        multiple
        className="sr-only"
        onChange={handleFileChange}
      />
      {uploadError && (
        <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/10 px-2.5 py-1.5">
          <AlertCircle className="h-3.5 w-3.5 text-destructive shrink-0 mt-0.5" />
          <p className="text-[11px] text-destructive">{uploadError}</p>
        </div>
      )}

      {/* Galería de miniaturas */}
      {fotos.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {fotos.map((foto) => (
            <FotoMiniatura
              key={foto.id}
              foto={foto}
              onPreview={onPreview}
              onEliminar={onEliminar}
              showStatus={showStatus}
              canEliminar={canEliminar}
            />
          ))}
          {!canEliminar && null}
        </div>
      )}
    </div>
  );
}

// ─── Grupo por subcategoría (etapa Verificación / wizard) ───────────────────

interface GrupoSubcategoriaCardProps {
  /** Configs que comparten (categoria, subcategoria) */
  configs:        IFotografiaConfig[];
  fotos:          IFotografia[];
  idBodega:       number;
  canFotografias: boolean;
  canEliminar:    boolean;
  /** Si es true, muestra la insignia de status de cada foto (etapa=Registro) */
  showStatus:     boolean;
  onPreview:      (foto: IFotografia) => void;
  onEliminar:     (foto: IFotografia) => void;
}

function GrupoSubcategoriaCard({
  configs,
  fotos,
  idBodega,
  canFotografias,
  canEliminar,
  showStatus,
  onPreview,
  onEliminar,
}: GrupoSubcategoriaCardProps) {
  const subcategoria = configs[0]?.subcategoria ?? '';

  // Orden estable de momentos: Antes, Durante, Posterior
  const ordenMomento: Record<string, number> = { Antes: 0, Durante: 1, Posterior: 2 };
  const configsOrdenados = [...configs].sort(
    (a, b) => (ordenMomento[a.momento] ?? 99) - (ordenMomento[b.momento] ?? 99),
  );

  return (
    <div className="px-5 py-3 border-b border-border last:border-0">
      <div className="flex items-center gap-2 mb-2.5">
        <h4 className="text-sm font-semibold text-foreground">{subcategoria}</h4>
      </div>
      <div className={`grid gap-3 ${
        configsOrdenados.length === 1
          ? 'grid-cols-1'
          : configsOrdenados.length === 2
            ? 'grid-cols-1 md:grid-cols-2'
            : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
      }`}>
        {configsOrdenados.map((cfg) => (
          <MomentoUploader
            key={cfg.id}
            config={cfg}
            fotos={fotos.filter((f) => f.id_config === cfg.id)}
            idBodega={idBodega}
            canFotografias={canFotografias}
            canEliminar={canEliminar}
            showStatus={showStatus}
            onPreview={onPreview}
            onEliminar={onEliminar}
          />
        ))}
      </div>
    </div>
  );
}

// ─── Props ────────────────────────────────────────────────────────────────────

export interface FotosState {
  allRequiredFilled: boolean;
  allProcessed: boolean;
  hasObservadas: boolean;
  allValidada: boolean;
}

interface FotografiasCardProps {
  idBodega: number;
  /** 'upload' muestra zona de carga; 'validar' muestra botones Validar/Observar. Default: 'upload' */
  mode?: FotografiasMode;
  /** Filtra configuraciones a mostrar. Default: etapa=Registro + Acondicionamiento/Antes */
  filtro?: FotografiasFiltro;
  /** Agrupa las configs del mismo (categoria, subcategoria) en un solo bloque con un MomentoUploader por cada momento (Antes/Durante/Posterior) */
  agruparPorSubcategoria?: boolean;
  /** Personaliza el texto de la leyenda que se muestra bajo el header del card mientras no se cumple el mínimo de fotos. */
  leyendaCaptura?: string;
  /** Callback opcional cuando se crea una observación */
  onObservacionCreada?: () => void;
  /** Callback con el estado actual de las fotos */
  onFotosStateChange?: (state: FotosState) => void;
  /** Observaciones pendientes de la bodega */
  observaciones?: IObservacionBodega[];
  /** Permite eliminar fotografías. Default: true */
  soloLecturaObservaciones?: boolean;
  /** Estatus actual de la bodega para determinar comportamiento de observaciones */
  bodegaStatus?: TStatusBodega;
  /** Permiso para subir fotografías (drag & drop) */
  canFotografias?: boolean;
  /** Permiso para validar fotografías */
  canValidarFotografia?: boolean;
  /** Permiso para ver observaciones */
  canObservaciones?: boolean;
  /** Permiso para validar observaciones */
  canValidarObservacion?: boolean;
  /** Permiso para eliminar observaciones */
  canEliminarObservacion?: boolean;
  /** Permiso para eliminar fotografías */
  canEliminarFotografia?: boolean;
  /**
   * Indica que el componente se está renderizando desde el wizard de verificación.
   * Cuando es true, se bloquea la eliminación de fotografías (mismo patrón que
   * la cédula cuando la verificación está en modo read-only).
   */
  modoWizard?: boolean;
}

// ─── FotografiasCard ──────────────────────────────────────────────────────────

export function FotografiasCard({ idBodega, mode = 'upload', filtro, agruparPorSubcategoria = false, leyendaCaptura, onObservacionCreada, onFotosStateChange, observaciones, soloLecturaObservaciones = false, bodegaStatus = 'Capturada', canFotografias = true, canValidarFotografia = true, canObservaciones = true, canValidarObservacion = true, canEliminarObservacion = true, canEliminarFotografia = true, modoWizard = false }: FotografiasCardProps) {
  const { data: configs = [], isLoading: loadingConfig } = useFotografiasConfig();
  const { data: fotos = [], isLoading: loadingFotos, isError } = useFotografiasConConfig(idBodega);

  const [configAObservar, setConfigAObservar] = useState<IFotografiaConfig | null>(null);
  const [configAVerObs, setConfigAVerObs]     = useState<{ config: IFotografiaConfig; readOnly: boolean } | null>(null);
  const [fotoAEliminar, setFotoAEliminar]     = useState<IFotografia | null>(null);
  const [previewFoto, setPreviewFoto]         = useState<IFotografia | null>(null);
  /** Conjunto de categorías colapsadas. Vacío = todas expandidas (default). */
  const [collapsedCategorias, setCollapsedCategorias] = useState<Set<string>>(new Set());

  function toggleCategoria(cat: string) {
    setCollapsedCategorias((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  }

  const { mutate: eliminar, isPending: eliminando } = useEliminarFotografia(idBodega);

  // Cuando el componente se renderiza desde el wizard de verificación, se
  // bloquea la eliminación de fotografías sin importar el permiso del usuario.
  const canEliminarEfectivo = modoWizard ? false : canEliminarFotografia;

  const handleObservarClose = () => {
    setConfigAObservar(null);
    onObservacionCreada?.();
  };

  const isLoading  = loadingConfig || loadingFotos;
  const filtroAplicado: FotografiasFiltro = { ...FILTRO_DEFAULT, ...filtro };
  const configsFiltrados = configsVisibles(configs, filtroAplicado);
  const categorias = Array.from(new Set(configsFiltrados.map((c) => c.categoria)));

  const required  = configsFiltrados;
  const completed = required.filter(
    (c) => fotos.filter((f) => f.id_config === c.id).length >= c.min_fotos,
  );
  const allDone = required.length > 0 && completed.length === required.length;

  // Estado para el padre
  const allRequiredFilled = completed.length === required.length;
  const allProcessed = fotos.length > 0 && fotos.every((f) => f.status_foto !== 'Pendiente');
  const hasObservadas = fotos.some((f) => f.status_foto === 'Observada');
  const allValidada = fotos.length > 0 && fotos.every((f) => f.status_foto === 'Validada');

  useEffect(() => {
    onFotosStateChange?.({
      allRequiredFilled,
      allProcessed,
      hasObservadas,
      allValidada,
    });
  }, [allRequiredFilled, allProcessed, hasObservadas, allValidada, onFotosStateChange]);

  function handlePreview(foto: IFotografia) {
    // Toggle: si ya está activa, cierra
    setPreviewFoto((prev) => (prev?.id === foto.id ? null : foto));
  }

  const hasPreview = previewFoto !== null;

  return (
    <>
      <Card className="overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between gap-2 pb-3">
          <div className="flex items-center gap-2 flex-wrap">
            <CardTitle>Fotografías</CardTitle>
          </div>
        </CardHeader>
        {!isLoading && !allDone && (
          <div className="flex items-start gap-2 border-b border-border bg-amber-50 dark:bg-amber-950/30 px-5 py-2 text-xs text-amber-800 dark:text-amber-300">
            <Info className="h-3.5 w-3.5 shrink-0 mt-0.5" aria-hidden="true" />
            <p>
              {leyendaCaptura ?? 'Debe adjuntar las fotografías de manera obligatoria para poder concluir la captura de información de la bodega.'}
            </p>
          </div>
        )}

        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-5 space-y-4">
              {[0, 1].map((i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-5 w-40" />
                  {[0, 1, 2].map((j) => <Skeleton key={j} className="h-10 w-full rounded" />)}
                </div>
              ))}
            </div>
          ) : isError ? (
            <div className="flex flex-col items-center justify-center py-10 text-center px-5">
              <AlertCircle className="h-8 w-8 text-destructive mb-2" />
              <p className="text-sm text-muted-foreground">Error al cargar las fotografías.</p>
            </div>
          ) : configs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center px-5">
              <ImageIcon className="h-6 w-6 text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">Sin configuración de fotografías.</p>
            </div>
          ) : (
            /* ── Split layout ────────────────────────────────────────── */
            <div className={`flex flex-col ${hasPreview ? 'lg:flex-row lg:items-start' : ''}`}>

              {/* ── Lista ──────────────────────────────────────────────── */}
              <div className={hasPreview ? 'lg:w-1/2 lg:max-h-[calc(100vh-2rem)] lg:overflow-y-auto lg:pr-1' : 'w-full'}>
                <div className="divide-y divide-border">
                  {categorias.map((categoria) => {
                    const slots = configsFiltrados.filter(
                      (c) => c.categoria === categoria,
                    );
                    if (slots.length === 0) return null;

                    // Cuando se solicita agrupación por subcategoría (wizard), se agrupan
                    // las configs que comparten (categoria, subcategoria) en un solo bloque
                    // con un MomentoUploader por cada momento (Antes/Durante/Posterior).
                    if (agruparPorSubcategoria) {
                      const gruposMap = new Map<string, IFotografiaConfig[]>();
                      for (const cfg of slots) {
                        const key = cfg.subcategoria ?? `__sin_subcat_${cfg.id}`;
                        if (!gruposMap.has(key)) gruposMap.set(key, []);
                        gruposMap.get(key)!.push(cfg);
                      }
                      const isCollapsed = collapsedCategorias.has(categoria);
                      return (
                        <div key={categoria}>
                          {/* Encabezado categoría (colapsable) */}
                          <button
                            type="button"
                            onClick={() => toggleCategoria(categoria)}
                            aria-expanded={!isCollapsed}
                            aria-controls={`cat-${categoria}`}
                            className="w-full px-5 py-3 flex items-center gap-2 border-b border-border bg-muted/30 hover:bg-muted/50 transition-colors text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                          >
                            {isCollapsed
                              ? <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                              : <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                            }
                            <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                              {categoria}
                            </h3>
                          </button>
                          {!isCollapsed && (
                            <div id={`cat-${categoria}`}>
                          {Array.from(gruposMap.entries()).map(([key, configsGrupo]) => {
                            if (key.startsWith('__sin_subcat_')) {
                              // Fallback: render normal por config si no hay subcategoria
                              return (
                                <div key={key}>
                                  {configsGrupo.map((cfg) => (
                                    <ConfigSection
                                      key={cfg.id}
                                      config={cfg}
                                      fotos={fotos.filter((f) => f.id_config === cfg.id)}
                                      idBodega={idBodega}
                                      mode={mode}
                                      previewFotoId={previewFoto?.id ?? null}
                                      onPreview={handlePreview}
                                      onEliminar={setFotoAEliminar}
                                      onObservar={setConfigAObservar}
                                      onVerObservaciones={(cfg, ro) => setConfigAVerObs({ config: cfg, readOnly: ro })}
                                      observaciones={observaciones}
                                      soloLecturaObservaciones={soloLecturaObservaciones}
                                      bodegaStatus={bodegaStatus}
                                      canValidarFotografia={canValidarFotografia}
canObservaciones={canObservaciones}
                                       canValidarObservacion={canValidarObservacion}
                                       canEliminarObservacion={canEliminarObservacion}
                                       canEliminarFotografia={canEliminarEfectivo}
                                     />
                                  ))}
                                </div>
                              );
                            }
                            return (
                              <GrupoSubcategoriaCard
                                key={key}
                                configs={configsGrupo}
                                fotos={fotos}
                                idBodega={idBodega}
                                canFotografias={canFotografias}
                                canEliminar={canEliminarEfectivo}
                                showStatus={false}
                                onPreview={handlePreview}
                                onEliminar={setFotoAEliminar}
                              />
                            );
                          })}
                            </div>
                          )}
                        </div>
                      );
                    }

                    // Renderizado por etapa Registro (comportamiento previo)
                    const momentos = Array.from(new Set(slots.map((s) => s.momento)));
                    const isCollapsed = collapsedCategorias.has(categoria);
                    return (
                      <div key={categoria}>
                        {/* Encabezado categoría (colapsable) */}
                        <button
                          type="button"
                          onClick={() => toggleCategoria(categoria)}
                          aria-expanded={!isCollapsed}
                          aria-controls={`cat-${categoria}`}
                          className="w-full px-5 py-3 flex items-center gap-2 border-b border-border bg-muted/30 hover:bg-muted/50 transition-colors text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                        >
                          {isCollapsed
                            ? <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                            : <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                          }
                          <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                            {categoria}
                          </h3>
                        </button>
                        {!isCollapsed && (
                          <div id={`cat-${categoria}`}>
                        {/* Sub-encabezados por momento */}
                        {momentos.map((momento) => {
                          const slotsMomento = slots.filter((s) => s.momento === momento);
                          if (slotsMomento.length === 0) return null;
                          return (
                            <div key={`${categoria}-${momento}`}>
                              <div className="px-5 py-2 flex items-center gap-2 border-b border-border bg-muted/20">
                                <h4 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                                  {ETAPA_LABEL[momento] ?? momento}
                                </h4>
                              </div>
                              <div className="divide-y divide-border">
                                {slotsMomento.map((cfg) => (
                                  <ConfigSection
                                    key={cfg.id}
                                    config={cfg}
                                    fotos={fotos.filter((f) => f.id_config === cfg.id)}
                                    idBodega={idBodega}
                                    mode={mode}
                                    previewFotoId={previewFoto?.id ?? null}
                                    onPreview={handlePreview}
                                    onEliminar={setFotoAEliminar}
                                    onObservar={setConfigAObservar}
                                    onVerObservaciones={(cfg, ro) => setConfigAVerObs({ config: cfg, readOnly: ro })}
                                    observaciones={observaciones}
                                    soloLecturaObservaciones={soloLecturaObservaciones}
                                    bodegaStatus={bodegaStatus}
                                    canValidarFotografia={canValidarFotografia}
                                    canObservaciones={canObservaciones}
                                    canValidarObservacion={canValidarObservacion}
                                    canEliminarObservacion={canEliminarObservacion}
                                    canEliminarFotografia={canEliminarEfectivo}
                                  />
                                ))}
                              </div>
                            </div>
                          );
                        })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* ── Panel vista previa ─────────────────────────────────── */}
              {hasPreview && (
                <FotoPreviewPanel
                  foto={previewFoto}
                  config={configsFiltrados.find((c) => c.id === previewFoto.id_config) ?? null}
                  onClose={() => setPreviewFoto(null)}
                />
              )}

            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog observar */}
      <ObservarDialog
        config={configAObservar}
        idBodega={idBodega}
        onClose={handleObservarClose}
        observaciones={observaciones}
        soloLecturaObservaciones={soloLecturaObservaciones}
        bodegaStatus={bodegaStatus}
        canValidarObservacion={canValidarObservacion}
        canEliminarObservacion={canEliminarObservacion}
      />

      {/* Dialog ver observaciones de config */}
      {configAVerObs && (
        <VerObservacionesFotoDialog
          config={configAVerObs.config}
          idBodega={idBodega}
          observaciones={observaciones}
          onClose={() => setConfigAVerObs(null)}
          readOnly={configAVerObs.readOnly}
          bodegaStatus={bodegaStatus}
          canValidarObservacion={canValidarObservacion}
          canEliminarObservacion={canEliminarObservacion}
        />
      )}

      {/* Confirmación eliminar fotografía */}
      <AlertDialog open={!!fotoAEliminar} onOpenChange={(open) => { if (!open) setFotoAEliminar(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar esta fotografía?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción <span className="font-semibold text-destructive">no es reversible</span>.
              Se eliminará la fotografía de forma permanente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={eliminando}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={eliminando}
              onClick={() => {
                if (!fotoAEliminar) return;
                eliminar(fotoAEliminar.id, {
                  onSuccess: () => {
                    setFotoAEliminar(null);
                    if (previewFoto?.id === fotoAEliminar.id) {
                      setPreviewFoto(null);
                    }
                  },
                });
              }}
            >
              {eliminando && <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />}
              Sí, eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

// ─── Dialog Ver Observaciones de Foto ─────────────────────────────────────────

interface VerObservacionesFotoDialogProps {
  config: IFotografiaConfig;
  idBodega: number;
  observaciones?: IObservacionBodega[];
  onClose: () => void;
  readOnly?: boolean;
  bodegaStatus?: TStatusBodega;
  canValidarObservacion?: boolean;
  canEliminarObservacion?: boolean;
}

function VerObservacionesFotoDialog({ config, idBodega, observaciones, onClose, readOnly = false, bodegaStatus = 'Capturada', canValidarObservacion = true, canEliminarObservacion = true }: VerObservacionesFotoDialogProps) {
  const { mutate: eliminar, isPending } = useEliminarObservacionBodega(idBodega);
  const { mutate: toggleStatusObs, isPending: togglingStatus } = useToggleStatusObservacionBodega(idBodega);
  const obsConfig = observaciones?.filter(
    (o) => o.seccion === 'Fotografias' && o.id_referencia === config.id,
  ) ?? [];

  const modoSolventar = bodegaStatus === 'Observada' || bodegaStatus === 'Capturada';

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{bodegaStatus === 'Observada' ? 'Solventar observaciones' : 'Observaciones'}</DialogTitle>
          <DialogDescription>
            {config.descripcion ?? ETAPA_LABEL[config.momento] ?? config.momento}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-1">
          {obsConfig.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sin observaciones.</p>
          ) : (
            obsConfig.map((obs) => (
              <div
                key={obs.id}
                className="rounded-lg border border-border bg-muted/20 p-3 space-y-2"
              >
                <p className="text-sm text-foreground">{obs.observacion}</p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider ${
                        obs.status === 'Pendiente'
                          ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                          : obs.status === 'Atendida'
                          ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                          : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                      }`}
                    >
                      {obs.status}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      {new Date(obs.created_at).toLocaleDateString('es-MX')}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    {canValidarObservacion && bodegaStatus === 'Capturada' && obs.status !== 'Validada' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
                        onClick={() => toggleStatusObs(obs.id)}
                        disabled={togglingStatus}
                        aria-label={obs.status === 'Pendiente' ? 'Marcar como atendida' : 'Validar'}
                      >
                        {togglingStatus ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <CheckCircle2 className="h-3.5 w-3.5" />
                        )}
                      </Button>
                    )}
                    {canEliminarObservacion && bodegaStatus === 'Capturada' && obs.status !== 'Validada' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 text-destructive hover:bg-destructive/10"
                        onClick={() => eliminar(obs.id)}
                        disabled={isPending}
                        aria-label="Eliminar observación"
                      >
                        {isPending ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="h-3.5 w-3.5" />
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" size="sm" onClick={onClose}>
            Cerrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
