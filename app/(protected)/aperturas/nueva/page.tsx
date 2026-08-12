import type { Metadata } from 'next';
import { AperturaFormView } from '../_components/apertura-form-view';

export const metadata: Metadata = {
  title: 'Nueva Apertura | SIODE',
  description: 'Registro de nueva apertura de bodega electoral.',
};

export default async function NuevaAperturaPage() {
  return <AperturaFormView />;
}
