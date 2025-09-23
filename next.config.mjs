/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  // Images must be handled differently for static exports
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
