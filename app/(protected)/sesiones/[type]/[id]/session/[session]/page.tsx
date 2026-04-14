import type { Metadata } from 'next';
import { SessionDetailPage } from './session-detail-page';

interface Props {
  params: Promise<{ type: string; id: string; session: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { session } = await params;
  return { title: `Sesión ${session} | Detalle` };
}

export default async function SessionDetailServerPage({ params }: Props) {
  const { type, id, session } = await params;
  return <SessionDetailPage type={type} id={id} sessionId={session} />;
}
