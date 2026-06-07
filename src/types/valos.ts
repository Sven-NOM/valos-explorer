export type CategoryId = 'fin' | 'sls' | 'dow' | 'kec' | 'hck' | 'gir' | 'sps' | 'rer';
export type ScaleBand = 0 | 1 | 2 | 3;
export type RiskGroup = 'Process' | 'Infrastructure' | 'People' | 'Software' | 'Counterparty';
export type AnswerLevel = 'none' | 'basic' | 'advanced' | 'tested';
export type MaturityLevel = 'Early' | 'Developing' | 'Mature' | 'Advanced';

export interface RiskCategory {
  id: CategoryId;
  name: string;
  slug: string;
  description?: string;
}

export interface Risk {
  id: string;         // 'risk-fin-1'
  displayId: string;  // 'FIN1'
  categoryId: CategoryId;
  riskGroup: RiskGroup;
  title: string;      // Risk Vector
  description: string;
  mitigationIds: string[];
  controlIds: string[];
}

export interface RiskAlias {
  id: string;        // 'risk-gir-1'
  replacedBy: string; // 'risk-hck-4'
}

export interface Tool {
  name: string;
  url?: string;
}

export interface Mitigation {
  id: string;           // 'sec-mit-cold-storage'
  title: string;
  description: string;
  domainId: string;     // 'sec-mitigations-secret-management'
  riskIds: string[];    // risks this mitigates (canonical ids)
  appliesToAll: boolean;
  controlIds: string[]; // derived via shared-risk linkage
  tools: Tool[];        // parsed from <details class="tools"> blocks in the spec
}

export interface Control {
  id: string;              // 'req-local-slashing-db'
  title: string;           // the MUST/SHOULD statement
  description: string;
  groupId: string;         // parent group heading text (#### sub-heading)
  domainId: string;        // parent control domain slug, e.g. 'sec-controls-people-management'
  domainName: string;      // parent control domain heading, e.g. 'Controls for People Management'
  riskIds: string[];       // risks this addresses
  evidenceTypeIds: string[]; // external standards: SOC2, ISO27001, …
  mitigationIds: string[]; // derived via shared-risk linkage
}

export interface EvidenceType {
  id: string;   // 'SOC2'
  name: string; // 'SOC2'
}

export interface RelationshipEdge {
  source: string;
  target: string;
  sharedRiskCount?: number;
}

export interface ValosData {
  meta: {
    generatedAt: string;
    sourceFile: string;
    specVersion?: string;
    counts: Record<string, number>;
  };
  categories: RiskCategory[];
  risks: Risk[];
  aliases: RiskAlias[];
  mitigations: Mitigation[];
  controls: Control[];
  evidenceTypes: EvidenceType[];
  edges: {
    riskMitigation: RelationshipEdge[];
    mitigationControl: RelationshipEdge[];
    controlEvidence: RelationshipEdge[];
  };
}
