<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useContentStore } from '@/stores/content'
import { useScale } from '@/composables/useScale'

const content = useContentStore()
const { scaleBand, isRiskInBand } = useScale()

// ── Filter state ──────────────────────────────────────────────
const showRisks = ref(true)
const showMitigations = ref(true)
const showControls = ref(false)
const search = ref('')
const selectedId = ref<string | null>(null)

// ── Node/edge types ───────────────────────────────────────────
interface GraphNode {
  id: string
  label: string
  type: 'risk' | 'mitigation' | 'control'
  inScale: boolean
  x: number
  y: number
  vx: number
  vy: number
  r: number
}

interface GraphEdge {
  source: string
  target: string
}

// ── Build graph data ──────────────────────────────────────────
const WIDTH = 960
const HEIGHT = 640

function buildGraph() {
  const nodes: GraphNode[] = []
  const edges: GraphEdge[] = []
  const nodeMap = new Map<string, GraphNode>()

  // Seed positions in a circular layout to reduce initial overlap
  const total = content.risks.length + content.mitigations.length + (showControls.value ? content.controls.length : 0)
  let idx = 0
  function spiralPos(i: number, total: number) {
    const angle = (i / total) * 2 * Math.PI * 3
    const r = 100 + (i / total) * 220
    return { x: WIDTH / 2 + r * Math.cos(angle), y: HEIGHT / 2 + r * Math.sin(angle) }
  }

  if (showRisks.value) {
    for (const risk of content.risks) {
      const inScale = scaleBand.value === null || isRiskInBand(risk.displayId)
      const pos = spiralPos(idx++, total)
      const node: GraphNode = { id: risk.id, label: risk.displayId, type: 'risk', inScale, ...pos, vx: 0, vy: 0, r: 9 }
      nodes.push(node)
      nodeMap.set(risk.id, node)
    }
  }

  if (showMitigations.value) {
    for (const mit of content.mitigations) {
      const pos = spiralPos(idx++, total)
      const node: GraphNode = { id: mit.id, label: mit.title.slice(0, 22), type: 'mitigation', inScale: true, ...pos, vx: 0, vy: 0, r: 7 }
      nodes.push(node)
      nodeMap.set(mit.id, node)
    }
    // Risk → Mitigation edges
    if (showRisks.value) {
      for (const risk of content.risks) {
        for (const mitId of risk.mitigationIds) {
          if (nodeMap.has(risk.id) && nodeMap.has(mitId)) {
            edges.push({ source: risk.id, target: mitId })
          }
        }
      }
    }
  }

  if (showControls.value) {
    for (const ctrl of content.controls) {
      const pos = spiralPos(idx++, total)
      const node: GraphNode = { id: ctrl.id, label: ctrl.id.replace('req-', '').slice(0, 20), type: 'control', inScale: true, ...pos, vx: 0, vy: 0, r: 5 }
      nodes.push(node)
      nodeMap.set(ctrl.id, node)
    }
    // Mitigation → Control edges
    if (showMitigations.value) {
      for (const mit of content.mitigations) {
        for (const ctrlId of mit.controlIds) {
          if (nodeMap.has(mit.id) && nodeMap.has(ctrlId)) {
            edges.push({ source: mit.id, target: ctrlId })
          }
        }
      }
    }
  }

  return { nodes, edges, nodeMap }
}

const graphData = ref(buildGraph())

watch([showRisks, showMitigations, showControls], () => {
  selectedId.value = null
  graphData.value = buildGraph()
  resetSim()
})

// ── Force simulation ──────────────────────────────────────────
const REPULSION = 1800
const SPRING_STRENGTH = 0.04
const REST_LENGTH = 60
const DAMPING = 0.82
const CENTER_FORCE = 0.008

let animFrameId: number | null = null
let simRunning = false

