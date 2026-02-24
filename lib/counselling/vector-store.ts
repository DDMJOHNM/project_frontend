// Vector store abstraction - supports both Chroma (local) and Pinecone (production)

import { v4 as uuidv4 } from "uuid";
// @ts-expect-error - flat has no types; used for metadata flattening (matches LangChain)
import flatten from "flat";
import { VectorStore } from "@langchain/core/vectorstores";
import { Document } from "@langchain/core/documents";
import { getEmbeddings } from "./embeddings";
import { getPineconeClient, PINECONE_INDEX_NAME, PINECONE_NAMESPACE } from "./pinecone-client";

const TEXT_KEY = "text"; // Pinecone metadata key for page content (matches LangChain default)

export type VectorStoreType = "chroma" | "pinecone";

// Determine which vector store to use based on environment
export function getVectorStoreType(): VectorStoreType {
  const useLocal = process.env.USE_LOCAL_VECTOR_DB === "true";
  return useLocal ? "chroma" : "pinecone";
}

// Chroma configuration
const CHROMA_COLLECTION = "counselling-practitioners";

// Helper functions to get Chroma config at runtime
function getChromaUrl() {
  return process.env.CHROMA_URL || "http://localhost:8000";
}

function isChromaInMemory() {
  return process.env.CHROMA_IN_MEMORY === "true";
}

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
    if (!isChromaInMemory()) {
      chromaConfig.url = getChromaUrl();
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
  if (documents.length === 0) {
    throw new Error("Cannot create vector store: documents array is empty");
  }

  const embeddings = getEmbeddings();
  const storeType = getVectorStoreType();

  console.log(`Creating vector store: ${storeType.toUpperCase()} with ${documents.length} documents`);

  if (storeType === "chroma") {
    // Create Chroma collection - dynamic import
    const { Chroma } = await import("@langchain/community/vectorstores/chroma");
    
    const chromaConfig: { collectionName: string; url?: string } = {
      collectionName: CHROMA_COLLECTION,
    };
    
    // Use in-memory mode or server mode based on config
    if (!isChromaInMemory()) {
      chromaConfig.url = getChromaUrl();
    }
    
    return await Chroma.fromDocuments(documents, embeddings, chromaConfig);
  } else {
    // Create Pinecone index and store documents
    const { PineconeStore } = await import("@langchain/pinecone");
    const pineconeClient = await getPineconeClient();
    const index = pineconeClient.index(PINECONE_INDEX_NAME);

    try {
      return await PineconeStore.fromDocuments(documents, embeddings, {
        pineconeIndex: index,
        namespace: PINECONE_NAMESPACE,
      });
    } catch (error) {
      // Fallback: @langchain/pinecone was built for Pinecone v5 and passes arrays to upsert().
      // Pinecone v7 expects { records: [...] }. Use direct SDK upsert with correct API.
      const errMessage = error instanceof Error ? error.message : String(error);
      if (errMessage.includes("at least 1 record") || errMessage.includes("Must pass in")) {
        console.warn("LangChain Pinecone API mismatch (v5 vs v7), using direct SDK upsert:", errMessage);
        return await seedPineconeDirect(documents, embeddings, index);
      }
      throw error;
    }
  }
}

// Direct Pinecone v7 upsert - bypasses LangChain which uses outdated API (passes array instead of { records })
async function seedPineconeDirect(
  documents: Document[],
  embeddings: Awaited<ReturnType<typeof getEmbeddings>>,
  index: Awaited<ReturnType<typeof getPineconeClient>> extends infer C
    ? C extends { index: (name: string) => infer I }
      ? I
      : never
    : never
): Promise<VectorStore> {
  const texts = documents.map((d) => d.pageContent);
  const vectors = await embeddings.embedDocuments(texts);

  const records = documents.map((doc, idx) => {
    const documentMetadata = { ...doc.metadata };
    const stringArrays: Record<string, string[]> = {};
    for (const key of Object.keys(documentMetadata)) {
      if (
        Array.isArray(documentMetadata[key]) &&
        documentMetadata[key].every((el: unknown) => typeof el === "string")
      ) {
        stringArrays[key] = documentMetadata[key] as string[];
        delete documentMetadata[key];
      }
    }
    const metadata: Record<string, unknown> = {
      ...flatten(documentMetadata as Record<string, unknown>),
      ...stringArrays,
      [TEXT_KEY]: doc.pageContent,
    };
    for (const key of Object.keys(metadata)) {
      if (metadata[key] == null) delete metadata[key];
      else if (typeof metadata[key] === "object" && Object.keys(metadata[key] as object).length === 0)
        delete metadata[key];
    }
    return {
      id: (doc.metadata.id as string) ?? uuidv4(),
      values: vectors[idx],
      metadata,
    };
  });

  const namespace = index.namespace(PINECONE_NAMESPACE);
  await namespace.upsert({ records: records as Parameters<typeof namespace.upsert>[0]["records"] });

  const { PineconeStore } = await import("@langchain/pinecone");
  return new PineconeStore(embeddings, {
    pineconeIndex: index,
    namespace: PINECONE_NAMESPACE,
    textKey: TEXT_KEY,
  });
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
      ? (isChromaInMemory() ? "In-Memory (No Server)" : getChromaUrl())
      : "Pinecone Cloud",
    collection: storeType === "chroma" ? CHROMA_COLLECTION : PINECONE_INDEX_NAME,
    mode: storeType === "chroma" ? (isChromaInMemory() ? "memory" : "server") : "cloud",
    configured: storeType === "chroma" 
      ? true // Chroma doesn't need API keys
      : !!(process.env.PINECONE_API_KEY),
  };
}
