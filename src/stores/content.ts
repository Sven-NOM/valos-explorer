import { defineStore } from 'pinia';
import data from '../data/valos.json';
import type { ValosData, CategoryId, Risk, Mitigation, Control } from '../types/valos';

const valos = data as unknown as ValosData;

export const useContentStore = defineStore('content', () => {
  const categories = valos.categories;
  const risks = valos.risks;
  const mitigations = valos.mitigations;
  const controls = valos.controls;
  const evidenceTypes = valos.evidenceTypes;
  const edges = valos.edges;
  const aliases = valos.aliases;

  const riskById = new Map<string, Risk>(risks.map((r) => [r.id, r]));
  const mitigationById = new Map<string, Mitigation>(mitigations.map((m) => [m.id, m]));
  const controlById = new Map<string, Control>(controls.map((c) => [c.id, c]));

  function risksByCategory(categoryId: CategoryId): Risk[] {
    return risks.filter((r) => r.categoryId === categoryId);
  }

  function mitigationsForRisk(riskId: string): Mitigation[] {
    const risk = riskById.get(riskId);
    if (!risk) return [];
    return risk.mitigationIds.flatMap((id) => {
      const m = mitigationById.get(id);
      return m ? [m] : [];
    });
  }

  function risksForMitigation(mitigationId: string): Risk[] {
    const mitigation = mitigationById.get(mitigationId);
    if (!mitigation) return [];
    return mitigation.riskIds.flatMap((id) => {
      const r = riskById.get(id);
      return r ? [r] : [];
    });
  }

  function controlsForRisk(riskId: string): Control[] {
    const risk = riskById.get(riskId);
    if (!risk) return [];
    return risk.controlIds.flatMap((id) => {
      const c = controlById.get(id);
      return c ? [c] : [];
    });
  }

  return {
    categories,
    risks,
    mitigations,
    controls,
    evidenceTypes,
    edges,
    aliases,
    riskById,
    mitigationById,
    controlById,
    risksByCategory,
    mitigationsForRisk,
    risksForMitigation,
    controlsForRisk,
  };
});
