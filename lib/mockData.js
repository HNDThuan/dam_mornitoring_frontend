export const DAMS = [
  { id: 1, name: 'Đập Thủy điện Hòa Bình', status: 'safe',    waterLevel: 105.2, flow: 1200, fillPct: 78 },
  { id: 2, name: 'Đập Sơn La',             status: 'warning', waterLevel: 212.5, flow: 3450, fillPct: 88 },
  { id: 3, name: 'Đập Lai Châu',           status: 'safe',    waterLevel: 295.1, flow:  850, fillPct: 65 },
  { id: 4, name: 'Đập Tuyên Quang',        status: 'safe',    waterLevel: 118.3, flow:  620, fillPct: 72 },
]

export const STATIONS = [
  { id: 1, name: 'Trạm Tân Ấp 1',  location: 'Hoàn Kiếm, Hà Nội', river: 'Sông Hồng', km: 'K25+500',  status: 'danger',  waterLevel: 12.5,  change: +0.4,  pressure: 450, flow: 3200, humidity: 78, bd3: 12.0, bd2: 10.5, bd1: 9.0,  alerts: ['Vượt BĐ III', 'Độ ẩm cao'],      lastUpdate: '10:45 AM' },
  { id: 2, name: 'Trạm Nhật Tân',   location: 'Tây Hồ, Hà Nội',    river: 'Sông Hồng', km: 'K32+200',  status: 'warning', waterLevel:  9.8,  change: +0.1,  pressure: 280, flow: 2100, humidity: 62, bd3: 11.0, bd2:  9.5, bd1: 8.5,  alerts: ['Tiệm cận BĐ II'],                 lastUpdate: '10:42 AM' },
  { id: 3, name: 'Trạm Long Biên',  location: 'Long Biên, Hà Nội',  river: 'Sông Hồng', km: 'K18+000',  status: 'safe',    waterLevel:  6.2,  change: -0.2,  pressure: 120, flow: 1400, humidity: 45, bd3: 10.0, bd2:  8.5, bd1: 7.5,  alerts: ['Hệ thống ổn định'],               lastUpdate: '10:40 AM' },
  { id: 4, name: 'Trạm Sơn Tây',    location: 'Sơn Tây, Hà Nội',   river: 'Sông Đà',   km: 'K45+000',  status: 'warning', waterLevel:  8.1,  change: +0.5,  pressure: 310, flow: 2450, humidity: 58, bd3:  9.5, bd2:  8.0, bd1: 7.0,  alerts: ['Áp lực tăng 15%'],                lastUpdate: '10:38 AM' },
  { id: 5, name: 'Trạm Hà Nội',     location: 'Hoàn Kiếm, Hà Nội', river: 'Sông Hồng', km: 'K120+000', status: 'warning', waterLevel:  6.12, change: +0.05, pressure: 200, flow: 1800, humidity: 52, bd3:  8.5, bd2:  7.0, bd1: 6.0,  alerts: ['BĐ1 – Tăng nhanh'],              lastUpdate: '10:45 AM' },
  { id: 6, name: 'Trạm Hưng Yên',   location: 'Hưng Yên',           river: 'Sông Hồng', km: 'TR-HY-01', status: 'danger',  waterLevel:  7.45, change: +0.3,  pressure: 380, flow: 2800, humidity: 71, bd3:  7.0, bd2:  6.5, bd1: 5.5,  alerts: ['Vượt BĐ3', 'Khẩn cấp'],          lastUpdate: '10:45 AM' },
  { id: 7, name: 'Trạm Nam Định',   location: 'Nam Định',           river: 'Sông Đào',  km: 'TR-ND-05', status: 'warning', waterLevel:  4.2,  change: +0.1,  pressure: 180, flow: 1200, humidity: 48, bd3:  5.0, bd2:  4.0, bd1: 3.5,  alerts: ['Báo động 2'],                     lastUpdate: '10:15 AM' },
  { id: 8, name: 'Trạm Phủ Lý',     location: 'Phủ Lý, Hà Nam',    river: 'Sông Đáy',  km: 'TR-PL-02', status: 'safe',    waterLevel:  3.8,  change:  0,    pressure:  95, flow:  800, humidity: 40, bd3:  6.5, bd2:  5.5, bd1: 4.5,  alerts: ['Bình thường'],                    lastUpdate: '10:00 AM' },
]

