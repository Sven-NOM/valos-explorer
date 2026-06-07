<script setup lang="ts">
import { ref, computed } from 'vue'
import { useContentStore } from '@/stores/content'
import { useAssessmentStore } from '@/stores/assessment'
import type { CategoryId } from '@/types/valos'
import MitigationList from '@/components/risk/MitigationList.vue'
import RiskControls from '@/components/risk/RiskControls.vue'

const content = useContentStore()
const assessment = useAssessmentStore()

const CATEGORY_COLORS: Record<CategoryId, string> = {
  fin: 'var(--color-risk-fin)',
  sls: 'var(--color-risk-sls)',
  dow: 'var(--color-risk-dow)',
  kec: 'var(--color-risk-kec)',
  hck: 'var(--color-risk-hck)',
  gir: 'var(--color-risk-gir)',
  sps: 'var(--color-risk-sps)',
  rer: 'var(--color-risk-rer)',
}

const expandedIds = ref<Set<string>>(new Set())

function toggle(riskId: string) {
  if (expandedIds.value.has(riskId)) {
    expandedIds.value.delete(riskId)
  } else {
    expandedIds.value.add(riskId)
  }
}

function isExpanded(riskId: string): boolean {
  return expandedIds.value.has(riskId)
}

// Confirmed-N/A risks are excluded — they've been triaged, not missed.
// Suggested-but-unconfirmed risks still appear (no pre-filtering by scale band).
const blindSpots = computed(() =>
  content.risks
    .filter((r) =>
      !assessment.naRisks.has(r.id) && (assessment.answers[r.id] ?? 'none') === 'none'
    )
    .slice()
    .sort((a, b) => b.mitigationIds.length - a.mitigationIds.length)
)

const naCount = computed(() => assessment.naRisks.size)
const totalRisks = computed(() => content.risks.length)
const blindSpotCount = computed(() => blindSpots.value.length)
</script>

<template>
  <div class="blind-spots-view">
    <div class="page-inner">
      <header class="page-header">
        <h1 class="page-title">Risk Explorer</h1>
        <p class="page-subtitle">
          Risks you haven't assessed yet, sorted by leverage — the more mitigations a risk links
          to, the more impactful it is to address.
        </p>
        <p class="page-count">
          <span class="count-number">{{ blindSpotCount }}</span> of
          <span class="count-number">{{ totalRisks }}</span> risks not yet assessed.
          <span v-if="naCount > 0" class="na-note">
            ({{ naCount }} marked Not Applicable)
          </span>
        </p>
      </header>

      <div v-if="blindSpotCount === 0" class="empty-state">
        <p class="empty-headline">You've covered all {{ totalRisks }} risks.</p>
        <p class="empty-body">
          Impressive — every risk in the framework has been assessed. Head back to
          <router-link to="/discovery">Risk Discovery</router-link> to review or refine your
          answers.
        </p>
      </div>

      <div v-else class="risk-list" role="list">
        <div
          v-for="risk in blindSpots"
          :key="risk.id"
          class="risk-row"
          :class="{ 'risk-row--expanded': isExpanded(risk.id) }"
          role="listitem"
        >
          <button
            class="risk-header"
            :aria-expanded="isExpanded(risk.id)"
            @click="toggle(risk.id)"
          >
            <span
              class="category-badge"
              :style="{
                color: CATEGORY_COLORS[risk.categoryId],
                borderColor: CATEGORY_COLORS[risk.categoryId],
              }"
            >{{ risk.displayId.replace(/\d+$/, '') }}</span>

            <span class="risk-group">{{ risk.riskGroup }}</span>

            <span class="risk-title">{{ risk.title }}</span>

            <span class="mit-count">
              <span class="mit-count-symbol">×</span>{{ risk.mitigationIds.length }}
              <span class="mit-count-label">mitigations</span>
            </span>

            <span class="chevron" :class="{ 'chevron--open': isExpanded(risk.id) }" aria-hidden="true">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 12 12"
                width="12"
                height="12"
                fill="none"
                stroke="currentColor"
                stroke-width="1.75"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path d="M2 4.5 6 8l4-3.5" />
              </svg>
            </span>
          </button>

          <div v-if="isExpanded(risk.id)" class="risk-body">
            <p class="risk-description">{{ risk.description }}</p>

            <div class="mitigations-section">
              <p class="mitigations-label">Mitigations</p>
              <MitigationList
                v-if="content.mitigationsForRisk(risk.id).length"
                :mitigations="content.mitigationsForRisk(risk.id)"
                :show-spec-link="true"
              />
              <p v-else class="no-mitigations">
                No specific mitigations are linked to this risk in the current spec version.
              </p>

              <RiskControls :risk-id="risk.id" class="risk-controls-block" />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.blind-spots-view {
  min-height: 100dvh;
  background-color: var(--color-surface-base);
  padding: 2.5rem 1.5rem 4rem;
}

