'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import VoiceAgent from './components/VoiceAgent'
import Logo from './components/Logo'

export default function IndexPage() {
  const router = useRouter()

  useEffect(() => {
    //TODO: Build Auth route to authenticate the user
    // Check if user is authenticated by verifying the token
    // const token = sessionStorage.getItem('authToken')
    //  if (!token) {
    //    router.push('/login')
    //  }
  }, [router])

  return (
    <div>
      <div className="pt-8 pl-8">
        <Logo />
      </div>
      <div className="container mx-auto py-8">
        <div className="min-h-7 min-w-1rounded overflow-hidden shadow-lg bg-stone-50 p-6 rounded-lg"> 
          <h1 className="text-xl font-semibold mb-4 pb-3 text-center border-b border-purple-400 text-purple-400 tracking-widest">Client Manager</h1>
          <VoiceAgent />
        </div>
      </div>
    </div>
  )
}