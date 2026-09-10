import { Metadata } from 'next';
import { ArticulosClient } from '../_components/articulos-client';

export const metadata: Metadata = {
  title: 'Artículos | SIODE',
  description:
    'Catálogo de artículos de documentación y material electoral que administra la oficina central.',
};

export default function ArticulosPage() {
  return <ArticulosClient />;
}
