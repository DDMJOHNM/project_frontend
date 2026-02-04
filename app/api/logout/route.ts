import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function POST() {
  try {
    // Clear the auth cookies
    cookies().delete('authToken')
    cookies().delete('loginTime')
    
    return NextResponse.json(
      { message: 'Logged out successfully' },
      { status: 200 }
    )
  } catch (err) {
    console.log("JSON parsing failed:", JSON.stringify(err))
    return NextResponse.json(
      { message: 'An error occurred during logout' },
      { status: 500 }
    )
  }
}

