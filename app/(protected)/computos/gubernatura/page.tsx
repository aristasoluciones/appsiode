import { Metadata } from 'next';
import { ModuloEnDesarrollo } from '@/components/common/modulo-en-desarrollo';

export const metadata: Metadata = {
  title: 'Acta de Cómputo de Gubernatura',
  description: 'Acta de cómputo de la elección de gubernatura.',
};

export default function GubernaturaPage() {
  return (
    <ModuloEnDesarrollo
      titulo="Acta de Cómputo de Gubernatura"
      seccion="Cómputos Electorales"
    />
  );
}
