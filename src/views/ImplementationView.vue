<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { specDeepLink } from '@/config'
import { useAssessmentStore } from '@/stores/assessment'
import { useScale } from '@/composables/useScale'
import { useImplementation, type ControlEntry } from '@/composables/useImplementation'
import { PROVENANCE } from '@/data/implementationScope'

const router = useRouter()
const assessment = useAssessmentStore()
const { scaleBand, scaleLabel } = useScale()
const { scopes, totalControls, totalImplemented } = useImplementation()

// ── View filters (display only; do not change the underlying counts) ──────────
const hideAboveScale = ref(false)
const onlyOutstanding = ref(false)

// Load expanded scopes from localStorage, default to all collapsed
function loadExpandedScopes(): Set<string> {
  const stored = localStorage.getItem('valos-explorer:expanded-scopes')
  return stored ? new Set(JSON.parse(stored)) : new Set()
}
const expandedScopes = ref(loadExpandedScopes())

// Persist expanded scopes to localStorage
watch(
  () => [...expandedScopes.value].sort(),
  (scopes) => {
    localStorage.setItem('valos-explorer:expanded-scopes', JSON.stringify(scopes))
  }
)

const hasScale = computed(() => scaleBand.value !== null)

function passesFilter(e: ControlEntry): boolean {
  if (hideAboveScale.value && !e.inScale) return false
  if (onlyOutstanding.value && e.coverage !== 'outstanding') return false
  return true
}

const visibleScopes = computed(() =>
  scopes.value
    .map((s) => ({
      ...s,
      groups: s.groups
        .map((g) => ({ ...g, controls: g.controls.filter(passesFilter) }))
        .filter((g) => g.controls.length > 0),
    }))
    .filter((s) => s.groups.length > 0)
)

const progressPct = computed(() =>
  totalControls.value === 0 ? 0 : Math.round((totalImplemented.value / totalControls.value) * 100)
)

function stripPrefix(title: string): string {
  return title.replace(/^Node Operators (MUST|SHOULD)\s+/i, '').trim()
}

function onToggle(controlId: string, ev: Event) {
  assessment.setImplemented(controlId, (ev.target as HTMLInputElement).checked)
}

function expandAll() {
  expandedScopes.value = new Set(visibleScopes.value.map((s) => s.domainId || s.label))
}

function collapseAll() {
  expandedScopes.value = new Set()
}

function toggleScope(domainId: string) {
  const next = new Set(expandedScopes.value)
  if (next.has(domainId)) {
    next.delete(domainId)
  } else {
    next.add(domainId)
  }
  expandedScopes.value = next
}

function isScopeOpen(domainId: string): boolean {
  return expandedScopes.value.has(domainId)
}

// Find outstanding risks for a control (for tooltip and routing)
function getOutstandingRisks(entry: ControlEntry): string[] {
  return entry.control.riskIds.filter((rid) => {
    const answer = assessment.answers[rid]
    return answer === 'none' || answer === 'basic'
  })
}

// Format outstanding risks for tooltip display
function formatOutstandingRisksTooltip(entry: ControlEntry): string {
  try {
    const outstandingRisks = getOutstandingRisks(entry)
    if (!outstandingRisks || outstandingRisks.length === 0) return 'Risks: unspecified'
    const riskDisplayIds = outstandingRisks
      .map((rid) => {
        if (!rid) return ''
        const risk = content.riskById.get(rid)
        return risk?.displayId ?? rid
      })
      .filter(Boolean)
      .slice(0, 3)
    const suffix = outstandingRisks.length > 3 ? ', ...' : ''
    return riskDisplayIds.join(', ') + suffix
  } catch (e) {
    return 'Risks: (error loading)'
  }
}

// Route to the first outstanding risk for a control
function jumpToOutstandingRisk(entry: ControlEntry) {
  const outstandingRisks = getOutstandingRisks(entry)
  if (outstandingRisks.length > 0) {
    router.push(`/discovery?focus=${outstandingRisks[0]}`)
  }
}
</script>

