'use client';

import { useRef, useState } from 'react';
import {
  FileText,
  Loader2,
  Upload,
  Eye,
  Trash2,
  AlertTriangle,
  PanelRightClose,
  Maximize2,
  MessageSquare,
  CheckCircle2,
  Info,
} from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
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
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useAcuerdoBodega, useSubirAcuerdo, useEliminarAcuerdo, useCrearObservacionBodega, useEliminarObservacionBodega, useToggleStatusObservacionBodega } from '../_hooks/use-bodegas';
import type { IObservacionBodega, TStatusBodega } from '@/types/bodegas';

type AcuerdoMode = 'upload' | 'validar';

interface UploadAcuerdoProps {
  idBodega: number;
  /** 'upload' permite carga/eliminación; 'validar' muestra botón observar. Default: 'upload' */
  mode?: AcuerdoMode;
  /** Callback opcional cuando se crea una observación */
  onObservacionCreada?: () => void;
  /** Observaciones pendientes de la bodega */
  observaciones?: IObservacionBodega[];
  /** Si es true, solo muestra observaciones sin permitir agregar nuevas */
  soloLecturaObservaciones?: boolean;
  /** Estatus actual de la bodega para determinar comportamiento de observaciones */
  bodegaStatus?: TStatusBodega;
  /** Permiso para subir/eliminar acuerdos (drag & drop) */
  canAcuerdos?: boolean;
  /** Permiso para eliminar acuerdo */
  canEliminarAcuerdo?: boolean;
  /** Permiso para ver observaciones */
  canObservaciones?: boolean;
  /** Permiso para validar observaciones */
  canValidarObservacion?: boolean;
  /** Permiso para eliminar observaciones */
  canEliminarObservacion?: boolean;
}

// ─── Dialog Observar Acuerdo ──────────────────────────────────────────────────

interface ObservarAcuerdoDialogProps {
  open: boolean;
  acuerdoId: number | null;
  onClose: () => void;
  idBodega: number;
  onObservacionCreada?: () => void;
  observaciones?: IObservacionBodega[];
  soloLecturaObservaciones?: boolean;
  bodegaStatus?: TStatusBodega;
  canValidarObservacion?: boolean;
  canEliminarObservacion?: boolean;
}

