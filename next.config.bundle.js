const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
})

// Import the main next config
const nextConfig = require('./next.config.ts').default

module.exports = withBundleAnalyzer(nextConfig)