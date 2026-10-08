import { L } from "../../shared/i18n/localized";
import type { Localized } from "../../shared/i18n/types";

export type EmergencyContact = { id: string; fullName: string; relationship: string; phone: string };

export type StudentProfile = {
  fullName: string;
  studentCode: string;
  className: string;
  university: Localized;
  faculty: Localized;
  major: Localized;
  program: Localized;
  cohort: string;
  academicYear: string;
  email: string;
  phone: string;
  birthDate: string;
  birthPlace: Localized;
  gender: "male" | "female";
  nationality: Localized;
  ethnicity: Localized;
  hometown: Localized;
  permanentAddress: string;
  currentAddress: Localized;
  identity: { number: string; issuedAt: string; issuedBy: Localized; expiresAt: string };
  emergencyContacts: EmergencyContact[];
  bank: { name: string; accountNumber: string; holder: string; branch: string };
  account: { username: string; lastPasswordChange: string };
};

/** Nguồn dữ liệu hồ sơ sinh viên (mock) — thay bằng API khi tích hợp. */
export class ProfileRepository {
  private static readonly profile: StudentProfile = {
    fullName: "Nguyễn Hoàng Nam",
    studentCode: "SV2026001",
    className: "DHKTPM18A",
    university: L("Trường Đại học Công nghiệp TP.HCM", "Industrial University of HCMC"),
    faculty: L("Công nghệ thông tin", "Information Technology"),
    major: L("Kỹ thuật phần mềm", "Software Engineering"),
    program: L("Chính quy", "Full-time"),
    cohort: "2022",
    academicYear: "2026 – 2027",
    email: "namnh.sv001@example.com",
    phone: "0987 654 321",
    birthDate: "2004-08-12",
    birthPlace: L("TP. Hồ Chí Minh", "Ho Chi Minh City"),
    gender: "male",
    nationality: L("Việt Nam", "Vietnamese"),
    ethnicity: L("Kinh", "Kinh"),
    hometown: L("Hà Nội", "Hanoi"),
    permanentAddress: "123 Đường Láng, Phường Láng Thượng, Quận Đống Đa, Hà Nội",
    currentAddress: L("KTX Tòa A, Tầng 1, Phòng A101", "Dormitory Building A, Floor 1, Room A101"),
    identity: { number: "001204045678", issuedAt: "2022-07-15", issuedBy: L("Cục CSQLHC về TTXH", "Police Dept. for Administrative Management"), expiresAt: "2032-07-15" },
    emergencyContacts: [
      { id: "ec-01", fullName: "Nguyễn Văn Hùng", relationship: "Bố", phone: "0912 345 678" },
      { id: "ec-02", fullName: "Trần Thị Lan", relationship: "Mẹ", phone: "0912 987 654" },
    ],
    bank: { name: "Vietcombank", accountNumber: "0123 4567 8912", holder: "NGUYEN HOANG NAM", branch: "Gò Vấp" },
    account: { username: "namnh123", lastPasswordChange: "2026-05-10T14:30:00+07:00" },
  };

  static get(): StudentProfile {
    return ProfileRepository.profile;
  }

  static initials(name: string): string {
    const parts = name.trim().split(/\s+/);
    return (parts.length > 1 ? parts[parts.length - 2][0] + parts[parts.length - 1][0] : (parts[0]?.[0] ?? "S")).toUpperCase();
  }
}
