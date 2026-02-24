// Generate embeddings and manage vector database operations

import { OpenAIEmbeddings } from "@langchain/openai";
import { Document } from "@langchain/core/documents";
import { createVectorStore, searchVectorStore, getVectorStoreType } from "./vector-store";
import { Practitioner } from "./types";

// Initialize OpenAI embeddings
export function getEmbeddings() {
  const apiKey = process.env.OPENAI_API_KEY;
  
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY environment variable is not set");
  }

  return new OpenAIEmbeddings({
    openAIApiKey: apiKey,
    modelName: "text-embedding-ada-002",
  });
}

// Convert practitioner to a searchable document
export function practitionerToDocument(practitioner: Practitioner): Document {
  // Create a rich text representation for embedding
  const content = `
Practitioner: ${practitioner.name}
Title: ${practitioner.title}
Specialties: ${practitioner.specialties.join(", ")}

Expertise:
${practitioner.expertise}

Treats conditions related to: ${practitioner.specialties.join(", ")}
  `.trim();

  return new Document({
    pageContent: content,
    metadata: {
      id: practitioner.id,
      name: practitioner.name,
      title: practitioner.title,
      specialties: practitioner.specialties,
      phone: practitioner.contact.phone,
      email: practitioner.contact.email,
      address: practitioner.contact.address || "",
      availability: practitioner.availability || "",
      acceptingNewClients: practitioner.acceptingNewClients,
    },
  });
}

// Seed the vector database with practitioners
export async function seedPractitioners(practitioners: Practitioner[]) {
  if (practitioners.length === 0) {
    throw new Error("Cannot seed: practitioners array is empty");
  }

  const storeType = getVectorStoreType();
  console.log(`Starting to seed ${practitioners.length} practitioners into ${storeType.toUpperCase()}...`);

  // Convert practitioners to documents
  const documents = practitioners.map(practitionerToDocument);

  // Store in vector database (Chroma or Pinecone based on environment)
  await createVectorStore(documents);

  console.log(`Successfully seeded ${practitioners.length} practitioners to ${storeType.toUpperCase()}`);
}

// Search for practitioners based on mental health concerns
export async function searchPractitioners(
  query: string,
  topK: number = 3
): Promise<Array<{ document: Document; score: number }>> {
  // Use the abstraction layer to search (works with both Chroma and Pinecone)
  return await searchVectorStore(query, topK);
}

// Get practitioner by ID from vector store
export async function getPractitionerById(
  practitionerId: string
): Promise<Document | null> {
  // Search with a generic query to get all results, then filter
  const results = await searchVectorStore("mental health practitioner", 100);
  const found = results.find((result) => result.document.metadata.id === practitionerId);
  return found ? found.document : null;
}
