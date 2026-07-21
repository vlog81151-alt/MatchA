import { create } from "zustand";

import type { AuthUser } from "@/lib/auth-client";

interface AuthState {
  setUser: (user: AuthUser | null) => void;
  user: AuthUser | null;
}

export const useAuthStore = create<AuthState>((set) => ({
  setUser: (user) => set({ user }),
  user: null
}));
