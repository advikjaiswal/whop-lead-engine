/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'https://whop-lead-engine-production.up.railway.app',
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${process.env.NEXT_PUBLIC_API_URL || 'https://whop-lead-engine-production.up.railway.app'}/api/:path*`,
      },
    ]
  },
}

module.exports = nextConfig