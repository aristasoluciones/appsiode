'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/providers/auth-provider';
import { ScreenLoader } from '@/components/common/screen-loader';
import { Layout1 } from '@/components/layouts/layout-1';
import { useProceso } from '@/hooks/use-proceso';
import { useDeviceName } from '@/hooks/use-device-name';

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();

  // Warm-up: inicia el fetch del proceso en cuanto user.idProceso esté disponible.
  // El hook se auto-habilita — no necesita `isAuthenticated` como parámetro.
  useProceso();
  useDeviceName();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      queryClient.removeQueries({ queryKey: ['proceso'] });
      router.push('/signin');
    }
  }, [isLoading, isAuthenticated, router, queryClient]);

  if (isLoading) {
    return <ScreenLoader />;
  }

  return user ? <Layout1>{children}</Layout1> : null;
}
