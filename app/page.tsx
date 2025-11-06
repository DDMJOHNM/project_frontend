'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function IndexPage() {
  const router = useRouter()

  useEffect(() => {
    // Check if user is authenticated by verifying the token
    const token = sessionStorage.getItem('authToken')
    if (!token) {
      router.push('/login')
    }
  }, [router])

  return (
    <div className="container mx-auto py-24">
      <div className="min-h-7 min-w-1rounded overflow-hidden shadow-lg"> 
        <h2 className="text-center">DashBoard</h2>
      </div>
    </div>
  )
}