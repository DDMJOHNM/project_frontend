/** localStorage key for the client email used to reload onboarding state after refresh. */
export const ONBOARDING_CLIENT_EMAIL_KEY = 'onboardingClientEmail'

/** Dispatched on `window` so `VoiceAgent` can clear UI state without logging out. */
export const ONBOARDING_RESET_EVENT = 'positivethought:onboarding-reset'

export function persistOnboardingClientEmail(email: string): void {
  const trimmed = email.trim()
  if (!trimmed || typeof window === 'undefined') return
  try {
    window.localStorage.setItem(ONBOARDING_CLIENT_EMAIL_KEY, trimmed)
  } catch {
    // Quota or private mode — ignore
  }
}

export function readOnboardingClientEmail(): string | null {
  if (typeof window === 'undefined') return null
  try {
    const v = window.localStorage.getItem(ONBOARDING_CLIENT_EMAIL_KEY)
    return v?.trim() ? v.trim() : null
  } catch {
    return null
  }
}

export function clearOnboardingClientEmail(): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.removeItem(ONBOARDING_CLIENT_EMAIL_KEY)
  } catch {
    // ignore
  }
}
