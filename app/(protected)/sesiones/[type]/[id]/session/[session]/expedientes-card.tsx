'use client';

import { useRef, useState } from 'react';
import { Eye, FileText, Loader2, Plus, SearchX, Trash2, Upload, X } from 'lucide-react';
import { PdfPreviewPanel } from './pdf-preview-panel';
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
  useEliminarExpediente,
  useExpedientesSesion,
  useSubirExpediente,
  useTiposDocumentos,
  useVerExpediente,
  type IExpediente,
} from './expedientes-data';

// ─── Constantes ───────────────────────────────────────────────────────────────

const MAX_SIZE_BYTES = 30 * 1024 * 1024; // 30 MB

const ACCEPTED_MIME_TYPES = new Set([
  'application/pdf',
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/bmp',
  'image/tiff',
  'image/svg+xml',
  'image/avif',
  'image/heic',
  'image/heif',
]);

const ACCEPTED_ACCEPT_ATTR = 'application/pdf,image/*';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const MESES = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];

function formatFecha(iso: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  const day  = String(d.getUTCDate()).padStart(2, '0');
  const mes  = MESES[d.getUTCMonth()];
  const year = d.getUTCFullYear();
  return `${day} ${mes} ${year}`;
}

// ─── SubirExpedienteDialog ────────────────────────────────────────────────────

