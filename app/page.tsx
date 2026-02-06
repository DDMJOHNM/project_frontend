import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import VoiceAgent from './components/VoiceAgent'
import Logo from './components/Logo'

export default function IndexPage() {
  // Check authentication server-side by reading the HTTP-only cookie
  const cookieStore = cookies()
  const authToken = cookieStore.get('authToken')
  const loginTime = cookieStore.get('loginTime')
  
  // If no auth token, redirect to login
  if (!authToken) {
    redirect('/login')
  }
  
  // Check if session has expired (1 hour = 3600000 milliseconds)
  if (loginTime) {
    const loginTimestamp = parseInt(loginTime.value)
    const now = Date.now()
    const sessionDuration = now - loginTimestamp
    const maxSessionDuration = 1 * 60 * 60 * 1000 // 1 hour in milliseconds
    
    if (sessionDuration > maxSessionDuration) {
      // Session expired, redirect to login
      redirect('/login')
      }
  }

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