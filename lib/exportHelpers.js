import * as XLSX from 'xlsx'
import { jsPDF } from 'jspdf'

const SENSOR_TYPE_LABELS = {
  vibration: 'Độ rung thân đập (VIB)',
  vib: 'Độ rung thân đập (VIB)',
  water_level: 'Mực nước thượng/hạ lưu (WTL)',
  wtl: 'Mực nước thượng/hạ lưu (WTL)',
  moisture: 'Độ ẩm móng đập (MST)',
  mst: 'Độ ẩm móng đập (MST)',
  humidity: 'Độ ẩm môi trường',
}

const SENSOR_TYPE_UNITS = {
  vibration: 'mm/s',
  vib: 'mm/s',
  water_level: 'm',
  wtl: 'm',
  moisture: '%',
  mst: '%',
  humidity: '%',
}

const CATEGORY_MAP = {
  ALL: 'Tất cả nhật ký',
  AUTH: 'Đăng nhập / Đăng ký',
  DAM: 'Hạ tầng Đập',
  STATION: 'Trạm quan trắc',
  GATEWAY: 'Gateway (Jetson TX2)',
  THRESHOLD: 'Ngưỡng báo động',
}

/**
 * Loại bỏ dấu tiếng Việt để xuất file PDF hiển thị chuẩn xác, không bị lỗi font ký tự.
 */
function removeVietnameseTones(str) {
  if (!str) return ''
  str = String(str)
  str = str.replace(/à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ/g, 'a')
  str = str.replace(/è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ/g, 'e')
  str = str.replace(/ì|í|ị|ỉ|ĩ/g, 'i')
  str = str.replace(/ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ/g, 'o')
  str = str.replace(/ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ/g, 'u')
  str = str.replace(/ỳ|ý|ỵ|ỷ|ỹ/g, 'y')
  str = str.replace(/đ/g, 'd')
  str = str.replace(/À|Á|Ạ|Ả|Ã|Â|Ầ|Ấ|Ậ|Ẩ|Ẫ|Ă|Ằ|Ắ|Ặ|Ẳ|Ẵ/g, 'A')
  str = str.replace(/È|É|Ẹ|Ẻ|Ẽ|Ê|Ề|Ế|Ệ|Ể|Ễ/g, 'E')
  str = str.replace(/Ì|Í|Ị|Ỉ|Ĩ/g, 'I')
  str = str.replace(/Ò|Ó|Ọ|Ỏ|Õ|Ô|Ồ|Ố|Ộ|Ổ|Ỗ|Ơ|Ờ|Ớ|Ợ|Ở|Ỡ/g, 'O')
  str = str.replace(/Ù|Ú|Ụ|Ủ|Ũ|Ư|Ừ|Ứ|Ự|Ử|Ữ/g, 'U')
  str = str.replace(/Ỳ|Ý|Ỵ|Ỷ|Ỹ/g, 'Y')
  str = str.replace(/Đ/g, 'D')
  return str
}

/**
 * Xuất Nhật Ký Hệ Thống (Audit Logs) ra file Excel (.xlsx)
 */
