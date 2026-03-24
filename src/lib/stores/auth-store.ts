import { create } from 'zustand';
import type { PracticeArea } from '../types';

export interface AuthUser {
  id: string;
  name: string;
  role: 'partner' | 'manager';
  practice_area: PracticeArea;
  avatar_url: string;
}

export const DEMO_USERS: AuthUser[] = [
  {
    id: 'user-partner',
    name: 'Sarah Chen',
    role: 'partner',
    practice_area: 'strategy',
    avatar_url: 'https://api.dicebear.com/9.x/notionists/svg?seed=SarahChen',
  },
  {
    id: 'user-manager',
    name: 'James Rivera',
    role: 'manager',
    practice_area: 'operations',
    avatar_url: 'https://api.dicebear.com/9.x/notionists/svg?seed=JamesRivera',
  },
];

interface AuthStore {
  currentUser: AuthUser | null;
  login: (user: AuthUser) => void;
  logout: () => void;
  isPartner: () => boolean;
  isAuthenticated: () => boolean;
}

export const useAuthStore = create<AuthStore>((set, get) => ({
  currentUser: null,
  login: (user) => set({ currentUser: user }),
  logout: () => set({ currentUser: null }),
  isPartner: () => get().currentUser?.role === 'partner',
  isAuthenticated: () => get().currentUser !== null,
}));
