'use client';

import { LayoutDashboard } from 'lucide-react';
import { useAuth } from '@/providers/auth-provider';
import { useProceso } from '@/hooks/use-proceso';
import { useMounted } from '@/hooks/use-mounted';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

/** El saludo depende de la hora local del navegador. */
function saludoDeLaHora(): string {
  const hora = new Date().getHours();
  return hora < 12
    ? 'Buenos días'
    : hora < 19
      ? 'Buenas tardes'
      : 'Buenas noches';
}

export function DashboardWelcome() {
  const { user } = useAuth();
  const { data: proceso } = useProceso();

  // La hora del servidor no coincide con la del navegador, así que el saludo
  // se calcula hasta después de montar para no romper la hidratación.
  const mounted = useMounted();
  const saludo = mounted ? saludoDeLaHora() : null;

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="flex flex-col items-center gap-5 text-center max-w-md">

        <div className="flex items-center justify-center size-16 rounded-full bg-primary/10 border border-primary/20">
          <LayoutDashboard className="size-7 text-primary" />
        </div>

        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">
            {saludo ? `${saludo},` : ' '}
          </p>
          <h2 className="text-2xl font-semibold text-foreground">
            {user?.nombre ?? 'Usuario'}
          </h2>
        </div>

        <Separator className="w-12" />

        <p className="text-sm text-muted-foreground leading-relaxed">
          Bienvenido al{' '}
          <span className="font-medium text-foreground">
            Sistema Integral para los Organos Desconcentrados
          </span>
          . Usa el menú lateral para navegar entre los módulos disponibles.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-2">
          {user?.rol && (
            <Badge variant="secondary">{user.rol}</Badge>
          )}
          {user?.consejo && (
            <Badge variant="outline">{user.consejo}</Badge>
          )}
          {proceso && (
            <Badge variant="outline" className="text-primary border-primary/30">
              {`PROCESO ELECTORAL  ${proceso.tipo}  ${proceso.anio}`}
            </Badge>
          )}
        </div>

      </div>
    </div>
  );
}