export const ALERTS_DATA = [
  { id: 1, level: 'danger',  title: 'Vỡ đê cục bộ K25+500',   time: '10:45 AM', date: '24/05/2024', location: 'H. Đan Phượng, HN', river: 'Đê Hữu Hồng', desc: 'Cảm biến mực nước vượt BĐ3. Camera AI phát hiện rò rỉ chân đê. Dòng chảy tràn 2.5 m/s.', waterLevel: 12.5, pressure: 450, rainfall: 15.2 },
  { id: 2, level: 'warning', title: 'Sạt lở chân đê K32+200',  time: '10:30 AM', date: '24/05/2024', location: 'H. Gia Lâm, HN',   river: 'Sông Hồng',   desc: 'Phát hiện vết nứt dài 5 m, nguy cơ sạt lở cao do mưa lớn kéo dài.',                       waterLevel:  9.8, pressure: 280, rainfall: 12.0 },
  { id: 3, level: 'info',    title: 'Mực nước dâng nhanh',     time: '09:15 AM', date: '24/05/2024', location: 'Sơn Tây, HN',       river: 'Sông Đà',     desc: 'Trạm Sơn Tây báo mực nước tăng 0.5 m/h vượt mức bình thường 3 tiếng liên tiếp.',         waterLevel:  8.1, pressure: 310, rainfall:  8.5 },
  { id: 4, level: 'info',    title: 'Cảnh báo xâm nhập mặn',  time: '08:45 AM', date: '24/05/2024', location: 'Cống Lân, Thái Bình',river: 'Cửa sông',    desc: 'Độ mặn cửa sông vượt mức cho phép 2.3 g/L. Nguy cơ ảnh hưởng vùng canh tác.',           waterLevel:  2.1, pressure:  80, rainfall:  0   },
  { id: 5, level: 'warning', title: 'Áp lực nước tăng cao',   time: '09:30 AM', date: '24/05/2024', location: 'Sông Đà – Km 45',   river: 'Sông Đà',     desc: 'Áp lực lên thân đê tại Trạm Sơn Tây tăng 15% so với trung bình mùa này.',               waterLevel:  8.1, pressure: 310, rainfall: 10.5 },
]

export const HISTORY_RECORDS = [
  { time: '24/08/2023 15:30', code: 'TR-HY-01', location: 'Sông Hồng (Hưng Yên)',  level: '7.45m', alertLv: 'danger',  statusLv: 'warning', statusLbl: 'ĐANG XỬ LÝ'   },
  { time: '24/08/2023 14:15', code: 'TR-ND-05', location: 'Sông Đào (Nam Định)',   level: '4.20m', alertLv: 'warning', statusLv: 'safe',    statusLbl: 'ĐÃ KIỂM SOÁT' },
  { time: '24/08/2023 12:00', code: 'TR-PL-02', location: 'Sông Đáy (Phủ Lý)',    level: '3.80m', alertLv: 'info',    statusLv: 'safe',    statusLbl: 'BÌNH THƯỜNG'   },
  { time: '23/08/2023 20:30', code: 'TR-HN-03', location: 'Sông Hồng (Hà Nội)',   level: '6.12m', alertLv: 'info',    statusLv: 'safe',    statusLbl: 'ĐÃ KIỂM SOÁT' },
  { time: '23/08/2023 16:00', code: 'TR-ST-01', location: 'Sông Đà (Sơn Tây)',    level: '8.10m', alertLv: 'warning', statusLv: 'safe',    statusLbl: 'ĐÃ KIỂM SOÁT' },
  { time: '22/08/2023 10:15', code: 'TR-TA-01', location: 'Sông Hồng (Tân Ấp 1)', level: '11.20m',alertLv: 'danger',  statusLv: 'safe',    statusLbl: 'ĐÃ KIỂM SOÁT' },
]

export const genWaterData = (base, bd3, n = 24) =>
  Array.from({ length: n }, (_, i) => ({
    time: `${String(i).padStart(2, '0')}:00`,
    level: +(base - 2 + (i / n) * 2.5 + Math.sin(i / 3) * 0.4 + (Math.random() - .5) * .15).toFixed(2),
    bd3,
  }))

export const genHistoryLine = () => [
  { d: '01/08', c: 5.2,  l71: 8.1, l96: 7.4 },
  { d: '05/08', c: 5.8,  l71: 8.1, l96: 7.4 },
  { d: '10/08', c: 6.5,  l71: 8.1, l96: 7.4 },
  { d: '15/08', c: 6.1,  l71: 8.1, l96: 7.4 },
  { d: '18/08', c: 6.9,  l71: 8.1, l96: 7.4 },
  { d: '20/08', c: 7.2,  l71: 8.1, l96: 7.4 },
  { d: '24/08', c: 7.45, l71: 8.1, l96: 7.4 },
]

export const genHistoryBar = () => [
  { d: '01/08', cb: 2, kc: 0 }, { d: '05/08', cb: 3, kc: 1 },
  { d: '10/08', cb: 5, kc: 2 }, { d: '15/08', cb: 4, kc: 1 },
  { d: '18/08', cb: 6, kc: 3 }, { d: '20/08', cb: 8, kc: 4 },
  { d: '24/08', cb: 7, kc: 3 },
]
