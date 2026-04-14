'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/providers/auth-provider';
import { ScreenLoader } from '@/components/common/screen-loader';
import { Layout1 } from '@/components/layouts/layout-1';
import { useDeviceName } from '@/hooks/use-device-name';

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const queryClient = useQueryClient();

  useDeviceName();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/signin');
      return;
    }
    // Capturista (idRol=1): redirigir solo dentro de /sesiones si no es su consejo asignado
    if (!isLoading && isAuthenticated && user?.idRol === '1' && user.tipoConsejo && user.idConsejo && pathname.startsWith('/sesiones')) {
      const targetBase = `/sesiones/${user.tipoConsejo.toLowerCase()}/${user.idConsejo}`;
      if (!pathname.startsWith(targetBase)) {
        router.replace(targetBase);
      }
    }
  }, [isLoading, isAuthenticated, user, pathname, router, queryClient]);

  // Bloquear render mientras carga o mientras un capturista necesita ser redirigido
  const targetBase =
    user?.idRol === '1' && user.tipoConsejo && user.idConsejo
      ? `/sesiones/${user.tipoConsejo.toLowerCase()}/${user.idConsejo}`
      : null;

  const needsRedirect =
    !isLoading &&
    isAuthenticated &&
    targetBase !== null &&
    pathname.startsWith('/sesiones') &&
    !pathname.startsWith(targetBase);

  if (isLoading || needsRedirect) {
    return <ScreenLoader />;
  }

  return user ? <Layout1>{children}</Layout1> : null;
}
