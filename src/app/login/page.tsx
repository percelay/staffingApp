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
    login(DEMO_USERS[userIndex]);
    router.push('/timeline');
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
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground font-bold text-lg">
              SH
            </div>
            <CardTitle className="text-2xl tracking-tight">StaffingHub</CardTitle>
            <CardDescription className="text-base">
              Visual staffing management for consulting teams
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
