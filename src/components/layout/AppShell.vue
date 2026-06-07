<script setup lang="ts">
import Sidebar from './Sidebar.vue'
import ProgressIndicator from './ProgressIndicator.vue'
</script>

<template>
  <div class="app-shell">
    <aside class="shell-sidebar">
      <Sidebar />
      <ProgressIndicator />
    </aside>
    <main class="shell-content">
      <slot />
    </main>
  </div>
</template>

<style scoped>
.app-shell {
  display: flex;
  min-height: 100dvh;
}

.shell-sidebar {
  display: flex;
  flex-direction: column;
  width: 14rem;
  flex-shrink: 0;
  position: sticky;
  top: 0;
  height: 100dvh;
  overflow: hidden;
}

.shell-content {
  flex: 1;
  min-width: 0;
  overflow-y: auto;
}
</style>
