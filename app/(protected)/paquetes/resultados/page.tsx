import { Metadata } from 'next';
import { ModuloEnDesarrollo } from '@/components/common/modulo-en-desarrollo';

export const metadata: Metadata = {
  title: 'Resultados Preliminares',
  description: 'Resultados preliminares de la recepción de paquetes.',
};

export default function ResultadosPreliminaresPage() {
  return (
    <ModuloEnDesarrollo
      titulo="Resultados Preliminares"
      seccion="Recepción de Paquetes"
    />
  );
}
