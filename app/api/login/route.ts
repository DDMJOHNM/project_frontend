import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function POST(request: Request) {
  try {
      const { email, password } = await request.json()
      console.log("email:", email)
      console.log("password:", password)
      
      const fakeemail = "johnmason@email.com"

      // Get backend URL from environment variable
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || process.env.BACKEND_URL
      
      if (!backendUrl) {
        return NextResponse.json(
          { message: 'Backend URL not configured' },
          { status: 500 }
        )
      }

      // Call backend API for authentication
      const res = await fetch(
        `${backendUrl}/login`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ "username": fakeemail, "password" : password }),
        }
      )

        // if (!res.ok) {
        //   // Forward 401 for invalid credentials, otherwise generic failure
        //   return NextResponse.json(
        //     { message: 'Invalid credentials' },
        //     { status: res.status === 401 ? 401 : 400 }
        //   )
        // }

        const data = await res.json()
        const apiToken = data?.token || data?.authToken || data?.session

        // if (!apiToken) {
        //   return NextResponse.json(
        //     { message: 'Auth service did not return a token' },
        //     { status: 500 }
        //   )
        // }

        // // Set the token in an HTTP-only cookie and return success
        cookies().set('authToken', apiToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
          maxAge: 7 * 24 * 60 * 60 // 1 week
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

