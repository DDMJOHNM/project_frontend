/** @type {import('next').NextConfig} */
const nextConfig = {
  // AWS Amplify hosting - supports API routes
  images: {
    unoptimized: true,
  },
  // Explicitly include environment variables for Lambda functions
  env: {
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    BACKEND_URL: process.env.BACKEND_URL,
    NEXT_PUBLIC_BACKEND_URL: process.env.NEXT_PUBLIC_BACKEND_URL,
  },
};

export default nextConfig;
