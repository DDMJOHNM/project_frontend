import {
  clearOnboardingClientEmail,
  ONBOARDING_CLIENT_EMAIL_KEY,
  persistOnboardingClientEmail,
  readOnboardingClientEmail,
} from './onboardingStorage'

describe('onboardingStorage', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('persists and reads trimmed email', () => {
    persistOnboardingClientEmail('  user@example.com  ')
    expect(localStorage.getItem(ONBOARDING_CLIENT_EMAIL_KEY)).toBe('user@example.com')
    expect(readOnboardingClientEmail()).toBe('user@example.com')
  })

  it('clears stored email', () => {
    persistOnboardingClientEmail('a@b.co')
    clearOnboardingClientEmail()
    expect(readOnboardingClientEmail()).toBeNull()
  })
})
