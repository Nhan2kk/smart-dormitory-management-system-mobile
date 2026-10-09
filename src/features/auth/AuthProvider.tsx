import * as SecureStore from "expo-secure-store";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { ApiCallOptions, ApiClient, ApiError, apiCall } from "../../shared/api";
import { authApi, AuthResponse, AuthUser } from "./authApi";

const STORAGE_KEY = "sdms.refreshToken";
/** Bật để xem giao diện bằng dữ liệu mock khi chưa có backend: mọi MSSV/mật khẩu đều đăng nhập được. */
const MOCK_AUTH = process.env.EXPO_PUBLIC_MOCK_AUTH === "true";

type AuthContextValue = {
  user: AuthUser | null;
  accessToken: string | null;
  loading: boolean;
  signIn: (username: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  /** Gọi API kèm access token; tự làm mới token một lần khi nhận 401. */
  request: ApiClient;
  /** Làm mới access token (vd. WebSocket bị từ chối); trả token mới hoặc null nếu phiên đã hết. */
  refresh: () => Promise<string | null>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<AuthResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const sessionRef = useRef<AuthResponse | null>(null);
  const refreshing = useRef<Promise<AuthResponse | null> | null>(null);

  useEffect(() => {
    sessionRef.current = session;
  }, [session]);

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
    if (MOCK_AUTH) {
      setSession({
        accessToken: "mock",
        refreshToken: "mock",
        user: { id: "mock", username: username.trim(), fullName: "Nguyễn Hoàng Nam", role: "STUDENT" },
      });
      return;
    }
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
    if (MOCK_AUTH) return;
    await SecureStore.deleteItemAsync(STORAGE_KEY);
    if (token && accessToken)
      await authApi.logout(token, accessToken).catch(() => undefined);
  }, [session]);

  /** Dùng chung một lượt refresh khi nhiều request cùng gặp 401. */
  const refreshSession = useCallback(async () => {
    const current = sessionRef.current;
    if (!current || MOCK_AUTH) return null;
    refreshing.current ??= authApi
      .refresh(current.refreshToken)
      .then(async (next) => {
        await SecureStore.setItemAsync(STORAGE_KEY, next.refreshToken);
        sessionRef.current = next;
        setSession(next);
        return next;
      })
      .catch(async () => {
        await SecureStore.deleteItemAsync(STORAGE_KEY).catch(() => undefined);
        sessionRef.current = null;
        setSession(null);
        return null;
      })
      .finally(() => {
        refreshing.current = null;
      });
    return refreshing.current;
  }, []);

  const request = useCallback(
    async <T,>(path: string, options: Omit<ApiCallOptions, "accessToken"> = {}): Promise<T> => {
      try {
        return await apiCall<T>(path, { ...options, accessToken: sessionRef.current?.accessToken });
      } catch (error) {
        if (!(error instanceof ApiError) || error.status !== 401) throw error;
        const next = await refreshSession();
        if (!next) throw error;
        return apiCall<T>(path, { ...options, accessToken: next.accessToken });
      }
    },
    [refreshSession],
  ) as ApiClient;

  const refresh = useCallback(async () => (await refreshSession())?.accessToken ?? null, [refreshSession]);

  const value = useMemo(
    () => ({
      user: session?.user ?? null,
      accessToken: session?.accessToken ?? null,
      loading,
      signIn,
      signOut,
      request,
      refresh,
    }),
    [session, loading, signIn, signOut, request, refresh],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth phải nằm trong AuthProvider");
  return context;
}
