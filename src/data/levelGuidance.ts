/**
 * LEVEL GUIDANCE OVERLAY — Editorial layer by ValOS Explorer.
 *
 * This file is NOT part of the ValOS specification. It is a hand-curated
 * editorial layer that provides per-risk, per-level meaning for the
 * None / Basic / Advanced / Tested self-assessment scale.
 *
 * The overlay is intentionally sparse: only a handful of marquee risks have
 * bespoke text. All other risks use the derived defaults computed in
 * useLevelGuidance.ts from the risk's linked controls.
 *
 * To add a new override: add the risk's displayId as a key and provide text
 * for one or more of the four levels. Any omitted level falls back to derived.
 */

import type { AnswerLevel } from '@/types/valos'

export const OVERLAY_VERSION = 1

export const PROVENANCE =
  'Level guidance is an editorial interpretation by ValOS Explorer, not part of the ValOS spec.'

/**
 * Control IDs whose requirement is explicitly to *test, verify, or audit*.
 * When a risk links one of these, the "Tested" level can reference it by name.
 */
export const TEST_CONTROL_IDS = new Set([
  'req-dont-edit-prod',              // "MUST be tested and reviewed before deployment"
  'req-verify-inputs',               // "MUST verify that input is safe"
  'req-test-coverage',               // "MUST have thorough test coverage"
  'req-reaudit-everything-impacted', // "MUST include an audit of all code and user interactions"
  'req-deploy-via-testnet',          // "MUST be tested on a staging environment"
  'req-verify-3rdparty-compliance',  // "MUST verify that third parties are in compliance"
])

/**
 * Per-risk bespoke level text, keyed by displayId (e.g. 'SLS3').
 * Only override levels where you have something meaningfully specific to say.
 * Omitted levels fall back to the derived default.
 */
export const levelGuidanceOverride: Record<string, Partial<Record<AnswerLevel, string>>> = {
  // SLS3 — Operational Failure: Validator keys used on 2 different validators
  // Seeded as a demonstration; the text matches the example in the design brief.
  SLS3: {
    basic:
      'You are aware of the risk and your validator client has a built-in anti-slashing mechanism enabled, but you have not configured a persistent, explicitly managed database.',
    advanced:
      'You have a persistent local anti-slashing database explicitly configured and backed up, signature requirements are documented, and you maintain operational records for this area.',
    tested:
      'You have verified the anti-slashing database survives migration and failover — for example by testing a restore, simulating a failover, or conducting an audit of the key-management process.',
  },
}
