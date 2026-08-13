import { Metadata } from 'next';
import { ModuloEnDesarrollo } from '@/components/common/modulo-en-desarrollo';

export const metadata: Metadata = {
  title: 'Entrega de Paquetes a PMDC',
  description:
    'Entrega de paquetes electorales a las presidencias de mesas directivas de casilla.',
};

export default function EntregaPaquetesPmdcPage() {
  return (
    <ModuloEnDesarrollo
      titulo="Entrega de Paquetes"
      seccion="Entrega de Paquetes a PMDC"
    />
  );
}
