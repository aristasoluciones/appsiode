'use client';

import { useEffect, useRef, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Eye,
  ImageIcon,
  Loader2,
  Maximize2,
  MessageSquare,
  PanelRightClose,
  RotateCcw,
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

const MOMENTOS_REQUERIDOS = new Set(['Antes']);

const ETAPA_LABEL: Record<string, string> = {
  Antes:   'Antes',
  Durante: 'Durante',
  Despues: 'Después',
};

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
  onClose: () => void;
}

function FotoPreviewPanel({ foto, onClose }: FotoPreviewPanelProps) {
  const [fullscreen, setFullscreen] = useState(false);

  return (
    <>
    <div className="flex-1 flex flex-col border-t border-border lg:border-t-0 lg:border-l min-h-[360px]">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 px-4 py-2.5 border-b border-border bg-muted/30 shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <ImageIcon className="h-4 w-4 text-muted-foreground shrink-0" />
          <span className="text-sm font-medium text-foreground truncate">
            {formatFecha(foto.created_at)}
          </span>
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
      <div className="flex-1 flex items-center justify-center bg-muted/20 p-4 min-h-[300px]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={foto.url}
          alt="Vista previa"
          className="max-w-full max-h-full object-contain rounded-lg cursor-zoom-in"
          style={{ maxHeight: '480px' }}
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

function ObservarDialog({ config, onClose, idBodega, observaciones, soloLecturaObservaciones = false, bodegaStatus = 'Registrada', canValidarObservacion = true, canEliminarObservacion = true }: ObservarDialogProps) {
  const [texto, setTexto] = useState('');
  const { mutate: observar, isPending } = useCrearObservacionBodega(idBodega);
  const { mutate: eliminarObs, isPending: eliminandoObs } = useEliminarObservacionBodega(idBodega);
  const { mutate: toggleStatusObs, isPending: togglingStatus } = useToggleStatusObservacionBodega(idBodega);

  const obsConfig = config
    ? (observaciones?.filter((o) => o.seccion === 'Fotografias' && o.id_referencia === config.id) ?? [])
    : [];

  const modoSolventar = bodegaStatus === 'Observada' || bodegaStatus === 'Registrada';
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
                        <span className="text-[10px] text-muted-foreground">
                          {new Date(obs.created_at).toLocaleDateString('es-MX')}
                        </span>
                        <div className="flex items-center gap-1">
                          {canValidarObservacion && bodegaStatus === 'Registrada' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className={`h-6 w-6 p-0 ${
                                obs.status === 'Pendiente'
                                  ? 'text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/30'
                                  : 'text-amber-600 hover:text-amber-700 hover:bg-amber-50 dark:hover:bg-amber-950/30'
                              }`}
                              onClick={() => toggleStatusObs(obs.id)}
                              disabled={togglingStatus}
                              aria-label={obs.status === 'Pendiente' ? 'Marcar como solventada' : 'Marcar como pendiente'}
                            >
                              {togglingStatus ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : obs.status === 'Pendiente' ? (
                                <CheckCircle2 className="h-3 w-3" />
                              ) : (
                                <RotateCcw className="h-3 w-3" />
                              )}
                            </Button>
                          )}
                          {canEliminarObservacion && bodegaStatus === 'Registrada' && obs.status !== 'Solventada' && (
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

            {bodegaStatus === 'Registrada' && (
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
          {bodegaStatus === 'Registrada' && (
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

function FotoRow({ foto, idBodega, mode, isPreviewing, onPreview, onEliminar, soloLecturaObservaciones = false, bodegaStatus = 'Registrada', canValidarFotografia = true, canEliminarFotografia = true }: FotoRowProps) {
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

      {canEliminarFotografia && (bodegaStatus === 'En captura' || bodegaStatus === 'Observada') && (
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

  const isRequired = MOMENTOS_REQUERIDOS.has(config.momento);
  const count      = fotos.length;
  const isFull     = count >= config.max_fotos;
  const slots      = config.max_fotos - count;
  const showUpload = canFotografias && !isFull && ((mode === 'upload' && bodegaStatus !== 'Validada') || bodegaStatus === 'Observada');

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
    const toUpload = valid.slice(0, slots);
    if (valid.length > slots)
      setUploadError(`Solo puedes agregar ${slots} foto${slots !== 1 ? 's' : ''} más (máx. ${config.max_fotos}).`);
    subir({ files: toUpload, id_config: config.id }, {
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
          <span className="text-xs text-muted-foreground tabular-nums">
            {count}/{config.max_fotos}
          </span>
          {isFull && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />}
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
                {slots > 0 && ` · ${slots} espacio${slots !== 1 ? 's' : ''} libre${slots !== 1 ? 's' : ''}`}
              </p>
            </div>
          </div>
          <input
            ref={inputRef}
            type="file"
            accept={ACCEPTED_ACCEPT}
            multiple={slots > 1}
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
}

// ─── FotografiasCard ──────────────────────────────────────────────────────────

export function FotografiasCard({ idBodega, mode = 'upload', onObservacionCreada, onFotosStateChange, observaciones, soloLecturaObservaciones = false, bodegaStatus = 'Registrada', canFotografias = true, canValidarFotografia = true, canObservaciones = true, canValidarObservacion = true, canEliminarObservacion = true, canEliminarFotografia = true }: FotografiasCardProps) {
  const { data: configs = [], isLoading: loadingConfig } = useFotografiasConfig();
  const { data: fotos = [], isLoading: loadingFotos, isError } = useFotografiasConConfig(idBodega);

  const [configAObservar, setConfigAObservar] = useState<IFotografiaConfig | null>(null);
  const [configAVerObs, setConfigAVerObs]     = useState<{ config: IFotografiaConfig; readOnly: boolean } | null>(null);
  const [fotoAEliminar, setFotoAEliminar]     = useState<IFotografia | null>(null);
  const [previewFoto, setPreviewFoto]         = useState<IFotografia | null>(null);

  const { mutate: eliminar, isPending: eliminando } = useEliminarFotografia(idBodega);

  const handleObservarClose = () => {
    setConfigAObservar(null);
    onObservacionCreada?.();
  };

  const isLoading  = loadingConfig || loadingFotos;
  const categorias = Array.from(new Set(configs.map((c) => c.categoria)));

  const required  = configs.filter((c) => MOMENTOS_REQUERIDOS.has(c.momento));
  const completed = required.filter(
    (c) => fotos.filter((f) => f.id_config === c.id).length >= c.max_fotos,
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
            {!isLoading && required.length > 0 && (
              allDone ? (
                <Badge variant="success" appearance="light" size="sm">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Requeridas completas
                </Badge>
              ) : (
                <Badge variant="destructive" appearance="light" size="sm">
                  {completed.length}/{required.length} requeridas
                </Badge>
              )
            )}
          </div>
        </CardHeader>

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
            <div className={`flex flex-col ${hasPreview ? 'lg:flex-row' : ''}`}>

              {/* ── Lista ──────────────────────────────────────────────── */}
              <div className={hasPreview ? 'lg:w-1/2' : 'w-full'}>
                <div className="divide-y divide-border">
                  {categorias.map((categoria) => {
                    const slots = configs.filter(
                      (c) => c.categoria === categoria && MOMENTOS_REQUERIDOS.has(c.momento),
                    );
                    if (slots.length === 0) return null;
                    return (
                      <div key={categoria}>
                        {/* Encabezado categoría */}
                        <div className="px-5 py-3 flex items-center gap-2 border-b border-border">
                          <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                            {categoria}
                          </h3>
                        </div>
                        {/* Configs */}
                        <div className="divide-y divide-border">
                          {slots.map((cfg) => (
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
                              canEliminarFotografia={canEliminarFotografia}
                            />
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* ── Panel vista previa ─────────────────────────────────── */}
              {hasPreview && (
                <FotoPreviewPanel
                  foto={previewFoto}
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

function VerObservacionesFotoDialog({ config, idBodega, observaciones, onClose, readOnly = false, bodegaStatus = 'Registrada', canValidarObservacion = true, canEliminarObservacion = true }: VerObservacionesFotoDialogProps) {
  const { mutate: eliminar, isPending } = useEliminarObservacionBodega(idBodega);
  const { mutate: toggleStatusObs, isPending: togglingStatus } = useToggleStatusObservacionBodega(idBodega);
  const obsConfig = observaciones?.filter(
    (o) => o.seccion === 'Fotografias' && o.id_referencia === config.id,
  ) ?? [];

  const modoSolventar = bodegaStatus === 'Observada' || bodegaStatus === 'Registrada';

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
                  <span className="text-[10px] text-muted-foreground">
                    {new Date(obs.created_at).toLocaleDateString('es-MX')}
                  </span>
                  <div className="flex items-center gap-1">
                    {canValidarObservacion && bodegaStatus === 'Registrada' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className={`h-7 w-7 p-0 ${
                          obs.status === 'Pendiente'
                            ? 'text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/30'
                            : 'text-amber-600 hover:text-amber-700 hover:bg-amber-50 dark:hover:bg-amber-950/30'
                        }`}
                        onClick={() => toggleStatusObs(obs.id)}
                        disabled={togglingStatus}
                        aria-label={obs.status === 'Pendiente' ? 'Marcar como solventada' : 'Marcar como pendiente'}
                      >
                        {togglingStatus ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : obs.status === 'Pendiente' ? (
                          <CheckCircle2 className="h-3.5 w-3.5" />
                        ) : (
                          <RotateCcw className="h-3.5 w-3.5" />
                        )}
                      </Button>
                    )}
                    {canEliminarObservacion && bodegaStatus === 'Registrada' && obs.status !== 'Solventada' && (
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
