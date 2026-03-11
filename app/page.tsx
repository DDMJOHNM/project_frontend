import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import VoiceAgent from './components/VoiceAgent'
import Logo from './components/Logo'
import { Client } from './components/Client'

// Force dynamic rendering (no caching) - required for auth checks
export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'

export default function IndexPage() {
  // Check authentication server-side by reading the HTTP-only cookie
  const cookieStore = cookies()
  const authToken = cookieStore.get('authToken')
  const loginTime = cookieStore.get('loginTime')
  

  if (!authToken) {
    redirect('/login')
  }
  
  if (loginTime) {
    const loginTimestamp = parseInt(loginTime.value)
    const now = Date.now()
    const sessionDuration = now - loginTimestamp
    const maxSessionDuration = 30 * 60 * 1000 // 30 minutes in milliseconds - FOR TESTING
        
    if (sessionDuration > maxSessionDuration) {
      redirect('/login')
    } else {
      console.log('✅ Session valid, remaining seconds:', Math.floor((maxSessionDuration - sessionDuration) / 1000))
    }
  } else {
    console.log('⚠️  No loginTime cookie found - this is a bug! authToken exists but loginTime missing')
  }

  return (
    <div>
      <div className="pt-8 pl-8">
        <Logo />
      </div>
      <div className="container mx-auto py-8 px-4">
        <h2 className="text-2xl font-semibold mb-6 text-center text-purple-400 tracking-widest">
          Client Manager
        </h2>
        <VoiceAgent />  
      </div>      
    </div>
  )
}