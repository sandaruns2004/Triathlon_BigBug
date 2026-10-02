/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,

  // Prevent Next.js from bundling these server-only native/ESM modules.
  // Required for firebase-admin and bcryptjs to work in Vercel serverless functions.
  // NOTE: In Next.js 14, this key lives under `experimental`. It moves to top-level in Next.js 15.
  experimental: {
    serverComponentsExternalPackages: [
      "firebase-admin",
      "bcryptjs",
      "@google-cloud/firestore",
      "google-gax",
    ],
  },

  // Suppress the webpack warnings for optional node: imports in firebase-admin
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Polyfills not needed on the client — replace with empty stubs
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        child_process: false,
      };
    }
    return config;
  },
};

export default nextConfig;

