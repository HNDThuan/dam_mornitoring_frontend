/** @type {import('next').NextConfig} */
const backendUrl = (process.env.NEXT_PUBLIC_API_URL && process.env.NEXT_PUBLIC_API_URL.trim() !== '')
  ? process.env.NEXT_PUBLIC_API_URL.trim()
  : 'https://library-opal-degraded.ngrok-free.dev'

const nextConfig = {
  async rewrites() {
    return [
      {
        source: '/sensor/:path*',
        destination: `${backendUrl}/sensor/:path*`,
      },
    ]
  },
}

module.exports = nextConfig

