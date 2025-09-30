/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  async rewrites() {
    return [
      {
        source: '/api/backend/:path*',
        destination: process.env.NODE_ENV === 'production' 
          ? 'http://backend:3001/api/:path*'
          : 'http://localhost:3001/api/:path*',
      },
    ];
  },
};

module.exports = nextConfig;