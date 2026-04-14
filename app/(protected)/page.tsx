import { Metadata } from 'next';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from '@/components/ui/breadcrumb';
import { Container } from '@/components/common/container';
import { Toolbar, ToolbarHeading, ToolbarTitle } from '@/components/common/toolbar';
import { DashboardWelcome } from './components/dashboard-welcome';

export const metadata: Metadata = {
  title: 'Inicio — SIODE',
  description: 'Sistema Integral de Organos Desconcentrados Electorales',
};

export default function DashboardPage() {
  return (
    <>
      <Container>
        <DashboardWelcome />
      </Container>
    </>
  );
}
