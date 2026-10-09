import type { Gender } from "../enums/profile.enum";

// ---- Dữ liệu server trả về / nhận ----

export interface EmergencyContactResponse {
  id: string;
  fullName: string;
  relationship: string;
  phone: string;
  address: string | null;
}

/** `GET /student/profile` — hồ sơ sinh viên (StudentResponse), chỉ các trường mobile dùng. */
export interface StudentProfileResponse {
  id: string;
  studentCode: string;
  fullName: string;
  gender: Gender;
  dateOfBirth: string | null;
  cccd: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  faculty: string | null;
  course: string | null;
  educationSystem: string | null;
  className: string | null;
  major: string | null;
  university: string | null;
  currentAcademicYear: string | null;
  placeOfBirth: string | null;
  nationality: string | null;
  ethnicity: string | null;
  region: string | null;
  documentType: string | null;
  documentIssueDate: string | null;
  documentIssuedBy: string | null;
  documentExpiryDate: string | null;
  contactAddress: string | null;
  accountHolder: string | null;
  accountNumber: string | null;
  bankName: string | null;
  bankBranch: string | null;
  emergencyContacts: EmergencyContactResponse[];
}

/** `POST /auth/change-password`. */
export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

// ---- Dữ liệu cho màn hình ----

/** Ô mật khẩu trong bảng đổi mật khẩu. */
export interface PasswordDraft {
  current: string;
  next: string;
  confirm: string;
}
