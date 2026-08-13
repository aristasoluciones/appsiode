import { Metadata } from 'next';
import { ModuloEnDesarrollo } from '@/components/common/modulo-en-desarrollo';

export const metadata: Metadata = {
  title: 'Monitoreo de Captura — Cómputos',
  description: 'Monitoreo de la captura de los cómputos electorales.',
};

export default function MonitoreoComputosPage() {
  return (
    <ModuloEnDesarrollo
      titulo="Monitoreo de Captura"
      seccion="Cómputos Electorales"
    />
  );
}
