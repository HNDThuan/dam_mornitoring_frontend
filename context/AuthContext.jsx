'use client'

import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { loginUser as apiLogin, logoutUser as apiLogout, fetchMe as apiFetchMe } from '@/lib/api'

const AuthContext = createContext({
  user: null,
  token: null,
  loading: true,
  login: async () => {},
  logout: async () => {},
  isAdmin: false,
  isOperator: false,
  isViewer: false,
  assignedDamId: null,
})

// Các trang công khai cho Khách xem VIEWER truy cập không cần đăng nhập
const isPublicRoute = (path) => {
  if (['/', '/dams', '/forecast', '/login', '/register'].includes(path)) return true
  if (path.startsWith('/dams/') || path.startsWith('/stations/')) return true
  return false
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()

  // Khởi tạo & kiểm tra phiên làm việc từ Token / Cookie
  const initAuth = useCallback(async () => {
    try {
      const savedToken = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null
      if (savedToken) setToken(savedToken)

      const profile = await apiFetchMe(savedToken)
      if (profile) {
        setUser(profile)
      } else {
        setUser(null)
        setToken(null)
        if (typeof window !== 'undefined') localStorage.removeItem('access_token')
      }
    } catch (err) {
      console.error('[AuthContext] Session init error:', err)
      setUser(null)
      setToken(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    initAuth()
  }, [initAuth])

  // Tải lại thông tin người dùng từ CSDL để cập nhật Role mới ngay lập tức
  const refreshUser = useCallback(async () => {
    try {
      const savedToken = typeof window !== 'undefined' ? localStorage.getItem('access_token') : token
      const profile = await apiFetchMe(savedToken)
      if (profile) {
        setUser(profile)
      }
      return profile
    } catch {
      return null
    }
  }, [token])

  // Tự động đồng bộ profile mới từ CSDL mỗi khi người dùng chuyển trang
  useEffect(() => {
    if (!loading && typeof window !== 'undefined') {
      refreshUser()
    }
  }, [pathname, loading, refreshUser])

  // Điều hướng dựa vào phiên đăng nhập và vai trò (Role Policy Enforcement)
  useEffect(() => {
    if (loading) return

    const publicPage = isPublicRoute(pathname)
    const isPrivateForAdminOrOperator = ['/alerts', '/history', '/users'].includes(pathname) || pathname.startsWith('/admin')

    if (!user && isPrivateForAdminOrOperator) {
      // Khách chưa đăng nhập cố truy cập trang riêng tư -> Redirect về /login
      router.push('/login')
    } else if (user && (pathname === '/login' || pathname === '/register')) {
      // Đã đăng nhập cố vào /login hay /register -> Redirect về /dams
      router.push('/dams')
    } else if (user && user.role === 'VIEWER' && isPrivateForAdminOrOperator) {
      // Tài khoản vai trò VIEWER cố truy cập trang riêng tư -> Redirect về /dams
      router.push('/dams')
    }
  }, [user, loading, pathname, router])

  const login = async (usernameOrEmail, password) => {
    const data = await apiLogin({ usernameOrEmail, password })
    if (data.accessToken) {
      setToken(data.accessToken)
      if (typeof window !== 'undefined') {
        localStorage.setItem('access_token', data.accessToken)
      }
    }
    if (data.user) {
      setUser(data.user)
    }
    router.push('/dams')
    return data
  }

  const logout = async () => {
    try {
      await apiLogout()
    } catch {
      // ignore
    } finally {
      setUser(null)
      setToken(null)
      if (typeof window !== 'undefined') {
        localStorage.removeItem('access_token')
      }
      router.push('/dams')
    }
  }

  const isAdmin = user?.role === 'ADMIN'
  const isOperator = user?.role === 'OPERATOR'
  const isViewer = !user || user?.role === 'VIEWER'
  const assignedDamId = user?.assignedDamId || null

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        logout,
        refreshUser,
        isAdmin,
        isOperator,
        isViewer,
        assignedDamId,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
