/**
 * SCALE OVERLAY — Editorial layer by ValOS Explorer.
 *
 * This file is NOT part of the ValOS specification and is NOT sourced from
 * valos-spec.html. It is a hand-curated editorial mapping from ValOS Explorer
 * authors that associates risks and mitigations with the minimum operator scale
 * band at which they are typically applicable.
 *
 * Scale bands: 0=Solo  1=Small team  2=Organization  3=Institutional
 *
 * Defaults: everything is band 0 (applies to all operators). Only exceptions
 * are listed below with an explicit rationale comment.
 */

import type { ScaleBand } from '@/types/valos'

export const OVERLAY_VERSION = 1

export const PROVENANCE =
  'Scale guidance is an editorial overlay by ValOS Explorer, not part of the ValOS spec.'

/**
 * Minimum scale band per risk (keyed by displayId, e.g. 'HCK1').
 * Default for any unlisted risk is 0 (applies to all operators).
 */
export const minBandForRisk: Record<string, ScaleBand> = {
  // Team-dependent insider risks — genuinely require having employees.
  // Note: HCK4 (Malicious External Hacker) is tagged 'People' in the spec
  // but applies universally — deliberately left at default band 0.
  // Note: GIR16 (Human error) and RER2 (Negative public appearance) are also
  // in the People group but apply at any scale — left at default band 0.
  HCK1: 1, // Malicious Internal Employee (intentional) — requires employees
  HCK2: 1, // Malicious Internal Employee (intentional) — requires employees
  HCK3: 1, // Malicious Ex-Employee — requires having had employees
  GIR25: 1, // Centralized knowledge — only meaningful with a team to distribute to
}

/**
 * Minimum scale band per mitigation (keyed by mitigation id, e.g. 'sec-mit-training').
 * These are used ONLY to populate the §7 "operators at your scale also implement…" panel.
 * They never remove mitigations from a risk's linked-mitigation list.
 * Default for any unlisted mitigation is 0.
 */
export const minBandForMitigation: Record<string, ScaleBand> = {
  // ── Band 1: Small-team practices (requires at least 2 people) ────────────
  'sec-mit-identified-individuals': 1, // Who does what — accountability across a team
  'sec-mit-training': 1,               // Formalized training programs need a group
  'sec-mit-employee-auth-management': 1, // Employee auth lifecycle needs employees

  // ── Band 2: Organization-level processes ─────────────────────────────────
  'sec-mit-ssdlc': 2,               // Formal Secure Development Lifecycle program
  'sec-mit-incident-simulation': 2,  // Formal tabletop / simulation exercises
  'sec-mit-comms-stakeholders': 2,   // Formal stakeholder communication protocols
  'sec-mit-monitor-compliance': 2,   // Formal security & compliance monitoring program

  // ── Band 3: Institutional / enterprise practices ──────────────────────────
  'sec-mit-containerized-environments': 3, // Orchestrated infra at enterprise scale
  'sec-mit-process-automation': 3,         // Formal process automation programs
}
