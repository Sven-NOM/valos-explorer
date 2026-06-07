<script setup lang="ts">
import { specDeepLink } from '@/config'
import type { Mitigation } from '@/types/valos'

const props = defineProps<{
  mitigation: Mitigation
  showSpecLink?: boolean
  selected?: boolean
}>()

const emit = defineEmits<{
  select: []
}>()
</script>

<template>
  <span
    class="mitigation-chip"
    :class="{ 'mitigation-chip--selected': selected }"
    @click="emit('select')"
  >
    <span class="chip-title">{{ mitigation.title }}</span>
    <a
      v-if="showSpecLink"
      :href="specDeepLink(mitigation.id)"
      target="_blank"
      rel="noopener noreferrer"
      class="spec-link"
      :title="`View ${mitigation.title} in the Valos spec`"
      @click.stop
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 12 12"
        width="11"
        height="11"
        fill="none"
        stroke="currentColor"
        stroke-width="1.5"
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-hidden="true"
      >
        <path d="M5 2H2a1 1 0 0 0-1 1v7a1 1 0 0 0 1 1h7a1 1 0 0 0 1-1V7" />
        <path d="M8 1h3v3" />
        <path d="M11 1 5.5 6.5" />
      </svg>
    </a>
  </span>
</template>

<style scoped>
.mitigation-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.3125rem;
  padding: 0.2em 0.6em;
  border-radius: 999px;
  background: var(--color-surface-overlay);
  border: 1px solid var(--color-border);
  color: var(--color-text-secondary);
  font-size: 0.75rem;
  font-weight: 500;
  line-height: 1.5;
  transition: background 0.15s, color 0.15s, border-color 0.15s;
  cursor: pointer;
  user-select: none;
}

.mitigation-chip:hover:not(.mitigation-chip--selected) {
  background: var(--color-brand-subtle);
  border-color: color-mix(in srgb, var(--color-brand) 35%, transparent);
  color: var(--color-brand);
}

.mitigation-chip--selected {
  background: var(--color-brand);
  border-color: var(--color-brand);
  color: #fff;
}

.mitigation-chip--selected:hover {
  background: var(--color-brand-hover);
  border-color: var(--color-brand-hover);
  color: #fff;
}

.chip-title {
  white-space: nowrap;
}

.spec-link {
  display: flex;
  align-items: center;
  color: inherit;
  opacity: 0.7;
  transition: opacity 0.15s;
  text-decoration: none;
  flex-shrink: 0;
}

.spec-link:hover {
  opacity: 1;
  text-decoration: none;
  color: inherit;
}
</style>
