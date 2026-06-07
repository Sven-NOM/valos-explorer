<script setup lang="ts">
import ReadinessSummary from '@/components/results/ReadinessSummary.vue'
import ScaleProgression from '@/components/results/ScaleProgression.vue'
import ShareCard from '@/components/results/ShareCard.vue'
import { CERT_URL } from '@/config'
</script>

<template>
  <div class="results-page">
    <header class="page-header">
      <h1 class="page-title">Your Risk Posture</h1>
      <p class="page-subtitle">
        Based on your self-assessment. This is an educational tool — not a certification or audit.
      </p>
    </header>

    <ReadinessSummary />

    <ScaleProgression />

    <div class="cta-block">
      <a
        :href="CERT_URL"
        target="_blank"
        rel="noopener noreferrer"
        class="cert-button"
      >
        Learn About Certification
      </a>
    </div>

    <ShareCard />
  </div>
</template>

<style scoped>
.results-page {
  max-width: 640px;
  margin: 0 auto;
  padding: 2.5rem 1.5rem 4rem;
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.page-header {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.page-title {
  margin: 0;
  font-family: var(--font-family-sans);
  font-size: 1.75rem;
  font-weight: 700;
  color: var(--color-text-primary);
  line-height: 1.2;
}

.page-subtitle {
  margin: 0;
  font-family: var(--font-family-sans);
  font-size: 0.8125rem;
  color: var(--color-text-muted);
  line-height: 1.6;
}

.cta-block {
  display: flex;
  flex-direction: column;
}

.cert-button {
  display: block;
  width: 100%;
  padding: 0.875rem 1.5rem;
  font-family: var(--font-family-mono);
  font-size: 0.75rem;
  font-weight: 500;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  text-align: center;
  text-decoration: none;
  color: var(--color-text-primary);
  background: var(--color-surface-base);
  border: 1px solid var(--color-border);
  cursor: pointer;
  transition: background 0.15s ease, color 0.15s ease;
}

.cert-button:hover {
  background: var(--color-brand);
  color: #fff;
  text-decoration: none;
}
</style>
