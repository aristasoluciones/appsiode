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
import { useSeguimiento } from '../_hooks/use-mecanismos';
import { MecanismosConsejoContainer } from './mecanismos-consejo-container';

interface MecanismosConsejoClientProps {
  tipoConsejo: 'D' | 'M';
  idConsejo: number;
}

/**
 * Un consejo visto desde el tablero de oficina central: la misma lista que ve
 * el consejo, con las acciones de administración. El nombre sale del
 * seguimiento ya consultado.
 */
export function MecanismosConsejoClient({
  tipoConsejo,
  idConsejo,
}: MecanismosConsejoClientProps) {
  const { hasPermission } = useAuth();
  const { data: seguimiento } = useSeguimiento(
    tipoConsejo,
    hasPermission('mecanismos.seguimiento'),
  );

  const tipoLabel = tipoConsejo === 'D' ? 'Distrital' : 'Municipal';
  const tipoPlural = tipoConsejo === 'D' ? 'Distritales' : 'Municipales';
  const consejo = seguimiento?.find((c) => c.id_consejo === idConsejo);
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
                  <BreadcrumbLink asChild>
                    <Link href="/mecanismos">Mecanismos de Recolección</Link>
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
              <Link href="/mecanismos">
                <ArrowLeft className="h-4 w-4" />
                Volver
              </Link>
            </Button>
          </ToolbarActions>
        </Toolbar>
      </Container>

      <Container>
        <MecanismosConsejoContainer
          tipoConsejo={tipoConsejo}
          idConsejo={idConsejo}
          nombreConsejo={consejoLabel}
        />
      </Container>
    </>
  );
}
