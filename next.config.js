/** @type {import('next').NextConfig} */

const withPWA = require("next-pwa")({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === "development", // Disable PWA in development
  // Example runtime caching strategies (customize as needed)
  runtimeCaching: [
    {
      urlPattern: /^https?:\/\/.*/i, // Cache external resources like fonts, APIs
      handler: "NetworkFirst",
      options: {
        cacheName: "https-calls",
        networkTimeoutSeconds: 15,
        expiration: {
          maxEntries: 150,
          maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
        },
        cacheableResponse: {
          statuses: [0, 200],
        },
      },
    },
    {
      urlPattern: /\.(?:png|gif|jpg|jpeg|svg|webp)$/i, // Cache images
      handler: "CacheFirst",
      options: {
        cacheName: "images",
        expiration: {
          maxEntries: 60,
          maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
        },
      },
    },
    {
      urlPattern: /\.(?:js|css)$/i, // Cache JS and CSS files
      handler: "StaleWhileRevalidate",
      options: {
        cacheName: "static-resources",
      },
    },
  ],
});

const nextConfig = {
  reactStrictMode: true,
  // Add other Next.js configurations here if needed
  env: {
    // Make env vars available client-side if needed (prefix with NEXT_PUBLIC_)
    NEXT_PUBLIC_HOTMART_CHECKOUT_URL: process.env.HOTMART_CHECKOUT_URL || "https://pay.hotmart.com/EXAMPLE_CHECKOUT_CODE?checkoutMode=10&email={user_email}",
  },
};

module.exports = withPWA(nextConfig);

