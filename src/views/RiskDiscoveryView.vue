<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useContentStore } from '@/stores/content'
import { useAssessmentStore } from '@/stores/assessment'
import { useScale } from '@/composables/useScale'
import type { CategoryId, AnswerLevel } from '@/types/valos'
import RiskCard from '@/components/risk/RiskCard.vue'
import RiskQuestion from '@/components/risk/RiskQuestion.vue'
import LevelGuidance from '@/components/risk/LevelGuidance.vue'
import MitigationList from '@/components/risk/MitigationList.vue'
import RiskControls from '@/components/risk/RiskControls.vue'

const route = useRoute()
const content = useContentStore()
const assessment = useAssessmentStore()
const { scaleBand, isRiskInBand, suggestedNaRiskIds, isCuriousMode, previewRiskIds } = useScale()

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

// Category order for sequential navigation
const CATEGORY_ORDER: CategoryId[] = ['fin', 'sls', 'dow', 'kec', 'hck', 'gir', 'sps', 'rer']

const selectedCategoryId = ref<CategoryId>(content.categories[0]?.id ?? 'fin')
const riskIndex = ref(0)

const allCategoryRisks = computed(() =>
  content.risksByCategory(selectedCategoryId.value)
)

// When a profile is set, hide out-of-scale risks. In curious mode, show only preview risks.
const categoryRisks = computed(() => {
  if (isCuriousMode.value) return allCategoryRisks.value.filter(r => previewRiskIds.value.has(r.id))
  if (scaleBand.value === null) return allCategoryRisks.value
  return allCategoryRisks.value.filter(r => isRiskInBand(r.displayId))
})

const hiddenInCategory = computed(() =>
  allCategoryRisks.value.length - categoryRisks.value.length
)

const currentRisk = computed(() => categoryRisks.value[riskIndex.value] ?? null)

const currentIsNa = computed(() =>
  currentRisk.value ? assessment.naRisks.has(currentRisk.value.id) : false
)

const currentIsSuggestedNa = computed(() =>
  currentRisk.value ? suggestedNaRiskIds.value.includes(currentRisk.value.id) : false
)

const currentAnswer = computed<AnswerLevel>({
  get: () => (currentRisk.value ? (assessment.answers[currentRisk.value.id] ?? 'none') : 'none'),
  set: (level) => {
    if (currentRisk.value) {
      assessment.setAnswer(currentRisk.value.id, level)
    }
  },
})

const hasAnswered = computed(
  () => currentIsNa.value || currentAnswer.value !== 'none'
)

const currentMitigations = computed(() =>
  currentRisk.value ? content.mitigationsForRisk(currentRisk.value.id) : []
)

const currentColor = computed(() => CATEGORY_COLORS[selectedCategoryId.value])

function selectCategory(id: CategoryId) {
  selectedCategoryId.value = id
  riskIndex.value = 0
}

// Check if we're at the last risk of the last category
const isAtEnd = computed(() => {
  const currentCatIdx = CATEGORY_ORDER.indexOf(selectedCategoryId.value)
  const isLastCategory = currentCatIdx === CATEGORY_ORDER.length - 1
  const isLastInCategory = riskIndex.value === categoryRisks.value.length - 1
  return isLastCategory && isLastInCategory
})

// Check if next button will move to a new section
const nextIsNewSection = computed(() => {
  const isLastInCategory = riskIndex.value === categoryRisks.value.length - 1
  const currentCatIdx = CATEGORY_ORDER.indexOf(selectedCategoryId.value)
  const hasNextCategory = currentCatIdx < CATEGORY_ORDER.length - 1
  return isLastInCategory && hasNextCategory
})

// Check if we can go to next
const canGoNext = computed(() => {
  if (riskIndex.value < categoryRisks.value.length - 1) return true
  const currentCatIdx = CATEGORY_ORDER.indexOf(selectedCategoryId.value)
  return currentCatIdx < CATEGORY_ORDER.length - 1
})

function prev() {
  if (riskIndex.value > 0) {
    riskIndex.value--
  } else {
    // Move to previous category's last risk
    const currentCatIdx = CATEGORY_ORDER.indexOf(selectedCategoryId.value)
    if (currentCatIdx > 0) {
      const prevCatId = CATEGORY_ORDER[currentCatIdx - 1]
      selectedCategoryId.value = prevCatId
      const prevCatRisks = content.risksByCategory(prevCatId)
      riskIndex.value = prevCatRisks.length - 1
    }
  }
}

function next() {
  if (riskIndex.value < categoryRisks.value.length - 1) {
    riskIndex.value++
  } else {
    // Move to next category's first risk
    const currentCatIdx = CATEGORY_ORDER.indexOf(selectedCategoryId.value)
    if (currentCatIdx < CATEGORY_ORDER.length - 1) {
      const nextCatId = CATEGORY_ORDER[currentCatIdx + 1]
      selectedCategoryId.value = nextCatId
      riskIndex.value = 0
    }
  }
}

