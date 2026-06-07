<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import type { Mitigation } from '@/types/valos'
import MitigationChip from './MitigationChip.vue'
import MitigationDetail from './MitigationDetail.vue'

const props = defineProps<{
  mitigations: Mitigation[]
  showSpecLink?: boolean
}>()

const selectedId = ref<string | null>(null)

const selectedMitigation = computed(() =>
  selectedId.value ? props.mitigations.find((m) => m.id === selectedId.value) ?? null : null
)

function handleSelect(mitigationId: string) {
  selectedId.value = selectedId.value === mitigationId ? null : mitigationId
}

function close() {
  selectedId.value = null
}

function onBackdropClick(e: MouseEvent) {
  if ((e.target as HTMLElement).classList.contains('mit-modal-backdrop')) {
    close()
  }
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') close()
}

onMounted(() => window.addEventListener('keydown', onKeydown))
onBeforeUnmount(() => window.removeEventListener('keydown', onKeydown))
</script>

<template>
  <div class="mitigation-list">
    <div class="chip-grid">
      <MitigationChip
        v-for="m in mitigations"
        :key="m.id"
        :mitigation="m"
        :show-spec-link="showSpecLink"
        :selected="selectedId === m.id"
        @select="handleSelect(m.id)"
      />
    </div>

    <!-- Modal teleported to body so it overlays the full page -->
    <Teleport to="body">
      <Transition name="mit-modal">
        <div
          v-if="selectedMitigation"
          class="mit-modal-backdrop"
          role="dialog"
          :aria-label="selectedMitigation.title"
          @click="onBackdropClick"
        >
          <div class="mit-modal-panel">
            <div class="mit-modal-header">
              <h2 class="mit-modal-title">{{ selectedMitigation.title }}</h2>
              <button
                class="mit-modal-close"
                type="button"
                aria-label="Close"
                @click="close"
              >
                ✕
              </button>
            </div>
            <div class="mit-modal-body">
              <MitigationDetail :mitigation="selectedMitigation" />
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped>
.mitigation-list {
  display: flex;
  flex-direction: column;
}

.chip-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 0.375rem;
}

/* ── Modal backdrop ──────────────────────────────────────────── */

.mit-modal-backdrop {
  position: fixed;
  inset: 0;
  z-index: 200;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1.5rem;
}

/* ── Modal panel ─────────────────────────────────────────────── */

.mit-modal-panel {
  background: var(--color-surface-base);
  border: 1px solid var(--color-border);
  width: 100%;
  max-width: 560px;
  max-height: 85dvh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 8px 40px rgba(0, 0, 0, 0.25);
}

.mit-modal-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  padding: 1.25rem 1.5rem 1rem;
  border-bottom: 1px solid var(--color-border);
  flex-shrink: 0;
}

.mit-modal-title {
  margin: 0;
  font-family: var(--font-family-sans);
  font-size: 1rem;
  font-weight: 700;
  color: var(--color-text-primary);
  line-height: 1.4;
}

.mit-modal-close {
  flex-shrink: 0;
  background: none;
  border: none;
  padding: 0.25rem 0.375rem;
  cursor: pointer;
  font-size: 0.875rem;
  color: var(--color-text-muted);
  line-height: 1;
  transition: color 0.15s;
}

.mit-modal-close:hover {
  color: var(--color-text-primary);
}

.mit-modal-body {
  overflow-y: auto;
  flex: 1;
}

/* ── Transition ──────────────────────────────────────────────── */

.mit-modal-enter-active,
.mit-modal-leave-active {
  transition: opacity 0.18s ease;
}

.mit-modal-enter-active .mit-modal-panel,
.mit-modal-leave-active .mit-modal-panel {
  transition: transform 0.18s ease, opacity 0.18s ease;
}

.mit-modal-enter-from,
.mit-modal-leave-to {
  opacity: 0;
}

.mit-modal-enter-from .mit-modal-panel,
.mit-modal-leave-to .mit-modal-panel {
  transform: translateY(12px);
  opacity: 0;
}
</style>