interface SubirExpedienteDialogProps {
  idSesion: string;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

function SubirExpedienteDialog({ idSesion, open, onOpenChange }: SubirExpedienteDialogProps) {
  const { data: tipos = [], isLoading: loadingTipos } = useTiposDocumentos();
  const { mutate: subir, isPending: subiendo } = useSubirExpediente(idSesion);

  const fileRef = useRef<HTMLInputElement>(null);

  const [idTipo, setIdTipo] = useState('');
  const [noDoc, setNoDoc] = useState('');
  const [fecha, setFecha] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [archivo, setArchivo] = useState<File | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const resetForm = () => {
    setIdTipo('');
    setNoDoc('');
    setFecha('');
    setDescripcion('');
    setArchivo(null);
    setErrors({});
    if (fileRef.current) fileRef.current.value = '';
  };

  const handleOpenChange = (v: boolean) => {
    if (!v) resetForm();
    onOpenChange(v);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    if (!file) return;
    if (!ACCEPTED_MIME_TYPES.has(file.type)) {
      setErrors((prev) => ({ ...prev, archivo: 'Solo se permiten archivos PDF e imágenes (JPG, PNG, GIF, WEBP, BMP, TIFF, SVG, AVIF, HEIC).' }));
      setArchivo(null);
      e.target.value = '';
      return;
    }
    if (file.size > MAX_SIZE_BYTES) {
      setErrors((prev) => ({ ...prev, archivo: 'El archivo supera el límite de 30 MB.' }));
      setArchivo(null);
      e.target.value = '';
      return;
    }
    setErrors((prev) => ({ ...prev, archivo: '' }));
    setArchivo(file);
  };

  const validate = (): boolean => {
    const next: Record<string, string> = {};
    if (!idTipo) next.idTipo = 'Selecciona el tipo de documento.';
    if (!noDoc.trim()) next.noDoc = 'Ingresa el número de documento.';
    if (!fecha) next.fecha = 'Selecciona una fecha.';
    if (!descripcion.trim()) next.descripcion = 'Ingresa una descripción.';
    else if (descripcion.length > 1000) next.descripcion = 'La descripción no puede superar los 1000 caracteres.';
    if (!archivo) next.archivo = 'Selecciona un archivo.';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    subir(
      {
        id_tipo: Number(idTipo),
        no_doc: noDoc.trim(),
        fecha,
        descripcion: descripcion.trim(),
        archivo: archivo!,
      },
      {
        onSuccess: () => {
          resetForm();
          onOpenChange(false);
        },
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Subir documento</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Tipo de documento */}
          <div className="space-y-1.5">
            <Label htmlFor="tipo-doc">Tipo de documento <span className="text-destructive">*</span></Label>
            <Select indicatorVisibility= {false} value={idTipo} onValueChange={setIdTipo} disabled={loadingTipos}>
              <SelectTrigger id="tipo-doc">
                <SelectValue placeholder={loadingTipos ? 'Cargando...' : 'Selecciona un tipo'} />
              </SelectTrigger>
              <SelectContent>
                {tipos.map((t) => (
                  <SelectItem key={t.id} value={String(t.id)}>
                    {t.tipo}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.idTipo && <p className="text-xs text-destructive">{errors.idTipo}</p>}
          </div>

          {/* No. documento */}
          <div className="space-y-1.5">
            <Label htmlFor="no-doc">No. documento <span className="text-destructive">*</span></Label>
            <Input
              id="no-doc"
              value={noDoc}
              onChange={(e) => setNoDoc(e.target.value)}
              placeholder="Ej. DOC-2026-001"
            />
            {errors.noDoc && <p className="text-xs text-destructive">{errors.noDoc}</p>}
          </div>

          {/* Fecha */}
          <div className="space-y-1.5">
            <Label htmlFor="fecha-doc">Fecha <span className="text-destructive">*</span></Label>
            <Input
              id="fecha-doc"
              type="date"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
            />
            {errors.fecha && <p className="text-xs text-destructive">{errors.fecha}</p>}
          </div>

          {/* Descripción */}
          <div className="space-y-1.5">
            <Label htmlFor="desc-doc">Descripción <span className="text-destructive">*</span></Label>
            <Textarea
              id="desc-doc"
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              rows={3}
              maxLength={1000}
              placeholder="Describe el contenido del documento..."
              className="resize-y"
            />
            <div className="flex items-center justify-between">
              {errors.descripcion
                ? <p className="text-xs text-destructive">{errors.descripcion}</p>
                : <span />}
              <span className={`text-xs tabular-nums ${descripcion.length > 950 ? 'text-destructive' : 'text-muted-foreground'}`}>
                {descripcion.length}/1000
              </span>
            </div>
          </div>

          {/* Archivo */}
          <div className="space-y-1.5">
            <Label htmlFor="archivo-doc">Archivo <span className="text-destructive">*</span></Label>
            {archivo ? (
              <div className="flex items-center gap-2 rounded-md border border-border bg-muted/40 px-3 py-2">
                <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className="flex-1 min-w-0 text-sm truncate">{archivo.name}</span>
                <span className="text-xs text-muted-foreground shrink-0">
                  {(archivo.size / 1024 / 1024).toFixed(1)} MB
                </span>
                <button
                  type="button"
                  className="shrink-0 text-muted-foreground hover:text-destructive transition-colors"
                  onClick={() => {
                    setArchivo(null);
                    if (fileRef.current) fileRef.current.value = '';
                  }}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <label
                htmlFor="archivo-doc"
                className="flex flex-col items-center justify-center gap-2 rounded-md border-2 border-dashed border-border bg-muted/20 px-4 py-6 cursor-pointer hover:bg-muted/40 transition-colors"
              >
                <Upload className="h-6 w-6 text-muted-foreground" />
                <span className="text-sm text-muted-foreground text-center">
                  Haz clic para seleccionar un archivo
                  <br />
                  <span className="text-xs">PDF o imagen · Máximo 30 MB</span>
                </span>
              </label>
            )}
            <input
              id="archivo-doc"
              ref={fileRef}
              type="file"
              accept={ACCEPTED_ACCEPT_ATTR}
              className="sr-only"
              onChange={handleFileChange}
            />
            {errors.archivo && <p className="text-xs text-destructive">{errors.archivo}</p>}
          </div>
        </div>

        <DialogFooter>
          <p className="text-xs text-muted-foreground mr-auto"><span className="text-destructive">*</span> Campos obligatorios</p>
          <Button variant="outline" onClick={() => handleOpenChange(false)} disabled={subiendo}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={subiendo}>
            {subiendo ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> Subiendo...</>
            ) : (
              <><Upload className="h-4 w-4" /> Subir documento</>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── ExpedienteRow ────────────────────────────────────────────────────────────

function ExpedienteRow({
  exp,
  idSesion,
  readonly,
  onVer,
  previewing,
}: {
  exp: IExpediente;
  idSesion: string;
  readonly: boolean;
  onVer: (exp: IExpediente) => void;
  previewing: boolean;
}) {
  const [confirmarEliminar, setConfirmarEliminar] = useState(false);
  const { mutate: eliminar, isPending: eliminando } = useEliminarExpediente(idSesion);

  const handleEliminar = () => eliminar(exp.id);
  const handleVerClick = () => onVer(exp);

  return (
    <>
      <li className={`flex items-start gap-4 px-5 py-4 transition-colors ${previewing ? 'bg-muted/50' : ''}`}>
        <div className="shrink-0 w-9 h-9 rounded-lg bg-muted flex items-center justify-center mt-0.5">
          <FileText className="h-4 w-4 text-muted-foreground" />
        </div>
        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold text-foreground">{exp.tipo}</span>
            <Badge variant="secondary" appearance="light" size="sm">
              {exp.no_doc}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground leading-snug">{exp.descripcion}</p>
          {exp.fecha && (
            <p className="text-xs font-medium text-foreground inline-flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
              {formatFecha(exp.fecha)}
            </p>
          )}
        </div>
        <div className="shrink-0 flex items-center gap-1">
          {/* Visualizar */}
          <button
            type="button"
            disabled={!exp.uuid_blob}
            onClick={handleVerClick}
            title="Previsualizar documento"
            className={`inline-flex items-center justify-center h-8 w-8 rounded-md border transition-colors disabled:opacity-30 disabled:cursor-not-allowed ${
              previewing
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-border hover:bg-muted'
            }`}
          >
            <Eye className="h-4 w-4" />
          </button>
          {/* Eliminar */}
          {!readonly && (
            <button
              type="button"
              disabled={eliminando}
              onClick={() => setConfirmarEliminar(true)}
              title="Eliminar documento"
              className="inline-flex items-center justify-center h-8 w-8 rounded-md border border-border hover:bg-destructive/10 hover:border-destructive/40 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              {eliminando ? (
                <Loader2 className="h-4 w-4 text-destructive animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4 text-destructive" />
              )}
            </button>
          )}
        </div>
      </li>

      <AlertDialog open={confirmarEliminar} onOpenChange={setConfirmarEliminar}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar este documento?</AlertDialogTitle>
            <AlertDialogDescription>
              Se eliminará <span className="font-semibold">{exp.no_doc}</span> de forma permanente.
              Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleEliminar}
            >
              Sí, eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

// ─── ExpedientesCard ──────────────────────────────────────────────────────────

interface ExpedientesCardProps {
  idSesion: string;
  readonly?: boolean;
}

export function ExpedientesCard({ idSesion, readonly = false }: ExpedientesCardProps) {
  const { data: expedientes = [], isLoading, isError } = useExpedientesSesion(idSesion);
  const { mutate: visualizar, isPending: visualizando } = useVerExpediente(idSesion);

  const [showDialog, setShowDialog] = useState(false);
  const [previewExp, setPreviewExp] = useState<IExpediente | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const handleOpenDialog = () => setShowDialog(true);

  const handleVer = (exp: IExpediente) => {
    if (!exp.uuid_blob) return;
    // Toggle off if same doc clicked again
    if (previewExp?.id === exp.id) {
      setPreviewExp(null);
      setPreviewUrl(null);
      return;
    }
    setPreviewExp(exp);
    setPreviewUrl(null);
    visualizar(
      { idExpediente: exp.id, uuid_blob: exp.uuid_blob },
      {
        onSuccess: (data) => {
          const azureUrl = typeof data === 'string' ? data : (data as { url: string } | null)?.url ?? null;
          const url = azureUrl ? `/api/pdf-proxy?url=${encodeURIComponent(azureUrl)}` : null;
          setPreviewUrl(url);
        },
        onError: () => {
          setPreviewExp(null);
          setPreviewUrl(null);
        },
      },
    );
  };

  const handleClosePreview = () => {
    setPreviewExp(null);
    setPreviewUrl(null);
  };

  const hasPreview = previewExp !== null;

  return (
    <>
      <Card className="overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
              <CardTitle>Expedientes</CardTitle>
              {expedientes.length > 0 && (
                <Badge variant="secondary" appearance="light" size="sm">
                  {expedientes.length}{' '}
                  {expedientes.length === 1 ? 'documento' : 'documentos'}
                </Badge>
              )}
          </div>
          {!readonly && (
              <Button size="sm" onClick={handleOpenDialog}>
                <Plus className="h-4 w-4" />
                Subir documento
              </Button>
            )}
        </CardHeader>

        <CardContent className="p-0">
          {/* ── Split layout ─────────────────────────────────────────── */}
          <div className={`flex flex-col ${hasPreview ? 'lg:flex-row' : ''}`}>

            {/* ── Lista ──────────────────────────────────────────────── */}
            <div className={hasPreview ? 'lg:w-3/6 lg:border-r lg:border-border' : 'w-full'}>
              {isLoading ? (
                <div className="flex items-center justify-center py-14">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : isError ? (
                <div className="flex flex-col items-center justify-center py-14 text-center px-5">
                  <div className="w-14 h-14 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
                    <FileText className="h-7 w-7 text-destructive" />
                  </div>
                  <p className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-1">
                    Error al cargar expedientes
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    No se pudo obtener el listado. Intenta recargar la página.
                  </p>
                </div>
              ) : expedientes.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-14 text-center px-5">
                  <div className="w-14 h-14 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
                    <SearchX className="h-7 w-7 text-gray-400" />
                  </div>
                  <p className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-1">
                    Sin expedientes
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    No hay expedientes disponibles para esta sesión.
                  </p>
                </div>
              ) : (
                <ul className="divide-y divide-border">
                  {expedientes.map((exp) => (
                    <ExpedienteRow
                      key={exp.id}
                      exp={exp}
                      idSesion={idSesion}
                      readonly={readonly}
                      onVer={handleVer}
                      previewing={previewExp?.id === exp.id}
                    />
                  ))}
                </ul>
              )}
            </div>

            {/* ── Panel de vista previa ───────────────────────────────── */}
            {hasPreview && (
              <PdfPreviewPanel
                exp={previewExp}
                url={previewUrl}
                loading={visualizando}
                onClose={handleClosePreview}
              />
            )}

          </div>
        </CardContent>
      </Card>

      <SubirExpedienteDialog
        idSesion={idSesion}
        open={showDialog}
        onOpenChange={setShowDialog}
      />
    </>
  );
}