export function exportLogsToExcel(logs, category = 'ALL', search = '') {
  if (!logs || logs.length === 0) {
    alert('Không có dữ liệu nhật ký hệ thống để xuất Excel!')
    return
  }

  const rows = logs.map((log, index) => {
    let formattedMetadata = ''
    if (log.metadata) {
      if (typeof log.metadata === 'object') {
        try {
          formattedMetadata = JSON.stringify(log.metadata)
        } catch {
          formattedMetadata = String(log.metadata)
        }
      } else {
        formattedMetadata = String(log.metadata)
      }
    }

    return {
      STT: index + 1,
      'Thời Gian': log.timestamp ? new Date(log.timestamp).toLocaleString('vi-VN') : '--',
      'Người Thực Hiện': log.username || 'System',
      'Vai Trò': log.userRole || 'SYSTEM',
      'Phân Loại': CATEGORY_MAP[log.category] || log.category || 'Hệ thống',
      'Loại Thao Tác': log.action || '--',
      'Chi Tiết Hành Động': log.description || '--',
      'Địa Chỉ IP': log.ipAddress || '--',
      'Thông Tin Bổ Sung (Metadata)': formattedMetadata,
    }
  })

  const worksheet = XLSX.utils.json_to_sheet(rows)

  // Tự động căn chỉnh độ rộng cột
  worksheet['!cols'] = [
    { wch: 6 },  // STT
    { wch: 22 }, // Thời Gian
    { wch: 18 }, // Người Thực Hiện
    { wch: 12 }, // Vai Trò
    { wch: 22 }, // Phân Loại
    { wch: 22 }, // Loại Thao Tác
    { wch: 55 }, // Chi Tiết Hành Động
    { wch: 16 }, // Địa Chỉ IP
    { wch: 35 }, // Metadata
  ]

  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Audit Logs')

  const catSuffix = category && category !== 'ALL' ? `_${category}` : ''
  const searchSuffix = search ? '_filtered' : ''
  const dateStr = new Date().toISOString().slice(0, 10)
  const fileName = `Nhat_Ky_He_Thong${catSuffix}${searchSuffix}_${dateStr}.xlsx`

  XLSX.writeFile(workbook, fileName)
}

/**
 * Xuất danh sách sự kiện cảnh báo ra file Excel (.xlsx)
 */
export function exportAlarmsToExcel(alarms, damName = 'Toan_Bo_Dap') {
  if (!alarms || alarms.length === 0) {
    alert('Không có dữ liệu cảnh báo để xuất Excel!')
    return
  }

  const rows = alarms.map((a, index) => {
    const sensorTypeKey = a.sensorType || ''
    const sensorLabel = SENSOR_TYPE_LABELS[sensorTypeKey] || sensorTypeKey || 'Cảm biến'
    const unit = SENSOR_TYPE_UNITS[sensorTypeKey] || ''

    const measuredVal = a.measuredVal != null ? `${a.measuredVal} ${unit}`.trim() : (a.value != null ? `${a.value} ${unit}`.trim() : '--')
    const thresholdVal = a.thresholdVal != null ? `${a.thresholdVal} ${unit}`.trim() : (a.thresholdValue != null ? `${a.thresholdValue} ${unit}`.trim() : '--')

    const severityLabel =
      a.severity === 'CRITICAL' ? 'NGUY CẤP (ĐỎ)' :
      a.severity === 'ALERT' ? 'BÁO ĐỘNG (CAM)' :
      a.severity === 'WARNING' ? 'CẢNH BÁO (VÀNG)' : (a.severity || 'THÔNG BÁO')

    const isResolved = Boolean(a.resolvedAt || a.resolved || a.status === 'RESOLVED')
    const triggeredTime = a.triggeredAt ? new Date(a.triggeredAt).toLocaleString('vi-VN') : (a.timestamp ? new Date(a.timestamp).toLocaleString('vi-VN') : '--')
    const resolvedTime = a.resolvedAt ? new Date(a.resolvedAt).toLocaleString('vi-VN') : (isResolved ? 'Đã xử lý' : 'Chưa xử lý')

    let aiStatus = 'Không kích hoạt'
    if (a.crackDetected != null) {
      aiStatus = a.crackDetected
        ? `Phát hiện nứt (${Math.round((a.crackConfidence || 0) * 100)}%)`
        : 'Không phát hiện vết nứt'
    } else if (a.cameraActivated) {
      aiStatus = 'Camera đã chụp ảnh'
    }

    return {
      STT: index + 1,
      'Mã Sự Cố': a.eventId || (a.id ? a.id.slice(0, 8).toUpperCase() : '--'),
      'Tên Đập': a.damName || a.damId || 'Đập Thủy Điện',
      'Trạm Quan Trắc': a.stationName || a.stationId || a.sensorId || 'Trạm Quan Trắc',
      'Vị Trí Cụ Thể': a.location || 'Thân đập',
      'Loại Cảm Biến': sensorLabel,
      'Mức Độ Rủi Ro': severityLabel,
      'Giá Trị Đo Thực Tế': measuredVal,
      'Ngưỡng An Toàn': thresholdVal,
      'Trạng Thái Xử Lý': isResolved ? 'ĐÃ XỬ LÝ' : 'CHỜ XỬ LÝ',
      'Thời Gian Ghi Nhận': triggeredTime,
      'Thời Gian Khắc Phục': resolvedTime,
      'Nhận Diện Vết Nứt (AI)': aiStatus,
      'Ghi Chú': a.notes || '--',
    }
  })

  const worksheet = XLSX.utils.json_to_sheet(rows)
  worksheet['!cols'] = [
    { wch: 6 },  // STT
    { wch: 14 }, // Mã Sự Cố
    { wch: 22 }, // Tên Đập
    { wch: 24 }, // Trạm Quan Trắc
    { wch: 24 }, // Vị Trí Cụ Thể
    { wch: 30 }, // Loại Cảm Biến
    { wch: 18 }, // Mức Độ Rủi Ro
    { wch: 18 }, // Giá Trị Đo Thực Tế
    { wch: 18 }, // Ngưỡng An Toàn
    { wch: 16 }, // Trạng Thái Xử Lý
    { wch: 22 }, // Thời Gian Ghi Nhận
    { wch: 22 }, // Thời Gian Khắc Phục
    { wch: 24 }, // Nhận Diện Vết Nứt
    { wch: 30 }, // Ghi Chú
  ]

  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Danh Sách Cảnh Báo')

  const safeDamName = removeVietnameseTones(damName).replace(/\s+/g, '_')
  const fileName = `Bao_Cao_Canh_Bao_${safeDamName}_${new Date().toISOString().slice(0, 10)}.xlsx`
  XLSX.writeFile(workbook, fileName)
}

