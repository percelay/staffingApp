'use client';

import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useAuthStore, DEMO_USERS } from '@/lib/stores/auth-store';

export default function LoginPage() {
  const router = useRouter();
  const login = useAuthStore((s) => s.login);

  const handleLogin = (userIndex: number) => {
    const user = DEMO_USERS[userIndex];
    login(user);
    router.push(user.role === 'manager' ? '/opportunities' : '/timeline');
  };

  return (
    <div className="flex-1 flex items-center justify-center min-h-full bg-gradient-to-br from-slate-50 via-white to-slate-100">
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
      >
        <Card className="w-[420px] shadow-xl border-0 shadow-slate-200/60">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-white border border-slate-200">
              <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M3 20C5 18 8 16.5 14 16.5C20 16.5 23 18 25 20" stroke="black" strokeWidth="1.5" strokeLinecap="round"/>
                <path d="M6 17V12" stroke="black" strokeWidth="1.2" strokeLinecap="round"/>
                <path d="M6 12C6 12 7.5 9 6 7" stroke="black" strokeWidth="1.2" strokeLinecap="round"/>
                <path d="M6 12C6 12 4.5 9.5 3 9" stroke="black" strokeWidth="1.2" strokeLinecap="round"/>
                <path d="M14 16.5V10" stroke="black" strokeWidth="1.2" strokeLinecap="round"/>
                <path d="M14 10C14 10 16 7 14 5" stroke="black" strokeWidth="1.2" strokeLinecap="round"/>
                <path d="M14 10C14 10 12 7.5 10 7" stroke="black" strokeWidth="1.2" strokeLinecap="round"/>
                <path d="M22 17V11" stroke="black" strokeWidth="1.2" strokeLinecap="round"/>
                <path d="M22 11C22 11 23.5 8 22 6" stroke="black" strokeWidth="1.2" strokeLinecap="round"/>
                <path d="M22 11C22 11 20 8.5 18 8" stroke="black" strokeWidth="1.2" strokeLinecap="round"/>
                <path d="M1 22C4 20 8 18.5 14 18.5C20 18.5 24 20 27 22" stroke="black" strokeWidth="1.2" strokeLinecap="round"/>
              </svg>
            </div>
            <CardTitle className="text-2xl tracking-tight">The Field</CardTitle>
            <CardDescription className="text-base">
              A smarter staffing tool
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 pt-4">
            {DEMO_USERS.map((user, i) => (
              <Button
                key={user.id}
                variant="outline"
                className="w-full h-auto p-4 justify-start gap-4 hover:bg-slate-50 hover:border-primary/30 transition-all"
                onClick={() => handleLogin(i)}
              >
                <Avatar className="h-10 w-10">
                  <AvatarImage src={user.avatar_url} alt={user.name} />
                  <AvatarFallback>
                    {user.name.split(' ').map((n) => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col items-start gap-1">
                  <span className="font-semibold text-sm">{user.name}</span>
                  <div className="flex gap-2">
                    <Badge variant="secondary" className="text-xs capitalize">
                      {user.role}
                    </Badge>
                    <Badge variant="outline" className="text-xs capitalize">
                      {user.practice_area}
                    </Badge>
                  </div>
                </div>
              </Button>
            ))}
            <p className="text-xs text-muted-foreground text-center pt-2">
              Select an account to explore the demo
            </p>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
