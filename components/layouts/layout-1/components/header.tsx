import { useEffect, useState } from 'react';
import {
  Menu,
} from 'lucide-react';
import { toAbsoluteUrl } from '@/lib/helpers';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { useScrollPosition } from '@/hooks/use-scroll-position';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/providers/auth-provider';
import {
  Sheet,
  SheetBody,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { UserDropdownMenu } from '@/components/layouts/layout-1/shared/topbar/user-dropdown-menu';
import { ProcesoSelector } from '@/components/layouts/layout-1/shared/topbar/proceso-selector';
// import { MegaMenu } from './mega-menu'; // deshabilitado
// import { MegaMenuMobile } from './mega-menu-mobile'; // deshabilitado
import { SidebarMenu } from './sidebar-menu';
import { usePathname } from 'next/navigation';
import Link from 'next/link';

export function Header() {
  const [isSidebarSheetOpen, setIsSidebarSheetOpen] = useState(false);
  const { user } = useAuth();

  const pathname = usePathname();
  const mobileMode = useIsMobile();

  const scrollPosition = useScrollPosition();
  const headerSticky: boolean = scrollPosition > 0;

  // Close sheet when route changes
  useEffect(() => {
    setIsSidebarSheetOpen(false);
  }, [pathname]);

  return (
    <header
      className={cn(
        'header fixed top-0 z-10 start-0 flex items-stretch shrink-0 border-b border-transparent bg-background end-0 pe-[var(--removed-body-scroll-bar-size,0px)]',
        headerSticky && 'border-b border-border',
      )}
    >
      <div className="container-fluid flex justify-between items-stretch lg:gap-4">
        {/* HeaderLogo */}
        <div className="flex lg:hidden items-center gap-2.5">
          <Link href="/" className="shrink-0">
            <img
              src={toAbsoluteUrl('/media/app/mini-logo-circle.png')}
              className="h-[25px] w-full"
              alt="mini-logo"
            />
          </Link>
          <div className="flex items-center">
            {mobileMode && (
              <Sheet
                open={isSidebarSheetOpen}
                onOpenChange={setIsSidebarSheetOpen}
              >
                <SheetTrigger asChild>
                  <Button variant="ghost" mode="icon">
                    <Menu className="text-muted-foreground/70" />
                  </Button>
                </SheetTrigger>
                <SheetContent
                  className="p-0 gap-0 w-[275px]"
                  side="left"
                  close={false}
                >
                  <SheetHeader className="p-0 space-y-0">
                    <SheetTitle className="sr-only">Menú de navegación</SheetTitle>
                  </SheetHeader>
                  <SheetBody className="p-0 overflow-y-auto">
                    <SidebarMenu />
                  </SheetBody>
                </SheetContent>
              </Sheet>
            )}
          </div>
        </div>

        {/* Proceso Electoral Selector */}
        <div className="flex items-center">
          <ProcesoSelector />
        </div>

        {/* HeaderTopbar */}
        <div className="flex items-center gap-3">
          <UserDropdownMenu
            trigger={
              <div className="flex items-center gap-2 cursor-pointer">
                <div className="hidden sm:flex flex-col items-end">
                  <span className="text-sm font-semibold text-foreground leading-tight">
                    {user?.nombre || 'Usuario'}
                  </span>
                  <span className="text-xs text-muted-foreground leading-tight">
                    {user?.rol || ''}
                  </span>
                </div>
                <img
                  className="size-9 rounded-full border-2 border-green-500 shrink-0"
                  src={toAbsoluteUrl('/media/avatars/blank.png')}
                  alt="User Avatar"
                />
              </div>
            }
          />
        </div>
      </div>
    </header>
  );
}

