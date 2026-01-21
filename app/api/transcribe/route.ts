import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

// Initialize OpenAI client lazily to avoid build-time errors
function getOpenAIClient() {
  const apiKey = process.env.OPENAI_API_KEY //where should this
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY environment variable is not set')
  }
  return new OpenAI({
    apiKey: apiKey,
  })
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const audioFile = formData.get('audio') as File

    if (!audioFile) {
      return NextResponse.json(
        { error: 'No audio file provided' },
        { status: 400 }
      )
    }

    // Convert File to a format OpenAI can use
    const arrayBuffer = await audioFile.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Create a File-like object for OpenAI
    const file = new File([buffer], audioFile.name, { type: audioFile.type })

    // Transcribe using OpenAI Whisper API
    const openai = getOpenAIClient()
    const transcription = await openai.audio.transcriptions.create({
      file: file,
      model: 'whisper-1',
      language: 'en', // Optional: specify language
      response_format: 'text', // or 'json', 'verbose_json', etc.
    })

    return NextResponse.json({
      transcript: transcription,
    })
  } catch (error) {
    console.error('Transcription error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to transcribe audio' },
      { status: 500 }
    )
  }
}