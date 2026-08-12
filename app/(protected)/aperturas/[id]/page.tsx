import type { Metadata } from 'next';
import { AperturaFormView } from '../_components/apertura-form-view';

interface Props {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ mode?: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  return {
    title: `Apertura #${id} | SIODE`,
    description: 'Detalle y edición de una apertura de bodega electoral.',
  };
}

export default async function AperturaDetallePage({ params, searchParams }: Props) {
  const { id } = await params;
  const { mode } = await searchParams;
  const idNum = parseInt(id, 10);
  if (Number.isNaN(idNum)) {
    return (
      <div className="p-6 text-sm text-muted-foreground">
        Identificador de apertura inválido.
      </div>
    );
  }
  const readOnly = mode === 'read';
  return <AperturaFormView idApertura={idNum} readOnly={readOnly} />;
}
