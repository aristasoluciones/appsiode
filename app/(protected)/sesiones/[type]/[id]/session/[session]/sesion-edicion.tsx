'use client';

import { useEffect, useRef, useState } from 'react';
import { Check, Loader2, Pencil, Trash2, X, Plus } from 'lucide-react';
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
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { DateTimePicker } from '@/components/ui/datetime-picker';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { toastSuccess } from '@/lib/toast';
import type { ISesionDetalle, ISesionDetalleAPI } from '@/types/sesiones';
import { useCatalogosSesiones } from '@/app/(protected)/sesiones/components/nueva-sesion-data';
import {
    useActualizarSesion,
    useActualizarPOD,
    useAgregarPOD,
    useEliminarPOD,
    type IActualizarSesionPayload,
    type IEliminarPODPayload,
} from './session-detail-data';

// --- Constantes ---

const TIPOS_PUNTO = ['INFORME', 'CUENTA', 'APROBACION'] as const;

// --- Props ---

interface Props {
    session: ISesionDetalle;
    idSesion: string;
    canEditarOrdenDia: boolean;
    canEliminarOrdenDia: boolean;
}

// --- Helpers ---

function toDatetimeLocal(iso: string | null): string {
    if (!iso) return '';
    try {
        const d = new Date(iso);
        if (Number.isNaN(d.getTime())) return '';
        const pad = (n: number) => String(n).padStart(2, '0');
        return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    } catch {
        return '';
    }
}

// --- Componente principal ---

