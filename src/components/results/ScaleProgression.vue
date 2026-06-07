<script setup lang="ts">
import { useScale } from '@/composables/useScale'
import { specDeepLink } from '@/config'
import { PROVENANCE } from '@/data/scaleOverlay'

const { scaleBand, scaleLabel, nextRungMitigations } = useScale()
</script>

<template>
  <div v-if="scaleBand !== null" class="scale-progression">
    <div class="scale-header">
      <h3 class="scale-title">Scale Appropriateness</h3>
      <span class="scale-badge">{{ scaleLabel }}</span>
    </div>

    <template v-if="scaleBand < 3 && nextRungMitigations.length">
      <p class="scale-intro">
        Operators at the next maturity level often additionally implement:
      </p>
      <ul class="mit-list">
        <li v-for="mit in nextRungMitigations" :key="mit.id" class="mit-item">
          <a
            :href="specDeepLink(mit.id)"
            target="_blank"
            rel="noopener noreferrer"
            class="mit-link"
          >
            {{ mit.title }} ↗
          </a>
        </li>
      </ul>
    </template>

    <p v-else-if="scaleBand >= 3" class="top-rung">
      Your profile is at the top maturity rung of the framework. The full ValOS
      assessment provides the deepest validation of practices at this scale.
    </p>

    <p class="provenance">{{ PROVENANCE }}</p>
  </div>
</template>

<style scoped>
.scale-progression {
  border-top: 1px solid var(--color-border);
  padding-top: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.875rem;
}

.scale-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.scale-title {
  margin: 0;
  font-size: 0.9375rem;
  font-weight: 700;
  color: var(--color-text-primary);
}

.scale-badge {
  font-family: var(--font-family-mono);
  font-size: 0.6875rem;
  font-weight: 500;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  padding: 0.2em 0.6em;
  border: 1px solid var(--color-border);
  background: var(--color-surface-overlay);
  color: var(--color-text-secondary);
}

.scale-intro {
  margin: 0;
  font-size: 0.875rem;
  color: var(--color-text-secondary);
}

.mit-list {
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
}

.mit-item {
  display: flex;
  align-items: center;
}

.mit-link {
  font-size: 0.875rem;
  color: var(--color-brand);
  text-decoration: none;
  padding: 0.375rem 0.625rem;
  border: 1px solid var(--color-border-subtle, #e0e0e0);
  background: var(--color-surface-raised);
  display: block;
  width: 100%;
  transition: background 0.12s, border-color 0.12s;
}

.mit-link:hover {
  background: var(--color-surface-overlay);
  border-color: var(--color-border);
  text-decoration: none;
}

.top-rung {
  margin: 0;
  font-size: 0.875rem;
  color: var(--color-text-secondary);
  font-style: italic;
}

.provenance {
  margin: 0;
  font-size: 0.6875rem;
  color: var(--color-text-muted);
  font-style: italic;
  border-top: 1px solid var(--color-border-subtle, #e0e0e0);
  padding-top: 0.5rem;
}
</style>
