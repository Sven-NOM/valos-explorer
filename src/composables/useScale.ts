import { computed } from 'vue'
import type { ScaleBand } from '@/types/valos'
import { useAssessmentStore } from '@/stores/assessment'
import { useContentStore } from '@/stores/content'
import { minBandForRisk, minBandForMitigation } from '@/data/scaleOverlay'

const SCALE_LABELS: Record<ScaleBand, string> = {
  0: 'Solo operator',
  1: 'Small-team operator',
  2: 'Organisation',
  3: 'Institutional operator',
}

export function useScale() {
  const assessment = useAssessmentStore()
  const content = useContentStore()

  // Derive a 0–3 ordinal band from the operator profile.
  // Primary signal: teamSize. Fallback: orgType. Nudge: over-1000 validators.
  // Empty profile → null (entire feature is a no-op).
  const scaleBand = computed<ScaleBand | null>(() => {
    const { teamSize, orgType, validatorCount } = assessment.profile

    let band: ScaleBand | null = null

    if (teamSize) {
      const map: Record<string, ScaleBand> = {
        'solo': 0,
        '2-5': 1,
        '6-20': 2,
        'over-20': 3,
      }
      band = map[teamSize] ?? null
    } else if (orgType) {
      const map: Record<string, ScaleBand> = {
        'solo': 0,
        'small-team': 1,
        'organization': 2,
        'enterprise': 3,
      }
      band = map[orgType] ?? null
    }

    if (band === null) return null

    // Nudge: large fleet implies process maturity even in a nominally small team
    if (validatorCount === 'over-1000' && band < 2) band = 2

    return band
  })

  const scaleLabel = computed(() =>
    scaleBand.value !== null ? SCALE_LABELS[scaleBand.value] : null
  )

  // Is a given risk applicable at the current scale band?
  function isRiskInBand(displayId: string): boolean {
    const band = scaleBand.value
    if (band === null) return true // no profile → everything applies
    const minBand = minBandForRisk[displayId] ?? 0
    return band >= minBand
  }

  // Risk IDs (not displayIds) that are out of scale band and not yet confirmed N/A.
  const suggestedNaRiskIds = computed<string[]>(() => {
    const band = scaleBand.value
    if (band === null) return []
    const naRisks = assessment.naRisks
    return content.risks
      .filter((r) => {
        const minBand = minBandForRisk[r.displayId] ?? 0
        return minBand > band && !naRisks.has(r.id)
      })
      .map((r) => r.id)
  })

  // Mitigations that belong to the NEXT rung up — shown in the §7 progression panel.
  const nextRungMitigations = computed(() => {
    const band = scaleBand.value
    if (band === null || band >= 3) return []
    const nextBand: ScaleBand = (band + 1) as ScaleBand
    return content.mitigations.filter(
      (m) => (minBandForMitigation[m.id] ?? 0) === nextBand
    )
  })

  return {
    scaleBand,
    scaleLabel,
    isRiskInBand,
    suggestedNaRiskIds,
    nextRungMitigations,
  }
}
