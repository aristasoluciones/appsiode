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
import { CedulasAdminDashboard } from './cedulas-admin-dashboard';
import { CedulasConsejoContainer } from './cedulas-consejo-container';

/**
 * Cédulas de los mecanismos. El usuario de consejo informa y acusa las suyas;
 * el de oficina central sigue el avance por tipo de consejo y opera el ciclo
 * desde cada consejo.
 */
export function CedulasClient() {
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
            <ToolbarTitle>Cédulas</ToolbarTitle>
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
                      <span>Cédulas</span>
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
                    <BreadcrumbPage>Cédulas</BreadcrumbPage>
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
          <CedulasConsejoContainer
            tipoConsejo={user!.tipoConsejo as 'D' | 'M'}
            idConsejo={Number(user!.idConsejo)}
            nombreConsejo={consejoLabel}
          />
        ) : (
          <CedulasAdminDashboard />
        )}
      </Container>
    </Fragment>
  );
}
