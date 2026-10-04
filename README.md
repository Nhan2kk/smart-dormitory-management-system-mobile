# KTX DN Mobile

Ứng dụng Expo SDK 57 cho sinh viên. Luồng hiện có: màn hình chào → đăng nhập qua backend → dashboard. Các nội dung dịch vụ và thông báo trên dashboard hiện là UI minh họa.

## Cấu trúc

```
assets/                 Ảnh dùng trong ứng dụng
src/app/                Route và layout của Expo Router
  (tabs)/               Dashboard và thanh điều hướng 5 mục
src/features/auth/      API, trạng thái phiên và lưu refresh token
src/features/dashboard/ Giao diện dashboard và màn hình phụ
src/shared/             API client, màu dùng chung
```

Route chỉ nối màn hình với điều hướng. Mã nghiệp vụ đặt trong `features`; phần dùng chung đặt trong `shared`. Khi thêm tính năng, tạo thư mục riêng trong `features`, đặt kiểu dữ liệu, API và UI của tính năng ở đó.

## Chạy ứng dụng

1. `npm install`
2. Tạo `.env` theo `.env.example`; `EXPO_PUBLIC_API_URL` mặc định dùng cùng backend với web: `https://sdms-server.duckdns.org/api/sdms/v1`.
3. `npx expo start --clear`

Với backend đã triển khai trên HTTPS, app có thể gọi cùng URL trên emulator và điện thoại thật khi có Internet. Nếu chuyển sang backend local, Android emulator dùng `http://10.0.2.2:8080/api/sdms/v1`; điện thoại thật dùng IP LAN của máy chạy backend. URL `EXPO_PUBLIC_*` được đóng vào app nên không đặt bí mật ở đây.

Đăng nhập gửi `username` (MSSV) và `password` đến `POST /auth/login`. App chỉ nhận vai trò `STUDENT`, lưu refresh token trong `expo-secure-store`, làm mới phiên khi mở lại app, và gọi `POST /auth/logout` khi đăng xuất. Màn hình đăng ký tài khoản chưa có vì backend hiện dùng tài khoản sinh viên được cấp sẵn.

## Kiểm tra

`npm run typecheck` và `npm run lint`.
