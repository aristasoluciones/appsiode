import { Metadata } from 'next';
import { ModuloEnDesarrollo } from '@/components/common/modulo-en-desarrollo';

export const metadata: Metadata = {
  title: 'Mecanismos de Recolección',
  description: 'Mecanismos de recolección de la documentación electoral.',
};

export default function MecanismosPage() {
  return (
    <ModuloEnDesarrollo titulo="Mecanismos de Recolección" />
  );
}
