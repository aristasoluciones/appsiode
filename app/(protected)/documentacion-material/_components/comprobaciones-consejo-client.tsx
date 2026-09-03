'use client';

import Link from 'next/link';
import { ArrowLeft, FileSpreadsheet } from 'lucide-react';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';
import { Container } from '@/components/common/container';
import {
  Toolbar,
  ToolbarActions,
  ToolbarHeading,
} from '@/components/common/toolbar';
import { useAuth } from '@/providers/auth-provider';
import {
  useAvanceComprobaciones,
  useDescargarReporteComprobaciones,
} from '../_hooks/use-avance-comprobaciones';
import { ComprobacionesContainer } from './comprobaciones-container';

interface ComprobacionesConsejoClientProps {
  tipoConsejo: 'D' | 'M';
  idConsejo: number;
}

/**
 * Detalle de un consejo visto desde el tablero de oficina central: las mismas
 * pantallas del consejo, en solo lectura. El nombre del consejo se toma del
 * avance ya consultado por el tablero, sin pedirlo otra vez.
 */
export function ComprobacionesConsejoClient({
  tipoConsejo,
  idConsejo,
}: ComprobacionesConsejoClientProps) {
  const { hasPermission } = useAuth();

  const puedeVerAvance = hasPermission(
    'documentacionymaterial.comprobaciones.resumen',
  );
  const puedeExportar = hasPermission(
    'documentacionymaterial.comprobaciones.exportar',
  );

  const { data: avance } = useAvanceComprobaciones(
    tipoConsejo,
    undefined,
    puedeVerAvance,
  );
  const descargarReporte = useDescargarReporteComprobaciones();

  const tipoLabel = tipoConsejo === 'D' ? 'Distrital' : 'Municipal';
  const tipoPlural = tipoConsejo === 'D' ? 'Distritales' : 'Municipales';

  const consejo = avance?.consejos.find(
    (c) => c.id_consejo === idConsejo && c.tipo_consejo === tipoConsejo,
  );
  const consejoLabel = consejo
    ? `${consejo.id_consejo}. ${consejo.nombre_consejo}`
    : `${idConsejo}. ${tipoLabel}`;

  return (
    <>
      <Container>
        <Toolbar>
          <ToolbarHeading>
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink href="/">Inicio</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <span>Documentación y Material</span>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbLink asChild>
                    <Link href="/documentacion-material/comprobaciones">
                      Comprobación Física
                    </Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <span>{tipoPlural}</span>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>{consejoLabel}</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </ToolbarHeading>
          <ToolbarActions>
            {puedeExportar && (
              <Button
                variant="outline"
                disabled={descargarReporte.isPending}
                onClick={() =>
                  descargarReporte.mutate({
                    reporte: 'consejo',
                    tipoConsejo,
                    idConsejo,
                  })
                }
              >
                <FileSpreadsheet className="h-4 w-4" />
                Reporte del consejo
              </Button>
            )}
            <Button variant="secondary" asChild>
              <Link href="/documentacion-material/comprobaciones">
                <ArrowLeft className="h-4 w-4" />
                Volver
              </Link>
            </Button>
          </ToolbarActions>
        </Toolbar>
      </Container>

      <Container>
        <ComprobacionesContainer
          tipoConsejo={tipoConsejo}
          idConsejo={idConsejo}
        />
      </Container>
    </>
  );
}
