'use client';

import { HistorialCuenta } from '@/components/common/historial-cuenta';
import {
  Card,
  CardContent,
  CardHeader,
  CardHeading,
  CardTitle,
} from '@/components/ui/card';

/**
 * Sección «Historial de la cuenta» del perfil: la misma línea de tiempo que ve
 * la administración en la pantalla de Usuarios, aquí sobre la propia cuenta y
 * sin permisos adicionales.
 */
export function HistorialSeccion() {
  return (
    <Card>
      <CardHeader>
        <CardHeading>
          <CardTitle>Historial de la cuenta</CardTitle>
        </CardHeading>
      </CardHeader>
      <CardContent>
        <HistorialCuenta />
      </CardContent>
    </Card>
  );
}
