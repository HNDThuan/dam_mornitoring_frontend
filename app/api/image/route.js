/**
 * GET /api/image?url=<encoded_image_url>
 * Server-side image proxy để tải ảnh từ Ngrok/MinIO với header bỏ qua trang cảnh báo Ngrok.
 * Giải quyết lỗi ERR_NGROK_6024 khi dùng <img src="...ngrok..."> trực tiếp.
 */
export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const imageUrl = searchParams.get('url')

  if (!imageUrl) {
    return new Response('Missing url parameter', { status: 400 })
  }

  try {
    const upstream = await fetch(imageUrl, {
      headers: {
        'ngrok-skip-browser-warning': '69420',
        'User-Agent': 'DamMonitoringApp/1.0',
      },
      cache: 'no-store',
    })

    if (!upstream.ok) {
      return new Response(`Image fetch failed: ${upstream.status}`, { status: upstream.status })
    }

    const contentType = upstream.headers.get('content-type') || 'image/jpeg'
    const buffer = await upstream.arrayBuffer()

    return new Response(buffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400',
        'Access-Control-Allow-Origin': '*',
      },
    })
  } catch (err) {
    console.error('[ImageProxy] Error fetching image:', err.message)
    return new Response('Internal Server Error', { status: 500 })
  }
}
