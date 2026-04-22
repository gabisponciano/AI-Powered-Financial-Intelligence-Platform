/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    workerThreads: true,
    webpackBuildWorker: false,
  },
  async rewrites() {
    return [
      {
        source: '/api/backend/:path*',
        destination: `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/:path*`,
      },
    ]
  },
}

module.exports = nextConfig
