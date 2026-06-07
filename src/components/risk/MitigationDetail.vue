<script setup lang="ts">
import { computed } from 'vue'
import { useContentStore } from '@/stores/content'
import { specDeepLink } from '@/config'
import type { Mitigation } from '@/types/valos'

const props = defineProps<{
  mitigation: Mitigation
}>()

const content = useContentStore()

const paragraphs = computed(() =>
  props.mitigation.description
    ? props.mitigation.description.split(/\n\n+/).filter((p) => p.trim().length > 0)
    : []
)

const risks = computed(() => content.risksForMitigation(props.mitigation.id))
const visibleRisks = computed(() => risks.value.slice(0, 8))
const hiddenCount = computed(() => Math.max(0, risks.value.length - 8))
</script>

<template>
  <div class="mitigation-detail">
    <div v-if="paragraphs.length > 0" class="description-block">
      <p v-for="(para, i) in paragraphs" :key="i" class="description-para">{{ para }}</p>
    </div>

    <div v-if="mitigation.tools.length > 0" class="section">
      <span class="section-label">Tools that support this</span>
      <p class="tools-note">Uncurated selection from the spec — not endorsements.</p>
      <ul class="tools-list">
        <li v-for="tool in mitigation.tools" :key="tool.name" class="tool-item">
          <a
            v-if="tool.url"
            :href="tool.url"
            target="_blank"
            rel="noopener noreferrer"
            class="tool-link"
          >
            {{ tool.name }}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 12 12"
              width="10"
              height="10"
              fill="none"
              stroke="currentColor"
              stroke-width="1.5"
              stroke-linecap="round"
              stroke-linejoin="round"
              aria-hidden="true"
              class="external-icon"
            >
              <path d="M5 2H2a1 1 0 0 0-1 1v7a1 1 0 0 0 1 1h7a1 1 0 0 0 1-1V7" />
              <path d="M8 1h3v3" />
              <path d="M11 1 5.5 6.5" />
            </svg>
          </a>
          <span v-else class="tool-plain">{{ tool.name }}</span>
        </li>
      </ul>
    </div>

    <div v-if="mitigation.riskIds.length > 0" class="section">
      <span class="section-label">Addresses {{ risks.length }} {{ risks.length === 1 ? 'risk' : 'risks' }}</span>
      <div class="risk-pills">
        <span v-for="risk in visibleRisks" :key="risk.id" class="risk-pill">{{ risk.displayId }}</span>
        <span v-if="hiddenCount > 0" class="risk-pill risk-pill--more">+{{ hiddenCount }} more</span>
      </div>
    </div>

    <a
      :href="specDeepLink(mitigation.id)"
      target="_blank"
      rel="noopener noreferrer"
      class="spec-link"
    >
      View full mitigation in spec ↗
    </a>
  </div>
</template>

<style scoped>
.mitigation-detail {
  background: var(--color-surface-base);
  padding: 1.25rem 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.description-block {
  display: flex;
  flex-direction: column;
  gap: 0.625rem;
}

.description-para {
  margin: 0;
  font-size: 0.8125rem;
  color: var(--color-text-secondary);
  line-height: 1.65;
}

.section {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.section-label {
  font-family: var(--font-family-mono);
  font-size: 0.6875rem;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--color-text-muted);
}

.tools-note {
  margin: 0;
  font-size: 0.75rem;
  font-style: italic;
  color: var(--color-text-muted);
}

.tools-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.3125rem;
}

.tool-item {
  font-size: 0.8125rem;
}

.tool-link {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  color: var(--color-text-secondary);
  text-decoration: underline;
  text-underline-offset: 2px;
  text-decoration-color: var(--color-border-subtle);
  transition: color 0.15s, text-decoration-color 0.15s;
}

.tool-link:hover {
  color: var(--color-text-primary);
  text-decoration-color: var(--color-text-primary);
}

.external-icon {
  flex-shrink: 0;
  opacity: 0.6;
}

.tool-plain {
  color: var(--color-text-secondary);
}

.risk-pills {
  display: flex;
  flex-wrap: wrap;
  gap: 0.3125rem;
}

.risk-pill {
  font-family: var(--font-family-mono);
  font-size: 0.6875rem;
  font-weight: 500;
  letter-spacing: 0.03em;
  padding: 0.15em 0.5em;
  background: var(--color-surface-overlay);
  border: 1px solid var(--color-border-subtle);
  color: var(--color-text-secondary);
  border-radius: var(--radius-sm);
  line-height: 1.6;
}

.risk-pill--more {
  color: var(--color-text-muted);
  border-style: dashed;
}

.spec-link {
  align-self: flex-start;
  font-size: 0.8125rem;
  font-weight: 500;
  color: var(--color-brand);
  text-decoration: none;
  transition: color 0.15s;
}

.spec-link:hover {
  color: var(--color-brand-hover);
  text-decoration: underline;
  text-underline-offset: 2px;
}
</style>
