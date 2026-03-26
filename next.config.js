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
    domains: ['www.goarmy.com', 'goarmy.com', 'offload.goarmy.com'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'www.goarmy.com',
      },
      {
        protocol: 'https',
        hostname: 'goarmy.com',
      },
      {
        protocol: 'https',
        hostname: 'offload.goarmy.com',
      },
    ],
  },
}

module.exports = nextConfig

