const baseUrl = process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, "");

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}

export async function apiRequest<T>(
  path: string,
  body?: unknown,
  accessToken?: string,
): Promise<T> {
  if (!baseUrl)
    throw new ApiError("Chưa cấu hình EXPO_PUBLIC_API_URL trong .env.", 0);

  let response: Response;
  try {
    response = await fetch(`${baseUrl}${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiError(
      "Không thể kết nối máy chủ. Kiểm tra mạng và địa chỉ API.",
      0,
    );
  }

  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    throw new ApiError(
      payload?.message || "Yêu cầu không thành công. Vui lòng thử lại.",
      response.status,
    );
  }
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}