function tickOnce() {
  const { nodes, edges } = graphData.value
  if (!nodes.length) return

  // Repulsion between all pairs (Barnes-Hut approximation skipped for simplicity)
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const a = nodes[i], b = nodes[j]
      const dx = b.x - a.x
      const dy = b.y - a.y
      const dist2 = dx * dx + dy * dy + 1
      const dist = Math.sqrt(dist2)
      const force = REPULSION / dist2
      const fx = force * dx / dist
      const fy = force * dy / dist
      a.vx -= fx; a.vy -= fy
      b.vx += fx; b.vy += fy
    }
  }

  // Spring forces on edges
  const nodeMap = graphData.value.nodeMap
  for (const edge of edges) {
    const s = nodeMap.get(edge.source)
    const t = nodeMap.get(edge.target)
    if (!s || !t) continue
    const dx = t.x - s.x
    const dy = t.y - s.y
    const dist = Math.sqrt(dx * dx + dy * dy) || 1
    const stretch = dist - REST_LENGTH
    const fx = SPRING_STRENGTH * stretch * dx / dist
    const fy = SPRING_STRENGTH * stretch * dy / dist
    s.vx += fx; s.vy += fy
    t.vx -= fx; t.vy -= fy
  }

  // Apply damping + centering + boundary clamp
  for (const n of nodes) {
    n.vx = (n.vx + CENTER_FORCE * (WIDTH / 2 - n.x)) * DAMPING
    n.vy = (n.vy + CENTER_FORCE * (HEIGHT / 2 - n.y)) * DAMPING
    n.x = Math.max(n.r + 2, Math.min(WIDTH - n.r - 2, n.x + n.vx))
    n.y = Math.max(n.r + 2, Math.min(HEIGHT - n.r - 2, n.y + n.vy))
  }
}

function runSim() {
  simRunning = true
  let ticks = 0
  function step() {
    tickOnce()
    ticks++
    // Force Vue to update by triggering reactivity via a ref swap every 3 ticks
    if (ticks % 3 === 0) {
      graphData.value = { ...graphData.value }
    }
    if (ticks < 240 && simRunning) {
      animFrameId = requestAnimationFrame(step)
    } else {
      simRunning = false
    }
  }
  animFrameId = requestAnimationFrame(step)
}

function resetSim() {
  simRunning = false
  if (animFrameId !== null) cancelAnimationFrame(animFrameId)
  graphData.value = buildGraph()
  runSim()
}

onMounted(() => runSim())
onUnmounted(() => {
  simRunning = false
  if (animFrameId !== null) cancelAnimationFrame(animFrameId)
})

// ── Interaction ───────────────────────────────────────────────
function selectNode(id: string) {
  selectedId.value = selectedId.value === id ? null : id
}

const highlightedIds = computed<Set<string>>(() => {
  if (!selectedId.value) return new Set()
  const { edges, nodeMap } = graphData.value
  const set = new Set<string>([selectedId.value])
  for (const edge of edges) {
    if (edge.source === selectedId.value) set.add(edge.target)
    if (edge.target === selectedId.value) set.add(edge.source)
  }
  return set
})

const highlightedEdges = computed<Set<string>>(() => {
  if (!selectedId.value) return new Set()
  const set = new Set<string>()
  for (const edge of graphData.value.edges) {
    if (edge.source === selectedId.value || edge.target === selectedId.value) {
      set.add(edge.source + '→' + edge.target)
    }
  }
  return set
})

// ── Search ────────────────────────────────────────────────────
function isNodeVisible(n: GraphNode): boolean {
  if (!search.value.trim()) return true
  return n.label.toLowerCase().includes(search.value.toLowerCase()) ||
    n.id.toLowerCase().includes(search.value.toLowerCase())
}

const NODE_COLORS: Record<GraphNode['type'], string> = {
  risk: 'var(--color-brand)',
  mitigation: '#15a34a',
  control: '#2563eb',
}

function nodeOpacity(n: GraphNode): number {
  if (!n.inScale && scaleBand.value !== null) return 0.25
  if (selectedId.value && !highlightedIds.value.has(n.id)) return 0.15
  if (search.value && !isNodeVisible(n)) return 0.1
  return 1
}

function edgeOpacity(edge: GraphEdge): number {
  if (selectedId.value) {
    return highlightedEdges.value.has(edge.source + '→' + edge.target) ? 0.7 : 0.04
  }
  const sNode = graphData.value.nodeMap.get(edge.source)
  const tNode = graphData.value.nodeMap.get(edge.target)
  if (scaleBand.value !== null && (!sNode?.inScale || !tNode?.inScale)) return 0.1
  return 0.18
}

