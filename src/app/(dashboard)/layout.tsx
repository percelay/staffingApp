'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/layout/app-sidebar';
import { Separator } from '@/components/ui/separator';
import { useAuthStore } from '@/lib/stores/auth-store';
import { StoreProvider } from '@/lib/stores/store-provider';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const currentUser = useAuthStore((s) => s.currentUser);

  useEffect(() => {
    if (!currentUser) {
      router.replace('/login');
      return;
    }
    // Manager role can only access /opportunities
    if (currentUser.role === 'manager' && !pathname.startsWith('/opportunities')) {
      router.replace('/opportunities');
    }
  }, [currentUser, pathname, router]);

  if (!currentUser) return null;
  if (currentUser.role === 'manager' && !pathname.startsWith('/opportunities')) return null;

  return (
    <StoreProvider key={currentUser.id}>
      <SidebarProvider className="h-full">
        <AppSidebar />
        <SidebarInset className="flex flex-col flex-1 min-h-0 min-w-0">
          <header className="flex h-14 items-center gap-2 border-b px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <h1 className="text-sm font-semibold tracking-tight">The Field</h1>
          </header>
          <main className="flex-1 flex flex-col overflow-hidden min-h-0 min-w-0">
            {children}
          </main>
        </SidebarInset>
      </SidebarProvider>
    </StoreProvider>
  );
}
