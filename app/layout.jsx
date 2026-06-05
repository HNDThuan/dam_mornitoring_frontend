import './globals.css'
import NavBar from '@/components/NavBar'
import LiveStatusBar from '@/components/LiveStatusBar'

export const metadata = {
  title: 'DykeSafe Monitor',
  description: 'Hệ thống giám sát đê điều thời gian thực',
}

export default function RootLayout({ children }) {
  return (
    <html lang="vi">
      <body className="min-h-screen bg-bg text-tx font-sans">
        <NavBar />
        <LiveStatusBar />
        <main>{children}</main>
      </body>
    </html>
  )
}
