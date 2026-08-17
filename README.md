# DykeSafe Monitor — Frontend Application 🌊🗺️

Giao diện Web giám sát an toàn đập thủy điện và quản trị hạ tầng quan trắc thời gian thực, xây dựng trên nền tảng **Next.js 14 (App Router)**, **React 18**, **TailwindCSS**, **Bản đồ GIS Leaflet tương tác**, kết nối **WebSocket (Socket.IO)** và hệ thống xuất báo cáo dữ liệu chuyên nghiệp (**Excel / PDF**).

---

## 📋 Mục lục

1. [Tổng quan hệ thống](#1-tổng-quan-hệ-thống)
2. [Ngăn xếp công nghệ (Tech Stack)](#2-ngăn-xếp-công-nghệ-tech-stack)
3. [Phân quyền người dùng & Bảo mật giao diện (RBAC)](#3-phân-quyền-người-dùng--bảo-mật-giao-diện-rbac)
4. [Các trang & Chức năng chính](#4-các-trang--chức-năng-chính)
5. [Hệ thống Xuất Báo Cáo Excel & PDF](#5-hệ-thống-xuất-báo-cáo-excel--pdf)
6. [Bản đồ GIS Leaflet & Tối ưu hóa hiển thị](#6-bản-đồ-gis-leaflet--tối-ưu-hóa-hiển-thị)
7. [Cấu trúc thư mục dự án](#7-cấu-trúc-thư-mục-dự-án)
8. [Cài đặt & Khởi chạy](#8-cài-đặt--khởi-chạy)
9. [Đa ngôn ngữ & Quản trị trạng thái](#9-đa-ngôn-ngữ--quản-trị-trạng-thái)

---

## 1. Tổng quan hệ thống

**DykeSafe Monitor Frontend** là trung tâm điều hành và trực quan hóa dữ liệu giám sát an toàn đập thủy điện:
- **Giám sát trực quan**: Hiển thị liên tục mực nước thượng/hạ lưu, độ ẩm chân đập, độ rung động thân đập (FFT) và camera AI thời gian thực qua WebSocket.
- **Bản đồ GIS thời gian thực**: Bản đồ tương tác đa lớp (Địa hình & Vệ tinh), hiển thị vị trí toàn bộ các công trình đập và trạm quan trắc trên toàn quốc.
- **Cảnh báo khẩn cấp**: Kích hoạt âm thanh và cảnh báo trực quan đa cấp độ (`CRITICAL`, `ALERT`, `WARNING`), hiển thị ảnh bằng chứng AI phát hiện vết nứt từ MinIO, gửi email khẩn cấp tới cán bộ phụ trách.
- **Quản trị hạ tầng thiết bị**: Quản lý chi tiết Gateway (Jetson TX2), Sensor Node (ESP32), Cảm biến và Camera quan sát.
- **Báo cáo chuyên nghiệp**: Xuất báo cáo dữ liệu đo đạc, nhật ký sự cố và nhật ký hệ thống ra định dạng Excel (`.xlsx`) và PDF (`.pdf`) chuẩn xác.

---

## 2. Ngăn xếp công nghệ (Tech Stack)

- **Framework**: [Next.js 14.2](https://nextjs.org/) (App Router, React 18, Server & Client Components).
- **Styling & UI**: [TailwindCSS 3.4](https://tailwindcss.com/), [Lucide React Icons](https://lucide.dev/), Dark Glassmorphism Design System.
- **Bản đồ GIS**: [Leaflet](https://leafletjs.com/), `react-leaflet@^4.2.1` (Tích hợp OpenStreetMap và Esri World Imagery vệ tinh).
- **Biểu đồ & Trực quan hóa**: [Recharts 2.12](https://recharts.org/) (AreaChart, LineChart, BarChart, Sparklines, RadialGauge).
- **Giao tiếp Real-time**: [Socket.IO Client](https://socket.io/docs/v4/client-api/) (Tự động kết nối lại, quản lý luồng telemetry).
- **Hệ thống Xuất Báo Cáo**: [SheetJS (XLSX)](https://sheetjs.com/) cho Excel, [jsPDF](https://github.com/parallax/jsPDF) cho PDF chuẩn quốc gia.
- **Đa ngôn ngữ (i18n)**: Tiếng Việt (`vi`) & Tiếng Anh (`en`).

---

## 3. Phân quyền người dùng & Bảo mật giao diện (RBAC)

Hệ thống tích hợp xác thực Token JWT với cơ chế phân quyền 3 cấp độ (`ADMIN`, `OPERATOR`, `VIEWER`):

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│                                 Phân Quyền RBAC                                  │
├───────────────────┬──────────────────────────────────────────────────────────────┤
│ 👑 ADMIN          │ Toàn quyền quản trị hệ thống toàn quốc:                      │
│ (Quản trị viên)   │ - Phê duyệt tài khoản cán bộ mới, gán đập phụ trách          │
│                   │ - Thêm/sửa/xóa Đập thủy điện & Trạm quan trắc                │
│                   │ - Quản trị Gateway/Node toàn cục & Xem Nhật ký Hệ thống (Logs)│
├───────────────────┼──────────────────────────────────────────────────────────────┤
│ 👷 OPERATOR       │ Quản trị trong phạm vi đập được phân công (assignedDamId):   │
│ (Cán bộ vận hành) │ - Quản lý cấu hình Gateway, Node, Cảm biến, Camera của đập   │
│                   │ - Tiếp nhận cảnh báo, gửi Email khẩn cấp, khắc phục sự cố    │
│                   │ - Xuất báo cáo hiện trạng trạm và dữ liệu lịch sử đo đạc     │
├───────────────────┼──────────────────────────────────────────────────────────────┤
│ 👁️ VIEWER         │ Khách quan sát (Xem công khai hoặc chưa đăng nhập):          │
│ (Khách quan sát)  │ - Chỉ xem bản đồ GIS & chỉ số giám sát trực quan             │
│                   │ - Ẩn hoàn toàn Tab cấu hình phần cứng thiết bị               │
│                   │ - Chặn truy cập Trung tâm Cảnh báo, Quản lý User và Logs     │
└───────────────────┴──────────────────────────────────────────────────────────────┘
```

---

## 4. Các trang & Chức năng chính

### 4.1 Trang Chủ GIS (`/`)
- **Bản đồ toàn quốc**: Trực quan hóa vị trí các đập thủy điện và trạm quan trắc trên nền bản đồ GIS tương tác.
- **Chuyển đổi lớp bản đồ**: Chuyển đổi linh hoạt giữa lớp bản đồ Địa hình (Terrain) và Vệ tinh (Satellite).
- **Thanh trạng thái LiveStatusBar**: Hiển thị tổng số đập, trạm, thiết bị online/offline và nhịp tim dữ liệu realtime.
- **Thẻ tổng quan & Bộ lọc nhanh**: Xem thông số nhanh mực nước, lưu lượng xả, dung tích hồ chứa từng đập.

### 4.2 Quản Lý Đập Thủy Điện (`/dams` & `/dams/[id]`)
- **Danh mục đập**: Hiển thị danh sách toàn bộ các đập kèm chỉ số an toàn (`safe`, `warning`, `danger`).
- **Trang Chi tiết đập (`/dams/[id]`)**:
  - Bản đồ GIS tập trung riêng cho đập được chọn (`Focus Isolation`).
  - Danh sách trạm quan trắc trực thuộc đập.
  - Cấu hình ngưỡng cảnh báo kỹ thuật (Mực nước BĐ1/BĐ2/BĐ3, Độ ẩm, Biên độ rung).
  - Tích hợp widget dự báo thời tiết khu vực đập.
  - Thao tác chỉnh sửa thông tin, tọa độ GPS hoặc xóa đập (dành cho Admin).

### 4.3 Chi Tiết Trạm Quan Trắc (`/stations/[id]`)
Giao diện trạm được phân tách thành 2 phân hệ chuyên biệt:
- **Tab 1: Giám Sát & Trực Quan Hóa (Live Telemetry & GIS)**:
  - Đồng hồ đo mực nước RadialGauge, Sparklines đo độ ẩm và độ rung MPU6050.
  - Phổ tần số rung FFT thời gian thực.
  - Khung xem trực tiếp Camera AI (RTSP / CSI Stream) kèm bounding box phát hiện nứt.
  - **Nút "Xuất báo cáo"**: Xuất phiếu đánh giá hiện trạng an toàn trạm quan trắc ra file PDF.
- **Tab 2: Cấu Hình Thiết Bị Phần Cứng (`StationDevicesTab`)** *(Chỉ hiển thị cho Admin/Operator)*:
  - Quản lý danh sách Gateway Jetson TX2, Sensor Node ESP32, Cảm biến và Camera.
  - Thêm mới Gateway, thêm Node, thêm Cảm biến đo đạc, ghép đôi Node với Camera AI.
  - Theo dõi trạng thái Online/Offline, địa chỉ IP/MAC và thời gian nhận tín hiệu cuối cùng.

### 4.4 Trung Tâm Cảnh Báo Khẩn Cấp (`/alerts`)
- **Âm thanh cảnh báo**: Tự động phát âm thanh cảnh báo khi có sự kiện vi phạm ngưỡng nghiêm trọng.
- **Bộ lọc đa chiều**: Lọc theo mức độ nguy cấp (`CRITICAL`, `ALERT`, `WARNING`), trạng thái xử lý, theo đập và trạm.
- **Bằng chứng thị giác AI**: Hiển thị ảnh chụp hiện trường từ camera AI MinIO, kích thước vết nứt và độ tin cậy.
- **Xử lý sự cố**: Nút xác nhận đã khắc phục sự cố chỉ với 1 click.
- **Gửi Email khẩn cấp**: Tự động lấy danh sách email cán bộ phụ trách đập và phát thông báo qua SMTP.
- **Xuất báo cáo**: Nút **Xuất Excel** danh sách cảnh báo và **Xuất PDF** Phiếu báo cáo sự cố an toàn đập chính thức.

### 4.5 Lịch Sử & Phân Tích CSDL (`/history`)
- **Biểu đồ chuỗi thời gian Recharts**: Trực quan hóa diễn biến thông số cảm biến theo thời gian thực từ CSDL.
- **Biểu đồ phân bố sự cố**: Thống kê số lượng cảnh báo theo từng ngày và mức độ nghiêm trọng.
- **Bảng dữ liệu đo đạc CSDL**: Danh sách chi tiết các bản ghi, hỗ trợ phân trang (10, 20, 50, 100 dòng) và tìm kiếm.
- **Bộ lọc thời gian**: 24 giờ gần nhất, 7 ngày, 30 ngày hoặc toàn bộ lịch sử CSDL.
- **Xuất Excel**: Hỗ trợ xuất **Excel Đo Đạc Telemetry** hoặc **Excel Sự Cố Cảnh Báo**.

### 4.6 Quản Lý Hạ Tầng Gateway & Thiết Bị (`/admin/gateways`)
- Quản trị toàn bộ hệ thống phần cứng Jetson TX2, Node ESP32 và Camera AI.
- Chế độ xem toàn cục cho Quản trị viên (Admin) hoặc tự động lọc theo đập phụ trách cho Cán bộ vận hành (Operator).
- Theo dõi thống kê phần cứng: Số lượng Online, Offline, Error, Tổng Node, Tổng Camera.

### 4.7 Nhật Ký Thao Tác Hệ Thống (`/admin/logs`)
- Giám sát toàn bộ lịch sử đăng nhập, thay đổi thông số đập/trạm, cấu hình ngưỡng và thao tác thiết bị.
- Lọc theo danh mục (`AUTH`, `DAM`, `STATION`, `GATEWAY`, `THRESHOLD`).
- Tìm kiếm từ khóa tức thì (Debounced Search) và phân trang linh hoạt.
- **Nút "Xuất Excel"**: Xuất toàn bộ danh sách nhật ký hệ thống kèm đầy đủ metadata chi tiết.

### 4.8 Quản Lý Người Dùng (`/users`)
- Danh sách tài khoản người dùng trong hệ thống (Dành riêng cho Admin).
- Phê duyệt / Từ chối tài khoản cán bộ mới đăng ký (`PENDING_APPROVAL` -> `APPROVED`).
- Gán đập phụ trách (`assignedDamId`) cho cán bộ vận hành `OPERATOR`.
- Thay đổi vai trò quyền hạn người dùng.

---

## 5. Hệ thống Xuất Báo Cáo Excel & PDF

Hệ thống module hóa xuất báo cáo tại [`lib/exportHelpers.js`](file:///c:/Users/thuan/OneDrive/Máy%20tính/Dam/front/dam_mornitoring_frontend/lib/exportHelpers.js) đảm bảo dữ liệu luôn **chính xác 100%** với cấu trúc entity thực tế:

| Hàm Xuất Báo Cáo | Định Dạng | Vị Trí Sử Dụng | Nội Dung & Đặc Điểm Kỹ Thuật |
| :--- | :---: | :---: | :--- |
| `exportLogsToExcel` | `.xlsx` | `/admin/logs` | Xuất toàn bộ nhật ký Audit Logs khớp bộ lọc; tự động căn chỉnh độ rộng cột; hiển thị metadata JSON chi tiết. |
| `exportAlarmsToExcel` | `.xlsx` | `/alerts`, `/history` | Xuất danh sách sự cố cảnh báo; ánh xạ chính xác `measuredVal`, `thresholdVal`, đơn vị đo, kết quả nhận diện nứt AI và thời gian xử lý. |
| `exportHistoryToExcel` | `.xlsx` | `/history` | Xuất bảng dữ liệu chuỗi thời gian đo đạc telemetry từ CSDL PostgreSQL/TimescaleDB. |
| `exportAlarmToPDF` | `.pdf` | `/alerts` | Xuất Phiếu báo cáo sự cố an toàn đập chuẩn quốc gia; bố cục khung viền chuyên nghiệp; chuẩn hóa ký tự tiếng Việt không lỗi font. |
| `exportStationReportToPDF` | `.pdf` | `/stations/[id]` | Xuất Phiếu đánh giá hiện trạng an toàn trạm quan trắc (Mực nước, Độ rung, Độ ẩm, danh sách sự cố gần nhất). |

---

## 6. Bản đồ GIS Leaflet & Tối ưu hóa hiển thị

- **Component**: `components/DamMapInner.jsx` và `components/LocationPickerMapInner.jsx`.
- **Lớp bản đồ**:
  - **Địa hình (Terrain)**: Bản đồ chuẩn OpenStreetMap.
  - **Vệ tinh (Satellite)**: Bản đồ ảnh vệ tinh độ phân giải cao Esri World Imagery.
- **Tối ưu hóa hiệu năng**:
  - Tích hợp `React.memo` với hàm so sánh `damMapPropsAreEqual` giúp bản đồ **không bị re-render thừa** khi nhận dữ liệu WebSocket.
  - Sử dụng `MapController` với `useRef` lưu giữ vị trí camera và mức zoom mượt mà.
  - Popup giao diện tối `Dark Glassmorphism` tương phản cao, dễ đọc số liệu.

---

## 7. Cấu trúc thư mục dự án

```
dam_mornitoring_frontend/
├── app/
│   ├── layout.jsx                    # Root Layout + Navbar + LiveStatusBar
│   ├── page.jsx                      # Dashboard GIS Bản đồ chính
│   ├── dams/
│   │   ├── page.jsx                  # Danh sách Đập thủy điện
│   │   └── [id]/page.jsx             # Chi tiết Đập & Danh sách Trạm
│   ├── stations/
│   │   └── [id]/page.jsx             # Chi tiết Trạm (Giám sát & Cấu hình phần cứng)
│   ├── alerts/page.jsx               # Trung tâm Cảnh báo khẩn cấp & Xuất PDF/Excel
│   ├── history/page.jsx              # Lịch sử đo đạc & Phân tích biểu đồ CSDL
│   ├── admin/
│   │   ├── gateways/page.jsx         # Quản lý Hạ tầng Gateway Jetson TX2
│   │   └── logs/page.jsx             # Nhật ký thao tác hệ thống (Audit Logs)
│   ├── users/page.jsx                # Quản lý & Phê duyệt người dùng (Admin)
│   ├── profile/page.jsx              # Trang cá nhân & Đổi mật khẩu
│   ├── login/page.jsx                # Đăng nhập hệ thống
│   ├── register/page.jsx             # Đăng ký tài khoản cán bộ
│   └── api/image/route.js            # Proxy xử lý ảnh MinIO
├── components/
│   ├── DamMap.jsx                    # Dynamic SSR Wrapper cho Bản đồ GIS
│   ├── DamMapInner.jsx               # Component Leaflet Map chính
│   ├── StationDevicesTab.jsx         # Tab Quản lý phần cứng Gateway/Node/Sensors
│   ├── CameraViewer.jsx              # Trình phát video Camera RTSP/CSI & AI
│   ├── NavBar.jsx                    # Thanh điều hướng phân quyền theo Role
│   ├── LiveStatusBar.jsx             # Thanh trạng thái nhịp tim hệ thống
│   ├── ui.jsx                        # Thư viện UI components dùng chung (Panel, Card, Badge...)
│   └── form.jsx                      # Form components & Modal dialogs
├── context/
│   ├── AuthContext.jsx               # Quản lý phiên đăng nhập & Phân quyền RBAC
│   └── LanguageContext.jsx           # Quản lý đa ngôn ngữ (vi/en)
├── hooks/
│   ├── useAlarmData.js               # Hook quản lý sự kiện cảnh báo & WebSocket
│   ├── useDamData.js                 # Hook quản lý dữ liệu Đập, Trạm & Silent Refetch
│   └── useSensorData.js              # Hook WebSocket luồng telemetry cảm biến
├── lib/
│   ├── api.js                        # REST API Client kết nối Backend
│   ├── exportHelpers.js              # Hệ thống Xuất Báo Cáo Excel & PDF
│   ├── sensorHelpers.js              # Helper định dạng cảm biến, đơn vị, màu sắc
│   ├── statusConfig.js               # Cấu hình màu sắc trạng thái an toàn
│   └── socket.js                     # Singleton Socket.IO Client
├── public/                           # Tài nguyên tĩnh (Logo, Icons, Audio cảnh báo)
├── tailwind.config.js                # Cấu hình Theme & Bảng màu Design System
├── next.config.js                    # Cấu hình Next.js
└── package.json                      # Danh sách Dependencies
```

---

## 8. Cài đặt & Khởi chạy

### 8.1 Cấu hình biến môi trường
Tạo file `.env.local` tại thư mục gốc của frontend:

```env
# Địa chỉ URL của Backend Service
NEXT_PUBLIC_API_URL=http://localhost:3001

# Địa chỉ WebSocket Server
NEXT_PUBLIC_WS_URL=http://localhost:3001
```

### 8.2 Khởi chạy môi trường phát triển (Development)

```bash
# 1. Cài đặt dependencies
npm install

# 2. Khởi chạy Next.js dev server
npm run dev
```

Mở trình duyệt truy cập: **[http://localhost:3000](http://localhost:3000)**

### 8.3 Build Production & Kiểm tra

```bash
# Build gói tối ưu production
npm run build

# Khởi chạy production server
npm run start
```

---

## 9. Đa ngôn ngữ & Quản trị trạng thái

- **Đa ngôn ngữ (i18n)**: Hỗ trợ chuyển đổi tức thì giữa Tiếng Việt và Tiếng Anh thông qua `LanguageContext` và từ điển tại `lib/i18n/vi.js` & `lib/i18n/en.js`.
- **Cập nhật dữ liệu ngầm (Silent Refetch)**: Mọi thao tác thêm/sửa/xóa hoặc đồng bộ cấu hình tự động kích hoạt chế độ làm mới dữ liệu nền không gây giật hay nhấp nháy giao diện.
- **Hệ thống Toast Notification**: Thông báo kết quả thao tác trực quan ở góc màn hình với thời gian hiển thị tự động 4 giây.
