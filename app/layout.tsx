import { ReactNode, Suspense } from 'react';
import { Inter } from 'next/font/google';
import { cn } from '@/lib/utils';
import { Toaster } from '@/components/ui/sonner';
import { Metadata } from 'next';

import { SettingsProvider } from '@/providers/settings-provider';
import { TooltipProvider } from '@/components/ui/tooltip';
import { AuthProvider } from '@/providers/auth-provider';
import { I18nProvider } from '@/providers/i18n-provider';
import { QueryProvider } from '@/providers/query-provider';
import { ThemeProvider } from '@/providers/theme-provider';
import { RouteProgress } from '@/components/common/route-progress';

import '@/styles/globals.css';
const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: {
    template: '%s | IEPC',
    default: 'IEPC', // a default is required when creating a template
  },
};

export default async function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <html className="h-full" suppressHydrationWarning>
      <body
        className={cn(
          'antialiased flex h-full text-base text-foreground bg-background',
          inter.className,
        )}
      >
        <AuthProvider>
          <SettingsProvider>
            <ThemeProvider>
              <QueryProvider>
                <I18nProvider>
                  <TooltipProvider delayDuration={0}>
                    <RouteProgress />
                    <Suspense>{children}</Suspense>
                    <Toaster />
                  </TooltipProvider>
                </I18nProvider>
              </QueryProvider>
            </ThemeProvider>    
          </SettingsProvider>   
        </AuthProvider>
      </body>
    </html>
  );
}
