/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable static export for S3 deployment
  output: 'export',
  // Images must be handled differently for static exports
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
