import { Metadata } from 'next';
import { ModuloEnDesarrollo } from '@/components/common/modulo-en-desarrollo';

export const metadata: Metadata = {
  title: 'Cédulas',
  description: 'Cédulas de los mecanismos de recolección.',
};

export default function CedulasPage() {
  return (
    <ModuloEnDesarrollo titulo="Cédulas" seccion="Mecanismos de Recolección" />
  );
}