// Handle the `focus` query param to jump to a specific risk
watch(
  () => route.query.focus as string,
  (focusRiskId) => {
    if (!focusRiskId) return
    const risk = content.riskById.get(focusRiskId)
    if (risk) {
      selectedCategoryId.value = risk.categoryId
      const categoryRisks = content.risksByCategory(risk.categoryId)
      const idx = categoryRisks.findIndex((r) => r.id === focusRiskId)
      if (idx >= 0) {
        riskIndex.value = idx
      }
    }
  },
  { immediate: true }
)

function inScaleRisksForCategory(categoryId: CategoryId) {
  const risks = content.risksByCategory(categoryId)
  if (scaleBand.value === null) return risks
  return risks.filter(r => isRiskInBand(r.displayId))
}

function answeredInCategory(categoryId: CategoryId): number {
  return inScaleRisksForCategory(categoryId).filter(
    (r) => assessment.naRisks.has(r.id) || (assessment.answers[r.id] ?? 'none') !== 'none'
  ).length
}

function totalInCategory(categoryId: CategoryId): number {
  return inScaleRisksForCategory(categoryId).length
}

function handleMarkNa() {
  if (currentRisk.value) assessment.setNotApplicable(currentRisk.value.id)
}

function handleClearNa() {
  if (currentRisk.value) assessment.clearNotApplicable(currentRisk.value.id)
}

// reset index when category changes
watch(selectedCategoryId, () => { riskIndex.value = 0 })
</script>

<template>
  <div class="discovery-view">
    <!-- Category tabs -->
    <nav class="category-nav" aria-label="Risk categories">
      <button
        v-for="cat in content.categories"
        :key="cat.id"
        class="cat-tab"
        :class="{ active: cat.id === selectedCategoryId }"
        :style="{ '--cat-color': CATEGORY_COLORS[cat.id as CategoryId] }"
        @click="selectCategory(cat.id as CategoryId)"
      >
        <span class="cat-name">{{ cat.name }}</span>
        <span
          class="cat-progress"
          :class="{
            'cat-progress--complete': answeredInCategory(cat.id as CategoryId) === totalInCategory(cat.id as CategoryId),
            'cat-progress--incomplete': answeredInCategory(cat.id as CategoryId) < totalInCategory(cat.id as CategoryId)
          }"
        >
          {{ answeredInCategory(cat.id as CategoryId) }}/{{ totalInCategory(cat.id as CategoryId) }}
        </span>
      </button>
    </nav>

    <!-- Curious/Preview mode banner -->
    <div v-if="isCuriousMode" class="preview-banner">
      <span class="preview-banner-text">
        You're in preview mode — showing {{ previewRiskIds.size }} representative risks.
      </span>
      <router-link to="/profile" class="preview-banner-link">Set a profile to see your full risk landscape →</router-link>
    </div>

    <!-- Main content -->
    <div class="discovery-main">
      <template v-if="currentRisk">
        <!-- Navigation — at the top so it's always reachable without scrolling -->
        <div class="risk-nav">
          <button
            class="nav-btn"
            :disabled="riskIndex === 0 && selectedCategoryId === CATEGORY_ORDER[0]"
            @click="prev"
          >
            ← Previous
          </button>

          <span class="nav-position">
            {{ riskIndex + 1 }} of {{ categoryRisks.length }}
            <span class="nav-category">in {{ content.categories.find(c => c.id === selectedCategoryId)?.name }}</span>
          </span>

          <button
            class="nav-btn nav-btn--primary"
            :class="{ 'nav-btn--next-section': nextIsNewSection }"
            :disabled="isAtEnd"
            @click="next"
          >
            <span v-if="nextIsNewSection">Next Section >></span>
            <span v-else>Next →</span>
          </button>
        </div>

        <!-- Scale N/A suggestion chip -->
        <transition name="fade-slide">
          <div v-if="currentIsSuggestedNa && !currentIsNa" class="na-suggestion">
            <span class="na-suggestion-text">
              Likely not applicable at your scale — does this risk apply to your operation?
            </span>
            <button class="na-suggestion-btn" @click="handleMarkNa">
              Mark as Not Applicable
            </button>
          </div>
        </transition>

        <!-- N/A confirmed state -->
        <div v-if="currentIsNa" class="na-confirmed">
          <span>✓ Marked Not Applicable — counts as covered in your assessment.</span>
          <button class="na-undo-btn" @click="handleClearNa">Undo</button>
        </div>

        <!-- Risk card -->
        <div class="risk-section" :class="{ 'is-na': currentIsNa }">
          <RiskCard
            :risk="currentRisk"
            :category-color="currentColor"
            class="current-card"
          />

          <!-- Answer selector -->
          <div class="answer-section">
            <p class="answer-prompt">How well does your operation address this risk?</p>
            <RiskQuestion
              v-model="currentAnswer"
              :is-na="currentIsNa"
              @mark-na="handleMarkNa"
              @clear-na="handleClearNa"
            />
            <LevelGuidance
              v-if="currentRisk"
              :risk-id="currentRisk.id"
              :selected-level="currentAnswer"
            />
          </div>

          <!-- Mitigations + Controls -->
          <div class="mitigations-section">
              <h4 class="mitigations-heading">
                Relevant mitigations
                <span class="mit-count">({{ currentMitigations.length }})</span>
              </h4>
              <MitigationList
                v-if="currentMitigations.length"
                :mitigations="currentMitigations"
                :show-spec-link="true"
              />
              <p v-else class="no-mitigations">
                No specific mitigations linked to this risk — see the
                <a href="https://lidofinance.github.io/valos/valos-spec.html" target="_blank" rel="noopener noreferrer">spec</a>
                for general guidance.
              </p>

              <RiskControls
                v-if="currentRisk"
                :risk-id="currentRisk.id"
                class="risk-controls-block"
              />
            </div>
        </div>

      </template>

      <!-- Hidden content disclosure -->
      <div v-if="hiddenInCategory > 0 && (riskIndex === categoryRisks.length - 1 || categoryRisks.length === 0)" class="hidden-disclosure">
        <span class="hidden-disclosure-icon">○</span>
        <span class="hidden-disclosure-text">
          {{ hiddenInCategory }} {{ hiddenInCategory === 1 ? 'risk' : 'risks' }} in this category
          {{ hiddenInCategory === 1 ? 'is' : 'are' }} not applicable at your current scale.
          These become relevant as your operation grows.
        </span>
      </div>

      <div v-else-if="categoryRisks.length === 0" class="empty-state">
        <p>No risks applicable at your current scale in this category.</p>
        <div v-if="hiddenInCategory > 0" class="hidden-disclosure">
          <span class="hidden-disclosure-icon">○</span>
          <span class="hidden-disclosure-text">
            {{ hiddenInCategory }} {{ hiddenInCategory === 1 ? 'risk' : 'risks' }} hidden — not applicable at your scale.
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.discovery-view {
  display: flex;
  flex-direction: column;
  min-height: 100dvh;
  background-color: var(--color-surface-base);
}