function ObservarAcuerdoDialog({ open, acuerdoId, onClose, idBodega, onObservacionCreada, observaciones, soloLecturaObservaciones = false, bodegaStatus = 'Capturada', canValidarObservacion = true, canEliminarObservacion = true }: ObservarAcuerdoDialogProps) {
  const [texto, setTexto] = useState('');
  const { mutate: observar, isPending } = useCrearObservacionBodega(idBodega);
  const { mutate: eliminarObs, isPending: eliminandoObs } = useEliminarObservacionBodega(idBodega);
  const { mutate: toggleStatusObs, isPending: togglingStatus } = useToggleStatusObservacionBodega(idBodega);

  const obsAcuerdo = observaciones?.filter((o) => o.seccion === 'Acuerdos') ?? [];

  const modoSolventar = bodegaStatus === 'Observada' || bodegaStatus === 'Capturada';
  const isReadOnly = soloLecturaObservaciones;

  function handleSubmit() {
    if (!acuerdoId || !texto.trim()) return;
    observar(
      { seccion: 'Acuerdos', id_referencia: null, observacion: texto.trim() },
      {
        onSuccess: () => { setTexto(''); onObservacionCreada?.(); },
      },
    );
  }

  function handleOpenChange(openDlg: boolean) {
    if (!openDlg) { setTexto(''); onClose(); }
  }

  const charCount = texto.length;

  const dialogTitle = isReadOnly
    ? 'Observaciones de acuerdo'
    : bodegaStatus === 'Observada'
      ? 'Solventar observaciones'
      : 'Observar acuerdo';

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{dialogTitle}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 overflow-y-auto pr-1">
          <div className="flex items-center gap-3 rounded-lg border border-border p-3 bg-muted/20">
            <FileText className="h-5 w-5 text-red-500 shrink-0" />
            <p className="text-sm font-medium text-foreground">Acuerdo de bodega</p>
          </div>

          {/* Observaciones existentes */}
          {obsAcuerdo.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-muted-foreground">
                Observaciones anteriores ({obsAcuerdo.length})
              </h4>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {obsAcuerdo.map((obs) => (
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
                <Label htmlFor="observacion-acuerdo-txt">Nueva observación</Label>
                <span className={`text-[11px] ${charCount > 5000 ? 'text-destructive' : 'text-muted-foreground'}`}>
                  {charCount}/5000
                </span>
              </div>
              <Textarea
                id="observacion-acuerdo-txt"
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

// ─── Panel de vista previa ────────────────────────────────────────────────────

interface AcuerdoPreviewPanelProps {
  ruta:    string;
  nombre:  string;
  onClose: () => void;
}

function AcuerdoPreviewPanel({ ruta, nombre, onClose }: AcuerdoPreviewPanelProps) {
  const [fullscreen, setFullscreen] = useState(false);

  return (
    <>
      <div className="flex-1 flex flex-col border-t border-border lg:border-t-0 lg:border-l min-h-[480px] lg:min-h-[600px]">
        {/* Header */}
        <div className="flex items-center justify-between gap-2 px-4 py-2.5 border-b border-border bg-muted/30 shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <FileText className="h-4 w-4 text-muted-foreground shrink-0" aria-hidden="true" />
            <span className="text-sm font-medium text-foreground truncate">
              {nombre}
            </span>
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

        {/* PDF */}
        <div className="flex-1 flex flex-col">
          <iframe
            src={`${ruta}#view=Fit&zoom=60`}
            title={nombre}
            className="flex-1 w-full border-0"
            style={{ minHeight: '800px' }}
          />
        </div>
      </div>

      {/* Fullscreen dialog */}
      <Dialog open={fullscreen} onOpenChange={setFullscreen}>
        <DialogContent className="sm:max-w-5xl w-[95vw] max-h-[95vh] flex flex-col p-0">
          <DialogHeader className="px-4 py-3 border-b border-border shrink-0">
            <DialogTitle className="text-sm font-semibold truncate">{nombre}</DialogTitle>
          </DialogHeader>
          <div className="flex-1 min-h-0 p-0">
            <iframe
              src={`${ruta}#view=Fit&zoom=60`}
              title={nombre}
              className="w-full h-full border-0"
              style={{ minHeight: '70vh' }}
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ─── Componente principal ───────────────────────────────────────────────────

export function UploadAcuerdo({ idBodega, mode = 'upload', onObservacionCreada, observaciones, soloLecturaObservaciones = false, bodegaStatus = 'Capturada', canAcuerdos = true, canEliminarAcuerdo = true, canObservaciones = true, canValidarObservacion = true, canEliminarObservacion = true }: UploadAcuerdoProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const { data: acuerdo, isLoading } = useAcuerdoBodega(idBodega);
  const subirMutation = useSubirAcuerdo(idBodega);
  const eliminarMutation = useEliminarAcuerdo(idBodega);
  const [isDragging, setIsDragging] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [observarOpen, setObservarOpen] = useState(false);
  const [verObsOpen, setVerObsOpen] = useState(false);

  const terminalStatuses = ['Determinada', 'Verificada', 'Aceptada', 'Rechazada'];
  const esTerminal = terminalStatuses.includes(bodegaStatus ?? '');
  const obsAcuerdo = observaciones?.filter((o) => o.seccion === 'Acuerdos') ?? [];
  const obsAcuerdoPendientes = obsAcuerdo.filter((o) => o.status === 'Pendiente').length;

  const hasPreview = previewOpen && !!acuerdo;

  function processFile(file: File) {
    if (file.type !== 'application/pdf') {
      alert('Solo se permiten archivos PDF.');
      return;
    }
    subirMutation.mutate(file);
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    processFile(file);
    e.target.value = '';
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(true);
  }

  function handleDragLeave(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    processFile(file);
  }

  function handleEliminar() {
    if (!acuerdo) return;
    eliminarMutation.mutate(acuerdo.id, {
      onSuccess: () => {
        setConfirmDelete(false);
        setPreviewOpen(false);
      },
    });
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <h2 className="text-sm font-semibold text-foreground">Acuerdo</h2>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-sm text-muted-foreground" aria-busy="true">
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            Cargando acuerdo…
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
          <h2 className="text-sm font-semibold text-foreground">Acuerdo</h2>
          {canObservaciones && (mode === 'validar' || obsAcuerdo.length > 0) && (
            <Button
              variant="ghost"
              size="sm"
              className="relative h-7 w-7 p-0 text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/30"
              aria-label={soloLecturaObservaciones ? 'Ver observaciones' : 'Observar acuerdo'}
              onClick={() => setObservarOpen(true)}
            >
              <MessageSquare className="h-3.5 w-3.5" />
              {obsAcuerdoPendientes > 0 && (
                <sup className="absolute -top-0.5 -right-0.5 flex h-3.5 min-w-[0.875rem] items-center justify-center rounded-full bg-rose-600 px-0.5 text-[9px] font-bold text-white leading-none">
                  {obsAcuerdoPendientes}
                </sup>
              )}
            </Button>
          )}
        </CardHeader>
        {!isLoading && !acuerdo && (
          <div className="flex items-start gap-2 border-b border-border bg-amber-50 dark:bg-amber-950/30 px-5 py-2 text-xs text-amber-800 dark:text-amber-300">
            <Info className="h-3.5 w-3.5 shrink-0 mt-0.5" aria-hidden="true" />
            <p>
              Debe adjuntar de manera obligatoria el acuerdo para poder concluir la captura de información de la bodega.
            </p>
          </div>
        )}
        <CardContent className="p-0">
          {/* Split layout */}
          <div className={`flex flex-col ${hasPreview ? 'lg:flex-row' : ''}`}>

            {/* Lista */}
            <div className={hasPreview ? 'lg:w-1/2' : 'w-full'}>
              <div className="p-5 space-y-3">
                {acuerdo && (
                  <div className="space-y-1">
                    {/* Fila de acuerdo */}
                    <div className="flex items-center gap-3 py-2.5 border-b border-border last:border-0">
                      {/* Miniatura PDF */}
                      <button
                        type="button"
                        onClick={() => setPreviewOpen(true)}
                        className={`w-10 h-10 rounded-md overflow-hidden border-2 shrink-0 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                          hasPreview ? 'border-primary' : 'border-border hover:border-primary/60'
                        }`}
                        aria-label="Ver acuerdo"
                      >
                        <div className="w-full h-full bg-red-50 dark:bg-red-950/30 flex items-center justify-center">
                          <FileText className="h-5 w-5 text-red-500 dark:text-red-400" aria-hidden="true" />
                        </div>
                      </button>

                      {/* Meta */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">
                          {acuerdo.nomenclatura}
                        </p>
                        <p className="text-[11px] text-muted-foreground">Acuerdo cargado</p>
                      </div>

                      {/* Botón ver */}
                      <button
                        type="button"
                        onClick={() => setPreviewOpen(true)}
                        title="Vista previa"
                        className={`inline-flex items-center justify-center h-7 w-7 rounded-md border transition-colors ${
                          hasPreview
                            ? 'border-primary bg-primary/10 text-primary'
                            : 'border-border hover:bg-muted text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </button>

                      {/* Botón eliminar (solo En captura u Observada) */}
                      {canEliminarAcuerdo && (bodegaStatus === 'En captura' || bodegaStatus === 'Observada') && (
                        <button
                          type="button"
                          onClick={() => setConfirmDelete(true)}
                          title="Eliminar acuerdo"
                          className="inline-flex items-center justify-center h-7 w-7 rounded-md border border-border hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30 text-muted-foreground transition-colors"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {!acuerdo && (
                  <div className="flex flex-col items-center justify-center py-6 text-center">
                    <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-2">
                      <FileText className="h-6 w-6 text-muted-foreground" aria-hidden="true" />
                    </div>
                    <p className="text-sm font-medium text-foreground">Sin acuerdo cargado</p>
                    {!esTerminal && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Arrastra un PDF o haz clic para cargar
                      </p>
                    )}
                  </div>
                )}

                {/* Zona de arrastre (solo modo upload o cuando no hay acuerdo, y no Validada) */}
                {canAcuerdos && (mode === 'upload' || !acuerdo) && !esTerminal && (
                  <div
                    role="button"
                    tabIndex={0}
                    aria-label="Zona de carga de acuerdo PDF. Arrastra un archivo o haz clic para seleccionar."
                    onClick={() => !subirMutation.isPending && inputRef.current?.click()}
                    onKeyDown={(e) => {
                      if ((e.key === 'Enter' || e.key === ' ') && !subirMutation.isPending) {
                        inputRef.current?.click();
                      }
                    }}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={[
                      'flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-5 text-center transition-colors',
                      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
                      subirMutation.isPending
                        ? 'pointer-events-none opacity-60 border-border'
                        : isDragging
                        ? 'border-primary bg-primary/5 cursor-copy'
                        : 'border-border hover:border-primary/50 hover:bg-muted/30 cursor-pointer',
                    ].join(' ')}
                  >
                    {subirMutation.isPending ? (
                      <>
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" aria-hidden="true" />
                        <p className="text-sm text-muted-foreground">Subiendo…</p>
                      </>
                    ) : (
                      <>
                        <Upload
                          className={`h-6 w-6 ${isDragging ? 'text-primary' : 'text-muted-foreground'}`}
                          aria-hidden="true"
                        />
                        <div>
                          <p className="text-sm font-medium text-foreground">
                            {isDragging
                              ? 'Suelta para cargar'
                              : acuerdo
                              ? 'Reemplazar acuerdo'
                              : 'Cargar acuerdo'}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            Arrastra o haz clic · Solo PDF
                          </p>
                        </div>
                      </>
                    )}
                  </div>
                )}

                <input
                  ref={inputRef}
                  type="file"
                  accept="application/pdf"
                  className="sr-only"
                  aria-hidden="true"
                  onChange={handleFileChange}
                />
              </div>
            </div>

            {/* Panel vista previa */}
            {hasPreview && (
              <AcuerdoPreviewPanel
                ruta={acuerdo.url}
                nombre={acuerdo.nomenclatura}
                onClose={() => setPreviewOpen(false)}
              />
            )}

          </div>
        </CardContent>
      </Card>

      {/* Dialog observar acuerdo */}
      <ObservarAcuerdoDialog
        open={observarOpen}
        acuerdoId={acuerdo?.id ?? null}
        idBodega={idBodega}
        onClose={() => setObservarOpen(false)}
        onObservacionCreada={onObservacionCreada}
        observaciones={observaciones}
        soloLecturaObservaciones={soloLecturaObservaciones}
        bodegaStatus={bodegaStatus}
        canValidarObservacion={canValidarObservacion}
        canEliminarObservacion={canEliminarObservacion}
      />

      {/* Dialog ver observaciones acuerdo */}
      {acuerdo && (
        <VerObservacionesAcuerdoDialog
          open={verObsOpen}
          acuerdoId={acuerdo.id}
          idBodega={idBodega}
          observaciones={observaciones}
          onClose={() => setVerObsOpen(false)}
          soloLecturaObservaciones={soloLecturaObservaciones}
          bodegaStatus={bodegaStatus}
          canValidarObservacion={canValidarObservacion}
          canEliminarObservacion={canEliminarObservacion}
        />
      )}

      {/* Confirmación de eliminación */}
      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" aria-hidden="true" />
              ¿Eliminar acuerdo?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará permanentemente el acuerdo de esta bodega. No se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={eliminarMutation.isPending}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleEliminar}
              disabled={eliminarMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {eliminarMutation.isPending && (
                <Loader2 className="h-4 w-4 mr-1.5 animate-spin" aria-hidden="true" />
              )}
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

// ─── Dialog Ver Observaciones de Acuerdo ─────────────────────────────────────

interface VerObservacionesAcuerdoDialogProps {
  open: boolean;
  acuerdoId: number;
  idBodega: number;
  observaciones?: IObservacionBodega[];
  onClose: () => void;
  soloLecturaObservaciones?: boolean;
  bodegaStatus?: TStatusBodega;
  canValidarObservacion?: boolean;
  canEliminarObservacion?: boolean;
}

function VerObservacionesAcuerdoDialog({ open, acuerdoId, idBodega, observaciones, onClose, soloLecturaObservaciones = false, bodegaStatus = 'Capturada', canValidarObservacion = true, canEliminarObservacion = true }: VerObservacionesAcuerdoDialogProps) {
  const { mutate: eliminar, isPending } = useEliminarObservacionBodega(idBodega);
  const { mutate: toggleStatusObs, isPending: togglingStatus } = useToggleStatusObservacionBodega(idBodega);
  const obsAcuerdo = observaciones?.filter(
    (o) => o.seccion === 'Acuerdos',
  ) ?? [];

  const modoSolventar = bodegaStatus === 'Observada' || bodegaStatus === 'Capturada';

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{bodegaStatus === 'Observada' ? 'Solventar observaciones' : 'Observaciones de acuerdo'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-1">
          {obsAcuerdo.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sin observaciones.</p>
          ) : (
            obsAcuerdo.map((obs) => (
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
