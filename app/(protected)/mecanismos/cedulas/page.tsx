import type { Metadata } from 'next';
import { CedulasClient } from '../_components/cedulas-client';

export const metadata: Metadata = {
  title: 'Cédulas | SIODE',
  description:
    'Cédulas de los mecanismos de recolección: propuesta del INE, informe del consejo, aprobación y cierre.',
};

export default function CedulasPage() {
  return <CedulasClient />;
}
