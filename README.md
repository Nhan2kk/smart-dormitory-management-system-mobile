# KTX DN Mobile

Ứng dụng Expo SDK 57 cho sinh viên. Đăng nhập gọi backend thật; các màn hình bên trong hiện dùng dữ liệu mock (lớp `*Repository` trong từng `features/*/*.mock.ts`) để thay bằng API sau.

Màn hình: Trang chủ · Điện & nước (biểu đồ, lịch tiêu thụ theo ngày) · Yêu cầu (hỗ trợ/chuyển phòng/trả phòng, tất toán, hoàn tiền) · Cá nhân (ảnh đại diện, thông tin, đổi mật khẩu) · Giao diện & ngôn ngữ (sáng/tối, 4 màu chủ đạo, Việt/Anh) · Công nợ + hoá đơn + biên lai + thanh toán QR · Thông báo · Hồ sơ lưu trú · Đăng ký KTX (đơn của tôi, 5 bước, giữ chỗ/huỷ) · Nhận phòng (kiểm tra tài sản) · Trợ lý AI (lịch sử trò chuyện).

Giao diện dùng theme động (`src/shared/theme.tsx`: `useTheme`, `makeStyles`), đa ngôn ngữ (`src/shared/i18n`: `useI18n().t/l`), lớp kính mờ `Glass` (expo-blur; Android dùng lớp phủ bán trong suốt) và ảnh thật từ Unsplash (`src/shared/images.ts`, cần mạng; ảnh nội bộ làm ảnh chờ).

## Cấu trúc

```
assets/                 Ảnh dùng trong ứng dụng
src/app/                Route của Expo Router (chỉ re-export màn hình)
  (app)/                Nhóm cần đăng nhập
    (tabs)/             Thanh tab nổi: Trang chủ, Điện nước, [+], Yêu cầu, Cá nhân
src/features/<feature>/ Màn hình, component và dữ liệu mock của từng tính năng
src/shared/ui/          Design system: Button, Card, Chip, Field, BottomSheet, Toast…
src/shared/charts/      Biểu đồ SVG (area, donut, bar), QR minh hoạ
src/shared/theme.ts     Màu, khoảng cách, bo góc, đổ bóng
```

Route chỉ nối màn hình với điều hướng. Mã nghiệp vụ đặt trong `features`; phần dùng chung đặt trong `shared`. Khi thêm tính năng, tạo thư mục riêng trong `features`, đặt kiểu dữ liệu, API và UI của tính năng ở đó.

## Chạy ứng dụng

1. `npm install`
2. Tạo `.env` theo `.env.example`; `EXPO_PUBLIC_API_URL` mặc định dùng cùng backend với web: `https://sdms-server.duckdns.org/api/sdms/v1`.
3. `npx expo start --clear`

Với backend đã triển khai trên HTTPS, app có thể gọi cùng URL trên emulator và điện thoại thật khi có Internet. Nếu chuyển sang backend local, Android emulator dùng `http://10.0.2.2:8080/api/sdms/v1`; điện thoại thật dùng IP LAN của máy chạy backend. URL `EXPO_PUBLIC_*` được đóng vào app nên không đặt bí mật ở đây.

Đăng nhập gửi `username` (MSSV) và `password` đến `POST /auth/login`. App chỉ nhận vai trò `STUDENT`, lưu refresh token trong `expo-secure-store`, làm mới phiên khi mở lại app, và gọi `POST /auth/logout` khi đăng xuất. Màn hình đăng ký tài khoản chưa có vì backend hiện dùng tài khoản sinh viên được cấp sẵn.

Xem UI mà không cần tài khoản: đặt `EXPO_PUBLIC_MOCK_AUTH=true` trong `.env` — mọi MSSV/mật khẩu đều đăng nhập được, không gọi backend. Phiên mock chỉ nằm trong bộ nhớ nên tải lại app sẽ quay về màn hình chào.

## Kiểm tra

`npm run typecheck` và `npm run lint`.
