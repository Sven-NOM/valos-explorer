<script setup lang="ts">
import { useCoverage } from '@/composables/useCoverage'

const { riskCoveragePct, mitigationCoveragePct, maturity, strengths, opportunities, naCount } = useCoverage()
</script>

<template>
  <section class="summary">
    <div class="maturity-block">
      <span class="maturity-label">Operator Maturity</span>
      <span class="maturity-word">{{ maturity }}</span>
    </div>

    <div class="coverage-block">
      <div class="coverage-row">
        <div class="coverage-meta">
          <span class="coverage-name">Risk breadth</span>
          <span class="coverage-pct">{{ riskCoveragePct }}%</span>
        </div>
        <div class="bar-track">
          <div class="bar-fill" :style="{ width: riskCoveragePct + '%' }" />
        </div>
      </div>

      <div class="coverage-row">
        <div class="coverage-meta">
          <span class="coverage-name">Mitigation depth</span>
          <span class="coverage-pct">{{ mitigationCoveragePct }}%</span>
        </div>
        <div class="bar-track">
          <div class="bar-fill" :style="{ width: mitigationCoveragePct + '%' }" />
        </div>
      </div>

      <p v-if="naCount > 0" class="na-disclosure">
        {{ naCount }} {{ naCount === 1 ? 'risk' : 'risks' }} marked Not Applicable at your scale.
      </p>
    </div>

    <div class="insight-block">
      <div class="insight-section">
        <span class="insight-label">Areas of Strength</span>
        <ul v-if="strengths.length" class="insight-list">
          <li v-for="m in strengths" :key="m.id" class="insight-item">
            <span class="insight-check" aria-hidden="true">✓</span>
            {{ m.title }}
          </li>
        </ul>
        <p v-else class="insight-empty">
          Complete more assessments to see your areas of strength.
        </p>
      </div>

      <div class="insight-section">
        <span class="insight-label">Areas to Explore</span>
        <ul v-if="opportunities.length" class="insight-list">
          <li v-for="m in opportunities" :key="m.id" class="insight-item">
            <span class="insight-dot" aria-hidden="true">→</span>
            {{ m.title }}
          </li>
        </ul>
        <p v-else class="insight-empty">
          No outstanding areas to explore right now.
        </p>
      </div>
    </div>
  </section>
</template>

<style scoped>
.summary {
  border: 1px solid var(--color-border);
  background: var(--color-surface-raised);
  display: flex;
  flex-direction: column;
}

.maturity-block {
  padding: 2rem 1.75rem 1.75rem;
  border-bottom: 1px solid var(--color-border);
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.maturity-label {
  font-family: var(--font-family-mono);
  font-size: 0.6875rem;
  font-weight: 500;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--color-text-muted);
}

.maturity-word {
  font-family: var(--font-family-mono);
  font-size: 3rem;
  font-weight: 400;
  letter-spacing: -0.02em;
  line-height: 1;
  color: var(--color-text-primary);
}

.coverage-block {
  padding: 1.5rem 1.75rem;
  border-bottom: 1px solid var(--color-border-subtle);
  display: flex;
  flex-direction: column;
  gap: 1.125rem;
}

.coverage-row {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
}

.coverage-meta {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
}

.coverage-name {
  font-family: var(--font-family-mono);
  font-size: 0.75rem;
  letter-spacing: 0.04em;
  color: var(--color-text-secondary);
  text-transform: uppercase;
}

.coverage-pct {
  font-family: var(--font-family-mono);
  font-size: 0.75rem;
  font-weight: 500;
  color: var(--color-text-primary);
}

.bar-track {
  height: 3px;
  background: var(--color-surface-overlay);
  border: 1px solid var(--color-border-subtle);
  position: relative;
  overflow: hidden;
}

.na-disclosure {
  margin: 0;
  font-size: 0.6875rem;
  color: var(--color-text-muted);
  font-style: italic;
}

.bar-fill {
  position: absolute;
  inset-block: 0;
  left: 0;
  background: var(--color-brand);
  transition: width 0.4s ease;
}

.insight-block {
  display: flex;
  flex-direction: column;
}

.insight-section {
  padding: 1.25rem 1.75rem;
  display: flex;
  flex-direction: column;
  gap: 0.875rem;
}

.insight-section + .insight-section {
  border-top: 1px solid var(--color-border-subtle);
}

.insight-label {
  font-family: var(--font-family-mono);
  font-size: 0.6875rem;
  font-weight: 500;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--color-text-muted);
}

.insight-list {
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.insight-item {
  display: flex;
  align-items: baseline;
  gap: 0.625rem;
  font-family: var(--font-family-sans);
  font-size: 0.875rem;
  color: var(--color-text-primary);
  line-height: 1.5;
}

.insight-check {
  font-family: var(--font-family-mono);
  font-size: 0.75rem;
  color: var(--color-brand);
  flex-shrink: 0;
}

.insight-dot {
  font-family: var(--font-family-mono);
  font-size: 0.75rem;
  color: var(--color-text-muted);
  flex-shrink: 0;
}

.insight-empty {
  margin: 0;
  font-size: 0.8125rem;
  color: var(--color-text-muted);
  font-style: italic;
  line-height: 1.6;
}
</style>
