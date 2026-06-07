<script setup lang="ts">
import { ref, computed } from 'vue'
import { useLevelGuidance } from '@/composables/useLevelGuidance'
import type { AnswerLevel } from '@/types/valos'

const props = defineProps<{
  riskId: string
  selectedLevel: AnswerLevel
}>()

const { guidanceFor } = useLevelGuidance()
const guidance = computed(() => guidanceFor(props.riskId))

const open = ref(false)

function toggle() {
  open.value = !open.value
}
</script>

<template>
  <div class="level-guidance">
    <button
      type="button"
      class="disclosure-trigger"
      :aria-expanded="open"
      @click="toggle"
    >
      <span class="trigger-text">What do these levels mean for this risk?</span>
      <svg
        class="chevron"
        :class="{ 'chevron--open': open }"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 12 12"
        width="12"
        height="12"
        fill="none"
        stroke="currentColor"
        stroke-width="1.75"
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-hidden="true"
      >
        <path d="M2 4.5 6 8l4-3.5" />
      </svg>
    </button>

    <div v-if="open" class="guidance-body">
      <ul class="level-list">
        <li
          v-for="entry in guidance.levels"
          :key="entry.value"
          class="level-item"
          :class="{ 'level-item--selected': entry.value === selectedLevel }"
        >
          <div class="level-header">
            <span class="level-label">{{ entry.label }}</span>
            <span class="level-summary">{{ entry.summary }}</span>
          </div>
          <p class="level-detail">{{ entry.detail }}</p>
        </li>
      </ul>

      <p class="provenance">{{ guidance.provenance }}</p>
    </div>
  </div>
</template>

<style scoped>
.level-guidance {
  border-top: 1px solid var(--color-border-subtle);
}

/* ── Trigger ─────────────────────────────────────────────────── */

.disclosure-trigger {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  width: 100%;
  padding: 0.5rem 0;
  background: none;
  border: none;
  cursor: pointer;
  text-align: left;
  font-family: inherit;
}

.trigger-text {
  font-size: 0.75rem;
  font-family: var(--font-family-mono);
  letter-spacing: 0.03em;
  color: var(--color-text-muted);
  transition: color 0.15s;
}

.disclosure-trigger:hover .trigger-text {
  color: var(--color-text-secondary);
}

.chevron {
  flex-shrink: 0;
  color: var(--color-text-muted);
  transition: transform 0.2s ease;
}

.chevron--open {
  transform: rotate(180deg);
}

/* ── Body ────────────────────────────────────────────────────── */

.guidance-body {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding-bottom: 0.75rem;
}

.level-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0;
}

/* ── Level item ──────────────────────────────────────────────── */

.level-item {
  padding: 0.625rem 0.75rem;
  border-left: 2px solid var(--color-border-subtle);
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  transition: border-color 0.15s;
}

.level-item + .level-item {
  margin-top: 0.25rem;
}

.level-item--selected {
  border-left-color: var(--color-brand);
  background: var(--color-brand-subtle);
}

.level-header {
  display: flex;
  align-items: baseline;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.level-label {
  font-family: var(--font-family-mono);
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--color-text-primary);
  letter-spacing: 0.03em;
  min-width: 4.5rem;
}

.level-item--selected .level-label {
  color: var(--color-brand);
}

.level-summary {
  font-family: var(--font-family-mono);
  font-size: 0.6875rem;
  color: var(--color-text-muted);
  letter-spacing: 0.02em;
}

.level-detail {
  margin: 0;
  font-size: 0.8125rem;
  color: var(--color-text-secondary);
  line-height: 1.6;
}

.level-item--selected .level-detail {
  color: var(--color-text-primary);
}

/* ── Provenance ──────────────────────────────────────────────── */

.provenance {
  margin: 0;
  font-size: 0.6875rem;
  font-style: italic;
  color: var(--color-text-muted);
  padding-left: 0.75rem;
}
</style>
