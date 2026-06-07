<template>
  <div class="welcome-root">
    <div class="hero-container">
      <div class="hero-inner">

        <div class="eyebrow">
          <span class="eyebrow-dot"></span>
          Ethereum Node Operator Toolkit
        </div>

        <h1 class="headline">
          Discover your operational<br />risk posture
        </h1>

        <p class="subheadline">
          A structured self-assessment for node operators running validators on the Ethereum network.
          Work through your setup once — roughly 5–10 minutes — and surface the risks, mitigations,
          and blind spots that matter for your infrastructure.
        </p>

        <div class="cta-row">
          <RouterLink to="/profile" class="btn-primary">Start Assessment</RouterLink>
          <RouterLink to="/discovery" class="btn-secondary">Explore Risks</RouterLink>
        </div>

        <div class="stats-bar">
          <div class="stat">
            <span class="stat-value">74</span>
            <span class="stat-label">risks</span>
          </div>
          <div class="stat-divider"></div>
          <div class="stat">
            <span class="stat-value">43</span>
            <span class="stat-label">mitigations</span>
          </div>
          <div class="stat-divider"></div>
          <div class="stat">
            <span class="stat-value">64</span>
            <span class="stat-label">controls</span>
          </div>
        </div>

      </div>
    </div>

    <div class="features-container">
      <div class="features-inner">
        <div class="feature-card">
          <div class="feature-icon" style="background-color: var(--color-brand-subtle); color: var(--color-brand);">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <path d="M12 8v4l3 3"/>
            </svg>
          </div>
          <h3 class="feature-title">Self-assess risk posture</h3>
          <p class="feature-body">
            Answer questions about your infrastructure, key management, and operational practices.
            The tool maps your answers to a curated risk taxonomy.
          </p>
        </div>

        <div class="feature-card">
          <div class="feature-icon" style="background-color: rgba(16, 185, 129, 0.12); color: var(--color-risk-gir);">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
          </div>
          <h3 class="feature-title">Discover mitigations</h3>
          <p class="feature-body">
            Each identified risk links to concrete mitigations and controls relevant to your
            setup — no generic checklists, only what applies to you.
          </p>
        </div>

        <div class="feature-card">
          <div class="feature-icon" style="background-color: rgba(139, 92, 246, 0.12); color: var(--color-risk-dow);">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="11" cy="11" r="8"/>
              <path d="m21 21-4.35-4.35"/>
            </svg>
          </div>
          <h3 class="feature-title">See your blind spots</h3>
          <p class="feature-body">
            Identify risk categories you may not have considered. The blind spots view highlights
            gaps between your current posture and common exposure areas.
          </p>
        </div>
      </div>
    </div>

    <div class="category-strip">
      <span class="category-chip" style="color: var(--color-risk-fin); border-color: var(--color-risk-fin);">Financial</span>
      <span class="category-chip" style="color: var(--color-risk-sls); border-color: var(--color-risk-sls);">Slashing</span>
      <span class="category-chip" style="color: var(--color-risk-dow); border-color: var(--color-risk-dow);">Downtime</span>
      <span class="category-chip" style="color: var(--color-risk-kec); border-color: var(--color-risk-kec);">Key &amp; Client</span>
      <span class="category-chip" style="color: var(--color-risk-hck); border-color: var(--color-risk-hck);">Security</span>
      <span class="category-chip" style="color: var(--color-risk-gir); border-color: var(--color-risk-gir);">Governance</span>
      <span class="category-chip" style="color: var(--color-risk-sps); border-color: var(--color-risk-sps);">Staking Pool</span>
      <span class="category-chip" style="color: var(--color-risk-rer); border-color: var(--color-risk-rer);">Regulatory</span>
    </div>

    <footer class="welcome-footer">
      <p>Educational use only. Not a certification tool. Not financial advice.</p>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { RouterLink } from 'vue-router'
</script>

<style scoped>
.welcome-root {
  min-height: 100dvh;
  display: flex;
  flex-direction: column;
  background-color: var(--color-surface-base);
  color: var(--color-text-primary);
}

/* ── Hero ─────────────────────────────────────────────────────── */

.hero-container {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 5rem 1.5rem 3rem;
}

.hero-inner {
  max-width: 720px;
  width: 100%;
  text-align: center;
}

.eyebrow {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--color-text-muted);
  margin-bottom: 1.75rem;
}

.eyebrow-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background-color: var(--color-brand);
  flex-shrink: 0;
}

