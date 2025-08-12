/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  images: {
    domains: ['localhost'],
  },
  webpack: (config, { isServer }) => {
    // Fix for Supabase realtime dependency warning in server-side bundles
    // Since API routes only use database operations, exclude realtime WebSocket dependencies
    if (isServer) {
      config.externals = config.externals || []
      config.externals.push({
        // Exclude the problematic realtime WebSocket factory from server bundles
        '@supabase/realtime-js': 'commonjs @supabase/realtime-js'
      })
      
      // Suppress the specific webpack warning about dynamic dependencies
      config.module = config.module || {}
      config.module.unknownContextCritical = false
      config.module.unknownContextRegExp = /^\.\/.*$/
      config.module.unknownContextRequest = '.'
    }
    
    return config
  },
}

module.exports = nextConfig