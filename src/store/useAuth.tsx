import ApiClient from "@/lib/api";
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface AuthState {
  token: string | null;
  user: any;
  login: (email: string, userName: string, password: string) => Promise<any>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

export const useAuth = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      login: async (email, userName, password) => {
        try {
          const response = await ApiClient.post("auth/login", {
            email,
            userName,
            password,
          });
          const { token } = response.data.data;

          localStorage.setItem("token", token);
          set({ token });
          return response.data.message;
        } catch (err: any) {
          throw err;
        }
      },
      logout: () => {
        localStorage.removeItem("token");
        localStorage.clear();

        set({ token: null, user: null });
      },
      refreshUser: async () => {
        try {
          const { token } = get();
          if (token) {
            const response = await ApiClient.get("/auth/profile");
            set({ user: response.data.data });
          }
        } catch (error) {}
      },
    }),
    { name: "auth-storage" }
  )
);
