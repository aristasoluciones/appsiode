import { Fragment } from 'react';
import { Construction } from 'lucide-react';
import { Container } from '@/components/common/container';
import {
  Toolbar,
  ToolbarActions,
  ToolbarHeading,
  ToolbarTitle,
} from '@/components/common/toolbar';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

export interface ModuloEnDesarrolloProps {
  /** Nombre del módulo — se muestra en el encabezado y cierra la ruta de navegación. */
  titulo: string;
  /** Secciones previas de la ruta de navegación, sin contar «Inicio» ni el propio módulo. */
  seccion?: string;
  /** Texto opcional que sustituye la descripción por defecto. */
  descripcion?: string;
}

export function ModuloEnDesarrollo({
  titulo,
  seccion,
  descripcion,
}: ModuloEnDesarrolloProps) {
  return (
    <Fragment>
      <Container>
        <Toolbar>
          <ToolbarHeading>
            <ToolbarTitle>{titulo}</ToolbarTitle>
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink href="/">Inicio</BreadcrumbLink>
                </BreadcrumbItem>
                {seccion && (
                  <Fragment>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>{seccion}</BreadcrumbItem>
                  </Fragment>
                )}
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>{titulo}</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </ToolbarHeading>
          <ToolbarActions />
        </Toolbar>
      </Container>

      <Container>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="flex flex-col items-center gap-5 text-center max-w-sm">
            <div className="flex items-center justify-center size-16 rounded-full bg-warning/10 border border-warning/20">
              <Construction className="size-7 text-warning" />
            </div>

            <div className="space-y-1">
              <Badge
                variant="outline"
                className="text-warning border-warning/40 mb-2"
              >
                En desarrollo
              </Badge>
              <h2 className="text-xl font-semibold text-foreground">
                Módulo en desarrollo
              </h2>
            </div>

            <Separator className="w-12" />

            <p className="text-sm text-muted-foreground leading-relaxed">
              {descripcion ?? (
                <>
                  Este módulo estará disponible{' '}
                  <span className="font-medium text-foreground">
                    próximamente
                  </span>
                  . Estamos trabajando para ofrecerte la mejor experiencia
                  posible.
                </>
              )}
            </p>
          </div>
        </div>
      </Container>
    </Fragment>
  );
}
