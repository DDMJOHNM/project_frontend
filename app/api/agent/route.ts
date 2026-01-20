import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

// Initialize OpenAI client lazily to avoid build-time errors
function getOpenAIClient() {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY environment variable is not set')
  }
  return new OpenAI({
    apiKey: apiKey,
  })
}

type WorkflowInput = { input_as_text: string }

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { input_as_text } = body as WorkflowInput

    if (!input_as_text) {
      return NextResponse.json(
        { error: 'input_as_text is required' },
        { status: 400 }
      )
    }

    // Use a plain chat completion to extract structured data from the transcript
    const openai = getOpenAIClient()
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      temperature: 0,
      messages: [
        {
          role: 'system',
          content: `
You are helping extract structured user details from a voice transcript.

GOAL:
- From the given transcript, reliably extract:
  - firstName
  - lastName
  - email

RULES:
- If any field is missing or unclear, set it to an empty string "".
- Do NOT ask follow-up questions.
- Do NOT include any explanation, prose, or extra text.
- Your final answer MUST be ONLY a valid JSON object with this exact shape:
  {
    "firstName": "...",
    "lastName": "...",
    "email": "..."
  }
          `.trim(),
        },
        {
          role: 'user',
          content: input_as_text,
        },
      ],
    })

    const rawOutput =
      completion.choices[0]?.message?.content ?? ''

    if (!rawOutput) {
      throw new Error('Model returned empty response')
    }

    // Parse the JSON the model was instructed to return
    let parsed
    const rawString = typeof rawOutput === 'string' ? rawOutput : String(rawOutput)

    try {
      // First, try to parse the whole string as JSON
      parsed = JSON.parse(rawString)
    } catch (err) {
      // If that fails, try to extract the first JSON object from the text
      const match = rawString.match(/\{[\s\S]*\}/)
      if (match) {
        try {
          parsed = JSON.parse(match[0])
        } catch (innerErr) {
          console.error('Failed to parse extracted JSON object:', match[0], innerErr)
          console.error('Full model output was:', rawString)
          throw new Error('Model did not return valid JSON')
        }
      } else {
        console.error('Model output did not contain a JSON object:', rawString, err)
        throw new Error('Model did not return valid JSON')
      }
    }

    const firstName = typeof parsed.firstName === 'string' ? parsed.firstName : ''
    const lastName = typeof parsed.lastName === 'string' ? parsed.lastName : ''
    const email = typeof parsed.email === 'string' ? parsed.email : ''

    const result = {
      firstName,
      lastName,
      email,
      rawOutput: rawString,
    }

    return NextResponse.json({
      success: true,
      result,
    })
  } catch (error) {
    console.error('Agent (chat) error:', error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to process agent request',
        details: process.env.NODE_ENV === 'development' ? String(error) : undefined,
      },
      { status: 500 }
    )
  }
}

