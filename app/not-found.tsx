import { FileQuestion } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Container } from '@/components/common/container';

export default function NotFoundPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen w-full p-4">
      <Container className="flex flex-col items-center text-center">
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-5">
          <FileQuestion className="h-7 w-7 text-muted-foreground" />
        </div>
        <h1 className="text-xl font-semibold text-foreground mb-1">
          Página no encontrada
        </h1>
        <p className="text-sm text-muted-foreground mb-6 max-w-sm">
          La página que buscas no existe o fue movida. Verifica la dirección e intenta nuevamente.
        </p>
        <Link href="/">
          <Button size="sm">Ir al inicio</Button>
        </Link>
      </Container>
    </div>
  );
}
