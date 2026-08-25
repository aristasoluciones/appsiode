'use client';

import * as React from 'react';
import { ThemeProvider as NextThemesProvider } from 'next-themes';
import { TooltipProvider } from '@/components/ui/tooltip';

export function ThemeProvider({
  children,
  nonce,
}: React.ComponentProps<typeof NextThemesProvider>) {
  return (
    <NextThemesProvider
      // Firma el script en línea que aplica el tema antes de pintar, para que
      // la política de contenido del sitio no lo bloquee.
      nonce={nonce}
      attribute="class"
      defaultTheme="light"
      storageKey="nextjs-theme"
      disableTransitionOnChange
      enableColorScheme
    >
      <TooltipProvider delayDuration={0}>{children}</TooltipProvider>
    </NextThemesProvider>
  );
}
