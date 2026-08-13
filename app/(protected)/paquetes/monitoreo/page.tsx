import { Metadata } from 'next';
import { ModuloEnDesarrollo } from '@/components/common/modulo-en-desarrollo';

export const metadata: Metadata = {
  title: 'Monitoreo de Captura — Paquetes',
  description: 'Monitoreo de la captura de la recepción de paquetes.',
};

export default function MonitoreoPaquetesPage() {
  return (
    <ModuloEnDesarrollo
      titulo="Monitoreo de Captura"
      seccion="Recepción de Paquetes"
    />
  );
}
