import { Metadata } from 'next';
import { ComprobacionesClient } from '../_components/comprobaciones-client';

export const metadata: Metadata = {
  title: 'Comprobación Física | SIODE',
  description:
    'Comprobación física de la documentación y el material electoral del consejo.',
};

export default function ComprobacionFisicaPage() {
  return <ComprobacionesClient />;
}