.headline {
  font-size: clamp(2rem, 5vw, 3.25rem);
  font-weight: 700;
  line-height: 1.15;
  letter-spacing: -0.02em;
  color: var(--color-text-primary);
  margin: 0 0 1.25rem;
}

.subheadline {
  font-size: 1.0625rem;
  line-height: 1.7;
  color: var(--color-text-secondary);
  max-width: 600px;
  margin: 0 auto 2.5rem;
}

/* ── CTAs ─────────────────────────────────────────────────────── */

.cta-row {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.875rem;
  flex-wrap: wrap;
  margin-bottom: 2.5rem;
}

.btn-primary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.6875rem 1.75rem;
  border-radius: var(--radius-md);
  background-color: var(--color-brand);
  color: #fff;
  font-size: 0.9375rem;
  font-weight: 600;
  text-decoration: none;
  transition: background-color 0.15s ease, box-shadow 0.15s ease;
  box-shadow: 0 0 0 0 transparent;
}

.btn-primary:hover {
  background-color: var(--color-brand-hover);
  color: #fff;
  text-decoration: none;
  box-shadow: 0 4px 16px rgba(91, 138, 255, 0.3);
}

.btn-secondary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.6875rem 1.75rem;
  border-radius: var(--radius-md);
  background-color: transparent;
  border: 1px solid var(--color-border);
  color: var(--color-text-secondary);
  font-size: 0.9375rem;
  font-weight: 600;
  text-decoration: none;
  transition: border-color 0.15s ease, color 0.15s ease, background-color 0.15s ease;
}

.btn-secondary:hover {
  border-color: var(--color-brand);
  color: var(--color-brand);
  background-color: var(--color-brand-subtle);
  text-decoration: none;
}

/* ── Stats bar ────────────────────────────────────────────────── */

.stats-bar {
  display: inline-flex;
  align-items: center;
  gap: 1.5rem;
  padding: 0.75rem 1.75rem;
  border-radius: var(--radius-lg);
  border: 1px solid var(--color-border);
  background-color: var(--color-surface-raised);
}

.stat {
  display: flex;
  align-items: baseline;
  gap: 0.35rem;
}

.stat-value {
  font-size: 1.0625rem;
  font-weight: 700;
  color: var(--color-text-primary);
  font-variant-numeric: tabular-nums;
}

.stat-label {
  font-size: 0.8125rem;
  color: var(--color-text-muted);
}

.stat-divider {
  width: 1px;
  height: 1.125rem;
  background-color: var(--color-border);
  flex-shrink: 0;
}

/* ── Features ─────────────────────────────────────────────────── */

.features-container {
  padding: 0 1.5rem 3rem;
}

.features-inner {
  max-width: 960px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 1rem;
}

.feature-card {
  padding: 1.5rem;
  border-radius: var(--radius-lg);
  border: 1px solid var(--color-border);
  background-color: var(--color-surface-raised);
  box-shadow: var(--shadow-card);
}

.feature-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: var(--radius-md);
  margin-bottom: 1rem;
}

.feature-title {
  font-size: 0.9375rem;
  font-weight: 600;
  color: var(--color-text-primary);
  margin: 0 0 0.5rem;
}

.feature-body {
  font-size: 0.875rem;
  line-height: 1.65;
  color: var(--color-text-secondary);
  margin: 0;
}

/* ── Category strip ───────────────────────────────────────────── */

.category-strip {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
  gap: 0.5rem;
  padding: 0 1.5rem 3rem;
}

.category-chip {
  display: inline-flex;
  align-items: center;
  padding: 0.3125rem 0.75rem;
  border-radius: var(--radius-sm);
  border: 1px solid;
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.03em;
  background-color: transparent;
  opacity: 0.75;
  transition: opacity 0.15s ease;
}

.category-chip:hover {
  opacity: 1;
}

/* ── Footer ───────────────────────────────────────────────────── */

.welcome-footer {
  border-top: 1px solid var(--color-border);
  padding: 1.25rem 1.5rem;
  text-align: center;
}

.welcome-footer p {
  font-size: 0.75rem;
  color: var(--color-text-muted);
  margin: 0;
}

/* ── Responsive ───────────────────────────────────────────────── */

@media (max-width: 480px) {
  .hero-container {
    padding-top: 3.5rem;
  }

  .stats-bar {
    gap: 1rem;
    padding: 0.625rem 1.25rem;
  }

  .features-inner {
    grid-template-columns: 1fr;
  }
}
</style>
