import { Metadata } from 'next';
import { ModuloEnDesarrollo } from '@/components/common/modulo-en-desarrollo';

export const metadata: Metadata = {
  title: 'Comprobación Física',
  description:
    'Comprobación física de la documentación y el material electoral.',
};

export default function ComprobacionFisicaPage() {
  return (
    <ModuloEnDesarrollo
      titulo="Comprobación Física"
      seccion="Documentación y Material"
    />
  );
}