export function SesionEdicion({ session, idSesion, canEditarOrdenDia, canEliminarOrdenDia }: Props) {
const { data: catalogos, isLoading: loadingCatalogos } = useCatalogosSesiones();

// --- Datos generales ---
const [noSesion, setNoSesion] = useState(session.noSesion ?? '');
const [tipo, setTipo] = useState(session.tipo ?? '');
const [fechaProgramada, setFechaProgramada] = useState(toDatetimeLocal(session.fechaProgramada));
const [urlDoc, setUrlDoc] = useState(session.url ?? '');

const { mutate: actualizarSesion, isPending: guardandoSesion } = useActualizarSesion(idSesion);

const handleGuardarDatosGenerales = () => {
    const payload: IActualizarSesionPayload = {
        no_sesion: noSesion,
        tipo: tipo,
        fecha_hora: fechaProgramada ? fechaProgramada : undefined,
        url: urlDoc || '',
    };
        actualizarSesion(payload, {
            onSuccess: () => {
                toastSuccess('Datos generales guardados correctamente.');
            },
        });
};

const handleCancelarDatosGenerales = () => {
    setNoSesion(session.noSesion ?? '');
    setTipo(session.tipo ?? '');
    setFechaProgramada(toDatetimeLocal(session.fechaProgramada));
    setUrlDoc(session.url ?? '');
};

// --- POD ---
const [editingPunto, setEditingPunto] = useState<number | null>(null);
const [editDesc, setEditDesc] = useState('');
const [editTipo, setEditTipo] = useState('');

const { mutate: actualizarPOD, isPending: guardandoPOD } = useActualizarPOD(idSesion);
const { mutate: eliminarPOD, isPending: eliminandoPOD } = useEliminarPOD(idSesion);

const [deletingPunto, setDeletingPunto] = useState<IEliminarPODPayload | null>(null);

    // --- Nuevo POD ---
    const [newPuntoId, setNewPuntoId] = useState('');
    const [newTipo, setNewTipo] = useState('INFORME');
    const [newDesc, setNewDesc] = useState('');
    const [showNewPunto, setShowNewPunto] = useState(false);

    const { mutate: agregarPOD, isPending: agregandoPOD } = useAgregarPOD(idSesion);

const handleEditPunto = (point: ISesionDetalleAPI['pod'][number]) => {
    setEditingPunto(point.id_punto);
    setEditDesc(point.descripcion);
    setEditTipo(point.tipo);
};

const handleCancelarEdicion = () => {
    setEditingPunto(null);
    setEditDesc('');
    setEditTipo('');
};

const handleGuardarPunto = (point: ISesionDetalleAPI['pod'][number]) => {
    if (!editDesc.trim() || !editTipo) return;
    actualizarPOD(
        { id_punto: point.id_punto, id_subpunto: 0, tipo: editTipo, descripcion: editDesc },
        { onSuccess: () => handleCancelarEdicion() },
    );
};

const handleConfirmarEliminar = () => {
    if (!deletingPunto) return;
    eliminarPOD(deletingPunto, { onSuccess: () => setDeletingPunto(null) });
};

const isDuplicatePunto = (id: number) => session.pod.some((p) => p.id_punto === id);

const handleAgregarPunto = () => {
    const idp = Number(newPuntoId);
    if (!idp || !newTipo || !newDesc.trim()) return;
    if (isDuplicatePunto(idp)) return;
    agregarPOD({ id_punto: idp, id_subpunto: 0, tipo: newTipo, descripcion: newDesc }, { onSuccess: () => {
        setNewPuntoId('');
        setNewTipo('INFORME');
        setNewDesc('');
        setShowNewPunto(false);
    }});
};

// --- Render ---
return (
    <div className="flex flex-col gap-5">
        {/* Datos generales */}
        <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2 pb-4">
                <CardTitle>Datos Generales</CardTitle>
                {guardandoSesion && (
                    <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        Guardando...
                    </span>
                )}
            </CardHeader>
            <CardContent>
                {loadingCatalogos ? (
                    <div className="flex items-center gap-2 py-4">
                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">Cargando catálogos...</span>
                    </div>
                ) : (
                    <><div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                        {/* No. de Sesión */}
                        <div className="space-y-1.5">
                            <Label htmlFor="edit-no-sesion">
                                No. de Sesión <span className="text-red-600">*</span>
                            </Label>
                            <Select
                                indicatorVisibility={false}
                                value={noSesion}
                                onValueChange={(v) => setNoSesion(v)}
                            >
                                <SelectTrigger id="edit-no-sesion" className="w-full">
                                    <SelectValue placeholder="Selecciona..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {(catalogos?.num_sesiones ?? []).map((n) => (
                                        <SelectItem key={n.num} value={String(n.num)}>
                                            {n.num}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Tipo de Sesión */}
                        <div className="space-y-1.5">
                            <Label htmlFor="edit-tipo">
                                Tipo <span className="text-red-600">*</span>
                            </Label>
                            <Select
                                indicatorVisibility={false}
                                value={tipo}
                                onValueChange={(v) => setTipo(v)}
                            >
                                <SelectTrigger id="edit-tipo" className="w-full">
                                    <SelectValue placeholder="Selecciona..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {(catalogos?.tipos_sesiones ?? []).map((ts) => (
                                        <SelectItem key={ts.tipo} value={ts.tipo}>
                                            {ts.tipo}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Fecha y Hora Programada */}
                        <div className="space-y-1.5">
                            <Label htmlFor="edit-fecha-programada">
                                Fecha y Hora <span className="text-red-600">*</span>
                            </Label>
                            <DateTimePicker
                                value={fechaProgramada}
                                onChange={(v) => {
                                    setFechaProgramada(v);
                                }} />
                        </div>

                        {/* Link Documentos */}
                        <div className="space-y-1.5">
                            <Label htmlFor="edit-url">Link Documentos</Label>
                            <Input
                                id="edit-url"
                                type="url"
                                placeholder="https://..."
                                value={urlDoc}
                                onChange={(e) => setUrlDoc(e.target.value)} />
                        </div>
                    </div><div className="flex items-center justify-end gap-2 mt-4">
                            <Button variant="outline" size="sm" onClick={handleCancelarDatosGenerales} disabled={guardandoSesion}>
                                Cancelar
                            </Button>
                            <Button
                                size="sm"
                                onClick={handleGuardarDatosGenerales}
                                disabled={guardandoSesion || !noSesion.trim() || !tipo.trim() || !fechaProgramada.trim()}
                            >
                                {guardandoSesion ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                                Guardar
                            </Button>
                        </div>
                        </>
                )}
            </CardContent>
        </Card>

        {/* Puntos del Orden del Día */}
        <Card>
                <CardHeader className="flex items-center justify-between gap-2">
                    <CardTitle>Puntos del Orden del Día</CardTitle>
                    <div>
                        <Button
                            size="sm"
                            onClick={() => setShowNewPunto((s) => !s)}
                            className="inline-flex items-center gap-2 bg-pink-600 text-white hover:bg-pink-700 focus:ring-2 focus:ring-pink-300"
                        >
                            {showNewPunto ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />} Nuevo punto
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    {showNewPunto && (
                    <div className="px-5 py-4 border-b border-border">
                        <div className="grid grid-cols-1 gap-3">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div className="space-y-1.5">
                                    <Label htmlFor="new-id-punto">Número <span className="text-red-600">*</span></Label>
                                    <Input
                                        id="new-id-punto"
                                        type="number"
                                        min={1}
                                        step={1}
                                        value={newPuntoId}
                                        onChange={(e) => setNewPuntoId(e.target.value)}
                                        placeholder="Número"
                                    />
                                    {newPuntoId.trim() && Number(newPuntoId) <= 0 && (
                                        <p className="mt-1 text-sm text-red-600">El número debe ser mayor a 0.</p>
                                    )}
                                    {newPuntoId.trim() && isDuplicatePunto(Number(newPuntoId)) && (
                                        <p className="mt-1 text-sm text-red-600">El número ya existe en la lista.</p>
                                    )}
                                </div>
                                <div className="space-y-1.5">
                                    <Label htmlFor="new-tipo">Tipo <span className="text-red-600">*</span></Label>
                                    <Select indicatorVisibility={false} value={newTipo} onValueChange={setNewTipo}>
                                        <SelectTrigger id="new-tipo" className="w-full">
                                            <SelectValue placeholder="Tipo..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {TIPOS_PUNTO.map((t) => (
                                                <SelectItem key={t} value={t}>{t}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="new-desc">Descripción <span className="text-red-600">*</span></Label>
                                <textarea
                                    id="new-desc"
                                    value={newDesc}
                                    onChange={(e) => setNewDesc(e.target.value)}
                                    placeholder="Descripción breve"
                                    rows={2}
                                    className="block w-full min-h-[2.25rem] rounded-md border bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                                />
                            </div>

                        </div>
                        <div className="flex items-center justify-end gap-2 mt-3">
                            <Button size="sm" variant="outline" onClick={() => { setNewPuntoId(''); setNewTipo('INFORME'); setNewDesc(''); setShowNewPunto(false); }} disabled={agregandoPOD}>
                                Cancelar
                            </Button>
                            <Button size="sm" onClick={handleAgregarPunto} disabled={agregandoPOD || !newPuntoId.trim() || !newTipo || !newDesc.trim() || isDuplicatePunto(Number(newPuntoId)) || Number(newPuntoId) <= 0}>
                                {agregandoPOD ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />} Agregar punto
                            </Button>
                        </div>
                    </div>
                )}

                    {session.pod.length === 0 ? (
                    <p className="px-5 py-8 text-center text-sm text-muted-foreground">
                        No hay puntos registrados para esta sesión.
                    </p>
                ) : (
                    <ol className="divide-y divide-border">
                        {session.pod.map((point) => {
                            const isEditing = editingPunto === point.id_punto;
                            return (
                                <li
                                    key={`${point.id_punto}-${point.id_subpunto}`}
                                    className={`px-5 py-4 transition-colors${isEditing ? ' bg-muted/40' : ''}`}
                                >
                                    <div className="flex items-start gap-3">
                                        {/* Número */}
                                        <span className="shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-muted text-xs font-semibold text-muted-foreground mt-0.5">
                                            {point.id_punto}
                                        </span>

                                        {isEditing ? (
                                            /* Fila en modo edición */
                                            <div className="flex-1 min-w-0 flex flex-col gap-3">
                                                <div className="grid grid-cols-1 gap-3">
                                                    {/* Tipo del punto */}
                                                    <div className="space-y-1.5">
                                                        <Label htmlFor={`edit-tipo-punto-${point.id_punto}`}>
                                                            Tipo <span className="text-red-600">*</span>
                                                        </Label>
                                                        <Select
                                                            value={editTipo}
                                                            indicatorVisibility={false}
                                                            onValueChange={setEditTipo}
                                                        >
                                                            <SelectTrigger id={`edit-tipo-punto-${point.id_punto}`} className="w-full">
                                                                <SelectValue placeholder="Tipo..." />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                {TIPOS_PUNTO.map((t) => (
                                                                    <SelectItem key={t} value={t}>{t}</SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                    {/* Descripción */}
                                                    <div className="space-y-1.5">
                                                        <Label htmlFor={`edit-desc-punto-${point.id_punto}`}>
                                                            Descripción <span className="text-red-600">*</span>
                                                        </Label>
                                                        <textarea
                                                            id={`edit-desc-punto-${point.id_punto}`}
                                                            value={editDesc}
                                                            onChange={(e) => setEditDesc(e.target.value)}
                                                            placeholder="Descripción del punto..."
                                                            autoFocus
                                                            rows={3}
                                                            className="block w-full min-h-[2.5rem] rounded-md border bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                                                        />
                                                    </div>
                                                </div>
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <Button
                                                        size="sm"
                                                        disabled={guardandoPOD || !editDesc.trim() || !editTipo}
                                                        onClick={() => handleGuardarPunto(point)}
                                                    >
                                                        {guardandoPOD ? (
                                                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                                        ) : (
                                                            <Check className="h-3.5 w-3.5" />
                                                        )}
                                                        Guardar cambios
                                                    </Button>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        disabled={guardandoPOD}
                                                        onClick={handleCancelarEdicion}
                                                    >
                                                        <X className="h-3.5 w-3.5" />
                                                        Cancelar
                                                    </Button>
                                                </div>
                                            </div>
                                        ) : (
                                            /* Fila en modo lectura */
                                            <>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm text-foreground leading-relaxed text-justify">
                                                        {point.descripcion}
                                                    </p>
                                                    <span className="inline-block mt-1 text-xs text-muted-foreground font-medium">
                                                        {point.tipo}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-1 shrink-0 ml-2">
                                                    {canEditarOrdenDia && (
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-7 w-7 text-muted-foreground hover:text-foreground"
                                                            title="Editar punto"
                                                            onClick={() => handleEditPunto(point)}
                                                        >
                                                            <Pencil className="h-3.5 w-3.5" />
                                                            <span className="sr-only">Editar</span>
                                                        </Button>
                                                    )}
                                                    {canEliminarOrdenDia && (
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-7 w-7 text-muted-foreground hover:text-destructive"
                                                            title="Eliminar punto"
                                                            onClick={() =>
                                                                setDeletingPunto({
                                                                    id_punto: point.id_punto,
                                                                    id_subpunto: point.id_subpunto,
                                                                })
                                                            }
                                                        >
                                                            <Trash2 className="h-3.5 w-3.5" />
                                                            <span className="sr-only">Eliminar</span>
                                                        </Button>
                                                    )}
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </li>
                            );
                        })}
                    </ol>
                )}
            </CardContent>
        </Card>

        {/* Confirmación eliminar POD */}
        <AlertDialog
            open={!!deletingPunto}
            onOpenChange={(open) => {
                if (!open) setDeletingPunto(null);
            }}
        >
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>¿Eliminar este punto?</AlertDialogTitle>
                    <AlertDialogDescription>
                        Esta acción eliminará el punto del orden del día de forma permanente y{' '}
                        <span className="font-semibold text-destructive">no es reversible</span>.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel disabled={eliminandoPOD}>Cancelar</AlertDialogCancel>
                    <AlertDialogAction
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        disabled={eliminandoPOD}
                        onClick={handleConfirmarEliminar}
                    >
                        {eliminandoPOD && <Loader2 className="h-4 w-4 animate-spin" />}
                        Sí, eliminar
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    </div>
);
}