// ── Selected node info ────────────────────────────────────────
const selectedInfo = computed(() => {
  if (!selectedId.value) return null
  const risk = content.riskById.get(selectedId.value)
  if (risk) return { label: risk.displayId, name: risk.title, type: 'Risk', linkedCount: risk.mitigationIds.length, linkedLabel: 'mitigations' }
  const mit = content.mitigationById.get(selectedId.value)
  if (mit) return { label: mit.title, name: '', type: 'Mitigation', linkedCount: mit.riskIds.length, linkedLabel: 'risks covered' }
  const ctrl = content.controlById.get(selectedId.value)
  if (ctrl) return { label: ctrl.id, name: ctrl.title.slice(0, 80), type: 'Control', linkedCount: ctrl.riskIds.length, linkedLabel: 'risks' }
  return null
})
</script>

<template>
  <div class="graph-view">
    <!-- Toolbar -->
    <div class="graph-toolbar">
      <div class="toolbar-filters">
        <label class="filter-toggle" :class="{ 'filter-toggle--active': showRisks }">
          <input type="checkbox" v-model="showRisks" />
          <span class="filter-dot filter-dot--risk"></span>
          Risks ({{ content.risks.length }})
        </label>
        <label class="filter-toggle" :class="{ 'filter-toggle--active': showMitigations }">
          <input type="checkbox" v-model="showMitigations" />
          <span class="filter-dot filter-dot--mitigation"></span>
          Mitigations ({{ content.mitigations.length }})
        </label>
        <label class="filter-toggle" :class="{ 'filter-toggle--active': showControls }">
          <input type="checkbox" v-model="showControls" />
          <span class="filter-dot filter-dot--control"></span>
          Controls ({{ content.controls.length }})
        </label>
      </div>

      <input
        v-model="search"
        type="search"
        class="graph-search"
        placeholder="Search nodes..."
      />

      <button class="reset-btn" @click="resetSim">↺ Reset layout</button>
    </div>

    <!-- Main graph area -->
    <div class="graph-area">
      <svg
        class="graph-svg"
        :viewBox="`0 0 ${WIDTH} ${HEIGHT}`"
        @click.self="selectedId = null"
      >
        <!-- Edges -->
        <g class="edges">
          <line
            v-for="(edge, i) in graphData.edges"
            :key="i"
            :x1="graphData.nodeMap.get(edge.source)?.x ?? 0"
            :y1="graphData.nodeMap.get(edge.source)?.y ?? 0"
            :x2="graphData.nodeMap.get(edge.target)?.x ?? 0"
            :y2="graphData.nodeMap.get(edge.target)?.y ?? 0"
            class="edge"
            :style="{ opacity: edgeOpacity(edge) }"
          />
        </g>

        <!-- Nodes -->
        <g class="nodes">
          <g
            v-for="node in graphData.nodes"
            :key="node.id"
            :transform="`translate(${node.x},${node.y})`"
            class="node"
            :class="{ 'node--selected': selectedId === node.id }"
            :style="{ opacity: nodeOpacity(node) }"
            @click.stop="selectNode(node.id)"
          >
            <circle
              :r="selectedId === node.id ? node.r + 3 : node.r"
              :fill="NODE_COLORS[node.type]"
              :stroke="selectedId === node.id ? 'var(--color-text-primary)' : 'transparent'"
              stroke-width="2"
            />
            <text
              v-if="node.r >= 7"
              class="node-label"
              dy="0.35em"
              text-anchor="middle"
              :font-size="node.type === 'risk' ? '6px' : '5px'"
            >{{ node.label }}</text>
          </g>
        </g>
      </svg>

      <!-- Legend + info panel -->
      <div class="graph-sidebar">
        <div class="legend">
          <div class="legend-title">Node types</div>
          <div class="legend-row"><span class="legend-dot" style="background: var(--color-brand)"></span> Risk</div>
          <div class="legend-row"><span class="legend-dot" style="background: #15a34a"></span> Mitigation</div>
          <div class="legend-row"><span class="legend-dot" style="background: #2563eb"></span> Control</div>
          <div v-if="scaleBand !== null" class="legend-row legend-row--muted">
            <span class="legend-dot" style="background: var(--color-border)"></span> Out of scale (dimmed)
          </div>
        </div>

        <div v-if="selectedInfo" class="info-panel">
          <div class="info-type">{{ selectedInfo.type }}</div>
          <div class="info-label">{{ selectedInfo.label }}</div>
          <div v-if="selectedInfo.name" class="info-name">{{ selectedInfo.name }}</div>
          <div class="info-linked">
            <strong>{{ selectedInfo.linkedCount }}</strong> {{ selectedInfo.linkedLabel }}
          </div>
        </div>
        <div v-else class="info-hint">
          Click any node to see its connections highlighted.
        </div>

        <div class="graph-instructions">
          <p>Edges connect risks to mitigations. One mitigation often reduces multiple risks — this is the framework's core insight.</p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.graph-view {
  display: flex;
  flex-direction: column;
  height: 100dvh;
  background: var(--color-surface-base);
  overflow: hidden;
}

