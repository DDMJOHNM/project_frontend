// Pinecone client configuration and initialization

import { Pinecone } from "@pinecone-database/pinecone";

let pineconeClient: Pinecone | null = null;

export async function getPineconeClient(): Promise<Pinecone> {
  if (pineconeClient) {
    return pineconeClient;
  }

  const apiKey = process.env.PINECONE_API_KEY;
  
  if (!apiKey) {
    throw new Error("PINECONE_API_KEY environment variable is not set");
  }

  pineconeClient = new Pinecone({
    apiKey: apiKey,
  });

  return pineconeClient;
}

export const PINECONE_INDEX_NAME = process.env.PINECONE_INDEX_NAME || "counselling-practitioners";
export const PINECONE_NAMESPACE = "practitioners";

// Initialize Pinecone index (run this once to create the index)
export async function initializePineconeIndex() {
  const client = await getPineconeClient();
  
  const indexList = await client.listIndexes();
  const indexExists = indexList.indexes?.some(
    (index) => index.name === PINECONE_INDEX_NAME
  );

  if (!indexExists) {
    console.log(`Creating Pinecone index: ${PINECONE_INDEX_NAME}`);
    await client.createIndex({
      name: PINECONE_INDEX_NAME,
      dimension: 1536, // OpenAI text-embedding-ada-002 dimension
      metric: "cosine",
      spec: {
        serverless: {
          cloud: "aws",
          region: "us-east-1" // Change based on your preference
        }
      }
    });
    
    console.log("Waiting for index to be ready...");
    // Wait for index to be ready
    await new Promise(resolve => setTimeout(resolve, 60000));
  } else {
    console.log(`Index ${PINECONE_INDEX_NAME} already exists`);
  }

  return client.index(PINECONE_INDEX_NAME);
}
