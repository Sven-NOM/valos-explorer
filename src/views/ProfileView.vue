<template>
  <div class="profile-view">
    <div class="profile-container">
      <header class="profile-header">
        <h1 class="profile-title">Tell us about your operation</h1>
        <p class="profile-subtitle">Your answers personalize results and your share card. All fields are optional.</p>
      </header>

      <div class="questions">
        <section class="question-section">
          <h2 class="question-label">Organization Type</h2>
          <div class="option-grid">
            <button
              v-for="opt in orgTypeOptions"
              :key="opt.value"
              class="option-btn"
              :class="{ selected: assessment.profile.orgType === opt.value }"
              @click="assessment.setProfileField('orgType', opt.value)"
            >
              {{ opt.label }}
            </button>
          </div>
        </section>

        <section class="question-section">
          <h2 class="question-label">Validator Count</h2>
          <div class="option-grid">
            <button
              v-for="opt in validatorCountOptions"
              :key="opt.value"
              class="option-btn"
              :class="{ selected: assessment.profile.validatorCount === opt.value }"
              @click="assessment.setProfileField('validatorCount', opt.value)"
            >
              {{ opt.label }}
            </button>
          </div>
        </section>

        <section class="question-section">
          <h2 class="question-label">Infrastructure</h2>
          <div class="option-grid">
            <button
              v-for="opt in infraOptions"
              :key="opt.value"
              class="option-btn"
              :class="{ selected: assessment.profile.infra === opt.value }"
              @click="assessment.setProfileField('infra', opt.value)"
            >
              {{ opt.label }}
            </button>
          </div>
        </section>

        <section class="question-section">
          <h2 class="question-label">Withdrawal Key Management</h2>
          <div class="option-grid">
            <button
              v-for="opt in keyMgmtOptions"
              :key="opt.value"
              class="option-btn"
              :class="{ selected: assessment.profile.keyMgmt === opt.value }"
              @click="assessment.setProfileField('keyMgmt', opt.value)"
            >
              {{ opt.label }}
            </button>
          </div>
        </section>

        <section class="question-section">
          <h2 class="question-label">Team Size</h2>
          <div class="option-grid">
            <button
              v-for="opt in teamSizeOptions"
              :key="opt.value"
              class="option-btn"
              :class="{ selected: assessment.profile.teamSize === opt.value }"
              @click="assessment.setProfileField('teamSize', opt.value)"
            >
              {{ opt.label }}
            </button>
          </div>
        </section>
      </div>

      <div class="profile-footer">
        <button class="continue-btn" @click="handleContinue">Continue</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useAssessmentStore } from '@/stores/assessment'
import type { OperatorProfile } from '@/stores/assessment'

const router = useRouter()
const assessment = useAssessmentStore()

const orgTypeOptions: { label: string; value: OperatorProfile['orgType'] }[] = [
  { label: 'Solo operator', value: 'solo' },
  { label: 'Small team', value: 'small-team' },
  { label: 'Organization', value: 'organization' },
  { label: 'Enterprise', value: 'enterprise' },
]

const validatorCountOptions: { label: string; value: OperatorProfile['validatorCount'] }[] = [
  { label: 'Under 10', value: 'under-10' },
  { label: '10–100', value: '10-100' },
  { label: '100–1,000', value: '100-1000' },
  { label: 'Over 1,000', value: 'over-1000' },
]

const infraOptions: { label: string; value: OperatorProfile['infra'] }[] = [
  { label: 'Cloud', value: 'cloud' },
  { label: 'Bare metal', value: 'bare-metal' },
  { label: 'Hybrid', value: 'hybrid' },
  { label: 'Managed service', value: 'managed' },
]

const keyMgmtOptions: { label: string; value: OperatorProfile['keyMgmt'] }[] = [
  { label: 'Hot wallet', value: 'hot-wallet' },
  { label: 'Hardware wallet', value: 'hardware-wallet' },
  { label: 'HSM', value: 'hsm' },
  { label: 'MPC', value: 'mpc' },
]

const teamSizeOptions: { label: string; value: OperatorProfile['teamSize'] }[] = [
  { label: 'Solo', value: 'solo' },
  { label: '2–5 people', value: '2-5' },
  { label: '6–20 people', value: '6-20' },
  { label: 'Over 20', value: 'over-20' },
]

function handleContinue() {
  router.push('/discovery')
}
</script>

<style scoped>
.profile-view {
  min-height: 100dvh;
  background-color: var(--color-surface-base);
  display: flex;
  justify-content: center;
  padding: 3rem 1.5rem;
}

.profile-container {
  width: 100%;
  max-width: 720px;
  display: flex;
  flex-direction: column;
  gap: 2.5rem;
}

.profile-header {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.profile-title {
  font-size: 1.75rem;
  font-weight: 700;
  color: var(--color-text-primary);
  margin: 0;
  line-height: 1.2;
}

.profile-subtitle {
  font-size: 0.9375rem;
  color: var(--color-text-secondary);
  margin: 0;
}

.questions {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.question-section {
  display: flex;
  flex-direction: column;
  gap: 0.875rem;
}

.question-label {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--color-text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  margin: 0;
}

.option-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 0.625rem;
}

.option-btn {
  padding: 0.625rem 1.125rem;
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border);
  background-color: var(--color-surface-overlay);
  color: var(--color-text-secondary);
  font-size: 0.9375rem;
  font-family: inherit;
  font-weight: 500;
  cursor: pointer;
  transition:
    background-color 0.15s ease,
    border-color 0.15s ease,
    color 0.15s ease;
  white-space: nowrap;
  line-height: 1.4;
}

.option-btn:hover {
  border-color: var(--color-brand);
  color: var(--color-text-primary);
}

.option-btn.selected {
  background-color: var(--color-brand-subtle);
  border-color: var(--color-brand);
  color: var(--color-brand);
}

.profile-footer {
  display: flex;
  justify-content: flex-end;
  padding-top: 0.5rem;
}

.continue-btn {
  padding: 0.75rem 2rem;
  border-radius: var(--radius-md);
  border: none;
  background-color: var(--color-brand);
  color: #fff;
  font-size: 1rem;
  font-family: inherit;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.15s ease;
}

.continue-btn:hover {
  background-color: var(--color-brand-hover);
}
</style>
