'use client';

import { useRouter, usePathname } from 'next/navigation';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/lib/stores/auth-store';

const NAV_ITEMS = [
  { label: 'Timeline', href: '/timeline', icon: '▦' },
  { label: 'Graph', href: '/graph', icon: '◉' },
  { label: 'Staffing', href: '/staffing', icon: '⊞' },
  { label: 'People', href: '/manage', icon: '◎' },
];

export function AppSidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const currentUser = useAuthStore((s) => s.currentUser);
  const logout = useAuthStore((s) => s.logout);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <Sidebar className="border-r border-border/50">
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white border border-slate-200">
            <svg width="18" height="18" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M3 20C5 18 8 16.5 14 16.5C20 16.5 23 18 25 20" stroke="black" strokeWidth="1.5" strokeLinecap="round"/>
              <path d="M6 17V12" stroke="black" strokeWidth="1.5" strokeLinecap="round"/>
              <path d="M6 12C6 12 7.5 9 6 7" stroke="black" strokeWidth="1.5" strokeLinecap="round"/>
              <path d="M6 12C6 12 4.5 9.5 3 9" stroke="black" strokeWidth="1.5" strokeLinecap="round"/>
              <path d="M14 16.5V10" stroke="black" strokeWidth="1.5" strokeLinecap="round"/>
              <path d="M14 10C14 10 16 7 14 5" stroke="black" strokeWidth="1.5" strokeLinecap="round"/>
              <path d="M14 10C14 10 12 7.5 10 7" stroke="black" strokeWidth="1.5" strokeLinecap="round"/>
              <path d="M22 17V11" stroke="black" strokeWidth="1.5" strokeLinecap="round"/>
              <path d="M22 11C22 11 23.5 8 22 6" stroke="black" strokeWidth="1.5" strokeLinecap="round"/>
              <path d="M22 11C22 11 20 8.5 18 8" stroke="black" strokeWidth="1.5" strokeLinecap="round"/>
              <path d="M1 22C4 20 8 18.5 14 18.5C20 18.5 24 20 27 22" stroke="black" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </div>
          <div>
            <p className="font-semibold text-sm tracking-tight">The Field</p>
            <p className="text-xs text-muted-foreground">Staffing Management</p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Views</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {NAV_ITEMS.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    isActive={pathname === item.href}
                    onClick={() => router.push(item.href)}
                    className="gap-3"
                  >
                    <span className="text-base">{item.icon}</span>
                    <span>{item.label}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4">
        {currentUser && (
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <Avatar className="h-8 w-8">
                <AvatarImage src={currentUser.avatar_url} alt={currentUser.name} />
                <AvatarFallback className="text-xs">
                  {currentUser.name.split(' ').map((n) => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{currentUser.name}</p>
                <Badge variant="secondary" className="text-[10px] capitalize">
                  {currentUser.role}
                </Badge>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="w-full text-muted-foreground"
              onClick={handleLogout}
            >
              Sign out
            </Button>
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
