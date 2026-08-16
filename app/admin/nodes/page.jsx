import { redirect } from 'next/navigation'

// Sensor Node giờ được quản lý lồng trong Gateway (Jetson TX2) — xem /admin/gateways.
export default function AdminNodesRedirectPage() {
  redirect('/admin/gateways')
}
