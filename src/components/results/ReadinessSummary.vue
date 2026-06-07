<script setup lang="ts">
import { useCoverage } from '@/composables/useCoverage'
import { useContentStore } from '@/stores/content'
import { useAssessmentStore } from '@/stores/assessment'
import { computed } from 'vue'
import type { CategoryId } from '@/types/valos'

const { maturity, strengths, opportunities, naCount } = useCoverage()
const content = useContentStore()
const assessment = useAssessmentStore()

const CATEGORY_NAMES: Record<CategoryId, string> = {
  fin: 'Financial', sls: 'Slashing', dow: 'Downtime', kec: 'Key Custody',
  hck: 'Hacking', gir: 'Infrastructure', sps: 'Service Partners', rer: 'Reputational',
}

// Compute average answer level per category (0=none, 0.33=basic, 0.66=advanced, 1=tested)
const CONFIDENCE: Record<string, number> = { none: 0, basic: 0.33, advanced: 0.66, tested: 1 }

const categoryScores = computed(() =>
  content.categories.map((cat) => {
    const risks = content.risksByCategory(cat.id as CategoryId)
      .filter(r => !assessment.naRisks.has(r.id))
    if (!risks.length) return { id: cat.id, name: CATEGORY_NAMES[cat.id as CategoryId] ?? cat.name, score: 0 }
    const avg = risks.reduce((sum, r) => sum + (CONFIDENCE[assessment.answers[r.id] ?? 'none'] ?? 0), 0) / risks.length
    return { id: cat.id, name: CATEGORY_NAMES[cat.id as CategoryId] ?? cat.name, score: avg }
  })
)

const topStrengthCategories = computed(() =>
  categoryScores.value.filter(c => c.score >= 0.5).sort((a, b) => b.score - a.score).slice(0, 3)
)

const nextStepCategories = computed(() =>
  categoryScores.value.filter(c => c.score < 0.5).sort((a, b) => a.score - b.score).slice(0, 3)
)

const MATURITY_DESCRIPTIONS: Record<string, string> = {
  'Early': 'You\'re beginning to explore the risk landscape. Focus on the highest-leverage risks first.',
  'Developing': 'You have basic coverage across key risks. Deepening your mitigations will build resilience.',
  'Mature': 'Strong risk posture with broad coverage. Targeted improvements in weaker areas will close gaps.',
  'Advanced': 'Comprehensive, tested risk management across all major categories.',
}
</script>

<template>
  <section class="summary">
    <div class="maturity-block">
      <span class="maturity-label">Operational Posture</span>
      <span class="maturity-word">{{ maturity }}</span>
      <p class="maturity-description">{{ MATURITY_DESCRIPTIONS[maturity] }}</p>
    </div>

    <div class="insight-block">
      <div class="insight-section">
        <span class="insight-label">Strengths</span>
        <div v-if="topStrengthCategories.length" class="category-chips">
          <span v-for="cat in topStrengthCategories" :key="cat.id" class="category-chip category-chip--strength">
            {{ cat.name }}
          </span>
        </div>
        <p v-else class="insight-empty">
          Complete more assessments to see your strengths.
        </p>
        <div v-if="strengths.length" class="insight-mitigations">
          <span class="insight-sub">Well addressed mitigations:</span>
          <ul class="insight-list">
            <li v-for="m in strengths.slice(0, 3)" :key="m.id" class="insight-item">
              <span class="insight-check" aria-hidden="true">✓</span>
              {{ m.title }}
            </li>
          </ul>
        </div>
      </div>

      <div class="insight-section">
        <span class="insight-label">Worth Exploring Next</span>
        <div v-if="nextStepCategories.length" class="category-chips">
          <span v-for="cat in nextStepCategories" :key="cat.id" class="category-chip category-chip--next">
            {{ cat.name }}
          </span>
        </div>
        <div v-if="opportunities.length" class="insight-mitigations">
          <span class="insight-sub">High-leverage mitigations:</span>
          <ul class="insight-list">
            <li v-for="m in opportunities.slice(0, 3)" :key="m.id" class="insight-item">
              <span class="insight-dot" aria-hidden="true">→</span>
              {{ m.title }}
            </li>
          </ul>
        </div>
        <p v-else class="insight-empty">
          No outstanding areas — well done.
        </p>
      </div>
    </div>

    <p v-if="naCount > 0" class="na-disclosure">
      {{ naCount }} {{ naCount === 1 ? 'risk' : 'risks' }} marked Not Applicable at your scale.
    </p>
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

.maturity-description {
  margin: 0.5rem 0 0;
  font-size: 0.8125rem;
  color: var(--color-text-secondary);
  line-height: 1.5;
  max-width: 44ch;
}

.category-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 0.375rem;
  margin-bottom: 0.5rem;
}

.category-chip {
  font-family: var(--font-family-mono);
  font-size: 0.6875rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding: 0.25em 0.625em;
  border: 1px solid currentColor;
}

.category-chip--strength { color: #15a34a; }
.category-chip--next { color: var(--color-brand); }

.insight-mitigations {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
  margin-top: 0.25rem;
}

.insight-sub {
  font-size: 0.6875rem;
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  font-weight: 600;
}

.na-disclosure {
  padding: 0.75rem 1.75rem;
  margin: 0;
  font-size: 0.6875rem;
  color: var(--color-text-muted);
  font-style: italic;
  border-top: 1px solid var(--color-border-subtle);
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
