// Script to seed the vector database with sample practitioners
// Supports both Chroma (local) and Pinecone (production)
// Run with: npx tsx scripts/seed-practitioners.ts

// Load environment variables from .env.local
import { config } from 'dotenv';
import { resolve } from 'path';
config({ path: resolve(process.cwd(), '.env.local') });

import { initializePineconeIndex } from "../lib/counselling/pinecone-client";
import { seedPractitioners } from "../lib/counselling/embeddings";
import { samplePractitioners } from "../lib/counselling/sample-practitioners";
import { getVectorStoreType, getVectorStoreInfo } from "../lib/counselling/vector-store";

async function main() {
  try {
    const storeType = getVectorStoreType();
    const storeInfo = getVectorStoreInfo();

    console.log("=== Dental Practitioner Database Seeding ===\n");
    console.log(`Vector Store: ${storeType.toUpperCase()}`);
    console.log(`Location: ${storeInfo.url}`);
    console.log(`Collection: ${storeInfo.collection}\n`);

    if (storeType === "pinecone") {
      // Step 1: Initialize Pinecone index (only needed for Pinecone)
      console.log("Step 1: Initializing Pinecone index...");
      await initializePineconeIndex();
      console.log("✓ Pinecone index initialized\n");
    } else {
      // For Chroma
      console.log("Step 1: Verifying Chroma setup...");
      if (storeInfo.mode === "memory") {
        console.log("Using in-memory Chroma (no server required)");
      } else {
        console.log(`Make sure Chroma is running at ${storeInfo.url}`);
        console.log("Run: docker run -p 8000:8000 chromadb/chroma");
      }
      console.log("✓ Ready to seed\n");
    }

    // Step 2: Seed practitioners
    console.log("Step 2: Seeding practitioners...");
    await seedPractitioners(samplePractitioners);
    console.log("✓ Practitioners seeded\n");

    console.log("=== Seeding Complete! ===");
    console.log(`Total practitioners seeded: ${samplePractitioners.length}`);
    console.log(`Database: ${storeType.toUpperCase()}`);
  } catch (error) {
    console.error("Error seeding database:", error);
    
    if (getVectorStoreType() === "chroma") {
      const storeInfo = getVectorStoreInfo();
      if (storeInfo.mode === "memory") {
        console.error("\n❌ Chroma Error: In-memory mode failed!");
        console.error("Check your OPENAI_API_KEY is set correctly.");
      } else {
        console.error("\n❌ Chroma Error: Make sure Chroma is running!");
        console.error("Start Chroma with: docker run -p 8000:8000 chromadb/chroma");
      }
    }
    
    process.exit(1);
  }
}

main();