/* ── Toolbar ─────────────────────────────────────────────────── */
.graph-toolbar {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 1.25rem;
  padding: 0.75rem 1.25rem;
  border-bottom: 1px solid var(--color-border);
  background: var(--color-surface-raised);
  flex-wrap: wrap;
}

.toolbar-filters {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

.filter-toggle {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  font-size: 0.8125rem;
  color: var(--color-text-muted);
  cursor: pointer;
  user-select: none;
  transition: color 0.15s;
}

.filter-toggle input { display: none; }

.filter-toggle--active { color: var(--color-text-primary); }

.filter-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  display: inline-block;
  flex-shrink: 0;
  opacity: 0.4;
  transition: opacity 0.15s;
}

.filter-toggle--active .filter-dot { opacity: 1; }

.filter-dot--risk { background: var(--color-brand); }
.filter-dot--mitigation { background: #15a34a; }
.filter-dot--control { background: #2563eb; }

.graph-search {
  padding: 0.375rem 0.625rem;
  border: 1px solid var(--color-border);
  background: var(--color-surface-overlay);
  color: var(--color-text-primary);
  font-family: inherit;
  font-size: 0.8125rem;
  width: 12rem;
}

.reset-btn {
  margin-left: auto;
  font-size: 0.75rem;
  font-family: inherit;
  color: var(--color-text-secondary);
  background: transparent;
  border: 1px solid var(--color-border);
  padding: 0.3rem 0.625rem;
  cursor: pointer;
  transition: color 0.15s, border-color 0.15s;
}

.reset-btn:hover { color: var(--color-brand); border-color: var(--color-brand); }

/* ── Graph area ──────────────────────────────────────────────── */
.graph-area {
  flex: 1;
  display: flex;
  overflow: hidden;
}

.graph-svg {
  flex: 1;
  cursor: default;
  background: var(--color-surface-base);
}

.edge {
  stroke: var(--color-text-muted);
  stroke-width: 1;
  transition: opacity 0.2s;
}

.node {
  cursor: pointer;
  transition: opacity 0.2s;
}

.node:hover circle {
  filter: brightness(1.2);
}

.node-label {
  fill: #fff;
  pointer-events: none;
  font-family: var(--font-family-mono);
  font-weight: 600;
}

/* ── Sidebar panel ───────────────────────────────────────────── */
.graph-sidebar {
  width: 14rem;
  flex-shrink: 0;
  border-left: 1px solid var(--color-border);
  background: var(--color-surface-raised);
  display: flex;
  flex-direction: column;
  gap: 0;
  overflow-y: auto;
}

.legend {
  padding: 1rem;
  border-bottom: 1px solid var(--color-border-subtle);
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.legend-title {
  font-size: 0.6875rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--color-text-muted);
}

.legend-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.8125rem;
  color: var(--color-text-secondary);
}

.legend-row--muted { color: var(--color-text-muted); }

.legend-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
}

.info-panel {
  padding: 1rem;
  border-bottom: 1px solid var(--color-border-subtle);
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
}

.info-type {
  font-size: 0.6875rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--color-text-muted);
}

.info-label {
  font-family: var(--font-family-mono);
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--color-brand);
  word-break: break-all;
}

.info-name {
  font-size: 0.8125rem;
  color: var(--color-text-secondary);
  line-height: 1.4;
}

.info-linked {
  font-size: 0.8125rem;
  color: var(--color-text-muted);
  margin-top: 0.25rem;
}

.info-linked strong { color: var(--color-text-primary); }

.info-hint {
  padding: 1rem;
  font-size: 0.8125rem;
  color: var(--color-text-muted);
  font-style: italic;
  line-height: 1.5;
  border-bottom: 1px solid var(--color-border-subtle);
}

.graph-instructions {
  padding: 1rem;
  font-size: 0.75rem;
  color: var(--color-text-muted);
  line-height: 1.6;
}

.graph-instructions p { margin: 0; }
</style>
