export interface Practitioner {
  id: string;
  name: string;
  title: string;
  specialties: string[];
  expertise: string; // Detailed description of their therapeutic approaches and what they help with
  contact: {
    phone: string;
    email: string;
    address?: string;
  };
  availability?: string;
  acceptingNewClients: boolean;
}

export interface CounsellingIssueInput {
  description: string;
  severity?: "mild" | "moderate" | "severe";
  duration?: string;
}

export interface RecommendationResult {
  practitioner: Practitioner;
  matchScore: number;
  reasoning: string;
  nextSteps: string[];
  urgency: "routine" | "soon" | "urgent" | "crisis";
}
