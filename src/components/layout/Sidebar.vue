<script setup lang="ts">
import { useRoute } from 'vue-router'
import { useTheme } from '@/composables/useTheme'

const route = useRoute()
const { theme, toggle } = useTheme()

const primaryNav = [
  { name: 'Welcome', to: '/welcome', icon: '⬡' },
  { name: 'Profile', to: '/profile', icon: '◈' },
  { name: 'Risks', to: '/discovery', icon: '⬡' },
  { name: 'Graph', to: '/graph', icon: '◎' },
  { name: 'Risk Explorer', to: '/blind-spots', icon: '◉' },
  { name: 'Results', to: '/results', icon: '◇' },
]

const advancedNav = [
  { name: 'Compliance', to: '/compliance', icon: '⊞' },
  { name: 'Implementation', to: '/implementation', icon: '⚙' },
]

function isActive(to: string) {
  return route.path === to || route.path.startsWith(to + '/')
}
</script>

<template>
  <nav class="sidebar">
    <div class="sidebar-brand">
      <img src="/valos-logo.svg" alt="Valos logo" class="brand-mark" />
      <span class="brand-name">ValOS<br><span class="brand-sub">Explorer</span></span>
    </div>

    <ul class="nav-list">
      <li v-for="item in primaryNav" :key="item.to">
        <router-link
          :to="item.to"
          class="nav-item"
          :class="{ active: isActive(item.to) }"
        >
          <span class="nav-icon">{{ item.icon }}</span>
          <span class="nav-label">{{ item.name }}</span>
        </router-link>
      </li>
    </ul>

    <div class="nav-divider">
      <span class="nav-divider-label">Advanced</span>
    </div>

    <ul class="nav-list">
      <li v-for="item in advancedNav" :key="item.to">
        <router-link
          :to="item.to"
          class="nav-item"
          :class="{ active: isActive(item.to) }"
        >
          <span class="nav-icon">{{ item.icon }}</span>
          <span class="nav-label">{{ item.name }}</span>
        </router-link>
      </li>
    </ul>

    <div class="sidebar-footer">
      <button
        class="theme-toggle"
        type="button"
        :aria-label="theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'"
        @click="toggle"
      >
        <!-- Sun icon (shown in dark mode to switch to light) -->
        <svg
          v-if="theme === 'dark'"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          width="16"
          height="16"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
        </svg>
        <!-- Moon icon (shown in light mode to switch to dark) -->
        <svg
          v-else
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          width="16"
          height="16"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </svg>
        <span class="theme-label">{{ theme === 'dark' ? 'Light mode' : 'Dark mode' }}</span>
      </button>
    </div>
  </nav>
</template>

<style scoped>
.sidebar {
  width: 14rem;
  min-height: 100dvh;
  background-color: var(--color-surface-raised);
  border-right: 1px solid var(--color-border);
  display: flex;
  flex-direction: column;
  padding: 1.5rem 0;
  position: sticky;
  top: 0;
  height: 100dvh;
  flex-shrink: 0;
}

.sidebar-brand {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0 1.25rem 1.5rem;
  border-bottom: 1px solid var(--color-border);
  margin-bottom: 1rem;
}

.brand-mark {
  width: 1.5rem;
  height: 1.5rem;
  object-fit: contain;
  flex-shrink: 0;
}

.brand-name {
  font-size: 0.875rem;
  font-weight: 700;
  color: var(--color-text-primary);
  line-height: 1.2;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

.brand-sub {
  font-weight: 400;
  color: var(--color-text-secondary);
  font-size: 0.75rem;
}

.nav-list {
  list-style: none;
  margin: 0;
  padding: 0 0.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  padding: 0.625rem 0.75rem;
  border-radius: var(--radius-sm);
  color: var(--color-text-secondary);
  text-decoration: none;
  font-size: 0.875rem;
  transition: background 0.15s, color 0.15s;
}

.nav-item:hover {
  background-color: var(--color-surface-overlay);
  color: var(--color-text-primary);
  text-decoration: none;
}

.nav-item.active {
  background-color: var(--color-brand-subtle);
  color: var(--color-brand);
}

.nav-icon {
  font-size: 1rem;
  width: 1.25rem;
  text-align: center;
  flex-shrink: 0;
}

.nav-label {
  font-weight: 500;
}

.nav-divider {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.625rem 1.25rem 0.375rem;
  margin-top: 0.25rem;
}

.nav-divider::before {
  content: '';
  flex: 1;
  height: 1px;
  background: var(--color-border-subtle);
}

.nav-divider-label {
  font-size: 0.625rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--color-text-muted);
  white-space: nowrap;
}

.nav-divider::after {
  content: '';
  flex: 1;
  height: 1px;
  background: var(--color-border-subtle);
}

.sidebar-footer {
  margin-top: auto;
  padding: 0.75rem 0.5rem 0;
  border-top: 1px solid var(--color-border-subtle);
}

.theme-toggle {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  width: 100%;
  padding: 0.625rem 0.75rem;
  background: none;
  border: none;
  cursor: pointer;
  font-family: inherit;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--color-text-muted);
  border-radius: var(--radius-sm);
  transition: background 0.15s, color 0.15s;
  text-align: left;
}

.theme-toggle:hover {
  background: var(--color-surface-overlay);
  color: var(--color-text-primary);
}

.theme-label {
  line-height: 1;
}
</style>
