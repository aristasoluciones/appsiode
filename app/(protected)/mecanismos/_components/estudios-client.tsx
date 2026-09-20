'use client';

import { Fragment } from 'react';
import { useAuth } from '@/providers/auth-provider';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Container } from '@/components/common/container';
import {
  Toolbar,
  ToolbarActions,
  ToolbarHeading,
  ToolbarTitle,
} from '@/components/common/toolbar';
import { EstudiosAdminDashboard } from './estudios-admin-dashboard';
import { EstudiosConsejoContainer } from './estudios-consejo-container';

/**
 * Estudios de factibilidad. El consejo ve el de su distrito federal y acusa
 * cada etapa; oficina central sigue el avance de los 13 distritos y opera el
 * ciclo desde el tablero.
 */
export function EstudiosClient() {
  const { user } = useAuth();

  const tieneConsejo =
    (user?.tipoConsejo === 'D' || user?.tipoConsejo === 'M') &&
    Number(user?.idConsejo) > 0;

  const tipoPlural = user?.tipoConsejo === 'D' ? 'Distritales' : 'Municipales';
  const consejoLabel =
    `${Number(user?.idConsejo) || user?.idConsejo}. ${user?.consejo ?? ''}`.trim();

  return (
    <Fragment>
      <Container>
        <Toolbar>
          <ToolbarHeading>
            <ToolbarTitle>Estudios de Factibilidad</ToolbarTitle>
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
                {tieneConsejo ? (
                  <>
                    <BreadcrumbItem>
                      <span>Estudios de Factibilidad</span>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                      <span>{tipoPlural}</span>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                      <BreadcrumbPage>{consejoLabel}</BreadcrumbPage>
                    </BreadcrumbItem>
                  </>
                ) : (
                  <BreadcrumbItem>
                    <BreadcrumbPage>Estudios de Factibilidad</BreadcrumbPage>
                  </BreadcrumbItem>
                )}
              </BreadcrumbList>
            </Breadcrumb>
          </ToolbarHeading>
          <ToolbarActions />
        </Toolbar>
      </Container>

      <Container>
        {tieneConsejo ? (
          <EstudiosConsejoContainer
            tipoConsejo={user!.tipoConsejo as 'D' | 'M'}
            idConsejo={Number(user!.idConsejo)}
          />
        ) : (
          <EstudiosAdminDashboard />
        )}
      </Container>
    </Fragment>
  );
}