/**
 * Xuất Danh Sách Bản Ghi Lịch Sử Đo Đạc CSDL ra Excel (.xlsx)
 */
export function exportHistoryToExcel(records, damName = 'He_Thong') {
  if (!records || records.length === 0) {
    alert('Không có bản ghi lịch sử nào để xuất Excel!')
    return
  }

  const rows = records.map((r, index) => ({
    STT: index + 1,
    'Thời Gian': r.time || '--',
    'Mã Thiết Bị': r.code || '--',
    'Trạm Quan Trắc': r.stationName || '--',
    'Đập Thủy Điện': r.damName || '--',
    'Vị Trí Chi Tiết': r.location || '--',
    'Loại Cảm Biến': SENSOR_TYPE_LABELS[r.sensorType] || r.sensorType || 'Cảm biến',
    'Giá Trị Đo Thực Tế': r.level || '--',
    'Trạng Thái Vận Hành': r.statusLbl || 'BÌNH THƯỜNG',
  }))

  const worksheet = XLSX.utils.json_to_sheet(rows)
  worksheet['!cols'] = [
    { wch: 6 },  // STT
    { wch: 22 }, // Thời Gian
    { wch: 18 }, // Mã Thiết Bị
    { wch: 24 }, // Trạm Quan Trắc
    { wch: 22 }, // Đập Thủy Điện
    { wch: 30 }, // Vị Trí Chi Tiết
    { wch: 28 }, // Loại Cảm Biến
    { wch: 18 }, // Giá Trị Đo Thực Tế
    { wch: 18 }, // Trạng Thái
  ]

  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Lịch Sử Đo Đạc')

  const safeDamName = removeVietnameseTones(damName).replace(/\s+/g, '_')
  const fileName = `Bao_Cao_Lich_Su_Do_Dac_${safeDamName}_${new Date().toISOString().slice(0, 10)}.xlsx`
  XLSX.writeFile(workbook, fileName)
}

/**
 * Xuất phiếu báo cáo sự cố an toàn đập ra file PDF (.pdf) với dữ liệu chuẩn xác
 */
