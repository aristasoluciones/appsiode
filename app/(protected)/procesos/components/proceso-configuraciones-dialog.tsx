'use client';

import { useMemo, useState, type ComponentType } from 'react';
import { FileText, Info, ShieldOff } from 'lucide-react';
import type { IProceso } from '@/types/proceso';
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
import { ActaConfiguracionSeccion } from '@/app/(protected)/documentacion-material/_components/acta-configuracion-seccion';
import { etiquetaModo, etiquetaTipo } from './procesos-data';

/** Lo mínimo del proceso que necesita el modal; lo cumplen el catálogo y el proceso activo. */
export type TProcesoConfigurable = Pick<
  IProceso,
  'id' | 'tipo' | 'anio' | 'modo'
>;

/** Sección configurable dentro de un módulo. */
interface ISeccionConfiguracion {
  clave: string;
  titulo: string;
  descripcion: string;
  Componente: ComponentType;
}

/** Apartado por módulo; se muestra solo con el permiso del módulo. */
interface IModuloConfiguracion {
  clave: string;
  titulo: string;
  permiso: string;
  icono: typeof FileText;
  secciones: ISeccionConfiguracion[];
}

/**
 * Apartados del modal, uno por módulo. Para colgar la configuración de otro
 * módulo basta con agregar aquí su entrada con sus secciones y su permiso.
 */
const MODULOS: IModuloConfiguracion[] = [
  {
    clave: 'documentacion',
    titulo: 'Documentación y Material',
    permiso: 'documentacionymaterial.actacircunstanciada.configuracion',
    icono: FileText,
    secciones: [
      {
        clave: 'acta',
        titulo: 'Acta circunstanciada',
        descripcion:
          'Plantilla Word con sus marcadores y apartados de fotografías que usan los consejos al generar el acta.',
        Componente: ActaConfiguracionSeccion,
      },
    ],
  },
];

/** Permisos que dan acceso a alguna configuración; con cualquiera se muestra la acción. */
export const PERMISOS_CONFIGURACION = MODULOS.map((m) => m.permiso);

interface ProcesoConfiguracionesDialogProps {
  proceso: TProcesoConfigurable | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Configuraciones de un proceso: un apartado por módulo y, dentro, una sección
 * por cosa configurable. La API administra la configuración del proceso activo
 * de la sesión; para cualquier otro proceso el modal lo avisa y no muestra
 * las secciones.
 */
export function ProcesoConfiguracionesDialog({
  proceso,
  open,
  onOpenChange,
}: ProcesoConfiguracionesDialogProps) {
  const { user, hasPermission } = useAuth();

  const modulosVisibles = useMemo(
    () => MODULOS.filter((m) => hasPermission(m.permiso)),
    [hasPermission],
  );
  const [moduloActivo, setModuloActivo] = useState<string | undefined>();
  const moduloValor = moduloActivo ?? modulosVisibles[0]?.clave;

  if (!proceso) return null;

  const esProcesoActivo = String(proceso.id) === String(user?.idProceso ?? '');
  const nombreProceso = `${etiquetaTipo(proceso.tipo)} ${proceso.anio} · ${etiquetaModo(proceso.modo)}`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[95vh]">
        <DialogHeader className="pr-8">
          <DialogTitle>Configuraciones del proceso</DialogTitle>
          <DialogDescription>{nombreProceso}</DialogDescription>
        </DialogHeader>

        {/* Encabezado, pestañas y pie quedan fijos: solo el contenido de la pestaña hace scroll. */}
        <DialogBody className="flex flex-col min-h-0">
          {!esProcesoActivo ? (
            <Alert variant="info" icon="info" appearance="light">
              <AlertIcon>
                <Info />
              </AlertIcon>
              <AlertTitle>
                Las configuraciones se administran sobre el proceso activo de tu
                sesión. Este proceso no es el activo, así que no se pueden
                consultar ni cambiar desde aquí.
              </AlertTitle>
            </Alert>
          ) : modulosVisibles.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <ShieldOff className="h-8 w-8 text-muted-foreground mb-3" />
              <p className="text-sm text-muted-foreground">
                Tu cuenta no tiene permiso para configurar ningún módulo.
              </p>
            </div>
          ) : (
            <Tabs
              value={moduloValor}
              onValueChange={setModuloActivo}
              className="flex flex-col min-h-0"
            >
              <TabsList
                variant="line"
                className="w-full justify-start shrink-0"
              >
                {modulosVisibles.map((m) => {
                  const Icono = m.icono;
                  return (
                    <TabsTrigger key={m.clave} value={m.clave}>
                      <Icono className="h-4 w-4" aria-hidden="true" />
                      {m.titulo}
                    </TabsTrigger>
                  );
                })}
              </TabsList>
              {modulosVisibles.map((m) => (
                <TabsContent
                  key={m.clave}
                  value={m.clave}
                  className="min-h-0 overflow-y-auto pt-4 pr-1"
                >
                  <div className="space-y-6">
                    {m.secciones.map((s) => (
                      <section key={s.clave} className="space-y-3">
                        <div>
                          <h2 className="text-base font-semibold text-foreground">
                            {s.titulo}
                          </h2>
                          <p className="text-sm text-muted-foreground">
                            {s.descripcion}
                          </p>
                        </div>
                        <s.Componente />
                      </section>
                    ))}
                  </div>
                </TabsContent>
              ))}
            </Tabs>
          )}
        </DialogBody>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cerrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
