import { create } from "zustand";

interface AppState {
  preferredCity: string;
  setPreferredCity: (city: string) => void;
}

export const useAppStore = create<AppState>((set) => ({
  preferredCity: "Jaipur",
  setPreferredCity: (city) => set({ preferredCity: city })
}));