<template>
  <div class="impl-view">
    <!-- Page header -->
    <div class="page-header">
      <div class="page-header-inner">
        <div class="header-text">
          <h1 class="page-title">Implementation</h1>
          <p class="page-subtitle">
            The spec's {{ totalControls }} controls, reorganized by who implements them in your
            organization — instead of scattered across risks.
          </p>
        </div>

        <div class="progress-block">
          <div class="progress-label">
            <strong>{{ totalImplemented }}</strong> of {{ totalControls }} marked implemented
          </div>
          <div class="progress-track" role="progressbar" :aria-valuenow="progressPct" aria-valuemin="0" aria-valuemax="100">
            <div class="progress-fill" :style="{ width: progressPct + '%' }" />
          </div>
        </div>
      </div>

      <div class="filter-bar">
        <div class="filter-controls">
          <label v-if="hasScale" class="filter-toggle">
            <input type="checkbox" v-model="hideAboveScale" />
            Hide controls above my scale
            <span class="scale-note">({{ scaleLabel }})</span>
          </label>
          <label class="filter-toggle">
            <input type="checkbox" v-model="onlyOutstanding" />
            Only show outstanding
          </label>
        </div>

        <div class="expand-buttons">
          <button class="expand-btn" @click="expandAll" type="button" aria-label="Expand all scopes">
            Expand all
          </button>
          <button class="expand-btn" @click="collapseAll" type="button" aria-label="Collapse all scopes">
            Collapse all
          </button>
        </div>

        <span class="provenance">{{ PROVENANCE }}</span>
      </div>
    </div>

    <!-- Scrollable scopes -->
    <div class="impl-scroll">
      <p v-if="!scopes || scopes.length === 0" class="empty-all">
        Loading implementation data...
      </p>
      <p v-else-if="visibleScopes.length === 0" class="empty-all">
        Nothing matches the current filters.
      </p>

      <details
        v-for="scope in visibleScopes"
        :key="scope.domainId || scope.label"
        class="scope"
        :open="isScopeOpen(scope.domainId || scope.label)"
      >
        <summary class="scope-head" @click="toggleScope(scope.domainId || scope.label)">
          <div class="scope-head-main">
            <span class="scope-label">{{ scope.label }}</span>
            <span class="scope-owner">{{ scope.owner }}</span>
          </div>
          <div class="scope-counts">
            <span
              class="count-chip"
              :class="{ 'count-chip--complete': scope.counts.must === 0 || scope.counts.implementedMust === scope.counts.must }"
            >{{ scope.counts.must }} MUST</span>
            <span
              v-if="scope.counts.should"
              class="count-chip count-chip--should"
              :class="{ 'count-chip--should-complete': scope.counts.should === 0 || scope.counts.implementedShould === scope.counts.should }"
            >{{ scope.counts.should }} SHOULD</span>
            <span
              class="count-chip count-chip--done"
              :class="{ 'count-chip--done-complete': scope.counts.implemented === scope.counts.total && scope.counts.total > 0 }"
            >{{ scope.counts.implemented }}/{{ scope.counts.total }} done</span>
          </div>
        </summary>

        <p class="scope-blurb">{{ scope.blurb }}</p>

        <div class="groups">
          <div v-for="group in scope.groups" :key="group.groupId" class="group">
            <h4 class="group-heading">{{ group.groupId }}</h4>

            <ul class="control-list">
              <li
                v-for="entry in group.controls"
                :key="entry.control.id"
                class="control-item"
                :class="[
                  entry.modal === 'MUST' ? 'control-item--must' : 'control-item--should',
                  { 'control-item--done': entry.implemented, 'control-item--above': !entry.inScale },
                ]"
              >
                <div class="control-main">
                  <label class="control-check">
                    <input
                      type="checkbox"
                      :checked="entry.implemented"
                      :aria-label="`Mark ${entry.control.id} implemented`"
                      @change="onToggle(entry.control.id, $event)"
                    />
                  </label>

                  <span
                    v-if="entry.modal"
                    class="modal-badge"
                    :class="entry.modal === 'MUST' ? 'modal-badge--must' : 'modal-badge--should'"
                  >{{ entry.modal }}</span>

                  <span class="control-statement">{{ stripPrefix(entry.control.title) }}</span>

                  <span v-if="!entry.inScale" class="tag tag--above">above your scale</span>
                  <span
                    v-else-if="entry.coverage === 'addressed'"
                    class="tag tag--addressed"
                  >✓ addressed</span>
                  <button
                    v-else-if="entry.coverage === 'outstanding'"
                    class="tag tag--outstanding tag--clickable"
                    type="button"
                    @click.prevent="jumpToOutstandingRisk(entry)"
                    :title="`Risks: ${formatOutstandingRisksTooltip(entry)} — click to address`"
                  >outstanding</button>

                  <a
                    :href="specDeepLink(entry.control.id)"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="spec-link"
                    :aria-label="`Open spec requirement ${entry.control.id} in new window`"
                    title="Open in spec (external link)"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="external-icon">
                      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                      <polyline points="15 3 21 3 21 9"></polyline>
                      <line x1="10" y1="14" x2="21" y2="3"></line>
                    </svg>
                  </a>
                </div>

                <p v-if="entry.control.description.trim()" class="control-description">
                  {{ entry.control.description.trim() }}
                </p>

                <div v-if="entry.control.evidenceTypeIds.length > 0" class="evidence-tags">
                  <span
                    v-for="evidenceId in entry.control.evidenceTypeIds"
                    :key="evidenceId"
                    class="evidence-tag"
                  >{{ evidenceId }}</span>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </details>
    </div>
  </div>
