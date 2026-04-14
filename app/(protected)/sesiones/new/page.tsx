import type { Metadata } from 'next';
import { NuevaSesionView } from './components/nueva-sesion-view';

export const metadata: Metadata = {
  title: 'Nueva Sesion | Sesiones',
  description: 'Creacion de una nueva sesion de consejo electoral.',
};

export default async function NuevaSesionPage() {
  return <NuevaSesionView />;
}
