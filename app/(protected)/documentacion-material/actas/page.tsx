import { Metadata } from 'next';
import { ActasClient } from '../_components/actas-client';

export const metadata: Metadata = {
  title: 'Actas Circunstanciadas | SIODE',
  description:
    'Actas circunstanciadas de recepción de la documentación y el material electoral del consejo.',
};

export default function ActasCircunstanciadasPage() {
  return <ActasClient />;
}
