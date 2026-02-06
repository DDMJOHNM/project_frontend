import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function POST(request: Request) {
  try {
      const { email, password } = await request.json()

      // Get backend URL from environment variable
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || process.env.BACKEND_URL
      console.log("backendUrl:", backendUrl)
      
      if (!backendUrl) {
        return NextResponse.json(
          { message: 'Backend URL not configured' },
          { status: 500 }
        )
      }

      // Call backend API for authentication
      const res = await fetch(
        `${backendUrl}/api/auth/login`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ "login": email, "password": password }),
        }
      )

        console.log("Backend response status:", res.status)
        console.log("Backend response headers:", res.headers.get('content-type'))

        if (!res.ok) {
          // Try to parse the backend error response
          try {
            const errorData = await res.json()
            console.log("Backend error response:", JSON.stringify(errorData))
            
            // Return the actual error message from the backend
            return NextResponse.json(
              { message: errorData.message || errorData.error || 'Invalid credentials' },
              { status: res.status }
            )
          } catch (parseError) {
            console.log("JSON parsing failed:", parseError)
            // If JSON parsing fails, return generic error
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

          // Set the token in an HTTP-only cookie and return success
          const expiresInSeconds = 1 * 60 
          // try 1 min for testing

          
          cookies().set('authToken', apiToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax', // 'lax' is better for production with custom domains
          path: '/',
          maxAge: expiresInSeconds
        })
        
        // Set login timestamp to verify session age
        cookies().set('loginTime', Date.now().toString(), {
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

