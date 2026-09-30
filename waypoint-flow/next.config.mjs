/** @type {import('next').NextConfig} */
const nextConfig = {
  distDir: process.env.MOBILE_TEST_MODE === "emulator"
    ? (/^\.next-mobile-[a-z-]+$/.test(process.env.MOBILE_TEST_DIST_DIR ?? "") ? process.env.MOBILE_TEST_DIST_DIR : ".next-mobile-test")
    : ".next",
  reactStrictMode: false,
};

export default nextConfig;
