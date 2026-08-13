'use client';

import { useCallback, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
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
import { AperturasContainer } from './apertura-container';
import type { IAperturasListaMeta } from '@/types/aperturas-bodegas';

interface AperturasConsejoClientProps {
  tipoConsejo: 'D' | 'M';
  idConsejo: number;
}

export function AperturasConsejoClient({
  tipoConsejo,
  idConsejo,
}: AperturasConsejoClientProps) {
  // El listado trae los datos del consejo en su `meta`; se reciben desde el
  // contenedor para pintar el breadcrumb sin repetir la consulta.
  const [meta, setMeta] = useState<IAperturasListaMeta | null>(null);
  const handleMetaChange = useCallback(
    (m: IAperturasListaMeta | null) => setMeta(m),
    [],
  );

  const tipoLabel = tipoConsejo === 'D' ? 'Distrital' : 'Municipal';
  const tipoPlural = tipoConsejo === 'D' ? 'Distritales' : 'Municipales';
  const consejoLabel = meta?.consejo
    ? `${meta.consejo.clave_consejo}. ${meta.consejo.consejo}`
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
                  <span>Bodegas Electorales</span>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbLink asChild>
                    <Link href="/aperturas">Aperturas</Link>
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
              <Link href="/aperturas">
                <ArrowLeft className="h-4 w-4" />
                Volver
              </Link>
            </Button>
          </ToolbarActions>
        </Toolbar>
      </Container>

      <Container>
        <AperturasContainer
          tipoConsejo={tipoConsejo}
          idConsejo={idConsejo}
          onMetaChange={handleMetaChange}
        />
      </Container>
    </>
  );
}
