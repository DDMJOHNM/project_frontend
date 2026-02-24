/** @type {import('next').NextConfig} */
const nextConfig = {
  // AWS Amplify hosting - supports API routes
  output: "standalone", // Required for Amplify SSR; creates self-contained server bundle
  images: {
    unoptimized: true,
  },
  // Explicitly include environment variables for Lambda/runtime (set in Amplify Console)
  env: {
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    PINECONE_API_KEY: process.env.PINECONE_API_KEY,
    PINECONE_INDEX_NAME: process.env.PINECONE_INDEX_NAME,
    USE_LOCAL_VECTOR_DB: process.env.USE_LOCAL_VECTOR_DB,
    BACKEND_URL: process.env.BACKEND_URL,
    NEXT_PUBLIC_BACKEND_URL: process.env.NEXT_PUBLIC_BACKEND_URL,
  },
  // Webpack configuration for Chroma compatibility
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Mark chromadb as external to avoid bundling issues
      config.externals = config.externals || [];
      config.externals.push({
        'chromadb': 'commonjs chromadb',
        '@chroma-core/default-embed': 'commonjs @chroma-core/default-embed',
      });
    }
    return config;
  },
};

export default nextConfig;
