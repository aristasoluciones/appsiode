'use client';

import { usePathname, useRouter } from 'next/navigation';
import { MENU_SIDEBAR } from '@/config/layout-1.config';
import type { MenuConfig, MenuItem } from '@/config/types';
import { useAuth } from '@/providers/auth-provider';
import { AccessDenied } from '@/components/common/access-denied';
import { Container } from '@/components/common/container';

/** Ítem del menú cuya ruta cubre la actual; con varias coincidencias gana la más larga. */
function itemDeRuta(items: MenuConfig, pathname: string): MenuItem | undefined {
  let mejor: MenuItem | undefined;
  for (const item of items) {
    if (
      item.path &&
      (pathname === item.path || pathname.startsWith(`${item.path}/`)) &&
      item.path.length > (mejor?.path?.length ?? -1)
    ) {
      mejor = item;
    }
    if (item.children) {
      const hijo = itemDeRuta(item.children, pathname);
      if (hijo?.path && hijo.path.length > (mejor?.path?.length ?? -1)) {
        mejor = hijo;
      }
    }
  }
  return mejor;
}

/**
 * Restringe el acceso por URL escrita a mano con el mismo permiso que el menú
 * (`permission` del ítem en `config/layout-1.config.tsx`): una sola fuente para
 * ocultar la opción y para rechazar la dirección directa. Una ruta sin ítem o
 * sin permiso es pública. La validación autoritativa sigue en el API.
 */
export function AccesoGuard({ children }: { children: React.ReactNode }) {
  const { hasPermission } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  const permiso = itemDeRuta(MENU_SIDEBAR, pathname)?.permission;

  if (permiso && !hasPermission(permiso)) {
    return (
      <Container>
        <AccessDenied
          description="No tienes permiso para abrir esta pantalla."
          onBack={() => router.push('/')}
        />
      </Container>
    );
  }

  return children;
}