export function exportAlarmToPDF(alarm, locationInfo, reporterUser) {
  if (!alarm) {
    alert('Vui lòng chọn 1 sự kiện cảnh báo để xuất báo cáo PDF!')
    return
  }

  const doc = new jsPDF()

  const unit = SENSOR_TYPE_UNITS[alarm.sensorType] || ''
  const measuredVal = alarm.measuredVal != null ? `${alarm.measuredVal} ${unit}`.trim() : (alarm.value != null ? `${alarm.value} ${unit}`.trim() : '--')
  const thresholdVal = alarm.thresholdVal != null ? `${alarm.thresholdVal} ${unit}`.trim() : (alarm.thresholdValue != null ? `${alarm.thresholdValue} ${unit}`.trim() : '--')

  const triggeredTime = alarm.triggeredAt ? new Date(alarm.triggeredAt).toLocaleString('vi-VN') : (alarm.timestamp ? new Date(alarm.timestamp).toLocaleString('vi-VN') : '--')
  const isResolved = Boolean(alarm.resolvedAt || alarm.resolved || alarm.status === 'RESOLVED')
  const resolvedTime = alarm.resolvedAt ? new Date(alarm.resolvedAt).toLocaleString('vi-VN') : 'Dang trong tien trinh xu ly'

  const damNameClean = removeVietnameseTones(locationInfo?.damName || alarm.damName || 'Dap Thuy Dien')
  const damLocClean = removeVietnameseTones(locationInfo?.damLocation || 'Viet Nam')
  const stationNameClean = removeVietnameseTones(locationInfo?.stationName || alarm.stationName || 'Tram Quan Trac')
  const stationLocClean = removeVietnameseTones(locationInfo?.stationLoc || alarm.location || 'Than dap chinh')
  const reporterNameClean = removeVietnameseTones(reporterUser?.fullName || reporterUser?.username || 'Can bo truc ca')
  const reporterRoleClean = reporterUser?.role || 'OPERATOR'

  const sensorTypeClean = removeVietnameseTones(SENSOR_TYPE_LABELS[alarm.sensorType] || alarm.sensorType || 'Cam bien')
  const eventIdClean = alarm.eventId || (alarm.id ? `EVT-${alarm.id.slice(0, 8).toUpperCase()}` : 'EVT-001')

  let aiResultClean = 'Khong chup anh'
  if (alarm.crackDetected != null) {
    aiResultClean = alarm.crackDetected
      ? `PHAT HIEN VET NUT (Do tin cay: ${Math.round((alarm.crackConfidence || 0) * 100)}%)`
      : 'Khong phat hien vet nut'
  } else if (alarm.cameraActivated) {
    aiResultClean = 'Camera AI da chup anh'
  }

  // Header Tiêu đề Quốc gia
  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.text('CONG HOA XA HOI CHU NGHIA VIET NAM', 105, 14, { align: 'center' })
  doc.setFont('helvetica', 'normal')
  doc.text('Doc lap - Tu do - Hanh phuc', 105, 19, { align: 'center' })
  doc.setLineWidth(0.5)
  doc.line(75, 22, 135, 22)

  // Tiêu đề báo cáo
  doc.setFontSize(15)
  doc.setFont('helvetica', 'bold')
  doc.text('PHIEU BAO CAO SU CO AN TOAN DAP THUY DIEN', 105, 33, { align: 'center' })
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.text(`Ma su co: ${eventIdClean}`, 105, 39, { align: 'center' })
  doc.text(`Ngay xuat bao cao: ${new Date().toLocaleDateString('vi-VN')} - Gio: ${new Date().toLocaleTimeString('vi-VN')}`, 105, 44, { align: 'center' })

  // Khung 1: Thông tin Vị trí
  doc.setDrawColor(60, 80, 110)
  doc.setFillColor(245, 248, 252)
  doc.rect(14, 50, 182, 38, 'FD')

  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(30, 64, 175)
  doc.text('1. THONG TIN CONG TRINH VA VI TRI QUAN TRAC', 18, 57)

  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(20, 20, 20)
  doc.text(`- Dap Thuy Dien: ${damNameClean} (Dia diem: ${damLocClean})`, 22, 65)
  doc.text(`- Tram Quan Trac: ${stationNameClean}`, 22, 72)
  doc.text(`- Vi tri / Tuyen cong trinh: ${stationLocClean}`, 22, 79)

  // Khung 2: Chỉ số Đo Đạc & Cảnh Báo
  doc.setFillColor(255, 250, 240)
  doc.rect(14, 93, 182, 58, 'FD')

  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(180, 83, 9)
  doc.text('2. THONG SO DO DAC VA MUC DO NGUY HIEM', 18, 100)

  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(20, 20, 20)
  doc.text(`- Loai cam bien: ${sensorTypeClean}`, 22, 108)
  doc.text(`- Gia tri do thuc te: ${measuredVal}`, 22, 115)
  doc.text(`- Nguong gioi han canh bao: ${thresholdVal}`, 22, 122)
  doc.text(`- Muc do rui ro: ${alarm.severity || 'CANH BAO'}`, 22, 129)
  doc.text(`- Nhan dien thi giac AI: ${aiResultClean}`, 22, 136)
  doc.text(`- Thoi gian ghi nhan vuot nguong: ${triggeredTime}`, 22, 143)

  // Khung 3: Tình trạng Xử lý & Xác nhận
  doc.setFillColor(240, 253, 244)
  doc.rect(14, 156, 182, 45, 'FD')

  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(21, 128, 61)
  doc.text('3. TINH TRANG XU LY VA XAC NHAN VAN HANH', 18, 163)

  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(20, 20, 20)
  doc.text(`- Trang thai xu ly: ${isResolved ? 'DA XAC NHAN VA XU LY KHAC PHUC' : 'CHUA XU LY - DANG CANH BAO KHAN CAP'}`, 22, 171)
  doc.text(`- Thoi gian khac phuc hoan tat: ${resolvedTime}`, 22, 178)
  doc.text(`- Can bo bao cao: ${reporterNameClean} (Vai tro: ${reporterRoleClean})`, 22, 185)
  doc.text(`- Ghi chu phat sinh: ${removeVietnameseTones(alarm.notes || 'Khong co ghi chu')}`, 22, 192)

  // Chữ ký
  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.text('CAN BO TRUC CA VAN HANH', 140, 220, { align: 'center' })
  doc.setFont('helvetica', 'italic')
  doc.setFontSize(8)
  doc.text('(Ky va ghi ro ho ten)', 140, 225, { align: 'center' })
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.text(reporterNameClean, 140, 252, { align: 'center' })

  const safeFileId = eventIdClean.replace(/[^a-zA-Z0-9_-]/g, '_')
  doc.save(`Phieu_Bao_Cao_Su_Co_${safeFileId}.pdf`)
}

