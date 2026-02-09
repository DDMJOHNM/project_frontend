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
  
  // DEBUG: Log what we're seeing (will appear in Amplify CloudWatch logs)
  console.log('========== AUTH CHECK START ==========')
  console.log('Server time:', new Date().toISOString())
  console.log('Has authToken:', !!authToken)
  console.log('Has loginTime:', !!loginTime)
  console.log('authToken value:', authToken?.value ? 'EXISTS' : 'MISSING')
  console.log('loginTime value:', loginTime?.value || 'MISSING')
  
  // If no auth token, redirect to login
  if (!authToken) {
    console.log('❌ NO AUTH TOKEN - Redirecting to login')
    console.log('========== AUTH CHECK END ==========')
    redirect('/login')
  }
  
  // Check if session has expired (1 hour = 3600000 milliseconds)
  if (loginTime) {
    const loginTimestamp = parseInt(loginTime.value)
    const now = Date.now()
    const sessionDuration = now - loginTimestamp
    const maxSessionDuration = 1 * 60 * 60 * 1000 // 1 hour in milliseconds
    
    console.log('Login timestamp:', new Date(loginTimestamp).toISOString())
    console.log('Current timestamp:', new Date(now).toISOString())
    console.log('Session duration (seconds):', Math.floor(sessionDuration / 1000))
    console.log('Max duration (seconds):', Math.floor(maxSessionDuration / 1000))
    console.log('Is expired:', sessionDuration > maxSessionDuration)
    
    if (sessionDuration > maxSessionDuration) {
      // Session expired, redirect to login
      console.log('❌ SESSION EXPIRED - Redirecting to login')
      console.log('========== AUTH CHECK END ==========')
      redirect('/login')
    } else {
      console.log('✅ Session valid, remaining seconds:', Math.floor((maxSessionDuration - sessionDuration) / 1000))
    }
  } else {
    console.log('⚠️  No loginTime cookie found - this is a bug! authToken exists but loginTime missing')
  }
  
  console.log('✅ AUTH CHECK PASSED - Rendering page')
  console.log('========== AUTH CHECK END ==========')


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