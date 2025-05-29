# Hướng Dẫn Thiết Lập SmartMediBox

Tài liệu này cung cấp hướng dẫn chi tiết để thiết lập và chạy SmartMediBox bao gồm cả phần ứng dụng di động và phần phần cứng ESP8266.

## Mục Lục
- [Thiết Lập Firebase](#thiết-lập-firebase)
- [Thiết Lập Ứng Dụng Di Động](#thiết-lập-ứng-dụng-di-động)
- [Thiết Lập Phần Cứng ESP8266](#thiết-lập-phần-cứng-esp8266)

## Thiết Lập Firebase

### 1. Tạo Tài Khoản và Dự Án Firebase
- Truy cập console.firebase.google.com và đăng nhập bằng tài khoản Google
- Nhấp vào "Tạo dự án" (hoặc "Add project")
- Đặt tên cho dự án (ví dụ: "SmartMediBox")
- Bật Google Analytics nếu muốn (tùy chọn)
- Chấp nhận điều khoản dịch vụ và nhấp "Tạo dự án"

### 2. Thiết Lập Realtime Database
- Trong menu bên trái của Firebase Console, chọn "Realtime Database"
- Nhấp "Tạo cơ sở dữ liệu"
- Chọn vị trí máy chủ gần bạn nhất
- Bắt đầu ở chế độ thử nghiệm (hoặc chế độ khóa nếu muốn bảo mật hơn)
- Nhấp "Bật"

### 3. Lấy Thông Tin Cấu Hình Firebase
- Trong Firebase Console, chọn biểu tượng bánh răng (⚙️) bên cạnh "Project Overview" và chọn "Project settings"
- Cuộn xuống và nhấp vào biểu tượng Web (</>) để thêm Firebase vào ứng dụng web
- Đặt tên cho ứng dụng (ví dụ: "SmartMediBox Web")
- Không cần thiết lập Firebase Hosting
- Nhấp "Đăng ký ứng dụng"
- Sao chép thông tin cấu hình Firebase (bao gồm apiKey, authDomain, projectId, storageBucket, messagingSenderId, appId, measurementId và databaseURL)

## Thiết Lập Ứng Dụng Di Động

### 1. Cài Đặt Công Cụ Cần Thiết
```shell
# Cài đặt Node.js (nếu chưa có)
# Truy cập https://nodejs.org và tải phiên bản LTS

# Cài đặt PNPM (nếu sử dụng PNPM thay vì NPM)
npm install -g pnpm

# Cài đặt Expo CLI
npm install -g expo-cli
```

### 2. Clone Dự Án và Cài Đặt Phụ Thuộc
```shell
# Clone dự án (nếu đã có repository)
git clone https://github.com/yourusername/SmartMediBox.git
cd SmartMediBox/mobile

# Nếu sử dụng npm
npm install

# Nếu sử dụng pnpm
pnpm install
```
### 3. Thiết Lập File .env
```shell
EXPO_PUBLIC_FIREBASE_API_KEY=your_api_key
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
EXPO_PUBLIC_FIREBASE_APP_ID=your_app_id
EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID=your_measurement_id
EXPO_PUBLIC_FIREBASE_DATABASE_URL=your_database_url
```
Tạo file .env trong thư mục mobile với nội dung sau (thay các giá trị bằng thông tin cấu hình Firebase của bạn):

### 4. Chạy Ứng Dụng Trong Môi Trường Phát Triển
```shell
# Chạy ứng dụng
npx expo start

# Hoặc với PNPM
pnpm start
```
### 5. Build Ứng Dụng
- Build cho Android
```shell
# Tạo cấu hình native
npx expo prebuild

# Chuyển đến thư mục Android
cd android

# Build APK Debug
./gradlew assembleDebug

# Build APK Release (đã ký)
./gradlew assembleRelease

# Cài đặt APK vào thiết bị đã kết nối
adb install -r app/build/outputs/apk/release/app-release.apk
```
- Build cho iOS (chỉ trên macOS)
```shell
# Tạo cấu hình native
npx expo prebuild

# Chuyển đến thư mục iOS
cd ios

# Cài đặt Pods
pod install

# Mở dự án trong Xcode
open SmartMediBox.xcworkspace

# Trong Xcode: Product > Archive
```
## Thiết Lập Phần Cứng ESP8266

### 1. Linh Kiện Cần Thiết
- NodeMCU ESP8266
- DS3231 RTC (Real-Time Clock)
- DHT11 (Cảm biến nhiệt độ và độ ẩm)
- Màn hình LCD I2C 16x2
- 3 Servo SG90
- Quạt DC 5V
- Buzzer 5V
- Nút nhấn
- Transistor NPN 2N2222 (x2)
- Điện trở 10kΩ (x1 cho nút nhấn), 1kΩ (x2 cho transistor)
- Breadboard và dây nối
- Nguồn 5V (hoặc pin)

### 2. Sơ Đồ Nối Mạch

| **Thiết bị**         | **Chức năng**               | **Kết nối với ESP8266**                         | **Ghi chú**                                                                 |
|----------------------|-----------------------------|--------------------------------------------------|-----------------------------------------------------------------------------|
| Nút nhấn mở cửa      | Gửi tín hiệu mở ngăn thuốc  | D6 (GPIO12)                                      | Dùng `attachInterrupt()` để xử lý ngắt                                     |
| DS3231               | Đồng hồ thời gian thực      | SDA → D2 (GPIO4) SCL → D1 (GPIO5)                | Giao tiếp I2C, dùng chung với LCD                                          |
| LCD 16x2 I2C         | Hiển thị giờ, thông báo     | SDA → D2 (GPIO4) SCL → D1 (GPIO5)                | Giao tiếp I2C                                                               |
| Servo ngăn sáng      | Mở nắp ngăn sáng            | D4 (GPIO16)                                      | Dùng PWM                                                                    |
| Servo ngăn trưa      | Mở nắp ngăn trưa            | D3 (GPIO0)                                       | Dùng PWM                                                                    |
| Servo ngăn tối       | Mở nắp ngăn tối             | D7 (GPIO13)                                      | Dùng PWM                                                                    |
| DHT11                | Đo nhiệt độ, độ ẩm          | D5 (GPIO14)                                      |                                                                             |
| Quạt hút ẩm mini     | Hút ẩm nếu độ ẩm cao        | D8 (GPIO15)                                      | Điều khiển qua transistor NPN                                              |
| Loa (buzzer/amp)     | Báo hiệu, nhạc              | D0                                               | Qua transistor/mạch khuếch đại nếu dùng loa công suất lớn                 |


**Chi Tiết Kết Nối:**
- DS3231 và LCD I2C: Cùng chia sẻ bus I2C (D1 và D2)
- Transistor cho Quạt: Base → ESP8266 qua điện trở 1kΩ, Collector → Quạt (+), Emitter → GND
- Transistor cho Buzzer: Base → ESP8266 qua điện trở 1kΩ, Collector → Buzzer (+), Emitter → GND
- Nguồn: 5V cho ESP8266, Servo, Quạt, và các thiết bị khác

### 3. Cài Đặt Arduino IDE và Thư Viện
- Tải và cài đặt Arduino IDE

- Thêm hỗ trợ ESP8266:
  - Mở Arduino IDE
  - Vào File > Preferences
  - Thêm URL sau vào Additional Boards Manager URLs: http://arduino.esp8266.com/stable/package_esp8266com_index.json
  - Nhấp OK
  - Vào Tools > Board > Boards Manager
  - Tìm "ESP8266" và cài đặt

- Cài đặt các thư viện cần thiết:
  - Vào Sketch > Include Library > Manage Libraries
  - Tìm và cài đặt các thư viện sau:
    - DHT sensor library (by Adafruit)
    - Adafruit Unified Sensor
    - ESP8266WiFi
    - Servo
    - Wire
    - RTClib (by Adafruit)
    - LiquidCrystal I2C
    - Firebase ESP8266 Client (by Mobizt)

### 4. Nạp Code vào ESP8266
- Kết nối ESP8266 với máy tính qua cáp USB
- Mở Arduino IDE
- Tạo một sketch mới và sao chép nội dung từ file vdk.cpp
- Thay đổi thông tin WiFi và Firebase trong code:
```cpp
const char* ssid     = "TenWifi";      // Thay bằng tên WiFi của bạn
const char* password = "MatKhauWifi";  // Thay bằng mật khẩu WiFi của bạn
#define API_KEY       "Your_API_Key"    // Điền API Key Firebase của bạn
#define DATABASE_URL  "Your_Database_URL" // Điền URL Database Firebase của bạn
```
- Chọn Board: Tools > Board > ESP8266 Boards > NodeMCU 1.0
- Chọn Port: Tools > Port > [Cổng COM mà ESP8266 đang kết nối]
- Nạp code: Sketch > Upload

### 5. Kiểm Tra Hoạt Động
- Mở Serial Monitor trong Arduino IDE (Tools > Serial Monitor)
- Đặt tốc độ baud là 9600
- Quan sát dữ liệu từ ESP8266 để xác nhận kết nối WiFi và Firebase thành công
- Kiểm tra LCD hiển thị thông tin thời gian, nhiệt độ và độ ẩm
- Kiểm tra các chức năng:
  - Mở/đóng ngăn thuốc theo thời gian đã cài đặt
  - Phản hồi khi nhấn nút
  - Quạt hoạt động khi nhiệt độ/độ ẩm vượt ngưỡng
  - Chuông cảnh báo khi đến giờ uống thuốc

## Xử Lý Sự Cố

### Ứng Dụng Di Động
- Lỗi Firebase: Kiểm tra lại thông tin cấu hình trong file .env
- Lỗi build ứng dụng: Kiểm tra phiên bản Node.js và các phụ thuộc

### ESP8266
- Không kết nối được WiFi: Kiểm tra SSID và mật khẩu
- Không gửi dữ liệu lên Firebase: Kiểm tra API Key và Database URL
- Servo không hoạt động: Kiểm tra kết nối và nguồn điện
- LCD không hiển thị: Kiểm tra địa chỉ I2C (mặc định 0x27, có thể là 0x3F)
