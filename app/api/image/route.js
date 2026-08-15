/**
 * GET /api/image?url=<encoded_image_url>
 * Server-side image proxy an toàn để tải ảnh từ Backend/MinIO proxy (/sensor/images/*).
 * Chống lỗ hổng SSRF bằng Dynamic Host Validation, Path restriction và Content-Type verification.
 */

const getApiHost = () => {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
  try {
    return new URL(apiUrl).hostname
  } catch {
    return 'localhost'
  }
}

/**
 * Kiểm tra hostname động:
 * 1. Tự động khớp với Hostname trong biến môi trường NEXT_PUBLIC_API_URL khi đổi Ngrok / Domain.
 * 2. Chấp nhận các localhost dev ('localhost', '127.0.0.1').
 * 3. Chấp nhận tất cả domain Ngrok (*.ngrok-free.dev, *.ngrok.io, *.ngrok.app).
 */
function isAllowedHost(hostname) {
  if (!hostname) return false

  const currentApiHost = getApiHost()
  if (hostname.toLowerCase() === currentApiHost.toLowerCase()) return true

  if (['localhost', '127.0.0.1'].includes(hostname.toLowerCase())) return true

  const h = hostname.toLowerCase()
  if (h.endsWith('.ngrok-free.dev') || h.endsWith('.ngrok.io') || h.endsWith('.ngrok.app')) {
    return true
  }

  return false
}

export async function GET(request) {
  const raw = new URL(request.url).searchParams.get('url')
  if (!raw) {
    return new Response('Missing url parameter', { status: 400 })
  }

  let target
  try {
    // Nếu raw là path tương đối (ví dụ /sensor/images/...), tự ghép với API_URL
    if (raw.startsWith('/')) {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
      target = new URL(raw, baseUrl)
    } else {
      target = new URL(raw)
    }
  } catch {
    return new Response('Bad url format', { status: 400 })
  }

  // 1. Kiểm tra Protocol & Hostname nằm trong danh sách cho phép (động theo NEXT_PUBLIC_API_URL và *.ngrok-free.dev)
  if (!['http:', 'https:'].includes(target.protocol) || !isAllowedHost(target.hostname)) {
    return new Response('Forbidden host', { status: 403 })
  }

  // 2. Bắt buộc đường dẫn chỉ được phép lấy ảnh từ /sensor/images/
  if (!target.pathname.startsWith('/sensor/images/')) {
    return new Response('Forbidden path', { status: 403 })
  }

  try {
    // 3. Tắt tự động redirect (redirect: 'error') để chống bypass SSRF qua HTTP 301/302 Redirect
    const upstream = await fetch(target.toString(), {
      redirect: 'error',
      headers: {
        'ngrok-skip-browser-warning': '69420',
        'User-Agent': 'DamMonitoringApp/1.0',
      },
    })

    if (!upstream.ok) {
      return new Response(`Image fetch failed: ${upstream.status}`, { status: upstream.status })
    }

    // 4. Kiểm tra Content-Type từ upstream bắt buộc phải là hình ảnh (image/*)
    const contentType = upstream.headers.get('content-type') || ''
    if (!contentType.startsWith('image/')) {
      return new Response('Not an image', { status: 415 })
    }

    const buffer = await upstream.arrayBuffer()

    return new Response(buffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400',
      },
    })
  } catch (err) {
    console.error('[ImageProxy] Error fetching image:', err.message)
    return new Response('Internal Server Error', { status: 500 })
  }
}
