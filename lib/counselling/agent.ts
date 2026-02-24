// LangChain agent for counselling practitioner recommendations

import { ChatOpenAI } from "@langchain/openai";
import { tool } from "@langchain/core/tools";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { z } from "zod";
import { searchPractitioners } from "./embeddings";
import { Practitioner, RecommendationResult } from "./types";

const searchPractitionersTool = tool(
  async ({ concernDescription, numResults = 3 }) => {
    try {
      const results = await searchPractitioners(concernDescription, numResults);
      
      if (results.length === 0) {
        return "No matching practitioners found. Recommend contacting a general counsellor for initial assessment.";
      }
   
      const formattedResults = results.map(({ document, score }, index) => {
        const metadata = document.metadata;
        return `
Match ${index + 1} (Similarity Score: ${(score * 100).toFixed(1)}%):
- Name: ${metadata.name}
- Title: ${metadata.title}
- Specialties: ${metadata.specialties?.join(", ") || "N/A"}
- Phone: ${metadata.phone}
- Email: ${metadata.email}
- Address: ${metadata.address || "N/A"}
- Availability: ${metadata.availability || "N/A"}
- Accepting New Patients: ${metadata.acceptingNewPatients ? "Yes" : "No"}

Expertise Summary:
${document.pageContent.substring(0, 300)}...
        `.trim();
      });

      return formattedResults.join("\n\n---\n\n");
    } catch (error) {
      console.error("Error searching practitioners:", error);
      return `Error searching for practitioners: ${error instanceof Error ? error.message : String(error)}`;
    }
  },
  {
    name: "search_practitioners",
    description: `Search for mental health counsellors based on a client's concerns or needs. 
  This tool uses semantic search to find practitioners whose expertise matches the described mental health concerns.
  Use this when a client describes their mental health challenges, emotional difficulties, or therapeutic needs.`,
    schema: z.object({
      concernDescription: z.string().describe(
        "The client's description of their mental health concerns, emotional challenges, or therapeutic needs"
      ),
      numResults: z.number().optional().describe(
        "Number of matching practitioners to return (default: 3)"
      ),
    }),
  }
);

const systemPrompt = `You are a compassionate mental health intake coordinator for Positive Thought Counselling that helps clients find the right counsellor for their specific needs.

Your role is to:
1. Listen to the client's description of their mental health concerns with empathy
2. Use the search_practitioners tool to find matching practitioners from our private database
3. Recommend the most appropriate counsellor(s) based on their therapeutic expertise
4. Provide clear next steps for the client
5. Assess the urgency of the situation (routine, soon, urgent, or crisis)

Guidelines:
- Be warm, empathetic, non-judgmental, and professional
- Normalize seeking help for mental health concerns
- If client mentions suicidal thoughts, self-harm, or immediate danger, mark as CRISIS and provide crisis resources (1737 in NZ, or 111 for emergencies)
- Consider both the match score and the counsellor's specific therapeutic approach and expertise
- Provide the counsellor's contact information clearly
- Suggest next steps (e.g., "Call to schedule an initial consultation", "Mention your specific concerns when booking")
- If multiple practitioners match, explain why each might be suitable based on their therapeutic approach
- If no perfect match, recommend a general counsellor for initial assessment

Format your response clearly with:
- A brief, empathetic acknowledgment of their concerns
- The recommended counsellor(s) with contact details
- Why this counsellor is a good match for their specific needs
- Urgency level (routine/soon/urgent/crisis)
- Specific next steps to take
- For crisis situations, always include immediate support numbers
`;

export async function createCounsellingAgent() {
  const apiKey = process.env.OPENAI_API_KEY;
  
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY environment variable is not set");
  }

  const llm = new ChatOpenAI({
    openAIApiKey: apiKey,
    modelName: "gpt-4-turbo-preview",
    temperature: 0.7,
  });


  const tools = [searchPractitionersTool];

  const agent = createReactAgent({
    llm,
    tools,
    messageModifier: systemPrompt,
  });

  return agent;
}

export async function getCounsellingRecommendation(
  concernDescription: string
): Promise<string> {
  try {
    const agent = await createCounsellingAgent();
    
    const result = await agent.invoke({
      messages: [{ role: "user", content: concernDescription }],
    });

    const messages = result.messages;
    const lastMessage = messages[messages.length - 1];
    
    return lastMessage.content as string;
  } catch (error) {
    console.error("Error getting counselling recommendation:", error);
    throw new Error(
      `Failed to get recommendation: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

// Alternative: Get structured recommendations (for programmatic use)
export async function getStructuredRecommendation(
  concernDescription: string
): Promise<RecommendationResult[]> {
  try {
    const results = await searchPractitioners(concernDescription, 3);

    if (results.length === 0) {
      throw new Error("No matching practitioners found");
    }

      return results.map(({ document, score }) => {
      const metadata = document.metadata;
      
      const practitioner: Practitioner = {
        id: metadata.id as string,
        name: metadata.name as string,
        title: metadata.title as string,
        specialties: metadata.specialties as string[],
        expertise: document.pageContent,
        contact: {
          phone: metadata.phone as string,
          email: metadata.email as string,
          address: metadata.address as string,
        },
        availability: metadata.availability as string,
        acceptingNewClients: metadata.acceptingNewClients as boolean,
      };

      let urgency: "routine" | "soon" | "urgent" | "crisis" = "routine";
      const crisisKeywords = ["suicide", "suicidal", "self-harm", "end my life", "kill myself", "don't want to live"];
      const urgentKeywords = ["severe", "overwhelming", "can't cope", "panic", "crisis"];
      const soonKeywords = ["anxious", "depressed", "struggling", "stressed", "worried"];
      
      const lowerDescription = concernDescription.toLowerCase();
      if (crisisKeywords.some(keyword => lowerDescription.includes(keyword))) {
        urgency = "crisis";
      } else if (urgentKeywords.some(keyword => lowerDescription.includes(keyword))) {
        urgency = "urgent";
      } else if (soonKeywords.some(keyword => lowerDescription.includes(keyword))) {
        urgency = "soon";
      }

      const nextSteps = [
        `Call ${metadata.phone} to schedule an initial consultation`,
        "Mention your specific concerns when booking",
        urgency === "crisis"
          ? "If in immediate danger, call 111 or text 1737 for free 24/7 crisis support"
          : urgency === "urgent" 
          ? "Request an appointment as soon as possible" 
          : "Request the next available appointment",
      ];

      return {
        practitioner,
        matchScore: score,
        reasoning: `This counsellor specializes in ${metadata.specialties?.join(", ")} which matches your needs.`,
        nextSteps,
        urgency,
      };
    });
  } catch (error) {
    console.error("Error getting structured recommendation:", error);
    throw error;
  }
}
