/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // output: 'export' - disabled for Better Auth API routes
  images: {
    unoptimized: true,
  },
}

module.exports = nextConfig

