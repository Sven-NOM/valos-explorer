/**
 * PREVIEW MODE — Editorial selection by ValOS Explorer.
 *
 * A curated set of 12 risk displayIds shown in "Curious / Preview" mode.
 * One or two per category, chosen to demonstrate the framework's breadth.
 * These are NOT a priority ranking — they are chosen for educational variety.
 */
export const PREVIEW_RISK_IDS: string[] = [
  'FIN3',  // Payment rail failure (node-ops finance, very concrete)
  'SLS1',  // Double attestation slashing (core validator risk)
  'DOW1',  // Node software failure (universal downtime risk)
  'KEC1',  // Withdrawal key loss (key custody, high stakes)
  'KEC3',  // Signing key theft (key custody, very common concern)
  'HCK4',  // External hacker (universal, no team required)
  'HCK5',  // Supply chain attack (software security, educational)
  'GIR3',  // Single point of failure (infrastructure resilience)
  'GIR16', // Human error (applies at any scale)
  'SPS1',  // Cloud provider outage (service partner dependency)
  'RER1',  // Slashing-caused reputation damage (reputational)
  'DOW5',  // Network split / fork (interesting edge case)
]
