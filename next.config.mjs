/** @type {import('next').NextConfig} */
const nextConfig = {
  // AWS Amplify hosting - supports API routes
  output: "standalone", // Required for Amplify SSR; creates self-contained server bundle
  agentRules: false,
  images: {
    unoptimized: true,
  },
  serverExternalPackages: ["chromadb", "@chroma-core/default-embed"],
  // Explicitly include environment variables for Lambda/runtime (set in Amplify Console)
  env: {
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    PINECONE_API_KEY: process.env.PINECONE_API_KEY,
    PINECONE_INDEX_NAME: process.env.PINECONE_INDEX_NAME,
    USE_LOCAL_VECTOR_DB: process.env.USE_LOCAL_VECTOR_DB,
    BACKEND_URL: process.env.BACKEND_URL,
    NEXT_PUBLIC_BACKEND_URL: process.env.NEXT_PUBLIC_BACKEND_URL,
    REGION: process.env.REGION,
    ACCESS_KEY_ID: process.env.ACCESS_KEY_ID,
    SECRET_ACCESS_KEY: process.env.SECRET_ACCESS_KEY,
    SQS_QUEUE_URL: process.env.SQS_QUEUE_URL,
  },
};

export default nextConfig;
