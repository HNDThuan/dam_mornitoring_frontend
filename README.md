# DykeSafe Monitor 🌊

Frontend **Next.js 14 + Tailwind** kết nối real-time với backend **NestJS + Socket.IO**.

## Cấu trúc project

```
dyke-safe-monitor/
├── app/
│   ├── layout.jsx              # Root layout + NavBar + LiveStatusBar
│   ├── page.jsx                # Dashboard
│   ├── stations/page.jsx       # Danh sách trạm
│   ├── stations/[id]/page.jsx  # Chi tiết trạm — KẾT NỐI BACKEND
│   ├── alerts/page.jsx         # Cảnh báo
│   ├── history/page.jsx        # Lịch sử
│   └── forecast/page.jsx       # Đang phát triển
├── components/
│   ├── NavBar.jsx
│   ├── LiveStatusBar.jsx       # Thanh trạng thái live ở top
│   ├── CameraViewer.jsx        # Camera với phóng to / navigate
│   └── ui.jsx
├── hooks/
│   └── useSensorData.js        # Hook WebSocket + REST realtime
├── lib/
│   ├── api.js                  # REST client (fetchLatest, postSensorData)
│   ├── socket.js               # Socket.IO singleton
│   ├── sensorHelpers.js        # Convert data backend → chart / display
│   ├── mockData.js             # Fallback khi backend chưa có
│   └── statusConfig.js
└── .env.local                  # API_URL config
```

## Cài đặt & chạy

### 1. Backend (NestJS) — chạy trên port 3001

```bash
cd dam_monitoring_system_backend
# Đổi port sang 3001 để không conflict với Next.js
PORT=3001 npm run start:dev
```

Hoặc tạo `.env` trong backend:
```
PORT=3001
```

### 2. Frontend (Next.js) — chạy trên port 3000

```bash
cd dyke-safe-monitor
npm install
npm run dev
```

Mở [http://localhost:3000](http://localhost:3000)

## Kết nối Backend

File `.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_WS_URL=http://localhost:3001
```

## API Backend

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| `POST` | `/sensor/all` | Nhận data từ sensor: `{ freq, amp, waterLevel, moisture, percent? }` |
| `GET`  | `/sensor/latest` | Trả về snapshot mới nhất + history 60 điểm |

### WebSocket events (Socket.IO)

| Event | Direction | Data |
|-------|-----------|------|
| `update` | Server → Client | `SensorSnapshot` mới nhất |
| `history` | Server → Client (on connect) | `SensorHistory` 60 điểm |

### Sensor fields

| Field | Đơn vị | Mô tả |
|-------|--------|-------|
| `freq` | Hz | Tần số rung thân đê |
| `amp` | mm | Biên độ rung |
| `waterLevel` | m | Mực nước |
| `moisture` | % | Độ ẩm thân đê |
| `percent` | % | Phần trăm mực nước (tự tính nếu không gửi) |

## Test nhanh bằng curl

```bash
# Gửi data giả lập
curl -X POST http://localhost:3001/sensor/all \
  -H "Content-Type: application/json" \
  -d '{"freq": 3.2, "amp": 1.5, "waterLevel": 6.12, "moisture": 72}'

# Xem data mới nhất
curl http://localhost:3001/sensor/latest
```

## Fallback

Khi backend chưa chạy, frontend **tự động dùng mock data** — không bị crash. Khi backend start, dữ liệu real-time sẽ replace mock data tự động.
