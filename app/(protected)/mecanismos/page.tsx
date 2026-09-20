import type { Metadata } from 'next';
import { MecanismosClient } from './_components/mecanismos-client';

export const metadata: Metadata = {
  title: 'Mecanismos de Recolección | SIODE',
  description:
    'Mecanismos de recolección de la documentación electoral: DAT y CRyT por consejo, con su CAE, costo estimado y cédula.',
};

export default function MecanismosPage() {
  return <MecanismosClient />;
}
