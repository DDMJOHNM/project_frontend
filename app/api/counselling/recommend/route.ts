import { NextRequest, NextResponse } from "next/server";
import { getCounsellingRecommendation, getStructuredRecommendation } from "@/lib/counselling/agent";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30; // Amplify/API Gateway limit; agent + vector search can be slow

interface RequestBody {
  description: string;
  format?: "text" | "structured";
}

export async function POST(request: NextRequest) {
  try {

    const body: RequestBody = await request.json();
    
    if (!body.description || typeof body.description !== "string") {
      return NextResponse.json(
        { error: "Description is required and must be a string" },
        { status: 400 }
      );
    }

    const format = body.format || "text";

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "OpenAI API key not configured" },
        { status: 500 }
      );
    }

    const useLocal = process.env.USE_LOCAL_VECTOR_DB === "true";
    if (!useLocal && !process.env.PINECONE_API_KEY) {
      return NextResponse.json(
        { error: "Pinecone API key not configured (set USE_LOCAL_VECTOR_DB=true to use Chroma)" },
        { status: 500 }
      );
    }

    if (format === "structured") {
      const recommendations = await getStructuredRecommendation(body.description);
      return NextResponse.json({
        success: true,
        format: "structured",
        recommendations,
      });
    } else {
      const recommendation = await getCounsellingRecommendation(body.description);
      return NextResponse.json({
        success: true,
        format: "text",
        recommendation,
      });
    }
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    console.error("[counselling/recommend] Error:", err.message, err.stack);

    // Surface actionable details (safe to expose - no secrets)
    const details = err.message;
    const isConfig =
      details.includes("not set") ||
      details.includes("not configured") ||
      details.includes("environment variable");
    const isPinecone =
      details.includes("Pinecone") ||
      details.includes("pinecone") ||
      details.includes("index");
    const isTimeout = details.includes("timeout") || details.includes("timed out");

    return NextResponse.json(
      {
        error: "Failed to get counselling recommendation",
        details,
        hint: isConfig
          ? "Check Amplify Console → Environment variables: OPENAI_API_KEY, PINECONE_API_KEY, PINECONE_INDEX_NAME, USE_LOCAL_VECTOR_DB=false"
          : isPinecone
            ? "Verify Pinecone index exists, is in same project, and has been seeded"
            : isTimeout
              ? "Request timed out (Amplify limit ~30s). Consider simplifying the query."
              : undefined,
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  const { getVectorStoreInfo } = await import("@/lib/counselling/vector-store");
  const vectorStoreInfo = getVectorStoreInfo();
  
  const useLocal = process.env.USE_LOCAL_VECTOR_DB === "true";
  const isConfigured = !!(
    process.env.OPENAI_API_KEY &&
    (useLocal || (process.env.PINECONE_API_KEY && process.env.PINECONE_INDEX_NAME))
  );

  return NextResponse.json({
    service: "Counselling Practitioner Recommendation",
    status: isConfigured ? "ready" : "not configured",
    vectorStore: {
      type: vectorStoreInfo.type,
      url: vectorStoreInfo.url,
      collection: vectorStoreInfo.collection,
      configured: vectorStoreInfo.configured,
    },
    configured: {
      openai: !!process.env.OPENAI_API_KEY,
      pinecone: !!process.env.PINECONE_API_KEY,
      chroma: useLocal,
    },
  });
}