/**
 * Xuất Báo Cáo Hiện Trạng An Toàn Trạm Quan Trắc ra PDF (.pdf)
 */
export function exportStationReportToPDF(station, dam, telemetryData, alarms, reporterUser) {
  if (!station) {
    alert('Không tìm thấy thông tin trạm để xuất báo cáo!')
    return
  }

  const doc = new jsPDF()

  const damName = removeVietnameseTones(dam?.name || `Dap ${station.damId || ''}`)
  const stationName = removeVietnameseTones(station.name || station.stationId)
  const stationLoc = removeVietnameseTones(station.location || station.river || 'Than dap chinh')
  const reporterName = removeVietnameseTones(reporterUser?.fullName || reporterUser?.username || 'Can bo van hanh')

  // Header Tiêu đề Quốc gia
  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.text('CONG HOA XA HOI CHU NGHIA VIET NAM', 105, 14, { align: 'center' })
  doc.setFont('helvetica', 'normal')
  doc.text('Doc lap - Tu do - Hanh phuc', 105, 19, { align: 'center' })
  doc.setLineWidth(0.5)
  doc.line(75, 22, 135, 22)

  // Tiêu đề báo cáo
  doc.setFontSize(15)
  doc.setFont('helvetica', 'bold')
  doc.text('BAO CAO HIEN TRANG AN TOAN TRAM QUAN TRAC', 105, 33, { align: 'center' })
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.text(`Tram: ${stationName} - Ma: ${station.stationId || station.stationCode || '--'}`, 105, 39, { align: 'center' })
  doc.text(`Ngay xuat: ${new Date().toLocaleDateString('vi-VN')} ${new Date().toLocaleTimeString('vi-VN')}`, 105, 44, { align: 'center' })

  // Khung 1: Hạ tầng Trạm
  doc.setDrawColor(60, 80, 110)
  doc.setFillColor(245, 248, 252)
  doc.rect(14, 50, 182, 38, 'FD')

  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(30, 64, 175)
  doc.text('1. THONG TIN CO SO HA TANG TRAM', 18, 57)

  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(20, 20, 20)
  doc.text(`- Dap Thuy Dien truc thuoc: ${damName}`, 22, 65)
  doc.text(`- Ten tram: ${stationName} (Ma tram: ${station.stationId})`, 22, 72)
  doc.text(`- Vi tri lap dat: ${stationLoc} (Toa do: ${station.lat || '--'}, ${station.lng || '--'})`, 22, 79)

  // Khung 2: Các Chỉ Số Telemetry Thực Tế
  doc.setFillColor(240, 253, 244)
  doc.rect(14, 93, 182, 50, 'FD')

  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(21, 128, 61)
  doc.text('2. CHI SO QUAN TRAC MOI NHAT TU CAM BIEN', 18, 100)

  const wtl = telemetryData?.waterLevel != null ? `${telemetryData.waterLevel} m` : '--'
  const vib = telemetryData?.vibration != null ? `${telemetryData.vibration} mm/s` : '--'
  const mst = telemetryData?.moisture != null ? `${telemetryData.moisture} %` : '--'
  const status = station.status === 'danger' ? 'NGUY HIEM' : station.status === 'warning' ? 'CANH BAO' : 'AN TOAN'

  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(20, 20, 20)
  doc.text(`- Muc nuoc thuong luu / ho chua: ${wtl}`, 22, 108)
  doc.text(`- Do rung dong than dap (MPU6050): ${vib}`, 22, 115)
  doc.text(`- Do am tham chan dap: ${mst}`, 22, 122)
  doc.text(`- Danh gia trang thai tong the: ${status}`, 22, 129)

  // Khung 3: Lịch sử Cảnh báo gần nhất
  doc.setFillColor(255, 250, 240)
  doc.rect(14, 148, 182, 52, 'FD')

  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(180, 83, 9)
  doc.text('3. SU CO CANH BAO GHI NHAN TRONG KY', 18, 155)

  const recentAlarms = (alarms || []).slice(0, 3)
  if (recentAlarms.length === 0) {
    doc.setFontSize(9)
    doc.setFont('helvetica', 'italic')
    doc.setTextColor(80, 80, 80)
    doc.text('Khong co su co vuot nguong nao ghi nhan trong ky quan trac.', 22, 165)
  } else {
    recentAlarms.forEach((a, i) => {
      const timeStr = a.triggeredAt ? new Date(a.triggeredAt).toLocaleDateString('vi-VN') : '--'
      const typeStr = removeVietnameseTones(SENSOR_TYPE_LABELS[a.sensorType] || a.sensorType || 'Su co')
      const valStr = `${a.measuredVal ?? a.value ?? '--'} ${SENSOR_TYPE_UNITS[a.sensorType] || ''}`
      doc.setFontSize(8.5)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(20, 20, 20)
      doc.text(`${i + 1}. [${timeStr}] ${typeStr}: ${valStr} (${a.severity || 'CANH BAO'})`, 22, 165 + (i * 7))
    })
  }

  // Chữ ký
  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(0, 0, 0)
  doc.text('NGUOI LAP BAO CAO', 140, 220, { align: 'center' })
  doc.setFont('helvetica', 'italic')
  doc.setFontSize(8)
  doc.text('(Ky va ghi ro ho ten)', 140, 225, { align: 'center' })
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.text(reporterName, 140, 252, { align: 'center' })

  const safeStationId = removeVietnameseTones(station.stationId || 'Station').replace(/\s+/g, '_')
  doc.save(`Bao_Cao_Tram_${safeStationId}_${new Date().toISOString().slice(0, 10)}.pdf`)
}
