/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  compress: true,
  poweredByHeader: false,
  env: {
    BACKEND_URL: process.env.BACKEND_URL || "http://localhost:5000",
  },
  experimental: {
    // Tree-shake icon/chart libraries — avoids shipping the full barrel export
    optimizePackageImports: [
      "lucide-react",
      "recharts",
      "@radix-ui/react-icons",
    ],
  },
  images: {
    formats: ["image/avif", "image/webp"],
  },
};

module.exports = nextConfig;

// Made with Bob
