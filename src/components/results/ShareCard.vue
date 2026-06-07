<script setup lang="ts">
import { ref } from 'vue'
import { useShareCard } from '@/composables/useShareCard'

const cardRef = ref<HTMLElement | null>(null)
const {
  orgTypeLabel,
  categoriesExplored,
  topStrengths,
  maturity,
  riskCoveragePct,
  mitigationCoveragePct,
  naCount,
  downloadPng,
  shareOnX,
} = useShareCard(cardRef)

const CATEGORY_COLORS: Record<string, string> = {
  fin: '#d97706', sls: '#dc2626', dow: '#7c3aed', kec: '#0891b2',
  hck: '#ea580c', gir: '#059669', sps: '#db2777', rer: '#4f46e5',
}

const downloading = ref(false)

async function handleDownload() {
  downloading.value = true
  try {
    await downloadPng()
  } finally {
    downloading.value = false
  }
}
</script>

<template>
  <div class="share-section">
    <h2 class="share-heading">Share your posture</h2>
    <p class="share-sub">Download a summary card or share on X.</p>

    <!-- The card that gets exported as PNG -->
    <div ref="cardRef" class="share-card">
      <div class="card-top">
        <span class="card-brand">ValOS Explorer</span>
        <span class="card-label">Risk posture assessment</span>
      </div>

      <div class="card-maturity">
        <span class="maturity-word">{{ maturity }}</span>
        <span class="maturity-label">Maturity</span>
      </div>

      <div class="card-stats">
        <div class="stat-item">
          <span class="stat-value">{{ riskCoveragePct }}%</span>
          <span class="stat-label">Risk breadth</span>
        </div>
        <div class="stat-divider" />
        <div class="stat-item">
          <span class="stat-value">{{ mitigationCoveragePct }}%</span>
          <span class="stat-label">Mitigation depth</span>
        </div>
        <div v-if="orgTypeLabel" class="stat-divider" />
        <div v-if="orgTypeLabel" class="stat-item">
          <span class="stat-value">{{ orgTypeLabel }}</span>
          <span class="stat-label">Operator type</span>
        </div>
      </div>

      <p v-if="naCount > 0" class="card-na-note">
        {{ naCount }} {{ naCount === 1 ? 'risk' : 'risks' }} marked Not Applicable
      </p>

      <div v-if="categoriesExplored.length" class="card-categories">
        <span
          v-for="cat in categoriesExplored"
          :key="cat.id"
          class="cat-chip"
          :style="{ color: CATEGORY_COLORS[cat.id], borderColor: CATEGORY_COLORS[cat.id] }"
        >{{ cat.name }}</span>
      </div>

      <div v-if="topStrengths.length" class="card-strengths">
        <span class="strengths-label">Strengths</span>
        <ul class="strengths-list">
          <li v-for="s in topStrengths" :key="s.id">{{ s.title }}</li>
        </ul>
      </div>

      <div class="card-footer">
        <span class="footer-url">lidofinance.github.io/valos-explorer</span>
        <span class="footer-note">Educational self-assessment · Not a certification</span>
      </div>
    </div>

    <!-- Action buttons -->
    <div class="share-actions">
      <button
        class="action-btn action-btn--primary"
        :disabled="downloading"
        @click="handleDownload"
      >
        {{ downloading ? 'Generating…' : 'Download PNG' }}
      </button>
      <button class="action-btn" @click="shareOnX">
        Share on X
      </button>
    </div>
  </div>
</template>

<style scoped>
.share-section {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  border-top: 1px solid var(--color-border);
  padding-top: 2rem;
}

.share-heading {
  margin: 0;
  font-size: 1.125rem;
  font-weight: 700;
  color: var(--color-text-primary);
}

.share-sub {
  margin: -0.5rem 0 0;
  font-size: 0.8125rem;
  color: var(--color-text-muted);
}

/* ── Share card (PNG target) ─────────────────────────────────── */

.share-card {
  border: 1px solid #000;
  background: #fff;
  padding: 2rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  width: 100%;
  max-width: 560px;
  font-family: 'Host Grotesk', Arial, sans-serif;
  color: #000;
}

.card-top {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
}

.card-brand {
  font-family: 'DM Mono', monospace;
  font-size: 0.75rem;
  font-weight: 500;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #fc5f2b;
}

.card-label {
  font-family: 'DM Mono', monospace;
  font-size: 0.6875rem;
  color: #999;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.card-maturity {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  border-top: 1px solid #000;
  padding-top: 1.25rem;
}

.maturity-word {
  font-family: 'DM Mono', monospace;
  font-size: 2.5rem;
  font-weight: 500;
  line-height: 1.1;
  color: #000;
  letter-spacing: -0.01em;
}

.maturity-label {
  font-family: 'DM Mono', monospace;
  font-size: 0.6875rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #999;
}

.card-stats {
  display: flex;
  align-items: stretch;
  gap: 1.25rem;
  flex-wrap: wrap;
}

.stat-item {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.stat-value {
  font-family: 'DM Mono', monospace;
  font-size: 1rem;
  font-weight: 500;
  color: #000;
}

.stat-label {
  font-family: 'DM Mono', monospace;
  font-size: 0.625rem;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: #999;
}

.stat-divider {
  width: 1px;
  background: #e0e0e0;
  align-self: stretch;
  flex-shrink: 0;
}

.card-na-note {
  margin: 0;
  font-family: 'DM Mono', monospace;
  font-size: 0.625rem;
  color: #999;
  font-style: italic;
}

.card-categories {
  display: flex;
  flex-wrap: wrap;
  gap: 0.375rem;
}

.cat-chip {
  font-family: 'DM Mono', monospace;
  font-size: 0.625rem;
  font-weight: 500;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  padding: 0.2em 0.5em;
  border: 1px solid;
  line-height: 1.5;
}

.card-strengths {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  border-top: 1px solid #e0e0e0;
  padding-top: 1rem;
}

.strengths-label {
  font-family: 'DM Mono', monospace;
  font-size: 0.625rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #999;
}

.strengths-list {
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.strengths-list li {
  font-size: 0.8125rem;
  color: #333;
  padding-left: 1em;
  position: relative;
}

.strengths-list li::before {
  content: '✓';
  position: absolute;
  left: 0;
  color: #fc5f2b;
  font-size: 0.6875rem;
}

.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  border-top: 1px solid #e0e0e0;
  padding-top: 0.75rem;
  gap: 1rem;
  flex-wrap: wrap;
}

.footer-url {
  font-family: 'DM Mono', monospace;
  font-size: 0.6875rem;
  color: #999;
}

.footer-note {
  font-size: 0.625rem;
  color: #bbb;
  font-style: italic;
}

/* ── Action buttons ──────────────────────────────────────────── */

.share-actions {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.action-btn {
  padding: 0.625rem 1.5rem;
  font-family: var(--font-family-mono);
  font-size: 0.75rem;
  font-weight: 500;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  border: 1px solid var(--color-border);
  background: var(--color-surface-base);
  color: var(--color-text-primary);
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
}

.action-btn:hover:not(:disabled) {
  background: var(--color-text-primary);
  color: #fff;
}

.action-btn--primary {
  background: var(--color-brand);
  border-color: var(--color-brand);
  color: #fff;
}

.action-btn--primary:hover:not(:disabled) {
  background: var(--color-brand-hover);
  border-color: var(--color-brand-hover);
}

.action-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
