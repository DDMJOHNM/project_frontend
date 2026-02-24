"use client";

import { useState } from "react";

interface RecommendationResult {
  success: boolean;
  format: string;
  recommendations: Array<{
    practitioner: {
      name: string;
      title: string;
      contact: {
        phone: string;
        email: string;
      };
    };
    matchScore: number;
    urgency: string;
    nextSteps: string[];
  }>;
}

export function CounsellingRecommendation() {
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<RecommendationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const getRecommendation = async () => {
    if (!description.trim()) {
      setError("Please describe what you're going through");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch("/api/counselling/recommend", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          description,
          format: "structured",
        }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`);
      }

      const data = await response.json();
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const exampleQueries = [
    "I'm feeling anxious and overwhelmed",
    "I'm struggling with depression",
    "I'm having relationship problems",
    "I'm dealing with grief after a loss",
    "I'm experiencing panic attacks",
  ];

  return (
    <div className="max-w-4xl mx-auto">
     {/* Example Queries */}
      <div className="mb-4">
        <p className="text-xl font-light text-gray-400 mb-2 text-center">Common concerns:</p>
        <div className="flex flex-wrap gap-2">
          {exampleQueries.map((query, index) => (
            <button
              key={index}
              onClick={() => setDescription(query)}
              className="text-xs px-3 py-1 bg-teal-50 hover:bg-teal-100 text-teal-600 rounded-full transition-colors"
            >
              {query}
            </button>
          ))}
        </div>
      </div>

      {/* Input Area */}
      <div className="mb-4">
        <label className="block text-gray-700 mb-6 text-center">
          What brings you here today?
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Share what's on your mind... e.g., I'm feeling anxious and having trouble sleeping..."
          className="w-full p-3 border border-gray-300 rounded-lg min-h-[120px] resize-y focus:ring-2 focus:ring-purple-400 focus:border-transparent"
          disabled={loading}
        />
      </div>

      {/* Submit Button */}
      <div className="flex justify-center">
        <button
          onClick={getRecommendation}
          disabled={loading || !description.trim()}
          className="px-0.5 py-0.5 bg-purple-700 hover:bg-gradient-to-r hover:from-purple-600 hover:via-purple-700 hover:to-purple-800 text-white font-semibold text-sm rounded-lg transition-all duration-200 shadow-md flex items-center justify-center tracking-widest text-glow-purple disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span className="flex items-center gap-2 px-3 py-1 border border-white rounded-lg">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9 9a2 2 0 114 0 2 2 0 01-4 0zm-4.5 0a2 2 0 114 0 2 2 0 01-4 0zM15 9a2 2 0 114 0 2 2 0 01-4 0z" />
            </svg>
            {loading ? "Finding..." : "Find"}
          </span>
        </button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-700">Error: {error}</p>
        </div>
      )}

      {/* Results Display */}
      {result && (
        <div className="mt-6">
          <div className="space-y-4">
            {result.recommendations.map((rec, index) => (
                <div
                  key={index}
                  className="p-4 border border-purple-100 rounded-lg bg-white shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-bold text-lg text-gray-900">
                        {rec.practitioner.name}
                      </h3>
                      <p className="text-gray-600 text-sm">{rec.practitioner.title}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-purple-600">
                        Match: {(rec.matchScore * 100).toFixed(0)}%
                      </div>
                      <div
                        className={`text-xs px-2 py-1 rounded-full mt-1 font-medium ${
                          rec.urgency === "crisis"
                            ? "bg-red-100 text-red-800"
                            : rec.urgency === "urgent"
                            ? "bg-orange-100 text-orange-700"
                            : rec.urgency === "soon"
                            ? "bg-yellow-100 text-yellow-700"
                            : "bg-green-100 text-green-700"
                        }`}
                      >
                        {rec.urgency.toUpperCase()}
                      </div>
                    </div>
                  </div>

                  <div className="mb-3 space-y-1">
                    <p className="text-sm text-gray-700">
                      📞 {rec.practitioner.contact.phone}
                    </p>
                    <p className="text-sm text-gray-700">
                      📧 {rec.practitioner.contact.email}
                    </p>
                  </div>

                  <div>
                    <h4 className="font-semibold text-sm mb-2 text-gray-900">Next Steps:</h4>
                    <ul className="list-disc list-inside space-y-1">
                      {rec.nextSteps.map((step, stepIndex) => (
                        <li key={stepIndex} className="text-sm text-gray-700">
                          {step}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
