import { Metadata } from 'next';
import { ModuloEnDesarrollo } from '@/components/common/modulo-en-desarrollo';

export const metadata: Metadata = {
  title: 'Acta de Voto en el Extranjero',
  description: 'Acta de cómputo del voto de las y los chiapanecos residentes en el extranjero.',
};

export default function VotoExtranjeroPage() {
  return (
    <ModuloEnDesarrollo
      titulo="Acta de Voto en el Extranjero"
      seccion="Cómputos Electorales"
    />
  );
}
