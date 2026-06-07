<script setup lang="ts">
import { computed } from 'vue'
import { useContentStore } from '@/stores/content'
import { specDeepLink } from '@/config'
import type { Control } from '@/types/valos'

const props = defineProps<{
  riskId: string
}>()

const content = useContentStore()

const controls = computed(() => content.controlsForRisk(props.riskId))

const groupedControls = computed(() => {
  return controls.value.reduce((map, control) => {
    const existing = map.get(control.groupId)
    if (existing) {
      existing.push(control)
    } else {
      map.set(control.groupId, [control])
    }
    return map
  }, new Map<string, Control[]>())
})

const evidenceTypeMap = computed(() => {
  return new Map(content.evidenceTypes.map((e) => [e.id, e.name]))
})

function extractModal(title: string): 'MUST' | 'SHOULD' | null {
  if (/\bMUST\b/.test(title)) return 'MUST'
  if (/\bSHOULD\b/.test(title)) return 'SHOULD'
  return null
}

function stripPrefix(title: string): string {
  return title
    .replace(/^Node Operators MUST\s+/i, '')
    .replace(/^Node Operators SHOULD\s+/i, '')
    .trim()
}
</script>

<template>
  <section class="risk-controls">
    <div class="section-header">
      <h3 class="section-title">What the framework requires</h3>
      <p class="section-subtitle">Concrete requirements from the ValOS specification — not a pass/fail assessment.</p>
    </div>

    <p v-if="controls.length === 0" class="empty-state">
      No specific controls linked to this risk in the current spec version.
    </p>

    <div v-else class="groups">
      <div
        v-for="[groupId, groupControls] in groupedControls"
        :key="groupId"
        class="group"
      >
        <h4 class="group-heading">{{ groupId }}</h4>

        <ul class="control-list">
          <li
            v-for="control in groupControls"
            :key="control.id"
            class="control-item"
            :class="extractModal(control.title) === 'MUST' ? 'control-item--must' : 'control-item--should'"
          >
            <div class="control-main">
              <span
                v-if="extractModal(control.title)"
                class="modal-badge"
                :class="extractModal(control.title) === 'MUST' ? 'modal-badge--must' : 'modal-badge--should'"
              >
                {{ extractModal(control.title) }}
              </span>

              <span class="control-statement">{{ stripPrefix(control.title) }}</span>

              <a
                :href="specDeepLink(control.id)"
                target="_blank"
                rel="noopener noreferrer"
                class="spec-link"
                :aria-label="`Open spec requirement ${control.id} in new window`"
                title="Open in spec (external link)"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="external-icon">
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                  <polyline points="15 3 21 3 21 9"></polyline>
                  <line x1="10" y1="14" x2="21" y2="3"></line>
                </svg>
              </a>
            </div>

            <p v-if="control.description.trim()" class="control-description">
              {{ control.description.trim() }}
            </p>

            <div v-if="control.evidenceTypeIds.length > 0" class="evidence-tags">
              <span
                v-for="evidenceId in control.evidenceTypeIds"
                :key="evidenceId"
                class="evidence-tag"
              >
                {{ evidenceTypeMap.get(evidenceId) ?? evidenceId }}
              </span>
            </div>
          </li>
        </ul>
      </div>
    </div>
  </section>
</template>

<style scoped>
.risk-controls {
  border-top: 1px solid var(--color-border-subtle);
  padding-top: 1.5rem;
}

.section-header {
  margin-bottom: 1.25rem;
}

.section-title {
  margin: 0 0 0.25rem;
  font-family: var(--font-family-sans);
  font-size: 1rem;
  font-weight: 700;
  color: var(--color-text-primary);
  line-height: 1.3;
}

.section-subtitle {
  margin: 0;
  font-size: 0.8125rem;
  color: var(--color-text-muted);
  line-height: 1.5;
}

.empty-state {
  margin: 0;
  font-size: 0.875rem;
  color: var(--color-text-muted);
  font-style: italic;
}

.groups {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.group {
  display: flex;
  flex-direction: column;
  gap: 0.625rem;
}

.group-heading {
  margin: 0 0 0.375rem;
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

.control-main {
  display: flex;
  align-items: baseline;
  gap: 0.5rem;
  flex-wrap: wrap;
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
  font-family: var(--font-family-sans);
  font-size: 0.875rem;
  font-weight: 400;
  color: var(--color-text-primary);
  line-height: 1.5;
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
  font-size: 0.8125rem;
  color: var(--color-text-secondary);
  line-height: 1.6;
}

.evidence-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.375rem;
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