/* ── Category nav ────────────────────────────────────────────── */

.category-nav {
  display: flex;
  gap: 0.25rem;
  padding: 1rem 1.5rem 0;
  overflow-x: auto;
  border-bottom: 1px solid var(--color-border);
  scrollbar-width: none;
  flex-shrink: 0;
}

.category-nav::-webkit-scrollbar { display: none; }

.cat-tab {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.125rem;
  padding: 0.5rem 0.875rem;
  border-radius: var(--radius-sm) var(--radius-sm) 0 0;
  border: 1px solid transparent;
  border-bottom: none;
  background: transparent;
  color: var(--color-text-muted);
  cursor: pointer;
  white-space: nowrap;
  font-family: inherit;
  font-size: 0.8125rem;
  font-weight: 500;
  transition: color 0.15s, background 0.15s;
  position: relative;
  bottom: -1px;
}

.cat-tab:hover { color: var(--color-text-primary); background: var(--color-surface-raised); }
.cat-tab.active {
  background: var(--color-surface-raised);
  border-color: var(--color-border);
  border-bottom-color: var(--color-surface-raised);
  color: var(--cat-color);
}

.cat-name { line-height: 1.3; }
.cat-progress {
  font-size: 0.6875rem;
  opacity: 0.65;
  line-height: 1.2;
}
.cat-progress--complete {
  opacity: 1;
  color: #15a34a;
  font-weight: 600;
}
.cat-progress--incomplete {
  opacity: 1;
  color: var(--color-brand);
  font-weight: 600;
}

/* ── Main content ────────────────────────────────────────────── */

.discovery-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  max-width: 800px;
  width: 100%;
  margin: 0 auto;
  padding: 2rem 1.5rem;
  gap: 1.25rem;
}

/* ── Scale N/A suggestion ────────────────────────────────────── */

.na-suggestion {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.625rem 0.875rem;
  background: var(--color-surface-raised);
  border: 1px solid var(--color-border);
  border-left: 3px solid var(--color-text-muted);
}

.na-suggestion-text {
  font-size: 0.8125rem;
  color: var(--color-text-secondary);
  flex: 1;
}

.na-suggestion-btn {
  font-family: var(--font-family-mono);
  font-size: 0.6875rem;
  letter-spacing: 0.04em;
  padding: 0.3em 0.75em;
  border: 1px solid var(--color-border);
  background: transparent;
  color: var(--color-text-secondary);
  cursor: pointer;
  white-space: nowrap;
  transition: border-color 0.15s, color 0.15s;
}

