<script setup lang="ts">
import { computed } from 'vue'
import { useContentStore } from '@/stores/content'
import { specDeepLink } from '@/config'
import type { CategoryId } from '@/types/valos'

const content = useContentStore()

const CATEGORY_ORDER: CategoryId[] = ['fin', 'sls', 'dow', 'kec', 'hck', 'gir', 'sps', 'rer']

// Risks ordered by category
const orderedRisks = computed(() =>
  CATEGORY_ORDER.flatMap((catId) => content.risksByCategory(catId))
)

// Controls grouped by groupId, preserving spec order
const groupedControls = computed(() => {
  const groups = new Map<string, typeof content.controls>()
  for (const ctrl of content.controls) {
    if (!groups.has(ctrl.groupId)) groups.set(ctrl.groupId, [])
    groups.get(ctrl.groupId)!.push(ctrl)
  }
  return [...groups.entries()]
})

// O(1) cell lookup
const linkSet = computed(() => {
  const set = new Set<string>()
  for (const ctrl of content.controls) {
    for (const riskId of ctrl.riskIds) set.add(`${ctrl.id}::${riskId}`)
  }
  return set
})

function hasLink(controlId: string, riskId: string) {
  return linkSet.value.has(`${controlId}::${riskId}`)
}

function extractModal(title: string): 'MUST' | 'SHOULD' | null {
  if (/\bMUST\b/.test(title)) return 'MUST'
  if (/\bSHOULD\b/.test(title)) return 'SHOULD'
  return null
}

function stripPrefix(title: string): string {
  return title.replace(/^Node Operators (MUST|SHOULD)\s+/i, '').trim()
}

// Category column spans for top header
const categorySpans = computed(() =>
  CATEGORY_ORDER.map((catId) => ({
    catId,
    name: content.categories.find((c) => c.id === catId)?.name ?? catId,
    count: content.risksByCategory(catId).length,
  })).filter((c) => c.count > 0)
)
</script>

<template>
  <div class="compliance-view">
    <!-- Page header -->
    <div class="page-header">
      <div class="page-header-inner">
        <h1 class="page-title">Compliance Matrix</h1>
        <p class="page-subtitle">
          {{ content.controls.length }} controls × {{ content.risks.length }} risks —
          how each framework requirement maps across the risk universe.
        </p>
        <div class="legend">
          <span class="legend-item">
            <span class="legend-dot legend-must" />
            MUST
          </span>
          <span class="legend-item">
            <span class="legend-dot legend-should" />
            SHOULD
          </span>
          <span class="legend-item">
            <span class="legend-dot legend-empty" />
            No link
          </span>
        </div>
      </div>
    </div>

    <!-- Scrollable matrix -->
    <div class="matrix-scroll">
      <table class="matrix-table" role="grid">
        <thead>
          <!-- Row 1: category spans -->
          <tr>
            <th class="corner-cell cat-corner" scope="col" />
            <th
              v-for="span in categorySpans"
              :key="span.catId"
              :colspan="span.count"
              scope="colgroup"
              class="cat-header"
              :class="`cat-${span.catId}`"
            >
              {{ span.name }}
            </th>
          </tr>
          <!-- Row 2: individual risk displayIds (rotated) -->
          <tr>
            <th class="corner-cell risk-corner" scope="col">
              <span class="corner-label">CONTROL ↓ / RISK →</span>
            </th>
            <th
              v-for="risk in orderedRisks"
              :key="risk.id"
              scope="col"
              class="risk-header"
              :title="risk.title"
            >
              <div class="risk-label-wrap">
                <span class="risk-label" :class="`cat-color-${risk.categoryId}`">
                  {{ risk.displayId }}
                </span>
              </div>
            </th>
          </tr>
        </thead>

        <tbody>
          <template v-for="[groupId, controls] in groupedControls" :key="groupId">
            <!-- Group header row -->
            <tr class="group-row">
              <td class="group-label" :colspan="orderedRisks.length + 1">
                {{ groupId }}
              </td>
            </tr>
            <!-- Control rows -->
            <tr v-for="ctrl in controls" :key="ctrl.id" class="control-row">
              <td class="ctrl-label-cell">
                <a
                  :href="specDeepLink(ctrl.id)"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="ctrl-label"
                  :title="ctrl.title"
                >
                  <span
                    class="modal-badge"
                    :class="extractModal(ctrl.title) === 'MUST' ? 'badge-must' : 'badge-should'"
                  >{{ extractModal(ctrl.title) }}</span>
                  {{ stripPrefix(ctrl.title) }}
                </a>
              </td>
              <td
                v-for="risk in orderedRisks"
                :key="risk.id"
                class="matrix-cell"
                :class="{
                  'cell-must':   hasLink(ctrl.id, risk.id) && extractModal(ctrl.title) === 'MUST',
                  'cell-should': hasLink(ctrl.id, risk.id) && extractModal(ctrl.title) === 'SHOULD',
                }"
                :title="hasLink(ctrl.id, risk.id)
                  ? `${extractModal(ctrl.title)}: ${stripPrefix(ctrl.title).slice(0, 60)}… → ${risk.displayId}`
                  : undefined"
              />
            </tr>
          </template>
        </tbody>
      </table>
    </div>
  </div>
