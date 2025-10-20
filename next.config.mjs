/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // Font optimization and error handling
  experimental: {
    // Remove fontLoaders as it's not a valid Next.js 15 option
    // Font loading is handled through our custom font configuration
  },
  // Network timeout configurations for better build reliability
  env: {
    NEXT_FONT_GOOGLE_TIMEOUT: '30000', // 30 seconds timeout
    NEXT_FONT_GOOGLE_RETRIES: '3',     // 3 retry attempts
  },
  // External packages for Puppeteer on Vercel
  serverExternalPackages: ["@sparticuz/chromium", "puppeteer-core"],
  // Webpack configuration for font handling
  webpack: (config, { isServer }) => {
    // Add fallback for font loading failures
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      }
    }
    return config
  },
}

export default nextConfig
