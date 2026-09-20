import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { CedulasConsejoClient } from '../../../../_components/cedulas-consejo-client';

interface Props {
  params: Promise<{ tipo: string; id: string }>;
}

export const metadata: Metadata = {
  title: 'Cédulas del Consejo | SIODE',
  description:
    'Cédulas de los mecanismos de un consejo, vistas desde oficina central.',
};

export default async function CedulasConsejoPage({ params }: Props) {
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
    <CedulasConsejoClient tipoConsejo={tipoConsejo} idConsejo={idConsejo} />
  );
}