.na-suggestion-btn:hover {
  border-color: var(--color-text-secondary);
  color: var(--color-text-primary);
}

/* ── N/A confirmed ───────────────────────────────────────────── */

.na-confirmed {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.625rem 0.875rem;
  background: var(--color-surface-raised);
  border: 1px solid var(--color-border);
  font-size: 0.8125rem;
  color: var(--color-text-secondary);
}

.na-undo-btn {
  font-family: var(--font-family-mono);
  font-size: 0.6875rem;
  letter-spacing: 0.04em;
  padding: 0.3em 0.75em;
  border: 1px solid var(--color-border);
  background: transparent;
  color: var(--color-text-muted);
  cursor: pointer;
  white-space: nowrap;
  transition: color 0.15s;
}

.na-undo-btn:hover { color: var(--color-text-primary); }

.risk-section {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.risk-section.is-na { opacity: 0.6; }

.current-card :deep(.risk-description) {
  -webkit-line-clamp: unset;
  display: block;
  overflow: visible;
}

/* ── Answer section ──────────────────────────────────────────── */

.answer-section {
  display: flex;
  flex-direction: column;
  gap: 0.625rem;
}

.answer-prompt {
  margin: 0;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--color-text-secondary);
}

/* ── Mitigations ─────────────────────────────────────────────── */

.mitigations-section {
  background: var(--color-surface-raised);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: 1rem 1.125rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.mitigations-heading {
  margin: 0;
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--color-text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.mit-count { font-weight: 400; opacity: 0.7; }

.mitigations-list { display: flex; flex-wrap: wrap; gap: 0.375rem; }

.risk-controls-block {
  margin-top: 0.5rem;
}

.no-mitigations { margin: 0; font-size: 0.8125rem; color: var(--color-text-muted); }
.no-mitigations a { color: var(--color-brand); }

/* ── Navigation ──────────────────────────────────────────────── */

.risk-nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid var(--color-border);
}

.nav-btn {
  padding: 0.5rem 1.25rem;
  border-radius: var(--radius-sm);
  border: 1px solid var(--color-border);
  background: var(--color-surface-overlay);
  color: var(--color-text-secondary);
  font-size: 0.875rem;
  font-family: inherit;
  font-weight: 500;
  cursor: pointer;
  transition: border-color 0.15s, color 0.15s, background 0.15s;
  white-space: nowrap;
}

.nav-btn:hover:not(:disabled) { border-color: var(--color-brand); color: var(--color-text-primary); }
.nav-btn:disabled { opacity: 0.35; cursor: not-allowed; }
.nav-btn--primary {
  background: var(--color-brand);
  border-color: var(--color-brand);
  color: #fff;
  min-width: 11rem;
  text-align: center;
}
.nav-btn--primary:hover:not(:disabled) { background: var(--color-brand-hover); border-color: var(--color-brand-hover); color: #fff; }
.nav-btn--next-section {
  background: transparent;
  border: 1px solid var(--color-brand);
  color: var(--color-brand);
  font-weight: 600;
}
.nav-btn--next-section:hover:not(:disabled) {
  background: var(--color-brand);
  color: #fff;
  border-color: var(--color-brand-hover);
}

.nav-position { font-size: 0.8125rem; color: var(--color-text-muted); text-align: center; flex: 1; }
.nav-category { display: block; font-size: 0.75rem; opacity: 0.7; }

.empty-state {
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 1;
  color: var(--color-text-muted);
  font-size: 0.875rem;
}

/* ── Transitions ─────────────────────────────────────────────── */

.fade-slide-enter-active { transition: opacity 0.25s ease, transform 0.25s ease; }
.fade-slide-enter-from { opacity: 0; transform: translateY(-6px); }

.preview-banner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.625rem 1.5rem;
  background: var(--color-brand-subtle);
  border-bottom: 1px solid var(--color-brand);
  flex-wrap: wrap;
}

.preview-banner-text {
  font-size: 0.8125rem;
  color: var(--color-brand);
  font-weight: 500;
}

.preview-banner-link {
  font-size: 0.8125rem;
  color: var(--color-brand);
  text-decoration: none;
  font-weight: 600;
}

.preview-banner-link:hover { text-decoration: underline; }

.hidden-disclosure {
  display: flex;
  align-items: flex-start;
  gap: 0.625rem;
  padding: 0.75rem 1rem;
  background: var(--color-surface-raised);
  border: 1px solid var(--color-border-subtle);
  border-left: 3px solid var(--color-border);
  font-size: 0.8125rem;
  color: var(--color-text-muted);
}

.hidden-disclosure-icon {
  flex-shrink: 0;
  font-size: 0.75rem;
  margin-top: 0.1rem;
  opacity: 0.5;
}
</style>
