'use client'

import { useState, useRef } from 'react'
import { CounsellingRecommendation } from './CounsellingRecommendation'
export default function VoiceAgent() {
  const [isRecording, setIsRecording] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [agentResponse, setAgentResponse] = useState('')
  const [parsedDetails, setParsedDetails] = useState<{
    firstName: string
    lastName: string
    email: string
  } | null>(null)
  const [error, setError] = useState('')
  const [hasStarted, setHasStarted] = useState(false)
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])

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
        const { firstName, lastName, email, rawOutput } = data.result
        setParsedDetails({
          firstName: firstName ?? '',
          lastName: lastName ?? '',
          email: email ?? '',
        })
        setAgentResponse(rawOutput ?? '')
      }
    } catch (err) {
      console.error('Agent workflow error:', err)
      setError('Error processing with agent: ' + (err instanceof Error ? err.message : 'Unknown error'))
    }
  }

  const startRecording = async () => {
    try {
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
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
        await transcribeAudio(audioBlob)
        
        stream.getTracks().forEach(track => track.stop())
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
    <div className="py-8 max-w-2xl ml-8">
      <div className="bg-gray-100 rounded-lg shadow-lg p-6">
        <h2 className="text-lg font-semibold mb-4 pb-3 text-center border-b border-gray-300 text-gray-500 tracking-widest">Create Account Assistant</h2>
        
        {!hasStarted ? (
          <div className="flex flex-col items-center gap-6 py-8">
            <div className="text-center">
              <p className="text-xl font-light text-gray-400 mb-3">
                Thank you for choosing Positive Thought Counselling.
              </p>
              <p className="text-gray-700 mb-6">
                Let&apos;s start by getting your account set up. Press the button below and tell us:
              </p>
              <ul className="text-left bg-white rounded-lg p-4 mb-6 inline-block">
                <li className="text-gray-700 mb-2">✓ Your first name</li>
                <li className="text-gray-700 mb-2">✓ Your last name</li>
                <li className="text-gray-700">✓ Your email address</li>
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
              <div className="bg-white p-4 rounded-lg border border-teal-100 space-y-2">
                <p className="text-gray-800">
                  <span className="font-semibold">First name:</span> {parsedDetails.firstName || <span className="italic text-gray-500">Not found</span>}
                </p>
                <p className="text-gray-800">
                  <span className="font-semibold">Last name:</span> {parsedDetails.lastName || <span className="italic text-gray-500">Not found</span>}
                </p>
                <p className="text-gray-800">
                  <span className="font-semibold">Email:</span> {parsedDetails.email || <span className="italic text-gray-500">Not found</span>}
                </p>
                <div className="mt-3 flex gap-3">
                  <button
                    type="button"
                    className="px-4 py-2 rounded bg-green-600 hover:bg-gradient-to-r hover:from-green-500 hover:via-green-600 hover:to-green-700 text-white text-sm font-semibold tracking-widest transition-all duration-200 text-glow-green"
                    onClick={() => {
                      // Placeholder: here you could POST these details to your backend
                      console.log('Saved details:', parsedDetails)
                      alert('Details saved (currently just logged to console).')
                    }}
                  >
                    Save Details
                  </button>
                  <button
                    type="button"
                    className="px-4 py-2 rounded bg-gray-300 hover:bg-gradient-to-r hover:from-gray-200 hover:via-gray-300 hover:to-gray-400 text-gray-800 text-sm font-semibold tracking-widest transition-all duration-200 text-glow-gray"
                    onClick={() => {
                      // Allow user to re-record / re-run
                      setParsedDetails(null)
                      setAgentResponse('')
                    }}
                  >
                    Edit / Re-record
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

          <CounsellingRecommendation />
          </div>
        )}
      </div>
    </div>
  )
}
