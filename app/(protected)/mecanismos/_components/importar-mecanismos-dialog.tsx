'use client';

import { useState } from 'react';
import { useIsMutating } from '@tanstack/react-query';
import {
  CircleAlert,
  FileArchive,
  FileSpreadsheet,
  History,
} from 'lucide-react';
import type { TImportacionTipo } from '@/types/mecanismos';
import { MECANISMOS_KEYS } from '@/lib/query-keys';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ChipFiltro } from '@/components/common/chip-filtro';
import { ImportacionesHistorial } from './importaciones-historial';
import { ImportarCedulasTab } from './importar-cedulas-tab';
import { ImportarFormatoTab } from './importar-formato-tab';

type TApartado = 'formato' | 'cedulas' | 'historial';

/** Solo estos dos tipos se cargan desde esta ventana; los de CAE tienen la suya. */
const TIPOS_HISTORIAL: { tipo: TImportacionTipo; texto: string }[] = [
  { tipo: 'MECANISMOS', texto: 'Formato de importación' },
  { tipo: 'CEDULAS', texto: 'Cédulas por zip' },
];

/**
 * Cargas masivas de oficina central en una sola ventana: el formato de
 * importación (mecanismos y casillas), las cédulas por zip y el historial de
 * ambas con la reversión del formato más reciente. Solo roles administrador.
 */
export function ImportarMecanismosDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { hasPermission } = useAuth();
  const puedeImportar = hasPermission('mecanismos.importar');

  const [apartado, setApartado] = useState<TApartado>('formato');
  const [tipoHistorial, setTipoHistorial] =
    useState<TImportacionTipo>('MECANISMOS');
  // Con una revisión o una carga en curso la ventana no se cierra ni cambia de pestaña.
  const ocupado =
    useIsMutating({ mutationKey: MECANISMOS_KEYS.importacionesEnCurso() }) > 0;

  return (
    <Dialog open={open} onOpenChange={(v) => !ocupado && onOpenChange(v)}>
      <DialogContent
        className="max-w-[95vw] sm:max-w-5xl"
        onEscapeKeyDown={(e) => ocupado && e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>Cargas masivas</DialogTitle>
          <DialogDescription>
            Formato de importación con los mecanismos y sus casillas (se arma a
            partir de las cédulas del INE), y zip con los PDF de cédula
            emparejados por número de mecanismo.
          </DialogDescription>
        </DialogHeader>

        <DialogBody className="flex flex-col gap-4 min-h-0">
          {!puedeImportar ? (
            <Alert variant="destructive" appearance="light" close={false}>
              <AlertIcon>
                <CircleAlert />
              </AlertIcon>
              <AlertTitle>
                La importación masiva es solo para roles administrador.
              </AlertTitle>
            </Alert>
          ) : (
            <Tabs
              value={apartado}
              onValueChange={(v) => !ocupado && setApartado(v as TApartado)}
            >
              <TabsList>
                <TabsTrigger value="formato" disabled={ocupado}>
                  <FileSpreadsheet className="h-4 w-4" />
                  Formato de importación
                </TabsTrigger>
                <TabsTrigger value="cedulas" disabled={ocupado}>
                  <FileArchive className="h-4 w-4" />
                  Cédulas
                </TabsTrigger>
                <TabsTrigger value="historial" disabled={ocupado}>
                  <History className="h-4 w-4" />
                  Historial de cargas
                </TabsTrigger>
              </TabsList>

              <TabsContent value="formato" className="mt-4">
                <ImportarFormatoTab activo={open && apartado === 'formato'} />
              </TabsContent>

              <TabsContent value="cedulas" className="mt-4">
                <ImportarCedulasTab />
              </TabsContent>

              <TabsContent value="historial" className="mt-4 space-y-3">
                <div
                  className="flex flex-wrap gap-1.5"
                  role="group"
                  aria-label="Tipo de carga"
                >
                  {TIPOS_HISTORIAL.map((t) => (
                    <ChipFiltro
                      key={t.tipo}
                      activo={tipoHistorial === t.tipo}
                      onClick={() => setTipoHistorial(t.tipo)}
                    >
                      {t.texto}
                    </ChipFiltro>
                  ))}
                </div>
                <ImportacionesHistorial
                  tipo={tipoHistorial}
                  activo={open && apartado === 'historial'}
                  puedeRevertir={tipoHistorial === 'MECANISMOS'}
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