</template>

<style scoped>
.impl-view {
  display: flex;
  flex-direction: column;
  height: 100dvh;
  overflow: hidden;
  background: var(--color-surface-base);
}

/* ── Page header ─────────────────────────────────────────────── */
.page-header {
  flex-shrink: 0;
  border-bottom: 1px solid var(--color-border);
  background: var(--color-surface-raised);
  padding: 1rem 1.5rem;
}

.page-header-inner {
  display: flex;
  align-items: flex-start;
  gap: 2rem;
  flex-wrap: wrap;
  justify-content: space-between;
}

.header-text {
  max-width: 46rem;
}

.page-title {
  margin: 0;
  font-size: 1.125rem;
  font-weight: 700;
  color: var(--color-text-primary);
}

.page-subtitle {
  margin: 0.25rem 0 0;
  font-size: 0.8125rem;
  color: var(--color-text-muted);
  line-height: 1.5;
}

.progress-block {
  min-width: 13rem;
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
}

.progress-label {
  font-size: 0.75rem;
  color: var(--color-text-secondary);
}

.progress-label strong {
  color: var(--color-brand);
}

.progress-track {
  height: 6px;
  background: var(--color-surface-overlay);
  border: 1px solid var(--color-border-subtle);
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: var(--color-brand);
  transition: width 0.25s ease;
}

.filter-bar {
  display: flex;
  align-items: center;
  gap: 1.25rem;
  margin-top: 0.875rem;
  flex-wrap: wrap;
}

.filter-controls {
  display: flex;
  align-items: center;
  gap: 1.25rem;
  flex-wrap: wrap;
}

.expand-buttons {
  display: flex;
  gap: 0.5rem;
}

.filter-toggle {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  font-size: 0.75rem;
  color: var(--color-text-secondary);
  cursor: pointer;
  user-select: none;
}

.filter-toggle input {
  accent-color: var(--color-brand);
  cursor: pointer;
}

.scale-note {
  color: var(--color-text-muted);
}

.expand-btn {
  font-size: 0.75rem;
  font-weight: 500;
  color: var(--color-brand);
  background: transparent;
  border: 1px solid var(--color-brand);
  padding: 0.3rem 0.75rem;
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
}

.expand-btn:hover {
  background: var(--color-brand);
  color: var(--color-surface-base);
}

.provenance {
  margin-left: auto;
  font-size: 0.6875rem;
  color: var(--color-text-muted);
  font-style: italic;
  max-width: 32rem;
  text-align: right;
  flex-shrink: 0;
}

/* ── Scroll area ─────────────────────────────────────────────── */
.impl-scroll {
  flex: 1;
  overflow: auto;
  padding: 1.25rem 1.5rem 3rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.empty-all {
  color: var(--color-text-muted);
  font-style: italic;
  font-size: 0.875rem;
}

/* ── Scope section ───────────────────────────────────────────── */
.scope {
  border: 1px solid var(--color-border);
  background: var(--color-surface-base);
}

.scope-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.75rem 1rem;
  background: var(--color-surface-raised);
  cursor: pointer;
  flex-wrap: wrap;
  list-style: none;
}

.scope-head::-webkit-details-marker {
  display: none;
}

.scope-head::before {
  content: '▸';
  color: var(--color-text-muted);
  font-size: 0.75rem;
  margin-right: 0.25rem;
}

.scope[open] .scope-head::before {
  content: '▾';
}

