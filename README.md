# Smart Dormitory Demo (iOS)

Ứng dụng Expo + TypeScript nhỏ để thử quy trình phát triển trên Windows và build iOS qua EAS. App có trang chủ và màn hình nội quy mẫu. Dữ liệu hiện là minh họa, chưa gọi backend.

## Chạy thử trên iPhone

Yêu cầu Node.js và npm. Project dùng Expo SDK 57; Expo Go trên iPhone cũng phải hỗ trợ SDK 57. Expo CLI trên Windows và Expo Go trên iPhone phải đăng nhập **cùng một tài khoản Expo**. Sau đó chạy trong thư mục này:

```powershell
npm install
npx expo login
npx expo whoami
npm run start
```

Trong Expo Go, chạm biểu tượng tài khoản ở góc trên bên phải và đăng nhập bằng tài khoản mà `npx expo whoami` hiển thị. Dùng Camera của iPhone quét QR. Nếu Expo Go đang hiện lỗi tài khoản, bấm **Try again** sau khi đăng nhập. Máy tính và điện thoại cần kết nối mạng phù hợp. Nếu không kết nối được qua LAN, chạy `npx expo start --tunnel`.

## Tạo bản iOS để thử qua TestFlight

Bạn cần tài khoản Expo và tư cách thành viên Apple Developer Program để ký và phân phối bản iOS. Trước tiên, đổi `ios.bundleIdentifier` trong `app.json` thành định danh riêng của bạn và tạo app tương ứng trong App Store Connect. Sau đó cài EAS CLI, đăng nhập, liên kết project và build:

```powershell
npm install --global eas-cli
eas login
eas build:configure
eas build --platform ios --profile production
eas submit --platform ios --latest
```

EAS build trên cloud nên có thể thực hiện các lệnh này từ Windows. Sau khi bản build xuất hiện trong App Store Connect, bật thử nghiệm TestFlight và mời người thử theo hướng dẫn của Apple.

Trước khi phát hành rộng rãi, thay icon Expo mẫu và tên app theo sản phẩm, kết nối API và thay nội quy minh họa bằng dữ liệu chính thức. App Store cần trải qua quy trình xét duyệt của Apple.
