/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    optimizePackageImports: ['@clerk/nextjs'],
  },
};

export default nextConfig;
