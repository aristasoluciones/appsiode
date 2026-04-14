import type { Metadata } from 'next';
import { SesionesConsejoPage } from './components/sesiones-consejo-page';

interface Props {
  params: Promise<{ type: string; id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { type, id } = await params;
  const tipoLabel = type === 'd' ? 'Distrital' : 'Municipal';
  return { title: `Consejo ${tipoLabel} ${id} | Sesiones` };
}

export default async function SesionesConsejoPage_({ params }: Props) {
  const { type, id } = await params;
  return <SesionesConsejoPage type={type} idConsejo={id} />;
}