.scope-head-main {
  display: flex;
  align-items: baseline;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.scope-label {
  font-size: 0.9375rem;
  font-weight: 700;
  color: var(--color-text-primary);
}

.scope-owner {
  font-family: var(--font-family-mono);
  font-size: 0.6875rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--color-text-muted);
  border: 1px solid var(--color-border-subtle);
  padding: 0.15em 0.5em;
}

.scope-counts {
  display: flex;
  gap: 0.4rem;
  flex-wrap: wrap;
}

.count-chip {
  font-family: var(--font-family-mono);
  font-size: 0.625rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--color-brand);
  border: 1px solid var(--color-brand);
  padding: 0.2em 0.5em;
}

.count-chip--should {
  color: var(--color-brand);
  border-color: var(--color-brand);
}

.count-chip--should-complete {
  color: #15a34a;
  border-color: #15a34a;
}

.count-chip--complete {
  color: #15a34a;
  border-color: #15a34a;
}

.count-chip--done {
  color: var(--color-brand);
  border-color: var(--color-brand);
}

.count-chip--done-complete {
  color: #15a34a;
  border-color: #15a34a;
}

.scope-blurb {
  margin: 0;
  padding: 0.75rem 1rem 0;
  font-size: 0.8125rem;
  color: var(--color-text-secondary);
  line-height: 1.5;
}

/* ── Groups & controls ───────────────────────────────────────── */
.groups {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  padding: 1rem;
}

.group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.group-heading {
  margin: 0;
  font-family: var(--font-family-mono);
  font-size: 0.6875rem;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.07em;
  color: var(--color-text-muted);
  padding-bottom: 0.375rem;
  border-bottom: 1px solid var(--color-border-subtle);
}

.control-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.control-item {
  padding: 0.75rem 1rem;
  background: var(--color-surface-raised);
  border: 1px solid var(--color-border-subtle);
  border-left-width: 2px;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.control-item--must {
  border-left-color: var(--color-brand);
}

.control-item--should {
  border-left-color: var(--color-border-subtle);
}

.control-item--done {
  background: var(--color-surface-base);
}

.control-item--above {
  opacity: 0.5;
}

.control-main {
  display: flex;
  align-items: baseline;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.control-check {
  display: inline-flex;
  align-items: center;
  flex-shrink: 0;
}

.control-check input {
  width: 1rem;
  height: 1rem;
  accent-color: var(--color-brand);
  cursor: pointer;
}

.modal-badge {
  flex-shrink: 0;
  font-family: var(--font-family-mono);
  font-size: 0.625rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  padding: 0.2em 0.5em;
  border-radius: var(--radius-sm);
  line-height: 1.5;
}

.modal-badge--must {
  background: var(--color-border);
  color: var(--color-surface-base);
  border: 1px solid var(--color-border);
}

.modal-badge--should {
  background: transparent;
  color: var(--color-text-primary);
  border: 1px solid var(--color-border);
}

.control-statement {
  flex: 1;
  min-width: 12rem;
  font-size: 0.875rem;
  color: var(--color-text-primary);
  line-height: 1.5;
}

.control-item--done .control-statement {
  text-decoration: line-through;
  color: var(--color-text-muted);
}

.tag {
  flex-shrink: 0;
  font-family: var(--font-family-mono);
  font-size: 0.5625rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding: 0.2em 0.5em;
  line-height: 1.4;
  border: 1px solid currentColor;
}

.tag--addressed {
  color: #1a9c66;
}

.tag--outstanding {
  color: var(--color-text-muted);
}

.tag--above {
  color: var(--color-text-muted);
}

.tag--clickable {
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
}

.tag--outstanding.tag--clickable:hover {
  background: var(--color-brand);
  color: var(--color-surface-base);
}

.spec-link {
  flex-shrink: 0;
  color: var(--color-brand);
  text-decoration: none;
  line-height: 1;
  transition: color 0.15s ease;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.spec-link:hover {
  color: var(--color-brand-hover);
}

.external-icon {
  width: 0.75rem;
  height: 0.75rem;
}

.control-description {
  margin: 0;
  padding-left: 1.5rem;
  font-size: 0.8125rem;
  color: var(--color-text-secondary);
  line-height: 1.6;
}

.evidence-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.375rem;
  padding-left: 1.5rem;
}

.evidence-tag {
  font-family: var(--font-family-mono);
  font-size: 0.625rem;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--color-text-muted);
  border: 1px solid var(--color-border-subtle);
  padding: 0.2em 0.55em;
  border-radius: var(--radius-sm);
  line-height: 1.5;
}
</style>
