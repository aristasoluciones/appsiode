'use client';

import { LoaderCircleIcon } from 'lucide-react';
import type { IMecanismo } from '@/types/mecanismos';
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
import { useCambiarEstatusMecanismo } from '../_hooks/use-mecanismos';
import { claveMecanismo } from '../_lib/estatus';

interface EstatusMecanismoDialogProps {
  mecanismo: IMecanismo | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/** Confirmación de la baja lógica o la reactivación del mecanismo. */
export function EstatusMecanismoDialog({
  mecanismo,
  open,
  onOpenChange,
}: EstatusMecanismoDialogProps) {
  const cambiar = useCambiarEstatusMecanismo();
  const activo = mecanismo?.activo ?? false;

  return (
    <AlertDialog
      open={open}
      onOpenChange={(v) => !v && !cambiar.isPending && onOpenChange(v)}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {activo ? 'Dar de baja' : 'Reactivar'}{' '}
            {mecanismo ? claveMecanismo(mecanismo) : ''}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {activo
              ? 'El mecanismo deja de aparecer para los consejos y en los reportes; sus datos se conservan y se puede reactivar.'
              : 'El mecanismo vuelve a aparecer para los consejos y en los reportes.'}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={cambiar.isPending}>
            Cancelar
          </AlertDialogCancel>
          <AlertDialogAction
            disabled={cambiar.isPending || !mecanismo}
            onClick={(e) => {
              e.preventDefault();
              if (!mecanismo) return;
              cambiar.mutate(
                { id: mecanismo.id, payload: { activo: !activo } },
                { onSuccess: () => onOpenChange(false) },
              );
            }}
          >
            {cambiar.isPending && (
              <LoaderCircleIcon
                className="h-4 w-4 animate-spin"
                aria-hidden="true"
              />
            )}
            Confirmar
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
