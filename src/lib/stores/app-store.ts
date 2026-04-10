import { create } from 'zustand';
import type { BootstrapSource } from '@/lib/contracts/bootstrap';

type BootstrapStatus = 'idle' | 'loading' | 'ready' | 'error';

interface AppStore {
  bootstrapStatus: BootstrapStatus;
  bootstrapSource: BootstrapSource | null;
  bootstrapError: string | null;
  setBootstrapLoading: () => void;
  setBootstrapReady: (source: BootstrapSource) => void;
  setBootstrapError: (message: string) => void;
  resetBootstrap: () => void;
}

export const useAppStore = create<AppStore>((set) => ({
  bootstrapStatus: 'idle',
  bootstrapSource: null,
  bootstrapError: null,
  setBootstrapLoading: () =>
    set({
      bootstrapStatus: 'loading',
      bootstrapError: null,
    }),
  setBootstrapReady: (bootstrapSource) =>
    set({
      bootstrapStatus: 'ready',
      bootstrapSource,
      bootstrapError: null,
    }),
  setBootstrapError: (bootstrapError) =>
    set({
      bootstrapStatus: 'error',
      bootstrapError,
    }),
  resetBootstrap: () =>
    set({
      bootstrapStatus: 'idle',
      bootstrapSource: null,
      bootstrapError: null,
    }),
}));
