'use client'

import {
  ONBOARDING_RESET_EVENT,
  clearOnboardingClientEmail,
} from '@/lib/onboardingStorage'

export function ResetOnboardingButton() {
  const handleReset = () => {
    clearOnboardingClientEmail()
    window.dispatchEvent(new CustomEvent(ONBOARDING_RESET_EVENT))
  }

  return (
    <button
      type="button"
      onClick={handleReset}
      className="text-sm font-medium text-purple-800 hover:text-purple-950 underline underline-offset-2"
    >
      Reset onboarding
    </button>
  )
}
