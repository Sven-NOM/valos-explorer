<script setup lang="ts">
import type { Risk } from '@/types/valos'

const props = defineProps<{
  risk: Risk
  categoryColor?: string
}>()
</script>

<template>
  <article
    class="risk-card"
    :style="{ '--accent': props.categoryColor ?? 'var(--color-brand)' }"
  >
    <div class="card-header">
      <span class="category-badge">{{ risk.displayId }}</span>
      <span class="risk-group">{{ risk.riskGroup }}</span>
    </div>
    <h3 class="risk-title">{{ risk.title }}</h3>
    <p class="risk-description">{{ risk.description }}</p>
  </article>
</template>

<style scoped>
.risk-card {
  background: var(--color-surface-raised);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-card);
  border: 1px solid var(--color-border);
  border-left: 3px solid var(--accent);
  padding: 1rem 1.125rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 0.625rem;
}

.category-badge {
  font-size: 0.6875rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  padding: 0.2em 0.55em;
  border-radius: var(--radius-sm);
  background: color-mix(in srgb, var(--accent) 16%, transparent);
  border: 1px solid color-mix(in srgb, var(--accent) 40%, transparent);
  color: var(--accent);
  line-height: 1.4;
}

.risk-group {
  font-size: 0.6875rem;
  font-weight: 500;
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.risk-title {
  margin: 0;
  font-size: 0.9375rem;
  font-weight: 600;
  color: var(--color-text-primary);
  line-height: 1.4;
}

.risk-description {
  margin: 0;
  font-size: 0.8125rem;
  color: var(--color-text-secondary);
  line-height: 1.6;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
