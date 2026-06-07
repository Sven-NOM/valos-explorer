import { computed } from 'vue'
import type { Control } from '@/types/valos'
import { useContentStore } from '@/stores/content'
import { useAssessmentStore } from '@/stores/assessment'
import { useScale } from '@/composables/useScale'
import { SCOPE_ORDER, scopeFor, type ScopeMeta } from '@/data/implementationScope'

export type Coverage = 'addressed' | 'outstanding' | 'general'

export interface ControlEntry {
  control: Control
  modal: 'MUST' | 'SHOULD' | null
  /** False when every linked risk is above the operator's scale band. */
  inScale: boolean
  /** Operator has ticked this control off in the progress tracker. */
  implemented: boolean
  /**
   * Soft signal derived from the operator's risk answers:
   *  - 'addressed'   — every non-N/A linked risk answered Advanced or Tested
   *  - 'outstanding' — at least one linked risk not yet at Advanced
   *  - 'general'     — no linked risks (a general/process control), no badge
   */
  coverage: Coverage
}

export interface ScopeGroup {
  groupId: string
  controls: ControlEntry[]
}

export interface ScopeCounts {
  must: number
  should: number
  total: number
  implemented: number
  implementedMust: number
  implementedShould: number
  outstanding: number
  addressed: number
  inScale: number
}

export interface ScopeSection extends ScopeMeta {
  groups: ScopeGroup[]
  counts: ScopeCounts
}

function extractModal(title: string): 'MUST' | 'SHOULD' | null {
  if (/\bMUST\b/.test(title)) return 'MUST'
  if (/\bSHOULD\b/.test(title)) return 'SHOULD'
  return null
}

export function useImplementation() {
  const content = useContentStore()
  const assessment = useAssessmentStore()
  const { isRiskInBand } = useScale()

  // Order index for the known scopes; any unknown/empty domain sorts last.
  const scopeIndex = new Map(SCOPE_ORDER.map((s, i) => [s.domainId, i]))

  const scopes = computed<ScopeSection[]>(() => {
    const naRisks = assessment.naRisks
    const implementedSet = assessment.implemented

    // 1) Bucket controls by their spec control-domain.
    const byDomain = new Map<string, Control[]>()
    for (const c of content.controls) {
      const key = c.domainId || ''
      if (!byDomain.has(key)) byDomain.set(key, [])
      byDomain.get(key)!.push(c)
    }

    // 2) Build a section per domain, grouped within by spec groupId.
    const sections: ScopeSection[] = []
    for (const [domainId, ctrls] of byDomain) {
      const meta = scopeFor(domainId)
      const groupMap = new Map<string, ControlEntry[]>()
      const counts: ScopeCounts = {
        must: 0,
        should: 0,
        total: 0,
        implemented: 0,
        implementedMust: 0,
        implementedShould: 0,
        outstanding: 0,
        addressed: 0,
        inScale: 0,
      }

      for (const control of ctrls) {
        const modal = extractModal(control.title)

        // In-scale iff no linked risks, or at least one linked risk is in band.
        const inScale =
          control.riskIds.length === 0
            ? true
            : control.riskIds.some((rid) => {
                const r = content.riskById.get(rid)
                return r ? isRiskInBand(r.displayId) : true
              })

        // Coverage signal from the operator's answers.
        const relevant = control.riskIds.filter((rid) => !naRisks.has(rid))
        let coverage: Coverage
        if (relevant.length === 0) {
          coverage = 'general'
        } else {
          const allCovered = relevant.every((rid) => {
            const a = assessment.answers[rid]
            return a === 'advanced' || a === 'tested'
          })
          coverage = allCovered ? 'addressed' : 'outstanding'
        }

        const implemented = implementedSet.has(control.id)
        const entry: ControlEntry = { control, modal, inScale, implemented, coverage }

        if (!groupMap.has(control.groupId)) groupMap.set(control.groupId, [])
        groupMap.get(control.groupId)!.push(entry)

        counts.total++
        if (modal === 'MUST') {
          counts.must++
          if (implemented) counts.implementedMust++
        } else if (modal === 'SHOULD') {
          counts.should++
          if (implemented) counts.implementedShould++
        }
        if (implemented) counts.implemented++
        if (coverage === 'outstanding') counts.outstanding++
        if (coverage === 'addressed') counts.addressed++
        if (inScale) counts.inScale++
      }

      const groups: ScopeGroup[] = [...groupMap.entries()].map(([groupId, controls]) => ({
        groupId,
        controls,
      }))

      sections.push({ ...meta, domainId, groups, counts })
    }

    // 3) Order by the editorial SCOPE_ORDER; unknown domains last.
    sections.sort((a, b) => {
      const ia = scopeIndex.get(a.domainId) ?? Number.MAX_SAFE_INTEGER
      const ib = scopeIndex.get(b.domainId) ?? Number.MAX_SAFE_INTEGER
      return ia - ib
    })

    return sections
  })

  const totalControls = computed(() => content.controls.length)
  const totalImplemented = computed(() =>
    scopes.value.reduce((n, s) => n + s.counts.implemented, 0)
  )

  return { scopes, totalControls, totalImplemented }
}
