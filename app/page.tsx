import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import VoiceAgent from './components/VoiceAgent'
import Logo from './components/Logo'

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
        <h2 className="mb-6 text-center">
          <span className="inline-block rounded-xl border border-gray-200 bg-white px-6 py-2 text-2xl font-semibold tracking-widest text-purple-900 shadow-[0_6px_24px_rgba(0,0,0,0.12)] ring-1 ring-black/10">
            Client Onboarding
          </span>
        </h2>
        <VoiceAgent />  
      </div>      
    </div>
  )
}