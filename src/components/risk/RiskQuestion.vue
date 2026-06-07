<script setup lang="ts">
import type { AnswerLevel } from '@/types/valos'

const props = defineProps<{
  modelValue: AnswerLevel
  isNa?: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: AnswerLevel]
  'mark-na': []
  'clear-na': []
}>()

const levels: { value: AnswerLevel; label: string; description: string }[] = [
  { value: 'none',     label: 'None',     description: 'Not addressed' },
  { value: 'basic',    label: 'Basic',    description: 'Informal / partial' },
  { value: 'advanced', label: 'Advanced', description: 'Implemented & documented' },
  { value: 'tested',   label: 'Tested',   description: 'Verified — tested or audited' },
]
</script>

<template>
  <div class="answer-wrapper">
    <div class="answer-row" role="group">
      <button
        v-for="level in levels"
        :key="level.value"
        type="button"
        class="answer-btn"
        :class="{ 'is-selected': !isNa && modelValue === level.value }"
        :disabled="isNa"
        @click="emit('update:modelValue', level.value)"
      >
        <span class="btn-label">{{ level.label }}</span>
        <span class="btn-description">{{ level.description }}</span>
      </button>
    </div>

    <div class="na-row">
      <button
        v-if="!isNa"
        type="button"
        class="na-btn"
        @click="emit('mark-na')"
      >
        Not Applicable
      </button>
      <button
        v-else
        type="button"
        class="na-btn na-btn--active"
        @click="emit('clear-na')"
      >
        ✓ Marked N/A — undo
      </button>
    </div>
  </div>
</template>

<style scoped>
.answer-wrapper {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.answer-row {
  display: flex;
  gap: 0.375rem;
}

.answer-btn {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.2em;
  padding: 0.5rem 0.625rem;
  border-radius: var(--radius-sm);
  border: 1px solid var(--color-border);
  background: var(--color-surface-overlay);
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: border-color 0.15s, background 0.15s, color 0.15s;
  text-align: center;
}

.answer-btn:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

.answer-btn:hover:not(.is-selected):not(:disabled) {
  border-color: color-mix(in srgb, var(--color-brand) 40%, transparent);
  background: var(--color-brand-subtle);
  color: var(--color-text-primary);
}

.answer-btn.is-selected {
  border-color: var(--color-brand);
  background: var(--color-brand-subtle);
  color: var(--color-brand);
}

.btn-label {
  font-size: 0.8125rem;
  font-weight: 600;
  line-height: 1.3;
}

.btn-description {
  font-size: 0.6875rem;
  line-height: 1.3;
  color: inherit;
  opacity: 0.75;
}

.answer-btn.is-selected .btn-description {
  opacity: 0.85;
}

/* N/A row */
.na-row {
  display: flex;
  justify-content: flex-end;
}

.na-btn {
  font-family: var(--font-family-mono);
  font-size: 0.6875rem;
  letter-spacing: 0.04em;
  padding: 0.3em 0.75em;
  border: 1px solid var(--color-border);
  background: transparent;
  color: var(--color-text-muted);
  cursor: pointer;
  transition: color 0.15s, border-color 0.15s, background 0.15s;
}

.na-btn:hover {
  color: var(--color-text-secondary);
  border-color: var(--color-text-secondary);
}

.na-btn--active {
  border-color: var(--color-text-secondary);
  color: var(--color-text-secondary);
  background: var(--color-surface-overlay);
}
</style>
