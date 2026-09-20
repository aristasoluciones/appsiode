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
import { MecanismosAdminDashboard } from './mecanismos-admin-dashboard';
import { MecanismosConsejoContainer } from './mecanismos-consejo-container';

/**
 * Mecanismos de recolección. Misma bifurcación que actas: el usuario de consejo
 * ve e informa los mecanismos que le tocan; el de oficina central administra el
 * catálogo y sigue el avance por tipo de consejo.
 */
export function MecanismosClient() {
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
            <ToolbarTitle>Mecanismos de Recolección</ToolbarTitle>
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink href="/">Inicio</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                {tieneConsejo ? (
                  <>
                    <BreadcrumbItem>
                      <span>Mecanismos de Recolección</span>
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
                    <BreadcrumbPage>Mecanismos de Recolección</BreadcrumbPage>
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
          <MecanismosConsejoContainer
            tipoConsejo={user!.tipoConsejo as 'D' | 'M'}
            idConsejo={Number(user!.idConsejo)}
            nombreConsejo={consejoLabel}
          />
        ) : (
          <MecanismosAdminDashboard />
        )}
      </Container>
    </Fragment>
  );
}
