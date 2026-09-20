'use client';

import { useEffect, useState } from 'react';
import { CircleAlert, History, ListChecks, Upload } from 'lucide-react';
import type {
  IMecanismoSeguimiento,
  TImportacionTipo,
} from '@/types/mecanismos';
import { useAuth } from '@/providers/auth-provider';
import { Alert, AlertIcon, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CaesCarga } from './caes-carga';
import { ImportacionesHistorial } from './importaciones-historial';

type TApartado = 'listado' | 'asignacion' | 'historial';

interface CaesAdminDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tipoConsejo: 'D' | 'M';
  consejos: IMecanismoSeguimiento[];
}

/**
 * CAE para oficina central: importar el listado (alta y actualización por
 * folio), asignar CAE a los mecanismos en bloque por Excel y el historial de
 * ambas cargas. Solo roles administrador.
 */
export function CaesAdminDialog({
  open,
  onOpenChange,
  tipoConsejo,
  consejos,
}: CaesAdminDialogProps) {
  const { hasPermission } = useAuth();
  const puedeImportar = hasPermission('mecanismos.importar');

  const [apartado, setApartado] = useState<TApartado>('listado');
  const [tipoHistorial, setTipoHistorial] = useState<TImportacionTipo>('CAES');
  const [ocupado, setOcupado] = useState(false);

  useEffect(() => {
    if (open) setApartado('listado');
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={(v) => !ocupado && onOpenChange(v)}>
      <DialogContent
        className="max-w-[95vw] sm:max-w-5xl"
        onEscapeKeyDown={(e) => ocupado && e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>
            CAE ·{' '}
            {tipoConsejo === 'D'
              ? 'consejos distritales'
              : 'consejos municipales'}
          </DialogTitle>
          <DialogDescription>
            El catálogo de CAE no se captura a mano: se importa el listado del
            sistema que los administra y, con el Excel de asignación, se indica
            qué CAE atiende cada mecanismo.
          </DialogDescription>
        </DialogHeader>

        <DialogBody className="flex flex-col gap-4 min-h-0">
          {!puedeImportar ? (
            <Alert variant="destructive" appearance="light" close={false}>
              <AlertIcon>
                <CircleAlert />
              </AlertIcon>
              <AlertTitle>
                Las cargas de CAE son solo para roles administrador.
              </AlertTitle>
            </Alert>
          ) : (
            <Tabs
              value={apartado}
              onValueChange={(v) => !ocupado && setApartado(v as TApartado)}
            >
              <TabsList>
                <TabsTrigger value="listado" disabled={ocupado}>
                  <Upload className="h-4 w-4" />
                  Listado de CAE
                </TabsTrigger>
                <TabsTrigger value="asignacion" disabled={ocupado}>
                  <ListChecks className="h-4 w-4" />
                  Asignación masiva
                </TabsTrigger>
                <TabsTrigger value="historial" disabled={ocupado}>
                  <History className="h-4 w-4" />
                  Historial
                </TabsTrigger>
              </TabsList>

              <TabsContent value="listado" className="mt-4">
                <CaesCarga
                  modo="listado"
                  tipoConsejo={tipoConsejo}
                  consejos={consejos}
                  onOcupado={setOcupado}
                />
              </TabsContent>
              <TabsContent value="asignacion" className="mt-4">
                <CaesCarga
                  modo="asignacion"
                  tipoConsejo={tipoConsejo}
                  consejos={consejos}
                  onOcupado={setOcupado}
                />
              </TabsContent>
              <TabsContent value="historial" className="mt-4 space-y-3">
                <Select
                  value={tipoHistorial}
                  onValueChange={(v) => setTipoHistorial(v as TImportacionTipo)}
                >
                  <SelectTrigger
                    className="w-full sm:w-64"
                    aria-label="Tipo de carga"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CAES">Listado de CAE</SelectItem>
                    <SelectItem value="CAES_ASIGNACION">
                      Asignación de CAE
                    </SelectItem>
                  </SelectContent>
                </Select>
                <ImportacionesHistorial
                  tipo={tipoHistorial}
                  activo={open && apartado === 'historial'}
                />
              </TabsContent>
            </Tabs>
          )}
        </DialogBody>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={ocupado}
          >
            Cerrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
