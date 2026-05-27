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
import { BodegaDetalleClient } from './components/bodega-detalle-client';

interface BodegaDetallePageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({
  params,
}: BodegaDetallePageProps): Promise<Metadata> {
  const { id } = await params;
  return {
    title: `Bodega #${id} | Bodegas Electorales | SIODE`,
  };
}

export default async function BodegaDetallePage({ params }: BodegaDetallePageProps) {
  const { id } = await params;

  return (
    <>
      <Container>
        <Toolbar>
          <ToolbarHeading>
            <ToolbarTitle>Detalle de Bodega</ToolbarTitle>
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink href="/">Inicio</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbLink href="/bodegas">Bodegas Electorales</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>Bodega #{id}</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </ToolbarHeading>
          <ToolbarActions />
        </Toolbar>
      </Container>

      <Container>
        <BodegaDetalleClient id={id} />
      </Container>
    </>
  );
}
