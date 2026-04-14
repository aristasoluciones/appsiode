import { Metadata } from 'next';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Container } from '@/components/common/container';
import { Toolbar, ToolbarHeading, ToolbarTitle } from '@/components/common/toolbar';
import { Construction } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';

export const metadata: Metadata = {
  title: 'Próximamente — SIODE',
};

export default function ComingSoonPage() {
  return (
    <>
      <Container>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="flex flex-col items-center gap-5 text-center max-w-sm">

            <div className="flex items-center justify-center size-16 rounded-full bg-warning/10 border border-warning/20">
              <Construction className="size-7 text-warning" />
            </div>

            <div className="space-y-1">
              <Badge variant="outline" className="text-warning border-warning/40 mb-2">
                En desarrollo
              </Badge>
              <h2 className="text-xl font-semibold text-foreground">
                Módulo en desarrollo
              </h2>
            </div>

            <Separator className="w-12" />

            <p className="text-sm text-muted-foreground leading-relaxed">
              Este módulo estará disponible <span className="font-medium text-foreground">próximamente</span>.
              Estamos trabajando para ofrecerte la mejor experiencia posible.
            </p>

          </div>
        </div>
      </Container>
    </>
  );
}
