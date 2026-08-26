'use client';

import { useAuth } from '@/providers/auth-provider';
import {
  Card,
  CardContent,
  CardHeader,
  CardHeading,
  CardTitle,
} from '@/components/ui/card';

/** Datos generales de la cuenta, tal como los entrega el perfil. */
export function PerfilInfo() {
  const { user } = useAuth();

  const filas: Array<{ etiqueta: string; valor: string | undefined }> = [
    { etiqueta: 'Nombre', valor: user?.nombre },
    { etiqueta: 'Usuario', valor: user?.email },
    { etiqueta: 'Rol', valor: user?.rol },
    {
      etiqueta: 'Consejo',
      valor: user?.consejo
        ? `${user.consejo}${user.tipoConsejoDesc ? ` (${user.tipoConsejoDesc})` : ''}`
        : 'Oficina central',
    },
    {
      etiqueta: 'Proceso',
      valor: user?.proceso
        ? `${user.proceso.tipo} ${user.proceso.anio}`
        : undefined,
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardHeading>
          <CardTitle>Datos de la cuenta</CardTitle>
        </CardHeading>
      </CardHeader>
      <CardContent>
        <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-3 text-sm">
          {filas
            .filter((f) => f.valor)
            .map((f) => (
              <div key={f.etiqueta} className="contents">
                <dt className="text-muted-foreground">{f.etiqueta}</dt>
                <dd className="font-medium text-foreground">{f.valor}</dd>
              </div>
            ))}
        </dl>
      </CardContent>
    </Card>
  );
}
