import * as XLSX from 'xlsx'
import { jsPDF } from 'jspdf'

/**
 * Xuất danh sách sự kiện cảnh báo ra file Excel (.xlsx)
 */
export function exportAlarmsToExcel(alarms, damName = 'Toan_Bo_Dap') {
  if (!alarms || alarms.length === 0) {
    alert('Không có dữ liệu cảnh báo để xuất Excel!')
    return
  }

  const rows = alarms.map((a, index) => ({
    STT: index + 1,
    'Mã sự cố': a.id || '--',
    'Tên Đập': a.damName || a.damId || 'Đập Thủy Điện',
    'Trạm Quan Trắc': a.stationName || a.sensorId || 'Trạm Quan Trắc',
    'Loại Cảm Biến': a.sensorType === 'vibration' ? 'Độ rung (MPU6050)' : a.sensorType === 'water_level' ? 'Mực nước' : 'Độ ẩm',
    'Mức Độ Cảnh Báo': a.severity === 'CRITICAL' ? 'NGUY HIỂM (ĐỎ)' : a.severity === 'ALERT' ? 'BÁO ĐỘNG (CAM)' : 'CẢNH BÁO (VÀNG)',
    'Giá Trị Đo Thực Tế': `${a.value} ${a.sensorType === 'vibration' ? 'mm/s' : a.sensorType === 'water_level' ? 'm' : '%'}`,
    'Ngưỡng Cho Phép': `${a.thresholdValue || '--'}`,
    'Trạng Thái Xử Lý': a.resolved ? 'ĐÃ XỬ LÝ' : 'CHƯA XỬ LÝ',
    'Thời Gian Xảy Ra': a.timestamp ? new Date(a.timestamp).toLocaleString('vi-VN') : '--',
  }))

  const worksheet = XLSX.utils.json_to_sheet(rows)
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Danh sách Cảnh báo')

  const fileName = `Bao_Cao_Canh_Bao_${damName}_${new Date().toISOString().slice(0, 10)}.xlsx`
  XLSX.writeFile(workbook, fileName)
}

/**
 * Xuất phiếu báo cáo sự cố an toàn đập ra file PDF (.pdf)
 */
export function exportAlarmToPDF(alarm, locationInfo, reporterUser) {
  if (!alarm) {
    alert('Vui lòng chọn 1 sự kiện cảnh báo để xuất báo cáo PDF!')
    return
  }

  const doc = new jsPDF()

  // Header Tiêu đề Quốc gia
  doc.setFontSize(11)
  doc.text('CONG HOA XA HOI CHU NGHIA VIET NAM', 105, 15, { align: 'center' })
  doc.text('Doc lap - Tu do - Hanh phuc', 105, 21, { align: 'center' })
  doc.line(70, 24, 140, 24)

  // Tiêu đề báo cáo
  doc.setFontSize(16)
  doc.text('PHIEU BAO CAO SU CO AN TOAN DAP THUY DIEN', 105, 36, { align: 'center' })
  doc.setFontSize(10)
  doc.text(`Ma phieu: #${(alarm.id || 'EVT-001').slice(0, 8)}`, 105, 42, { align: 'center' })
  doc.text(`Ngay xuat bao cao: ${new Date().toLocaleDateString('vi-VN')}`, 105, 47, { align: 'center' })

  // Khung Thông tin Chi tiết Sự cố
  doc.setDrawColor(180, 180, 180)
  doc.rect(14, 55, 182, 90)

  doc.setFontSize(11)
  doc.text('1. THONG TIN VI TRI DONG CONG TRINH', 20, 65)
  doc.setFontSize(10)
  doc.text(`- Ten Dap Thuy Dien: ${locationInfo?.damName || 'Dap Thuy Dien Hoa Binh'}`, 25, 73)
  doc.text(`- Tram Quan Trac: ${locationInfo?.stationName || 'Tram Tan Ap 1'}`, 25, 80)
  doc.text(`- Vi tri/Tuyen song: ${locationInfo?.stationLoc || 'Than dap chinh'}`, 25, 87)

  doc.setFontSize(11)
  doc.text('2. CHIS O BIEN DO PHAT HIEN VUOT NGUONG', 20, 100)
  doc.setFontSize(10)
  doc.text(`- Loai cam bien kiem dinh: ${alarm.sensorType || 'Vibration / Water Level'}`, 25, 108)
  doc.text(`- Gia tri do thuc te: ${alarm.value} ${alarm.sensorType === 'vibration' ? 'mm/s' : 'm'}`, 25, 115)
  doc.text(`- Nguong gioi han an toan: ${alarm.thresholdValue || '10.0'}`, 25, 122)
  doc.text(`- Muc do rui ro: ${alarm.severity || 'CRITICAL'}`, 25, 129)
  doc.text(`- Thoi gian ghi nhan: ${alarm.timestamp ? new Date(alarm.timestamp).toLocaleString() : '--'}`, 25, 136)

  // Khung Xử lý sự cố
  doc.rect(14, 152, 182, 50)
  doc.setFontSize(11)
  doc.text('3. XAC NHAN VA HUONG XU LY CUA CAN BO TRUC CA', 20, 162)
  doc.setFontSize(10)
  doc.text(`- Trang thai hien tai: ${alarm.resolved ? 'DA XAC NHAN & KHAC PHUC' : 'DANG TRONG TIEN TRINH KHAC PHUC'}`, 25, 170)
  doc.text(`- Can bo bao cao: ${reporterUser?.fullName || 'Can bo Van hanh'} (${reporterUser?.role || 'OPERATOR'})`, 25, 177)
  doc.text(`- Dap phu trach: ${reporterUser?.assignedDamId || locationInfo?.damName || 'Hoa Binh'}`, 25, 184)

  // Chữ ký
  doc.text('CAN BO TRUC CA VAN HANH', 140, 215, { align: 'center' })
  doc.text('(Ky va ghi ro ho ten)', 140, 221, { align: 'center' })
  doc.text(reporterUser?.fullName || 'Nguoi lap phieu', 140, 245, { align: 'center' })

  doc.save(`Phieu_Bao_Cao_Su_Co_${(alarm.id || 'ALERT').slice(0, 6)}.pdf`)
}
