'use client';

import { LayoutDashboard } from 'lucide-react';
import { useAuth } from '@/providers/auth-provider';
import { useProceso } from '@/hooks/use-proceso';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

export function DashboardWelcome() {
  const { user } = useAuth();
  const { data: proceso } = useProceso();

  const hora = new Date().getHours();
  const saludo =
    hora < 12 ? 'Buenos días' : hora < 19 ? 'Buenas tardes' : 'Buenas noches';

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="flex flex-col items-center gap-5 text-center max-w-md">

        <div className="flex items-center justify-center size-16 rounded-full bg-primary/10 border border-primary/20">
          <LayoutDashboard className="size-7 text-primary" />
        </div>

        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">{saludo},</p>
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

