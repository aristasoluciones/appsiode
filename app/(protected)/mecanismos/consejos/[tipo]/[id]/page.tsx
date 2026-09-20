import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { MecanismosConsejoClient } from '../../../_components/mecanismos-consejo-client';

interface Props {
  params: Promise<{ tipo: string; id: string }>;
}

export const metadata: Metadata = {
  title: 'Mecanismos del Consejo | SIODE',
  description:
    'Mecanismos de recolección que informa un consejo, vistos desde oficina central.',
};

export default async function MecanismosConsejoPage({ params }: Props) {
  const { tipo, id } = await params;
  const tipoLower = tipo.toLowerCase();

  if (tipoLower !== 'distritales' && tipoLower !== 'municipales') {
    notFound();
  }

  const tipoConsejo = tipoLower === 'distritales' ? 'D' : 'M';
  const idConsejo = Number(id);

  if (!Number.isInteger(idConsejo) || idConsejo <= 0) {
    notFound();
  }

  return (
    <MecanismosConsejoClient tipoConsejo={tipoConsejo} idConsejo={idConsejo} />
  );
}
