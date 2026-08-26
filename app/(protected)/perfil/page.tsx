import { Metadata } from 'next';
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
import { PerfilInfo } from './_components/perfil-info';
import { MfaSeccion } from './_components/mfa-seccion';
import { SesionesSeccion } from './_components/sesiones-seccion';
import { DispositivosSeccion } from './_components/dispositivos-seccion';
import { HistorialSeccion } from './_components/historial-seccion';

export const metadata: Metadata = {
  title: 'Mi perfil',
  description:
    'Datos de la cuenta, autenticación en dos pasos y seguridad de la sesión.',
};

export default async function PerfilPage() {
  return (
    <>
      <Container>
        <Toolbar>
          <ToolbarHeading>
            <ToolbarTitle>Mi perfil</ToolbarTitle>
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink href="/">Inicio</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>Mi perfil</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </ToolbarHeading>
          <ToolbarActions />
        </Toolbar>
      </Container>

      <Container>
        <div className="grid gap-5 lg:grid-cols-2 items-start">
          <PerfilInfo />
          <MfaSeccion />
          <SesionesSeccion />
          <DispositivosSeccion />
          <div className="lg:col-span-2">
            <HistorialSeccion />
          </div>
        </div>
      </Container>
    </>
  );
}
