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
import { AuthService } from "../../services/auth.service";
import { AuthResponse, AuthUser } from "../../models/auth.model";
import { SessionStore } from "./SessionStore";

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
    /**
     * Mở app như Zalo: có phiên đã lưu thì vào thẳng (access token để trống, request đầu tiên tự làm mới),
     * đồng thời làm mới phiên ngầm. Chỉ đăng xuất khi server từ chối phiên; mất mạng thì vẫn giữ.
     */
    async function restore() {
      const saved = await SessionStore.load();
      if (!saved) {
        if (mounted) setLoading(false);
        return;
      }
      if (saved.user && mounted) {
        const cached: AuthResponse = {
          accessToken: "",
          refreshToken: saved.refreshToken,
          user: saved.user,
        };
        sessionRef.current = cached;
        setSession(cached);
        setLoading(false);
      }
      try {
        const refreshed = await AuthService.refresh(saved.refreshToken);
        if (refreshed.user.role === "STUDENT") {
          await SessionStore.save(refreshed.refreshToken, refreshed.user);
          if (mounted) {
            sessionRef.current = refreshed;
            setSession(refreshed);
          }
        } else {
          await SessionStore.clear();
          if (mounted) setSession(null);
        }
      } catch (error) {
        if (SessionStore.isRejected(error)) {
          await SessionStore.clear();
          if (mounted) setSession(null);
        }
        // Lỗi mạng / server tạm lỗi: giữ phiên đã lưu, lần gọi API sau sẽ làm mới lại.
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
        user: {
          id: "mock",
          username: username.trim(),
          fullName: "Nguyễn Hoàng Nam",
          role: "STUDENT",
        },
      });
      return;
    }
    const result = await AuthService.login(username.trim(), password);
    if (result.user.role !== "STUDENT") {
      await AuthService.logout(result.refreshToken, result.accessToken).catch(
        () => undefined,
      );
      throw new Error("Ứng dụng này dành cho tài khoản sinh viên.");
    }
    await SessionStore.save(result.refreshToken, result.user);
    setSession(result);
  }, []);

  const signOut = useCallback(async () => {
    const token = session?.refreshToken;
    const accessToken = session?.accessToken;
    setSession(null);
    if (MOCK_AUTH) return;
    await SessionStore.clear();
    if (!token) return;
    // Phiên mở từ máy (chưa có access token): làm mới để có token rồi thu hồi trên server.
    const current = accessToken
      ? { refreshToken: token, accessToken }
      : await AuthService.refresh(token).catch(() => null);
    if (current)
      await AuthService.logout(current.refreshToken, current.accessToken).catch(
        () => undefined,
      );
  }, [session]);

  /** Dùng chung một lượt refresh khi nhiều request cùng gặp 401. */
  const refreshSession = useCallback(async () => {
    const current = sessionRef.current;
    if (!current || MOCK_AUTH) return null;
    refreshing.current ??= AuthService.refresh(current.refreshToken)
      .then(async (next) => {
        await SessionStore.save(next.refreshToken, next.user);
        sessionRef.current = next;
        setSession(next);
        return next;
      })
      .catch(async (error: unknown) => {
        // Chỉ đăng xuất khi server từ chối phiên; mất mạng thì giữ phiên để thử lại sau.
        if (!SessionStore.isRejected(error)) return null;
        await SessionStore.clear();
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
    async <T,>(
      path: string,
      options: Omit<ApiCallOptions, "accessToken"> = {},
    ): Promise<T> => {
      try {
        return await apiCall<T>(path, {
          ...options,
          accessToken: sessionRef.current?.accessToken,
        });
      } catch (error) {
        if (!(error instanceof ApiError) || error.status !== 401) throw error;
        const next = await refreshSession();
        if (!next) throw error;
        return apiCall<T>(path, { ...options, accessToken: next.accessToken });
      }
    },
    [refreshSession],
  ) as ApiClient;

  const refresh = useCallback(
    async () => (await refreshSession())?.accessToken ?? null,
    [refreshSession],
  );

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
