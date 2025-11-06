import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function POST(request: Request) {
  try {
      const { email, password } = await request.json()
      console.log("email:", email)
      
      const fakeemail = "johnmason"

      // Call external login API
      try {
        const res = await fetch(
          'https://beobftaez9.execute-api.us-west-2.amazonaws.com/prod/login',
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ "username": fakeemail, "password" : password }),
          }
        )

        if (!res.ok) {
          // Forward 401 for invalid credentials, otherwise generic failure
          return NextResponse.json(
            { message: 'Invalid credentials' },
            { status: res.status === 401 ? 401 : 400 }
          )
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
        cookies().set('authToken', apiToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
          maxAge: 7 * 24 * 60 * 60 // 1 week
        })

        return NextResponse.json(
          {
            message: 'Authenticated successfully',
            token: apiToken
          },
          { status: 200 }
        )
      } catch (err) {
        return NextResponse.json(
          { message: 'An error occurred contacting auth service' },
          { status: 500 }
        )
       
      }
    } catch (err) {
      return NextResponse.json(
        { message: 'Invalid request payload' },
        { status: 400 }
      )
    }
}