</template>

<style scoped>
/* ── Layout ─────────────────────────────────────────────────── */

.compliance-view {
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
  align-items: baseline;
  gap: 1.5rem;
  flex-wrap: wrap;
}

.page-title {
  margin: 0;
  font-size: 1.125rem;
  font-weight: 700;
  color: var(--color-text-primary);
  white-space: nowrap;
}

.page-subtitle {
  margin: 0;
  font-size: 0.8125rem;
  color: var(--color-text-muted);
}

.legend {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-left: auto;
  font-family: var(--font-family-mono);
  font-size: 0.6875rem;
  color: var(--color-text-secondary);
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 0.375rem;
}

.legend-dot {
  display: inline-block;
  width: 10px;
  height: 10px;
  flex-shrink: 0;
}

.legend-must   { background: var(--color-brand); }
.legend-should { background: var(--color-brand); opacity: 0.35; border: 1px solid var(--color-brand); }
.legend-empty  { background: var(--color-surface-overlay); border: 1px solid var(--color-border-subtle); }

/* ── Scrollable matrix wrapper ───────────────────────────────── */

.matrix-scroll {
  flex: 1;
  overflow: auto;
  /* needed for sticky to work inside a scrollable container */
  position: relative;
}

/* ── Table base ──────────────────────────────────────────────── */

.matrix-table {
  border-collapse: collapse;
  table-layout: fixed;
}

/* ── Sticky corner ───────────────────────────────────────────── */

.corner-cell {
  position: sticky;
  left: 0;
  z-index: 4;
  background: var(--color-surface-raised);
  border-right: 1px solid var(--color-border);
  width: 220px;
  min-width: 220px;
  max-width: 220px;
}

.cat-corner {
  top: 0;
  border-bottom: 1px solid var(--color-border-subtle);
  height: 28px;
}

.risk-corner {
  top: 28px;
  height: 80px;
  vertical-align: bottom;
  padding: 0 0.5rem 0.375rem;
}

.corner-label {
  font-family: var(--font-family-mono);
  font-size: 0.5625rem;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--color-text-muted);
  white-space: nowrap;
}

/* ── Category headers (row 1) ────────────────────────────────── */

.cat-header {
  position: sticky;
  top: 0;
  z-index: 3;
  background: var(--color-surface-raised);
  border-bottom: 1px solid var(--color-border-subtle);
  border-right: 1px solid var(--color-border-subtle);
  height: 28px;
  padding: 0 4px;
  font-family: var(--font-family-mono);
  font-size: 0.625rem;
  font-weight: 600;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  text-align: left;
  white-space: nowrap;
  overflow: hidden;
}

/* Category accent colours — inherited from CSS vars */
.cat-fin { color: var(--color-risk-fin); border-bottom-color: var(--color-risk-fin); }
.cat-sls { color: var(--color-risk-sls); border-bottom-color: var(--color-risk-sls); }
.cat-dow { color: var(--color-risk-dow); border-bottom-color: var(--color-risk-dow); }
.cat-kec { color: var(--color-risk-kec); border-bottom-color: var(--color-risk-kec); }
.cat-hck { color: var(--color-risk-hck); border-bottom-color: var(--color-risk-hck); }
.cat-gir { color: var(--color-risk-gir); border-bottom-color: var(--color-risk-gir); }
.cat-sps { color: var(--color-risk-sps); border-bottom-color: var(--color-risk-sps); }
.cat-rer { color: var(--color-risk-rer); border-bottom-color: var(--color-risk-rer); }

