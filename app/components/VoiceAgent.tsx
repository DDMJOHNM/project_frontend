'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { CounsellingRecommendation } from './CounsellingRecommendation'
import { ClientData, Client } from '@/app/components/Client'
import { ResetOnboardingButton } from '@/app/components/ResetOnboardingButton'
import {
  clearOnboardingClientEmail,
  ONBOARDING_RESET_EVENT,
  persistOnboardingClientEmail,
  readOnboardingClientEmail,
} from '@/lib/onboardingStorage'

export default function VoiceAgent() {
  const [isRecording, setIsRecording] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [agentResponse, setAgentResponse] = useState('')
  const [parsedDetails, setParsedDetails] = useState<ClientData | null>(null)
  
  const [client, setClient] = useState<ClientData | null>(null)
  const [accountSaved, setAccountSaved] = useState(false)
  const [profileLoading, setProfileLoading] = useState(false)
  /** When true, first/last/email are shown as inputs so the user can correct them before Save. */
  const [editingAccountDetails, setEditingAccountDetails] = useState(false)
  /** After a counsellor is chosen, the finder is hidden unless the user opts to change. */
  const [showCounsellorFinderOverride, setShowCounsellorFinderOverride] = useState(false)

  const [error, setError] = useState('')
  const [hasStarted, setHasStarted] = useState(false)
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  /** When true, `onstop` skips transcription (e.g. reset during recording). */
  const resetAbortRecordingRef = useRef(false)
  /** Email used for the profile GET after save; avoids re-fetching when `client` updates from that response. */
  const profileFetchEmailRef = useRef<string | null>(null)

  /** Restore onboarding session after refresh (email in localStorage). */
  useEffect(() => {
    const email = readOnboardingClientEmail()
    if (!email) return
    profileFetchEmailRef.current = email
    setAccountSaved(true)
    setProfileLoading(true)
  }, [])

  useEffect(() => {
    if (!accountSaved) return
    const email = profileFetchEmailRef.current
    if (!email) {
      setProfileLoading(false)
      return
    }

    let cancelled = false

    fetch(`/api/client?email=${encodeURIComponent(email)}`)
      .then(async (response) => {
        const payload = (await response.json()) as { error?: string } & Partial<ClientData>
        if (response.status === 404) {
          clearOnboardingClientEmail()
          profileFetchEmailRef.current = null
          if (!cancelled) {
            setAccountSaved(false)
            setClient(null)
          }
          return null
        }
        if (!response.ok || payload.error) {
          throw new Error(typeof payload.error === 'string' ? payload.error : 'Failed to load profile')
        }
        return payload as ClientData
      })
      .then((data) => {
        if (data === null || cancelled) return
        setClient((prev) => {
          const incoming = data as ClientData
          const incNotes = incoming.initial_consult_notes
          const prevNotes = prev?.initial_consult_notes
          return {
            ...incoming,
            initial_consult_notes:
              incNotes != null && String(incNotes).trim() !== ''
                ? String(incNotes)
                : prevNotes,
          }
        })
      })
      .catch((err) => {
        console.error('Client profile fetch:', err)
      })
      .finally(() => {
        if (!cancelled) setProfileLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [accountSaved])

  const resetOnboardingUi = useCallback(() => {
    resetAbortRecordingRef.current = true
    if (mediaRecorderRef.current) {
      try {
        mediaRecorderRef.current.stop()
      } catch {
        // ignore
      }
    }
    mediaRecorderRef.current = null
    audioChunksRef.current = []
    profileFetchEmailRef.current = null
    setIsRecording(false)
    setTranscript('')
    setIsProcessing(false)
    setAgentResponse('')
    setParsedDetails(null)
    setClient(null)
    setAccountSaved(false)
    setProfileLoading(false)
    setEditingAccountDetails(false)
    setShowCounsellorFinderOverride(false)
    setError('')
    setHasStarted(false)
  }, [])

  useEffect(() => {
    const handler = () => resetOnboardingUi()
    window.addEventListener(ONBOARDING_RESET_EVENT, handler)
    return () => window.removeEventListener(ONBOARDING_RESET_EVENT, handler)
  }, [resetOnboardingUi])

  const hasChosenCounsellor = Boolean(client?.requested_counsellor?.trim())
  const showFindCounsellorSection =
    accountSaved && (!hasChosenCounsellor || showCounsellorFinderOverride)

  const handleCounsellingClientUpdated = (next: ClientData) => {
    setClient((prev) => {
      const base = prev ?? {
        first_name: '',
        last_name: '',
        email: '',
      }
      return {
        ...base,
        ...next,
        initial_consult_notes:
          next.initial_consult_notes ?? base.initial_consult_notes,
      }
    })
    if (next.requested_counsellor?.trim()) {
      setShowCounsellorFinderOverride(false)
    }
  }

  const runWorkflow = async (inputText: string) => {
    try {
      const response = await fetch('/api/agent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ input_as_text: inputText }),
      })

      const contentType = response.headers.get('content-type')
      
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text()
        console.error('Non-JSON response:', text.substring(0, 200))
        throw new Error(`Server returned ${response.status}: Expected JSON`)
      }

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Agent processing failed')
      }

      if (data.result) {
        const { first_name, last_name, email, rawOutput } = data.result
        setParsedDetails({
          first_name: first_name ?? '',
          last_name: last_name ?? '',
              email: email ?? '',
            })
        setEditingAccountDetails(false)
        setAgentResponse(rawOutput ?? '')
      }
    } catch (err) {
      console.error('Agent workflow error:', err)
      setError('Error processing with agent: ' + (err instanceof Error ? err.message : 'Unknown error'))
    }
  }

  const startRecording = async () => {
    try {
      resetAbortRecordingRef.current = false
      setError('')
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm'
      })
      
      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach((track) => track.stop())
        if (resetAbortRecordingRef.current) {
          resetAbortRecordingRef.current = false
          return
        }
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
        await transcribeAudio(audioBlob)
      }

      mediaRecorder.start()
      setIsRecording(true)
    } catch (err) {
      setError('Error accessing microphone: ' + (err instanceof Error ? err.message : 'Unknown error'))
      console.error('Error starting recording:', err)
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
    }
  }

  const transcribeAudio = async (audioBlob: Blob) => {
    setIsProcessing(true)
    setError('')
    setAgentResponse('')
    setParsedDetails(null)

    try {
      const formData = new FormData()
      formData.append('audio', audioBlob, 'recording.webm')

      const response = await fetch('/api/transcribe', {
        method: 'POST',
        body: formData,
      })

      const contentType = response.headers.get('content-type')
      
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text()
        console.error('Non-JSON response:', text.substring(0, 200))
        throw new Error(`Server returned ${response.status}: Expected JSON but got ${contentType}`)
      }

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Transcription failed')
      }

      setTranscript(data.transcript)
      
      // Run the agent workflow with the transcript
      if (data.transcript) {
        await runWorkflow(data.transcript)
      }
    } catch (err) {
      setError('Error transcribing audio: ' + (err instanceof Error ? err.message : 'Unknown error'))
      console.error('Error transcribing:', err)
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="py-8 px-4">
      <div className="flex flex-col gap-6 max-w-4xl mx-auto">
        {accountSaved ? (
          <div className="rounded-lg bg-white border border-gray-200 shadow-sm px-4 py-4">
            <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-widest">
                Completed tasks
              </h3>
              <div className="shrink-0 self-start">
                <ResetOnboardingButton />
              </div>
            </div>
            <ul className="space-y-3" role="list">
              <li className="flex items-center gap-3">
                <span
                  className="flex-shrink-0 w-6 h-6 rounded-full bg-green-500 flex items-center justify-center"
                  aria-hidden
                >
                  <svg
                    className="w-4 h-4 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </span>
                <span className="text-sm font-medium text-gray-800">Create account</span>
              </li>
              <li className="flex items-center gap-3">
                {hasChosenCounsellor && !showFindCounsellorSection ? (
                  <span
                    className="flex-shrink-0 w-6 h-6 rounded-full bg-green-500 flex items-center justify-center"
                    aria-hidden
                  >
                    <svg
                      className="w-4 h-4 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </span>
                ) : (
                  <span
                    className="flex-shrink-0 w-6 h-6 rounded-full border-2 border-gray-300 bg-gray-50"
                    aria-hidden
                  />
                )}
                <span
                  className={`text-sm font-medium ${
                    hasChosenCounsellor && !showFindCounsellorSection
                      ? 'text-gray-800'
                      : 'text-gray-500'
                  }`}
                >
                  Find your counsellor
                </span>
              </li>
            </ul>
          </div>
        ) : (
        <div className="rounded-lg bg-gray-100 shadow-lg p-6">
          <div className={`flex items-center justify-between border-b border-gray-300 ${accountSaved ? 'pb-2' : 'mb-4 pb-3'}`}>
            <h2 className={`font-semibold text-gray-500 tracking-widest ${accountSaved ? 'text-base' : 'text-lg'}`}>Create Account Assistant</h2>
            {accountSaved && (
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            )}
          </div>
        
        {accountSaved ? null : !hasStarted ? (
          <div className="flex flex-col items-center gap-6 py-8">
            <div className="text-center">
              <p className="text-xl font-light text-gray-700 mb-3">
                Thank you for choosing Positive Thought Counselling.
              </p>
              <p className="text-gray-800 mb-6">
                Let&apos;s start by getting your account set up. Press the button below and tell us:
              </p>
              <ul className="text-left rounded-xl p-5 mb-6 inline-block min-w-[16rem] space-y-2 bg-white border-2 border-gray-200 shadow-md ring-1 ring-black/5">
                <li className="text-gray-900">✓ Your first name</li>
                <li className="text-gray-900">✓ Your last name</li>
                <li className="text-gray-900">✓ Your email address</li>
              </ul>
            </div>
            <button
              onClick={() => {
                setHasStarted(true)
                startRecording()
              }}
              disabled={isProcessing}
              className="px-0.5 py-0.5 bg-purple-700 hover:bg-gradient-to-r hover:from-purple-600 hover:via-purple-700 hover:to-purple-800 text-white font-semibold text-sm rounded-lg transition-all duration-200 shadow-md flex items-center justify-center tracking-widest text-glow-purple"
            >
              <span className="flex items-center gap-2 px-3 py-1 border border-white rounded-lg">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0m0-1.035A5.007 5.007 0 013.05 8H1a1 1 0 000 2h2.05a7.01 7.01 0 0011.9 0H19a1 1 0 100-2h-2.05A5.007 5.007 0 018 14.965zM12 8a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
                </svg>
                Start
              </span>
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4">
          <button
            onClick={isRecording ? stopRecording : startRecording}
            disabled={isProcessing}
            className={`px-0.5 py-0.5 rounded-lg font-semibold text-sm transition-all duration-200 flex items-center justify-center ${
              isRecording
                ? 'bg-red-500 hover:bg-gradient-to-r hover:from-red-400 hover:via-red-500 hover:to-red-600 text-white tracking-widest text-glow-red'
                : 'bg-purple-700 hover:bg-gradient-to-r hover:from-purple-600 hover:via-purple-700 hover:to-purple-800 text-white tracking-widest text-glow-purple'
            } ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <span className="flex items-center gap-2 px-3 py-1 border border-white rounded-lg">
              {isRecording ? (
                <>
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M6 6h8v8H6z" />
                  </svg>
                  Stop
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0m0-1.035A5.007 5.007 0 013.05 8H1a1 1 0 000 2h2.05a7.01 7.01 0 0011.9 0H19a1 1 0 100-2h-2.05A5.007 5.007 0 018 14.965zM12 8a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
                  </svg>
                  Start
                </>
              )}
            </span>
          </button>

          {isProcessing && (
            <p className="text-teal-600 font-medium">Processing audio...</p>
          )}

          {error && (
            <div className="bg-red-50 text-red-600 px-3 py-2 rounded mt-2">
              <p className="text-sm">{error}</p>
            </div>
          )}

          {transcript && (
            <div className="mt-4 w-full">
              <h3 className="text-gray-600 font-semibold mb-2">Transcript:</h3>
              <div className="bg-white p-4 rounded-lg min-h-[100px] border border-teal-100">
                <p className="text-gray-800">{transcript}</p>
              </div>
            </div>
          )}

          {parsedDetails && (
            <div className="mt-4 w-full">
              <h3 className="text-gray-600 font-semibold mb-2">Detected Details (Review):</h3>
              <div className="bg-white p-4 rounded-lg border border-teal-100 space-y-3">
                {editingAccountDetails ? (
                  <>
                    <label className="block text-sm text-gray-800">
                      <span className="font-semibold">First name</span>
                      <input
                        type="text"
                        value={parsedDetails.first_name}
                        onChange={(e) =>
                          setParsedDetails({ ...parsedDetails, first_name: e.target.value })
                        }
                        className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                        autoComplete="given-name"
                      />
                    </label>
                    <label className="block text-sm text-gray-800">
                      <span className="font-semibold">Last name</span>
                      <input
                        type="text"
                        value={parsedDetails.last_name}
                        onChange={(e) =>
                          setParsedDetails({ ...parsedDetails, last_name: e.target.value })
                        }
                        className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                        autoComplete="family-name"
                      />
                    </label>
                    <label className="block text-sm text-gray-800">
                      <span className="font-semibold">Email</span>
                      <input
                        type="email"
                        value={parsedDetails.email}
                        onChange={(e) =>
                          setParsedDetails({ ...parsedDetails, email: e.target.value })
                        }
                        className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                        autoComplete="email"
                      />
                    </label>
                  </>
                ) : (
                  <>
                    <p className="text-gray-800">
                      <span className="font-semibold">First name:</span>{' '}
                      {parsedDetails.first_name || (
                        <span className="italic text-gray-500">Not found</span>
                      )}
                    </p>
                    <p className="text-gray-800">
                      <span className="font-semibold">Last name:</span>{' '}
                      {parsedDetails.last_name || (
                        <span className="italic text-gray-500">Not found</span>
                      )}
                    </p>
                    <p className="text-gray-800">
                      <span className="font-semibold">Email:</span>{' '}
                      {parsedDetails.email || (
                        <span className="italic text-gray-500">Not found</span>
                      )}
                    </p>
                  </>
                )}
                <div className="mt-3 flex flex-wrap gap-3">
                  <button
                    type="button"
                    className="px-4 py-2 rounded bg-green-600 hover:bg-gradient-to-r hover:from-green-500 hover:via-green-600 hover:to-green-700 text-white text-sm font-semibold tracking-widest transition-all duration-200 text-glow-green"
                    onClick={async () => {
                      try {
                        const response = await fetch('/api/client', {
                          method: 'POST',
                          headers: {
                            'Content-Type': 'application/json',
                          },
                          body: JSON.stringify(parsedDetails),
                        })
                        const data = await response.json()
                        if (!response.ok || data.error) {
                          console.error('Error saving client:', data.error ?? response.status)
                          return
                        }
                        const nextClient: ClientData =
                          data.client && typeof data.client === 'object'
                            ? data.client
                            : parsedDetails
                        const emailForProfile = nextClient.email || parsedDetails.email
                        profileFetchEmailRef.current = emailForProfile
                        persistOnboardingClientEmail(emailForProfile)
                        setClient(nextClient)
                        setProfileLoading(true)
                        setAccountSaved(true)
                        setEditingAccountDetails(false)
                      } catch (error) {
                        console.error('Error saving client:', error)
                      }
                    }}
                  >
                    Save Details
                  </button>
                  {!editingAccountDetails ? (
                    <button
                      type="button"
                      className="px-4 py-2 rounded bg-indigo-600 hover:bg-gradient-to-r hover:from-indigo-500 hover:via-indigo-600 hover:to-indigo-700 text-white text-sm font-semibold tracking-widest transition-all duration-200"
                      onClick={() => setEditingAccountDetails(true)}
                    >
                      Edit
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="px-4 py-2 rounded border border-gray-400 bg-white hover:bg-gray-50 text-gray-800 text-sm font-semibold tracking-widest transition-all duration-200"
                      onClick={() => setEditingAccountDetails(false)}
                    >
                      Done editing
                    </button>
                  )}
                  <button
                    type="button"
                    className="px-4 py-2 rounded bg-gray-300 hover:bg-gradient-to-r hover:from-gray-200 hover:via-gray-300 hover:to-gray-400 text-gray-800 text-sm font-semibold tracking-widest transition-all duration-200 text-glow-gray"
                    onClick={() => {
                      setParsedDetails(null)
                      setAgentResponse('')
                      setEditingAccountDetails(false)
                    }}
                  >
                    Re-record
                  </button>
                </div>
              </div>
            </div>
          )}

          {agentResponse && !parsedDetails && (
            <div className="mt-4 w-full">
              <h3 className="text-gray-600 font-semibold mb-2">Agent Response:</h3>
              <div className="bg-white p-4 rounded-lg min-h-[100px] border border-teal-100">
                <p className="text-gray-800">{agentResponse}</p>
              </div>
            </div>
          )}
          </div>
        )}
        </div>
        )}

        {showFindCounsellorSection && (
          <div className="bg-gray-100 rounded-lg shadow-lg p-6">
            <h2 className="text-lg font-semibold mb-4 pb-3 text-center border-b border-gray-300 text-gray-500 tracking-widest">Find Your Counsellor</h2>
            <CounsellingRecommendation
              savedClient={client}
              onClientProfileUpdated={handleCounsellingClientUpdated}
            />
          </div>
        )}

        {accountSaved && (
          <div className="bg-gray-100 rounded-lg shadow-lg p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4 pb-3 border-b border-gray-300">
              <h2 className="text-lg font-semibold text-center sm:text-left text-gray-500 tracking-widest">
                Client Profile
              </h2>
              {hasChosenCounsellor && !showFindCounsellorSection && (
                <button
                  type="button"
                  onClick={() => setShowCounsellorFinderOverride(true)}
                  className="text-sm font-medium text-purple-700 hover:text-purple-900 underline underline-offset-2 self-center sm:self-auto"
                >
                  Change counsellor
                </button>
              )}
            </div>
            {profileLoading && (
              <p className="text-sm text-gray-500 mb-3">Loading profile from server…</p>
            )}
            <Client client={client ?? { first_name: '', last_name: '', email: '' }} />
          </div>
        )}
      </div>
    </div>
  )
}
