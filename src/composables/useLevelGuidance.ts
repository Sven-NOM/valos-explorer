import { useContentStore } from '@/stores/content'
import { levelGuidanceOverride, TEST_CONTROL_IDS, PROVENANCE } from '@/data/levelGuidance'
import type { AnswerLevel } from '@/types/valos'

export interface LevelEntry {
  value: AnswerLevel
  label: string
  summary: string  // short caption shown in collapsed state / button sub-label
  detail: string   // full sentence shown in the expanded explainer
}

export interface LevelGuidance {
  levels: LevelEntry[]
  provenance: string
  isOverride: boolean   // true if any level uses bespoke text
  isDerived: boolean    // true if any level uses derived (control-based) text
}

function stripPrefix(title: string): string {
  return title.replace(/^Node Operators (MUST|SHOULD)\s+/i, '').trim()
}

export function useLevelGuidance() {
  const content = useContentStore()

  function guidanceFor(riskId: string): LevelGuidance {
    const risk = content.riskById.get(riskId)
    const displayId = risk?.displayId ?? ''
    const override = levelGuidanceOverride[displayId] ?? {}

    // Fetch the risk's linked controls
    const allControls = content.controlsForRisk(riskId)
    const mustControls = allControls.filter((c) => /\bMUST\b/.test(c.title))
    const testControls = allControls.filter((c) => TEST_CONTROL_IDS.has(c.id))
    const hasControls = allControls.length > 0

    // Build the requirement names for Advanced (up to 3 MUST controls)
    const sampleMustNames = mustControls
      .slice(0, 3)
      .map((c) => stripPrefix(c.title).toLowerCase())

    const advancedRequirements =
      sampleMustNames.length > 0
        ? `For this risk, that includes: ${sampleMustNames.join('; ')}.`
        : ''

    // Build the Tested signal: name test-controls if present, else generic fallback
    const testControlNames = testControls.map((c) => stripPrefix(c.title).toLowerCase())
    const testedVerification =
      testControlNames.length > 0
        ? `That includes verification such as: ${testControlNames.join('; ')}.`
        : 'That means you have verified them through testing, drills, or an external audit.'

    // Derived defaults (used when no override is provided)
    const derived: Record<AnswerLevel, string> = {
      none: hasControls
        ? 'You have not yet addressed this risk. The requirements listed below are not in place.'
        : 'You have not yet addressed this risk.',
      basic: hasControls
        ? 'You have an informal or partial version of the requirements below — you are aware of this risk but have not fully implemented or documented the controls.'
        : 'You are aware of this risk but have not yet put formal practices in place.',
      advanced: hasControls
        ? `The requirements below are fully in place and documented. ${advancedRequirements}`
        : 'The relevant practices are fully in place and documented.',
      tested: hasControls
        ? `Everything in the Advanced level is done, and you have verified it holds under realistic conditions. ${testedVerification}`
        : `Everything in the Advanced level is done, and you have verified it — through testing, drills, or audit.`,
    }

    // Merge: override takes precedence; fall back to derived
    const isOverride = Object.keys(override).length > 0
    const isDerived = !isOverride || Object.keys(override).length < 4

    const levels: LevelEntry[] = [
      {
        value: 'none',
        label: 'None',
        summary: 'Not addressed',
        detail: override.none ?? derived.none,
      },
      {
        value: 'basic',
        label: 'Basic',
        summary: 'Informal / partial',
        detail: override.basic ?? derived.basic,
      },
      {
        value: 'advanced',
        label: 'Advanced',
        summary: 'Implemented & documented',
        detail: override.advanced ?? derived.advanced,
      },
      {
        value: 'tested',
        label: 'Tested',
        summary: 'Verified — tested or audited',
        detail: override.tested ?? derived.tested,
      },
    ]

    return { levels, provenance: PROVENANCE, isOverride, isDerived }
  }

  return { guidanceFor }
}
