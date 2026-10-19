/** @type {import('next').NextConfig} */
const withPWA = require('next-pwa')({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
  register: true,
  skipWaiting: true,
  fallbacks: {
    document: '/offline.html',
  },
  runtimeCaching: [
    {
      // Static assets — cache-first for long-lived Next.js bundles
      urlPattern: /^\/_next\/static\/.*/i,
      handler: 'CacheFirst',
      options: {
        cacheName: 'static-assets',
        expiration: {
          maxEntries: 200,
        },
      },
    },
    {
      // API responses — network-first with 1-hour staleness fallback
      urlPattern: /^\/api\/.*/i,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'api-cache',
        expiration: {
          maxAgeSeconds: 3600,
        },
      },
    },
  ],
});

const nextConfig = {
  reactStrictMode: true,
  experimental: {
    typedRoutes: false,
  },
};

module.exports = withPWA(nextConfig);
