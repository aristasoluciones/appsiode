'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { useAuth } from '@/providers/auth-provider';
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
import { useCedulasResumen } from '../_hooks/use-cedulas';
import { CedulasConsejoContainer } from './cedulas-consejo-container';

interface CedulasConsejoClientProps {
  tipoConsejo: 'D' | 'M';
  idConsejo: number;
}

/**
 * Las cédulas de un consejo vistas desde el tablero de oficina central, con el
 * ciclo completo (proponer, aprobar, cerrar, anular). El nombre sale del resumen
 * ya consultado.
 */
export function CedulasConsejoClient({
  tipoConsejo,
  idConsejo,
}: CedulasConsejoClientProps) {
  const { hasPermission } = useAuth();
  const { data: resumen } = useCedulasResumen(
    tipoConsejo,
    hasPermission('mecanismos.cedulas.bandeja'),
  );

  const tipoLabel = tipoConsejo === 'D' ? 'Distrital' : 'Municipal';
  const tipoPlural = tipoConsejo === 'D' ? 'Distritales' : 'Municipales';
  const consejo = resumen?.find((c) => c.id_consejo === idConsejo);
  const consejoLabel = consejo
    ? `${consejo.id_consejo}. ${consejo.consejo}`
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
                  <BreadcrumbLink href="/mecanismos">
                    Mecanismos de Recolección
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbLink asChild>
                    <Link href="/mecanismos/cedulas">Cédulas</Link>
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
            <Button variant="secondary" asChild>
              <Link href="/mecanismos/cedulas">
                <ArrowLeft className="h-4 w-4" />
                Volver
              </Link>
            </Button>
          </ToolbarActions>
        </Toolbar>
      </Container>

      <Container>
        <CedulasConsejoContainer
          tipoConsejo={tipoConsejo}
          idConsejo={idConsejo}
          nombreConsejo={consejoLabel}
        />
      </Container>
    </>
  );
}
