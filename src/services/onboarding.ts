export interface OnboardingState {
  step: number;
  completed: boolean;
}

export async function getOnboardingState(owner: string): Promise<OnboardingState> {
  try {
    const res = await fetch(`/api/onboarding?owner=${owner}`);
    const data = await res.json();
    return data.success ? data.record : { step: 0, completed: false };
  } catch {
    return { step: 0, completed: false };
  }
}

export async function setOnboardingState(owner: string, step: number, completed: boolean): Promise<void> {
  try {
    await fetch('/api/onboarding', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ owner, step, completed }),
    });
  } catch (e) {
    console.error('setOnboardingState error:', e);
  }
}