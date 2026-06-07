import { computed } from 'vue'
import type { MaturityLevel } from '@/types/valos'
import { useContentStore } from '@/stores/content'
import { useAssessmentStore } from '@/stores/assessment'

const CONFIDENCE: Record<string, number> = {
  none: 0,
  basic: 0.33,
  advanced: 0.66,
  tested: 1,
}

export function useCoverage() {
  const content = useContentStore()
  const assessment = useAssessmentStore()

  const confidenceByRisk = computed(() => {
    const map: Record<string, number> = {}
    for (const risk of content.risks) {
      const level = assessment.answers[risk.id] ?? 'none'
      map[risk.id] = CONFIDENCE[level] ?? 0
    }
    return map
  })

  // Count of operator-confirmed N/A risks
  const naCount = computed(() => assessment.naRisks.size)

  // Breadth denominator excludes confirmed-N/A risks (they count as covered)
  const effectiveTotal = computed(() => content.risks.length - naCount.value)

  const riskCoveragePct = computed(() => {
    const total = effectiveTotal.value
    if (!total) return 100
    const answered = content.risks.filter((r) => {
      if (assessment.naRisks.has(r.id)) return true // N/A counts as covered
      const level = assessment.answers[r.id] ?? 'none'
      return level !== 'none'
    }).length
    return Math.round((answered / content.risks.length) * 100)
  })

  // A mitigation is "covered" when at least one risk it addresses is answered 'advanced' or 'tested'
  const mitigationCoveragePct = computed(() => {
    const mits = content.mitigations
    if (!mits.length) return 0
    const covered = mits.filter((m) =>
      m.riskIds.some((rId) => {
        const level = assessment.answers[rId] ?? 'none'
        return level === 'advanced' || level === 'tested'
      })
    ).length
    return Math.round((covered / mits.length) * 100)
  })

  // Top 5 mitigations where the operator has answered all linked risks at 'advanced' or 'tested'
  const strengths = computed(() => {
    return content.mitigations
      .filter((m) => {
        if (!m.riskIds.length) return false
        return m.riskIds.every((rId) => {
          if (assessment.naRisks.has(rId)) return true // N/A counts as covered
          const level = assessment.answers[rId] ?? 'none'
          return level === 'advanced' || level === 'tested'
        })
      })
      .slice(0, 5)
  })

  // Top 5 high-leverage mitigations with unanswered (non-N/A) risks
  const opportunities = computed(() => {
    return content.mitigations
      .map((m) => {
        const unanswered = m.riskIds.filter(
          (rId) =>
            !assessment.naRisks.has(rId) &&
            (assessment.answers[rId] ?? 'none') === 'none'
        ).length
        return { mitigation: m, unanswered }
      })
      .filter(({ unanswered }) => unanswered > 0)
      .sort((a, b) => b.unanswered - a.unanswered)
      .slice(0, 5)
      .map(({ mitigation }) => mitigation)
  })

  const maturity = computed((): MaturityLevel => {
    const pct = riskCoveragePct.value
    if (pct >= 80) return 'Advanced'
    if (pct >= 50) return 'Mature'
    if (pct >= 20) return 'Developing'
    return 'Early'
  })

  return {
    confidenceByRisk,
    naCount,
    effectiveTotal,
    riskCoveragePct,
    mitigationCoveragePct,
    strengths,
    opportunities,
    maturity,
  }
}
