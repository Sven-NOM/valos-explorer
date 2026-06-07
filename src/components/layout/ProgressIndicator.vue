<script setup lang="ts">
import { computed } from 'vue'
import { useContentStore } from '@/stores/content'
import { useAssessmentStore } from '@/stores/assessment'

const content = useContentStore()
const assessment = useAssessmentStore()

const answeredCount = computed(() =>
  content.risks.filter(
    (r) => assessment.naRisks.has(r.id) || (assessment.answers[r.id] ?? 'none') !== 'none'
  ).length
)
const totalCount = computed(() => content.risks.length)
const pct = computed(() =>
  totalCount.value ? Math.round((answeredCount.value / totalCount.value) * 100) : 0
)
</script>

<template>
  <div class="progress-indicator">
    <div class="progress-track">
      <div class="progress-fill" :style="{ width: pct + '%' }" />
    </div>
    <span class="progress-label">{{ answeredCount }}/{{ totalCount }} risks reviewed</span>
  </div>
</template>

<style scoped>
.progress-indicator {
  padding: 1rem 1.25rem;
  border-top: 1px solid var(--color-border);
  margin-top: auto;
}

.progress-track {
  height: 4px;
  background-color: var(--color-surface-overlay);
  border-radius: 9999px;
  overflow: hidden;
  margin-bottom: 0.5rem;
}

.progress-fill {
  height: 100%;
  background-color: var(--color-brand);
  border-radius: 9999px;
  transition: width 0.3s ease;
  min-width: 0;
}

.progress-label {
  font-size: 0.75rem;
  color: var(--color-text-muted);
}
</style>
