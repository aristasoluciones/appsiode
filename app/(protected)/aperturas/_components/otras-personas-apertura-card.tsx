'use client';

import { useState } from 'react';
import { Pencil, Plus, Trash2, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type {
  ICatalogoProcedencia,
  IOtraPersona,
} from '@/types/aperturas-bodegas';

const NONE = '__none__';

export interface OtrasPersonasAperturaCardProps {
  items: IOtraPersona[];
  onChange: (items: IOtraPersona[]) => void;
  readOnly: boolean;
  procedencias: ICatalogoProcedencia[];
}

interface DialogState {
  open: boolean;
  uid: string | null;
  cargo: string;
  nombre: string;
  id_procedencia: number;
}

const EMPTY_DIALOG: DialogState = {
  open: false,
  uid: null,
  cargo: '',
  nombre: '',
  id_procedencia: 0,
};

function uniqueUid() {
  return `tmp-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
}

export function OtrasPersonasAperturaCard({
  items,
  onChange,
  readOnly,
  procedencias,
}: OtrasPersonasAperturaCardProps) {
  const [dlg, setDlg] = useState<DialogState>(EMPTY_DIALOG);

  function openAdd() {
    setDlg({ ...EMPTY_DIALOG, open: true });
  }

  function openEdit(idx: number) {
    const it = items[idx];
    setDlg({
      open: true,
      uid: it.uid,
      cargo: it.cargo,
      nombre: it.nombre,
      id_procedencia: it.id_procedencia,
    });
  }

  function closeDlg() {
    setDlg(EMPTY_DIALOG);
  }

  function saveDlg() {
    if (dlg.cargo.trim() === '' || dlg.nombre.trim() === '' || !dlg.id_procedencia) {
      return;
    }
    if (dlg.uid === null) {
      const nuevo: IOtraPersona = {
        uid: uniqueUid(),
        cargo: dlg.cargo.trim(),
        nombre: dlg.nombre.trim(),
        id_procedencia: dlg.id_procedencia,
      };
      onChange([...items, nuevo]);
    } else {
      onChange(
        items.map((it) =>
          it.uid === dlg.uid
            ? {
                ...it,
                cargo: dlg.cargo.trim(),
                nombre: dlg.nombre.trim(),
                id_procedencia: dlg.id_procedencia,
              }
            : it,
        ),
      );
    }
    closeDlg();
  }

  function removeItem(idx: number) {
    onChange(items.filter((_, i) => i !== idx));
  }

  const isEdit = dlg.uid !== null;
  const canSaveDlg =
    dlg.cargo.trim() !== '' && dlg.nombre.trim() !== '' && dlg.id_procedencia > 0;

  const procedenciaLabel = (id: number) =>
    procedencias.find((p) => p.id === id)?.procedencia ?? '—';

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2">
        <CardTitle>Otras Personas</CardTitle>
        {!readOnly && (
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={openAdd}
            className="gap-1.5"
          >
            <Plus className="h-4 w-4" />
            Agregar otra persona
          </Button>
        )}
      </CardHeader>
      <CardContent className="p-0">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center px-5">
            <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-3">
              <Users className="h-6 w-6 text-gray-400" />
            </div>
            <p className="text-sm text-muted-foreground">
              No hay otras personas registradas.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {items.map((it, idx) => (
              <li
                key={it.uid}
                className="flex items-start gap-3 px-5 py-3"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground leading-tight">
                    {it.nombre}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {it.cargo} · {procedenciaLabel(it.id_procedencia)}
                  </p>
                </div>
                {!readOnly && (
                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => openEdit(idx)}
                      aria-label={`Editar persona ${idx + 1}`}
                      className="h-8 w-8 text-muted-foreground hover:text-primary"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeItem(idx)}
                      aria-label={`Eliminar persona ${idx + 1}`}
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </CardContent>

      <Dialog open={dlg.open} onOpenChange={(o) => !o && closeDlg()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {isEdit ? 'Editar persona' : 'Agregar otra persona'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label htmlFor="op-procedencia">
                Procedencia <span className="text-destructive">*</span>
              </Label>
              <Select
                value={
                  dlg.id_procedencia > 0 ? String(dlg.id_procedencia) : NONE
                }
                onValueChange={(v) => {
                  if (v === NONE) return;
                  setDlg((p) => ({ ...p, id_procedencia: parseInt(v, 10) }));
                }}
                indicatorVisibility={false}
                
              >
                <SelectTrigger id="op-procedencia" className="mt-1.5">
                  <SelectValue placeholder="Selecciona..." />
                </SelectTrigger>
                <SelectContent>
                  {procedencias.map((p) => (
                    <SelectItem key={p.id} value={String(p.id)}>
                      {p.procedencia}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="op-cargo">
                Cargo <span className="text-destructive">*</span>
              </Label>
              <Input
                id="op-cargo"
                className="mt-1.5"
                value={dlg.cargo}
                onChange={(e) =>
                  setDlg((p) => ({ ...p, cargo: e.target.value }))
                }
                placeholder="Cargo"
              />
            </div>

            <div>
              <Label htmlFor="op-nombre">
                Nombre <span className="text-destructive">*</span>
              </Label>
              <Input
                id="op-nombre"
                className="mt-1.5"
                value={dlg.nombre}
                onChange={(e) =>
                  setDlg((p) => ({ ...p, nombre: e.target.value }))
                }
                placeholder="Nombre completo"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={closeDlg}>
              Cancelar
            </Button>
            <Button type="button" onClick={saveDlg} disabled={!canSaveDlg}>
              {isEdit ? 'Actualizar' : 'Agregar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}