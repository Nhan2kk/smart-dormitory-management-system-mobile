import * as SecureStore from "expo-secure-store";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { authApi, AuthResponse, AuthUser } from "./authApi";

const STORAGE_KEY = "sdms.refreshToken";

type AuthContextValue = {
  user: AuthUser | null;
  accessToken: string | null;
  loading: boolean;
  signIn: (username: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<AuthResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    async function restore() {
      try {
        const token = await SecureStore.getItemAsync(STORAGE_KEY);
        if (token) {
          const refreshed = await authApi.refresh(token);
          if (refreshed.user.role === "STUDENT") {
            await SecureStore.setItemAsync(STORAGE_KEY, refreshed.refreshToken);
            if (mounted) setSession(refreshed);
          } else {
            await SecureStore.deleteItemAsync(STORAGE_KEY);
          }
        }
      } catch {
        await SecureStore.deleteItemAsync(STORAGE_KEY).catch(() => undefined);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    restore();
    return () => {
      mounted = false;
    };
  }, []);

  const signIn = useCallback(async (username: string, password: string) => {
    const result = await authApi.login(username.trim(), password);
    if (result.user.role !== "STUDENT") {
      await authApi
        .logout(result.refreshToken, result.accessToken)
        .catch(() => undefined);
      throw new Error("Ứng dụng này dành cho tài khoản sinh viên.");
    }
    await SecureStore.setItemAsync(STORAGE_KEY, result.refreshToken);
    setSession(result);
  }, []);

  const signOut = useCallback(async () => {
    const token = session?.refreshToken;
    const accessToken = session?.accessToken;
    setSession(null);
    await SecureStore.deleteItemAsync(STORAGE_KEY);
    if (token && accessToken)
      await authApi.logout(token, accessToken).catch(() => undefined);
  }, [session]);

  const value = useMemo(
    () => ({
      user: session?.user ?? null,
      accessToken: session?.accessToken ?? null,
      loading,
      signIn,
      signOut,
    }),
    [session, loading, signIn, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth phải nằm trong AuthProvider");
  return context;
}
