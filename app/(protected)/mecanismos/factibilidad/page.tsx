import type { Metadata } from 'next';
import { EstudiosClient } from '../_components/estudios-client';

export const metadata: Metadata = {
  title: 'Estudios de Factibilidad | SIODE',
  description:
    'Estudios de factibilidad de los mecanismos de recolección por distrito federal: propuesta, acuses de los consejos y aprobación.',
};

export default function FactibilidadPage() {
  return <EstudiosClient />;
}
