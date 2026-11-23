const baseUrl = process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, "");

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    /** Mã lỗi nghiệp vụ ổn định do BE trả về (vd. DORM_DEBT_UNSETTLED). */
    public code?: string,
    /** Trang nên dẫn người dùng tới để xử lý lỗi. */
    public actionPath?: string,
  ) {
    super(message);
  }
}

export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export type ApiCallOptions = {
  method?: HttpMethod;
  body?: unknown;
  /** Gửi multipart (upload tệp) thay cho JSON. */
  form?: FormData;
  accessToken?: string | null;
};

/** Hàm gọi API đã gắn sẵn phiên đăng nhập (xem `useAuth().request`). */
export type ApiClient = <T>(
  path: string,
  options?: Omit<ApiCallOptions, "accessToken">,
) => Promise<T>;

export async function apiCall<T>(
  path: string,
  { method = "POST", body, form, accessToken }: ApiCallOptions = {},
): Promise<T> {
  if (!baseUrl)
    throw new ApiError("Chưa cấu hình EXPO_PUBLIC_API_URL trong .env.", 0);

  let response: Response;
  try {
    response = await fetch(`${baseUrl}${path}`, {
      method,
      headers: {
        ...(form ? {} : { "Content-Type": "application/json" }),
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      },
      body: form ?? (body === undefined ? undefined : JSON.stringify(body)),
    });
  } catch (error) {
    if (__DEV__) console.warn(`[api] ${method} ${path} failed:`, error);
    throw new ApiError(
      "Không thể kết nối máy chủ. Vui lòng kiểm tra kết nối mạng.",
      0,
    );
  }

  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    // 413 do proxy (nginx) chặn trả về HTML, không có `message`.
    const fallback = response.status === 413
      ? "Tệp tải lên quá lớn so với giới hạn của máy chủ."
      : "Yêu cầu không thành công. Vui lòng thử lại.";
    throw new ApiError(
      payload?.message || fallback,
      response.status,
      payload?.code ?? undefined,
      payload?.actionPath ?? undefined,
    );
  }
  if (response.status === 204) return undefined as T;
  const text = await response.text();
  return (text ? JSON.parse(text) : undefined) as T;
}

export async function apiRequest<T>(
  path: string,
  body?: unknown,
  accessToken?: string,
): Promise<T> {
  return apiCall<T>(path, { method: "POST", body, accessToken });
}

export function isNotFound(error: unknown): boolean {
  return error instanceof ApiError && error.status === 404;
}

export function errorMessage(error: unknown): string {
  return error instanceof Error && error.message
    ? error.message
    : "Yêu cầu không thành công. Vui lòng thử lại.";
}
