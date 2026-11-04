export interface AuthUser {
  id: string;
  username: string;
  fullName: string;
  role: string;
  permissions?: string[];
  /** Ảnh đại diện trên server; null/không có = hiển thị chữ cái đầu. */
  avatarUrl?: string | null;
}

export interface AvatarResponse {
  avatarUrl: string | null;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
}
