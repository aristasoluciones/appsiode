import { Metadata } from 'next';
import { ModuloEnDesarrollo } from '@/components/common/modulo-en-desarrollo';

export const metadata: Metadata = {
  title: 'Estudios de Factibilidad',
  description: 'Estudios de factibilidad de los mecanismos de recolección.',
};

export default function FactibilidadPage() {
  return (
    <ModuloEnDesarrollo
      titulo="Estudios de Factibilidad"
      seccion="Mecanismos de Recolección"
    />
  );
}
