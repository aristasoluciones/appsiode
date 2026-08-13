import { Metadata } from 'next';
import { ModuloEnDesarrollo } from '@/components/common/modulo-en-desarrollo';

export const metadata: Metadata = {
  title: 'Resultados — Cómputos',
  description: 'Resultados de los cómputos electorales.',
};

export default function ResultadosComputosPage() {
  return (
    <ModuloEnDesarrollo titulo="Resultados" seccion="Cómputos Electorales" />
  );
}