/* ── Risk column headers (row 2) ─────────────────────────────── */

.risk-header {
  position: sticky;
  top: 28px;        /* below the category row */
  z-index: 3;
  background: var(--color-surface-raised);
  border-bottom: 1px solid var(--color-border);
  border-right: 1px solid var(--color-border-subtle);
  width: 14px;
  min-width: 14px;
  max-width: 14px;
  height: 80px;
  padding: 0;
  vertical-align: bottom;
  text-align: left;
}

.risk-label-wrap {
  display: flex;
  align-items: flex-end;
  height: 100%;
  padding-bottom: 4px;
  padding-left: 2px;
}

.risk-label {
  display: block;
  transform: rotate(-55deg);
  transform-origin: left bottom;
  white-space: nowrap;
  font-family: var(--font-family-mono);
  font-size: 9px;
  font-weight: 500;
  line-height: 1;
}

.cat-color-fin { color: var(--color-risk-fin); }
.cat-color-sls { color: var(--color-risk-sls); }
.cat-color-dow { color: var(--color-risk-dow); }
.cat-color-kec { color: var(--color-risk-kec); }
.cat-color-hck { color: var(--color-risk-hck); }
.cat-color-gir { color: var(--color-risk-gir); }
.cat-color-sps { color: var(--color-risk-sps); }
.cat-color-rer { color: var(--color-risk-rer); }

/* ── Group header rows ───────────────────────────────────────── */

.group-row {
  background: var(--color-surface-raised);
}

.group-label {
  position: sticky;
  left: 0;
  z-index: 1;
  background: var(--color-surface-raised);
  border-top: 1px solid var(--color-border-subtle);
  padding: 0.3rem 0.625rem;
  font-family: var(--font-family-mono);
  font-size: 0.6rem;
  font-weight: 600;
  letter-spacing: 0.07em;
  text-transform: uppercase;
  color: var(--color-text-muted);
  white-space: nowrap;
}

/* ── Control label rows ──────────────────────────────────────── */

.control-row:hover {
  background: var(--color-surface-overlay);
}

.ctrl-label-cell {
  position: sticky;
  left: 0;
  z-index: 1;
  background: inherit;
  border-right: 1px solid var(--color-border);
  width: 220px;
  min-width: 220px;
  max-width: 220px;
  padding: 0;
}

.ctrl-label {
  display: flex;
  align-items: flex-start;
  gap: 0.375rem;
  padding: 3px 8px 3px 6px;
  font-size: 0.6875rem;
  color: var(--color-text-secondary);
  text-decoration: none;
  line-height: 1.35;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  transition: color 0.12s;
}

.ctrl-label:hover {
  color: var(--color-brand);
  text-decoration: none;
}

.modal-badge {
  flex-shrink: 0;
  font-family: var(--font-family-mono);
  font-size: 0.5625rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  padding: 0.1em 0.3em;
  line-height: 1.4;
  margin-top: 0.05em;
}

.badge-must {
  background: var(--color-text-primary);
  color: var(--color-surface-base);
}

.badge-should {
  border: 1px solid var(--color-text-muted);
  color: var(--color-text-muted);
  background: transparent;
}

/* ── Matrix cells ────────────────────────────────────────────── */

.matrix-cell {
  width: 14px;
  min-width: 14px;
  max-width: 14px;
  height: 14px;
  padding: 0;
  border-right: 1px solid var(--color-border-subtle);
  border-bottom: 1px solid var(--color-border-subtle);
  background: var(--color-surface-overlay);
  transition: background 0.1s;
}

.matrix-cell:hover {
  background: color-mix(in srgb, var(--color-brand) 20%, transparent);
  cursor: default;
}

.cell-must {
  background: var(--color-brand);
}

.cell-must:hover {
  background: var(--color-brand-hover);
}

.cell-should {
  background: color-mix(in srgb, var(--color-brand) 38%, var(--color-surface-overlay));
}

.cell-should:hover {
  background: color-mix(in srgb, var(--color-brand) 55%, var(--color-surface-overlay));
}

/* Vertical separator between categories — right border on last risk column of each category */
.matrix-cell:last-child {
  border-right: 1px solid var(--color-border);
}
</style>
