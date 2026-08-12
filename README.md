# DykeSafe Monitor — Frontend Application 🌊🗺️

Giao diện Web giám sát an toàn đập thủy điện và trạm quan trắc theo thời gian thực, xây dựng với **Next.js 14 (App Router)**, **TailwindCSS**, **Leaflet GIS Map**, và kết nối **WebSocket Socket.IO** tới backend NestJS.

---

## 📋 Mục lục

1. [Tính năng nổi bật](#1-tính-năng-nổi-bật)
2. [Cấu trúc thư mục dự án](#2-cấu-trúc-thư-mục-dự-án)
3. [Công nghệ & Thư viện](#3-công-nghệ--thư-viện)
4. [Bản đồ GIS Leaflet & Tọa độ Địa lý](#4-bản-đồ-gis-leaflet--tọa-độ-địa-lý)
5. [Cài đặt & Hướng dẫn sử dụng](#5-cài-đặt--hướng-dẫn-sử-dụng)
6. [Quản lý Trạng thái & Tối ưu hóa Performance](#6-quản-lý-trạng-thái--tối-ưu-hóa-performance)

---

## 1. Tính năng nổi bật

- 📊 **Dashboard Giám Sát Real-time**: Theo dõi liên tục mực nước, lưu lượng xả, tần số rung đê/đập và độ ẩm đất.
- 🗺️ **Bản đồ GIS Leaflet Tương tác**:
  - Hỗ trợ chuyển đổi giữa 2 lớp bản đồ: **🗺️ Địa hình (Terrain)** & **🛰️ Vệ tinh (Satellite)**.
  - Hiển thị vị trí Đập & Trạm quan trắc dựa trên tọa độ GPS Vĩ độ (°N) / Kinh độ (°E).
  - Tự động lọc hiển thị theo đập chỉ định (`Focus Isolation`) và chống re-render bản đồ với `React.memo`.
  - Popup giao diện tối tương phản cao (`Dark Glassmorphism`), chữ rõ ràng, dễ nhìn.
- 🏢 **Quản lý Đập Thủy Điện (`/dams` & `/dams/[id]`)**:
  - Tạo, Chỉnh sửa thông tin/tọa độ, Xóa đập thủy điện.
  - Xem danh sách trạm quan trắc trực thuộc từng đập.
  - Tự động sinh ID dạng slug tiếng Việt không dấu (`dam_dap_thuy_dien_hoa_binh`), vô hiệu hóa chỉnh sửa ID.
- 📡 **Quản lý Trạm Quan Trắc (`/stations/[id]`)**:
  - Biểu đồ thời gian thực về mực nước, độ ẩm, biên độ rung và phổ tần số rung FFT.
  - Bản đồ GIS riêng cho từng trạm.
  - Nút Chỉnh sửa thông tin trạm / ngưỡng báo động (BĐ1, BĐ2, BĐ3) và Nút Xóa trạm trực tiếp.
- 🛡️ **Quản lý Cụm Cảm Biến (`/admin/sensor-clusters`)**:
  - Quản lý danh sách Cụm cảm biến và Thiết bị cảm biến trực thuộc.
  - Mã cụm định dạng slug kèm vị trí (`cluster_tram_tan_ap_1_k25_500`).
  - Nút chuyển hướng trực tiếp sang trang Chi tiết Trạm tương ứng.
- ⚡ **Cập nhật dữ liệu ngầm (Silent Refetch)**:
  - Tất cả các thao tác CRUD (Tạo/Sửa/Xóa) tự động cập nhật dữ liệu mới lên màn hình trong 0ms mà **KHÔNG cần reload hay làm nhấp nháy trang**.
  - Hệ thống thông báo **Toast nổi** góc trên bên phải màn hình.

---

## 2. Cấu trúc thư mục dự án

```
dam_mornitoring_frontend/
├── app/
│   ├── layout.jsx                    # Root Layout + Navbar + LiveStatusBar + Footer
│   ├── page.jsx                      # Dashboard chính
│   ├── dams/
│   │   ├── page.jsx                  # Trang danh sách & Quản lý Đập thủy điện
│   │   └── [id]/
│   │       └── page.jsx              # Trang Chi tiết Đập (Sửa/Xóa Đập, Danh sách Trạm)
│   ├── stations/
│   │   └── [id]/
│   │       └── page.jsx              # Trang Chi tiết Trạm (Sửa/Xóa Trạm, Chart Telemetry)
│   ├── admin/
│   │   └── sensor-clusters/
│   │       └── page.jsx              # Trang Quản lý Cụm Cảm Biến & Thiết Bị
│   ├── alerts/page.jsx               # Nhật ký cảnh báo
│   └── history/page.jsx              # Lịch sử dữ liệu
├── components/
│   ├── DamMap.jsx                    # Dynamic SSR Wrapper cho Leaflet Map
│   ├── DamMapInner.jsx               # Component Bản đồ GIS Leaflet chính
│   ├── NavBar.jsx                    # Thanh điều hướng top
│   ├── LiveStatusBar.jsx             # Thanh thông số trực tuyến
│   └── ui.jsx                        # Layout utilities & components
├── hooks/
│   ├── useDamData.js                 # Custom Hook quản lý REST Data + Silent Refetch
│   └── useSensorData.js              # Hook WebSocket Socket.IO real-time
├── lib/
│   ├── api.js                        # REST API Client
│   └── socket.js                     # Singleton Socket.IO Client
└── .env.local                        # Cấu hình URL Backend API & WS
```

---

## 3. Công nghệ & Thư viện

- **Framework**: Next.js 14 (App Router, React 18)
- **Styling**: TailwindCSS, Lucide Icons, Glassmorphism UI
- **Map / GIS**: Leaflet, `react-leaflet@^4.2.1`
- **Charts**: Recharts
- **Real-time**: `socket.io-client`

---

## 4. Bản đồ GIS Leaflet & Tọa độ Địa lý

- **Component**: `components/DamMapInner.jsx`
- **Tính năng nổi bật**:
  - **Địa hình vs Vệ tinh**: Chuyển đổi linh hoạt giữa bản đồ OpenStreetMap & Esri World Imagery.
  - **Tối ưu Performance**: Sử dụng `React.memo` với hàm so sánh `damMapPropsAreEqual` và `MapController` với `useRef` giúp bản đồ **chỉ render 1 lần duy nhất khi load trang** và khi sửa tọa độ đập/trạm, tránh giật lag khi re-render.
  - **Chỉ hiển thị Đập được chọn**: Khi xem trang chi tiết đập (`/dams/[id]`), bản đồ chỉ tập trung hiển thị đập đó và các trạm phụ thuộc.

---

## 5. Cài đặt & Hướng dẫn sử dụng

### 5.1 Cấu hình biến môi trường
Tạo file `.env.local` ở thư mục gốc frontend:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_WS_URL=http://localhost:3001
```

### 5.2 Cài đặt & Chạy ứng dụng

```bash
# Cài đặt thư viện dependencies
npm install

# Chạy giao diện phát triển (Development mode)
npm run dev
```

Mở trình duyệt truy cập: **[http://localhost:3000](http://localhost:3000)**

---

## 6. Quản lý Trạng thái & Tối ưu hóa Performance

- **Silent Refetching**: Trong `useDamData()`, cờ `silent = true` giúp ứng dụng tải lại dữ liệu mới từ backend ngầm mà không thay đổi trạng thái `loading`, không làm màn hình xuất hiện spinner chờ.
- **Auto Toast Notification**: Các hành động thành công hoặc thất bại đều được phản hồi tức thì thông qua Banner Toast nổi ở góc phải trên cùng màn hình trong 4 giây.
