/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
  // Optimize for Vercel deployment
  images: {
    domains: [],
    remotePatterns: [],
  },
}

module.exports = nextConfig