.page-inner {
  max-width: 1100px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.page-header {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.page-title {
  margin: 0;
  font-size: 1.75rem;
  font-weight: 700;
  color: var(--color-text-primary);
  line-height: 1.2;
}

.page-subtitle {
  margin: 0;
  font-size: 0.9375rem;
  color: var(--color-text-secondary);
  max-width: 56ch;
  line-height: 1.5;
}

.page-count {
  margin: 0.25rem 0 0;
  font-size: 0.8125rem;
  color: var(--color-text-muted);
}

.count-number {
  font-family: var(--font-family-mono);
  font-weight: 500;
  color: var(--color-text-primary);
}

.na-note {
  font-style: italic;
  color: var(--color-text-muted);
}

.empty-state {
  border-top: 1px solid #000;
  padding-top: 2rem;
  display: flex;
  flex-direction: column;
  gap: 0.625rem;
}

.empty-headline {
  margin: 0;
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--color-text-primary);
}

.empty-body {
  margin: 0;
  font-size: 0.9375rem;
  color: var(--color-text-secondary);
}

.risk-list {
  border-top: 1px solid #000;
  display: flex;
  flex-direction: column;
}

.risk-row {
  border-bottom: 1px solid #000;
}

.risk-header {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.875rem 0;
  background: transparent;
  border: none;
  cursor: pointer;
  text-align: left;
  font-family: inherit;
  color: var(--color-text-primary);
  transition: background 0.1s;
}

.risk-header:hover {
  background: var(--color-surface-raised);
}

.category-badge {
  font-family: var(--font-family-mono);
  font-size: 0.6875rem;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  border: 1px solid currentColor;
  padding: 0.15em 0.45em;
  flex-shrink: 0;
  line-height: 1.4;
}

.risk-group {
  font-size: 0.75rem;
  color: var(--color-text-muted);
  flex-shrink: 0;
  white-space: nowrap;
}

.risk-title {
  flex: 1;
  font-size: 0.9375rem;
  font-weight: 500;
  color: var(--color-text-primary);
  line-height: 1.3;
}

.mit-count {
  font-family: var(--font-family-mono);
  font-size: 0.75rem;
  color: var(--color-text-muted);
  flex-shrink: 0;
  white-space: nowrap;
  display: flex;
  align-items: baseline;
  gap: 0.1em;
}

.mit-count-symbol {
  font-size: 0.8125rem;
  color: var(--color-text-secondary);
}

.mit-count-label {
  font-size: 0.6875rem;
  margin-left: 0.25em;
}

.chevron {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  color: var(--color-text-muted);
  transition: transform 0.2s ease;
}

.chevron--open {
  transform: rotate(180deg);
}

.risk-body {
  background: var(--color-surface-raised);
  border-top: 1px solid var(--color-border-subtle);
  padding: 1.25rem 0 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.risk-description {
  margin: 0;
  font-size: 0.9rem;
  color: var(--color-text-secondary);
  line-height: 1.6;
  max-width: 72ch;
}

.mitigations-section {
  display: flex;
  flex-direction: column;
  gap: 0.625rem;
}

.mitigations-label {
  margin: 0;
  font-size: 0.6875rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--color-text-muted);
}

.mitigations-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 0.375rem;
}

.no-mitigations {
  margin: 0;
  font-size: 0.8125rem;
  color: var(--color-text-muted);
}

.risk-controls-block {
  margin-top: 0.5rem;
}
</style>
