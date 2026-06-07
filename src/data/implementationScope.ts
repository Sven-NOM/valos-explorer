/**
 * IMPLEMENTATION SCOPE OVERLAY — Editorial layer by ValOS Explorer.
 *
 * This file is NOT part of the ValOS specification. The grouping of controls into
 * domains, and the controls themselves, come from valos-spec.html (the spec
 * organizes its Controls Catalog under ten "### Controls for …" domain headings,
 * captured at build time as `control.domainId`). What this overlay adds is purely
 * editorial: an org-friendly LABEL, a typical OWNER/team hint, a short BLURB, and an
 * intentional ORDER — to help an operator see who in their organization implements
 * what. None of that wording is spec text.
 */

export const OVERLAY_VERSION = 1

export const PROVENANCE =
  'Scope labels, owner hints, and ordering are an editorial overlay by ValOS Explorer. ' +
  'The grouping of controls into domains, and the controls themselves, are from the ValOS spec.'

export interface ScopeMeta {
  /** Spec control-domain slug, e.g. 'sec-controls-people-management'. */
  domainId: string
  /** Org-friendly scope name. */
  label: string
  /** Typical owner / team that implements this scope. */
  owner: string
  /** One-line description of what lives here. */
  blurb: string
  /** Explanation shown when controls are hidden due to scale. */
  hiddenExplanation?: string
}

/**
 * The ten spec control domains, in an organizationally-sensible order.
 * Key & Secret Management deliberately sits directly above Access Management
 * (mirroring the spec's own adjacency).
 */
export const SCOPE_ORDER: ScopeMeta[] = [
  {
    domainId: 'sec-controls-risk-management',
    label: 'Risk & Governance',
    owner: 'Leadership / Risk owner',
    blurb: 'Setting risk appetite, documenting assessments, and ensuring mitigation processes are actually followed.',
  },
  {
    domainId: 'sec-controls-people-management',
    label: 'People & HR',
    owner: 'HR / People ops',
    blurb: 'Knowing who is authorized, training them, and managing vendor and partner dependencies.',
    hiddenExplanation: 'These controls require having a team with distinct roles. They become relevant once you have more than one operator.',
  },
  {
    domainId: 'sec-controls-fin-reg',
    label: 'Finance & Regulatory',
    owner: 'Finance / Compliance',
    blurb: 'Node-operations finance — payment rails and validator withdrawal — and regulatory posture. Not corporate payroll.',
  },
  {
    domainId: 'sec-controls-tech-stack',
    label: 'Technology Stack',
    owner: 'Infrastructure / Platform',
    blurb: 'Client diversity, keeping third-party software current, and the resilience of the deployed stack.',
  },
  {
    domainId: 'sec-controls-info-secrets',
    label: 'Key & Secret Management',
    owner: 'Key custody / Security',
    blurb: 'Validator key management, the anti-slashing database, signing controls, and encryption of data.',
  },
  {
    domainId: 'sec-controls-access',
    label: 'Access Management',
    owner: 'IT / Security',
    blurb: 'Authentication, least privilege, network segmentation, and regular review of access rights.',
  },
  {
    domainId: 'sec-controls-monitoring',
    label: 'Monitoring & Logging',
    owner: 'SRE / Monitoring',
    blurb: 'Logging traffic, access, performance, and slashing events — and analyzing them for anomalies.',
  },
  {
    domainId: 'sec-controls-environment',
    label: 'Facilities & Hardware',
    owner: 'Data-center / Ops',
    blurb: 'Physical access to servers, environmental threats, and equipment lifecycle management.',
  },
  {
    domainId: 'sec-controls-updates',
    label: 'Development & Client Updates',
    owner: 'Engineering / Release',
    blurb: 'Secure development, test coverage, staging deploys, configuration verification, and rollback.',
  },
  {
    domainId: 'sec-controls-response',
    label: 'Incident Response & Comms',
    owner: 'Incident response / Comms',
    blurb: 'Incident and disaster-recovery plans, response simulations, and communication strategies.',
  },
]

const SCOPE_BY_DOMAIN = new Map(SCOPE_ORDER.map((s) => [s.domainId, s]))

const FALLBACK_SCOPE: ScopeMeta = {
  domainId: '',
  label: 'Other',
  owner: 'Unassigned',
  blurb: 'Controls not mapped to an organizational scope.',
}

/** Returns the editorial scope meta for a spec domain slug, or an "Other" fallback. */
export function scopeFor(domainId: string): ScopeMeta {
  return SCOPE_BY_DOMAIN.get(domainId) ?? FALLBACK_SCOPE
}
