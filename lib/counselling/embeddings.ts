// Generate embeddings and manage vector database operations

import { OpenAIEmbeddings } from "@langchain/openai";
import { Document } from "@langchain/core/documents";
import { createVectorStore, searchVectorStore, getVectorStoreType } from "./vector-store";
import { Practitioner } from "./types";

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

export function practitionerToDocument(practitioner: Practitioner): Document {
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

export async function seedPractitioners(practitioners: Practitioner[]) {
  if (practitioners.length === 0) {
    throw new Error("Cannot seed: practitioners array is empty");
  }

  const storeType = getVectorStoreType();
  console.log(`Starting to seed ${practitioners.length} practitioners into ${storeType.toUpperCase()}...`);

  const documents = practitioners.map(practitionerToDocument);

  await createVectorStore(documents);

  console.log(`Successfully seeded ${practitioners.length} practitioners to ${storeType.toUpperCase()}`);
}

export async function searchPractitioners(
  query: string,
  topK: number = 3
): Promise<Array<{ document: Document; score: number }>> {
  return await searchVectorStore(query, topK);
}

export async function getPractitionerById(
  practitionerId: string
): Promise<Document | null> {
  const results = await searchVectorStore("mental health practitioner", 100);
  const found = results.find((result) => result.document.metadata.id === practitionerId);
  return found ? found.document : null;
}
