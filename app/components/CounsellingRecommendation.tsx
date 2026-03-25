"use client";

import { useState } from "react";
import type { ClientData } from "@/app/components/Client";

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

interface CounsellingRecommendationProps {
  /** When the account is saved and this includes at least an email, the intake text is written to the client profile as initial consult notes after a successful match. */
  savedClient?: ClientData | null;
  /** Fired when the server returns an updated client after saving initial consult notes. */
  onClientProfileUpdated?: (client: ClientData) => void;
}

export function CounsellingRecommendation({
  savedClient,
  onClientProfileUpdated,
}: CounsellingRecommendationProps = {}) {
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<RecommendationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notesSaveError, setNotesSaveError] = useState<string | null>(null);
  const [savingCounsellorIndex, setSavingCounsellorIndex] = useState<number | null>(
    null,
  );
  const [selectionError, setSelectionError] = useState<string | null>(null);
  const [selectedCounsellorIndex, setSelectedCounsellorIndex] = useState<
    number | null
  >(null);

  const persistCounsellorSelection = async (
    rec: RecommendationResult["recommendations"][0],
    index: number,
  ) => {
    if (!savedClient?.email?.trim() || !savedClient.client_id?.trim()) {
      setSelectionError("Client profile not found or incomplete.");
      return;
    }

    setSavingCounsellorIndex(index);
    setSelectionError(null);
    try {
      const response = await fetch("/api/client", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          client_id: savedClient.client_id,
          requested_counsellor: rec.practitioner.name,
          urgency: rec.urgency,
        }),
      });
      const payload = (await response.json()) as {
        error?: string;
        client?: ClientData;
      };
      if (!response.ok || payload.error || !payload.client) {
        setSelectionError("Could not save your counsellor choice to your profile.");
        return;
      }
      onClientProfileUpdated?.({
        ...savedClient,
        ...payload.client,
        requested_counsellor: rec.practitioner.name,
        urgency: rec.urgency,
      });
      setSelectedCounsellorIndex(index);
    } catch {
      setSelectionError("Could not save your counsellor choice to your profile.");
    } finally {
      setSavingCounsellorIndex(null);
    }
  };

  const persistInitialConsultNotes = async (note: string) => {
    if (!savedClient?.email?.trim()) return;

    setNotesSaveError(null);
    try {
      if (savedClient.client_id?.trim()) {
        const response = await fetch("/api/client", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            client_id: savedClient.client_id,
            note,
          }),
        });
        const payload = (await response.json()) as {
          error?: string;
          client?: ClientData;
        };
        if (!response.ok || payload.error) {
          setNotesSaveError("Could not save your note to your client profile.");
          return;
        }
        onClientProfileUpdated?.({
          ...savedClient,
          ...(payload.client ?? {}),
          initial_consult_notes: note,
        });
        return;
      }

      const response = await fetch("/api/client", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          first_name: savedClient.first_name,
          last_name: savedClient.last_name,
          email: savedClient.email,
          initial_consult_notes: note,
        }),
      });
      const payload = (await response.json()) as {
        error?: string;
        client?: ClientData;
      };
      if (!response.ok || payload.error || !payload.client) {
        setNotesSaveError("Could not save your note to your client profile.");
        return;
      }
      onClientProfileUpdated?.({
        ...payload.client,
        initial_consult_notes: note,
      });
    } catch {
      setNotesSaveError("Could not save your note to your client profile.");
    }
  };

  const getRecommendation = async () => {
    if (!description.trim()) {
      setError("Please describe what you're going through");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);
    setNotesSaveError(null);

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
      setSelectionError(null);
      if (savedClient?.requested_counsellor) {
        const idx = data.recommendations.findIndex(
          (r: RecommendationResult["recommendations"][0]) =>
            r.practitioner.name === savedClient.requested_counsellor,
        );
        setSelectedCounsellorIndex(idx >= 0 ? idx : null);
      } else {
        setSelectedCounsellorIndex(null);
      }

      const note = description.trim();
      await persistInitialConsultNotes(note);
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

      {notesSaveError && (
        <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <p className="text-amber-800 text-sm">{notesSaveError}</p>
        </div>
      )}

      {selectionError && (
        <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <p className="text-amber-800 text-sm">{selectionError}</p>
        </div>
      )}

      {/* Results Display */}
      {result && (
        <div className="mt-6">
          <p className="text-sm text-gray-600 mb-3 text-center">
            Click a counsellor to save them as your requested counsellor and urgency to your
            profile.
          </p>
          <div className="space-y-4">
            {result.recommendations.map((rec, index) => {
              const isSelected = selectedCounsellorIndex === index;
              const isSaving = savingCounsellorIndex === index;
              const disabled =
                !savedClient?.email?.trim() ||
                loading ||
                isSaving ||
                savingCounsellorIndex !== null;
              return (
                <button
                  key={index}
                  type="button"
                  disabled={disabled}
                  onClick={() => persistCounsellorSelection(rec, index)}
                  className={`w-full text-left p-4 border rounded-lg shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed ${
                    isSelected
                      ? "border-purple-500 bg-purple-50/80 ring-1 ring-purple-300"
                      : "border-purple-100 bg-white hover:shadow-md hover:border-purple-200"
                  }`}
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-bold text-lg text-gray-900">
                        {rec.practitioner.name}
                      </h3>
                      <p className="text-gray-600 text-sm">{rec.practitioner.title}</p>
                    </div>
                    <div className="text-right shrink-0 ml-2">
                      <div className="text-sm font-medium text-purple-600">
                        Match: {(rec.matchScore * 100).toFixed(0)}%
                      </div>
                      <div
                        className={`text-xs px-2 py-1 rounded-full mt-1 font-medium inline-block ${
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
                      {isSaving && (
                        <p className="text-xs text-purple-600 mt-2 font-medium">Saving…</p>
                      )}
                      {isSelected && !isSaving && (
                        <p className="text-xs text-purple-700 mt-2 font-semibold">
                          Saved to profile
                        </p>
                      )}
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
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
