import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json()
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || process.env.BACKEND_URL
    
    if (!backendUrl) {
      return NextResponse.json(
        { message: 'Backend URL not configured' },
        { status: 500 }
      )
    }

    const res = await fetch(
      `${backendUrl}/api/auth/login`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ "login": email, "password": password }),
      }
    )

    if (!res.ok) {
      try {
        const errorData = await res.json()
        console.log("Backend error response:", JSON.stringify(errorData))
        
        return NextResponse.json(
          { message: errorData.message || errorData.error || 'Invalid credentials' },
          { status: res.status }
        )
      } catch (parseError) {
        console.log("JSON parsing failed:", parseError)

        return NextResponse.json(
          { message: 'Invalid credentials' },
          { status: res.status }
        )
      }
    }

    const data = await res.json()
    const apiToken = data?.token || data?.authToken || data?.session

    if (!apiToken) {
      return NextResponse.json(
        { message: 'Auth service did not return a token' },
        { status: 500 }
      )
    }

    const expiresInSeconds = 30 * 60
    const loginTimestamp = Date.now()
    
    cookies().set('authToken', apiToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: expiresInSeconds
    })
    
    cookies().set('loginTime', loginTimestamp.toString(), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: expiresInSeconds
    })
    
    return NextResponse.json(
      {
        message: 'Authenticated successfully',
        token: ""
      },
      { status: 200 }
    )
  } catch (err) {
    return NextResponse.json(
      { message: 'An error occurred contacting auth service' + err },
      { status: 500 }
    )
  }
}

