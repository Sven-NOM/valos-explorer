import { ref, watchEffect } from 'vue'

type Theme = 'light' | 'dark'

const STORAGE_KEY = 'valos-explorer:theme'

function getInitialTheme(): Theme {
  const stored = localStorage.getItem(STORAGE_KEY) as Theme | null
  return stored ?? 'dark'
}

// Module-level singleton so the ref is shared across all useTheme() calls
const theme = ref<Theme>(getInitialTheme())

function applyTheme(t: Theme) {
  document.documentElement.dataset.theme = t
}

// Apply immediately on module load
applyTheme(theme.value)

watchEffect(() => {
  applyTheme(theme.value)
  localStorage.setItem(STORAGE_KEY, theme.value)
})

export function useTheme() {
  function toggle() {
    theme.value = theme.value === 'dark' ? 'light' : 'dark'
  }

  return { theme, toggle }
}
