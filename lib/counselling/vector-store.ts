// Vector store abstraction - supports both Chroma (local) and Pinecone (production)

import { VectorStore } from "@langchain/core/vectorstores";
import { Document } from "@langchain/core/documents";
import { getEmbeddings } from "./embeddings";
import { getPineconeClient, PINECONE_INDEX_NAME, PINECONE_NAMESPACE } from "./pinecone-client";

export type VectorStoreType = "chroma" | "pinecone";

// Determine which vector store to use based on environment
export function getVectorStoreType(): VectorStoreType {
  const useLocal = process.env.USE_LOCAL_VECTOR_DB === "true";
  return useLocal ? "chroma" : "pinecone";
}

// Chroma configuration
const CHROMA_URL = process.env.CHROMA_URL || "http://localhost:8000";
const CHROMA_COLLECTION = "counselling-practitioners";
const CHROMA_IN_MEMORY = process.env.CHROMA_IN_MEMORY === "true";

// Get the appropriate vector store based on environment
export async function getVectorStore(): Promise<VectorStore> {
  const embeddings = getEmbeddings();
  const storeType = getVectorStoreType();

  console.log(`Using vector store: ${storeType.toUpperCase()}`);

  if (storeType === "chroma") {
    // Local development with Chroma - dynamic import to avoid build issues
    const { Chroma } = await import("@langchain/community/vectorstores/chroma");
    
    const chromaConfig: { collectionName: string; url?: string } = {
      collectionName: CHROMA_COLLECTION,
    };
    
    // Use in-memory mode or server mode based on config
    if (!CHROMA_IN_MEMORY) {
      chromaConfig.url = CHROMA_URL;
    }
    
    try {
      return await Chroma.fromExistingCollection(embeddings, chromaConfig);
    } catch (error) {
      console.warn("Chroma collection doesn't exist yet, will be created on first seed");
      throw error;
    }
  } else {
    // Production with Pinecone
    const { PineconeStore } = await import("@langchain/pinecone");
    const pineconeClient = await getPineconeClient();
    const index = pineconeClient.index(PINECONE_INDEX_NAME);

    return await PineconeStore.fromExistingIndex(embeddings, {
      pineconeIndex: index,
      namespace: PINECONE_NAMESPACE,
    });
  }
}

// Create and seed a new vector store
export async function createVectorStore(documents: Document[]): Promise<VectorStore> {
  const embeddings = getEmbeddings();
  const storeType = getVectorStoreType();

  console.log(`Creating vector store: ${storeType.toUpperCase()}`);

  if (storeType === "chroma") {
    // Create Chroma collection - dynamic import
    const { Chroma } = await import("@langchain/community/vectorstores/chroma");
    
    const chromaConfig: { collectionName: string; url?: string } = {
      collectionName: CHROMA_COLLECTION,
    };
    
    // Use in-memory mode or server mode based on config
    if (!CHROMA_IN_MEMORY) {
      chromaConfig.url = CHROMA_URL;
    }
    
    return await Chroma.fromDocuments(documents, embeddings, chromaConfig);
  } else {
    // Create Pinecone index and store documents
    const { PineconeStore } = await import("@langchain/pinecone");
    const pineconeClient = await getPineconeClient();
    const index = pineconeClient.index(PINECONE_INDEX_NAME);

    return await PineconeStore.fromDocuments(documents, embeddings, {
      pineconeIndex: index,
      namespace: PINECONE_NAMESPACE,
    });
  }
}

// Search for similar documents
export async function searchVectorStore(
  query: string,
  topK: number = 3
): Promise<Array<{ document: Document; score: number }>> {
  const vectorStore = await getVectorStore();
  const results = await vectorStore.similaritySearchWithScore(query, topK);

  return results.map(([document, score]) => ({
    document,
    score,
  }));
}

// Delete all documents (useful for re-seeding)
export async function clearVectorStore(): Promise<void> {
  const storeType = getVectorStoreType();

  if (storeType === "chroma") {
    console.log("To clear Chroma, delete the collection via API or restart the Chroma server");
    // Chroma doesn't have a simple "clear all" method
    // You need to delete and recreate the collection
  } else {
    console.log("To clear Pinecone, delete all vectors from the index via Pinecone console");
    // Pinecone clearing would require fetching all IDs and deleting them
  }
}

// Get vector store information
export function getVectorStoreInfo() {
  const storeType = getVectorStoreType();

  return {
    type: storeType,
    url: storeType === "chroma" 
      ? (CHROMA_IN_MEMORY ? "In-Memory (No Server)" : CHROMA_URL)
      : "Pinecone Cloud",
    collection: storeType === "chroma" ? CHROMA_COLLECTION : PINECONE_INDEX_NAME,
    mode: storeType === "chroma" ? (CHROMA_IN_MEMORY ? "memory" : "server") : "cloud",
    configured: storeType === "chroma" 
      ? true // Chroma doesn't need API keys
      : !!(process.env.PINECONE_API_KEY),
  };
}
