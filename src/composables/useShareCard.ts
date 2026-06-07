import { computed, type Ref } from 'vue'
import { useCoverage } from './useCoverage'
import { useContentStore } from '@/stores/content'
import { useAssessmentStore } from '@/stores/assessment'
import type { CategoryId } from '@/types/valos'

const ORG_TYPE_LABELS: Record<string, string> = {
  'curious': 'Exploring',
  'solo': 'Solo operator',
  'small-team': 'Small team',
  'organization': 'Organization',
  'enterprise': 'Enterprise',
}

export function useShareCard(cardRef: Ref<HTMLElement | null>) {
  const { maturity, riskCoveragePct, mitigationCoveragePct, strengths, naCount } = useCoverage()
  const content = useContentStore()
  const assessment = useAssessmentStore()

  const orgTypeLabel = computed(() =>
    assessment.profile.orgType ? ORG_TYPE_LABELS[assessment.profile.orgType] ?? null : null
  )

  const categoriesExplored = computed(() => {
    const seen = new Set<CategoryId>()
    for (const [riskId, level] of Object.entries(assessment.answers)) {
      if (level !== 'none') {
        const risk = content.riskById.get(riskId)
        if (risk) seen.add(risk.categoryId)
      }
    }
    return content.categories.filter((c) => seen.has(c.id as CategoryId))
  })

  const topStrengths = computed(() => strengths.value.slice(0, 3))

  async function downloadPng() {
    if (!cardRef.value) return
    const { toPng } = await import('html-to-image')
    const dataUrl = await toPng(cardRef.value, {
      pixelRatio: 2,
      backgroundColor: '#ffffff',
    })
    const link = document.createElement('a')
    link.download = 'valos-risk-posture.png'
    link.href = dataUrl
    link.click()
  }

  function shareOnX() {
    const parts: string[] = ['I assessed my Ethereum validator risk posture with ValOS Explorer.']
    parts.push(`Operational posture: ${maturity.value}.`)
    const appUrl = 'https://lidofinance.github.io/valos-explorer/'
    const intent =
      'https://twitter.com/intent/tweet' +
      `?text=${encodeURIComponent(parts.join(' '))}` +
      `&url=${encodeURIComponent(appUrl)}`
    window.open(intent, '_blank', 'noopener,noreferrer')
  }

  return {
    orgTypeLabel,
    categoriesExplored,
    topStrengths,
    maturity,
    riskCoveragePct,
    mitigationCoveragePct,
    naCount,
    downloadPng,
    shareOnX,
  }
}
