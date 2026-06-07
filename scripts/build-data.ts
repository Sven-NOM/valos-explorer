import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { load as cheerioLoad } from 'cheerio';
import { join } from 'path';

import type {
  ValosData,
  RiskCategory,
  Risk,
  RiskAlias,
  Mitigation,
  Control,
  EvidenceType,
  CategoryId,
  RelationshipEdge,
  Tool,
} from '../src/types/valos.js';

const ROOT = process.cwd();
const SPEC_PATH = join(ROOT, 'references/valos-spec.html');
const OUT_PATH = join(ROOT, 'src/data/valos.json');

// Category anchor slug → CategoryId prefix
const SLUG_TO_CATEGORY_ID: Record<string, CategoryId> = {
  financial: 'fin',
  slashing: 'sls',
  downtime: 'dow',
  keys: 'kec',
  hacking: 'hck',
  infra: 'gir',
  partner: 'sps',
  reputation: 'rer',
};

// ─── Heading scanner ─────────────────────────────────────────────────────────

interface HeadingInfo {
  lineNum: number;
  level: number;
  text: string;
  anchor: string | null;
}

const HEADING_RE = /^(#{1,6})\s+(.*?)(?:\s*\{#([a-z0-9][a-z0-9-]*)\})?\s*$/;

function scanHeadings(lines: string[]): HeadingInfo[] {
  const headings: HeadingInfo[] = [];
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(HEADING_RE);
    if (m) {
      headings.push({
        lineNum: i,
        level: m[1].length,
        text: m[2].trim(),
        anchor: m[3] ?? null,
      });
    }
  }
  return headings;
}

// Given a heading at headings[idx], return the line where the next sibling (same level or higher)
// heading starts, or `maxLine` if none.
function sectionEnd(headings: HeadingInfo[], idx: number, maxLine: number): number {
  const level = headings[idx].level;
  for (let j = idx + 1; j < headings.length; j++) {
    if (headings[j].level <= level) return headings[j].lineNum;
  }
  return maxLine;
}

// ─── Info-block extractor ────────────────────────────────────────────────────

// Returns all text content of <div class="info">...</div> blocks in the given lines.
function extractInfoBlocks(blockLines: string[]): string[] {
  const blocks: string[] = [];
  let inInfo = false;
  let depth = 0;
  let current: string[] = [];

  for (const line of blockLines) {
    if (!inInfo && line.includes('<div class="info">')) {
      inInfo = true;
      depth = 1;
      current = [line];
      continue;
    }
    if (inInfo) {
      current.push(line);
      if (line.includes('<div')) depth++;
      if (line.includes('</div>')) {
        depth--;
        if (depth <= 0) {
          blocks.push(current.join('\n'));
          inInfo = false;
          current = [];
        }
      }
    }
  }
  return blocks;
}

// ─── Risk-link expansion (the 3 cases) ───────────────────────────────────────

function extractRiskLinks(
  infoText: string,
  allRiskIds: Set<string>,
  risksByCategory: Map<CategoryId, string[]>,
): { riskIds: string[]; appliesToAll: boolean } {
  const ids = new Set<string>();
  let appliesToAll = false;

  // Case 2: literal list item "- All risks" or "* All risks"
  if (/^[-*]\s+All risks\s*$/im.test(infoText)) {
    appliesToAll = true;
    for (const id of allRiskIds) ids.add(id);
    return { riskIds: [...ids], appliesToAll };
  }

  // Case 3: category-all reference: [Slashing Risks](#sec-risks-slashing)
  const catRe = /\(#sec-risks-([a-z]+)\)/g;
  let m: RegExpExecArray | null;
  while ((m = catRe.exec(infoText)) !== null) {
    const slug = m[1];
    const catId = SLUG_TO_CATEGORY_ID[slug];
    if (catId) {
      for (const id of risksByCategory.get(catId) ?? []) ids.add(id);
    }
  }

  // Case 1: direct [ID](#risk-xxx-n) links
  const directRe = /\[([A-Z]+\d+)\]\(#(risk-[a-z]+-\d+)\)/g;
  while ((m = directRe.exec(infoText)) !== null) {
    const riskId = m[2];
    if (allRiskIds.has(riskId)) ids.add(riskId);
  }

  return { riskIds: [...ids], appliesToAll };
}

// Extract external-standard refs: [[?SOC2]], [[?ISO27001]], etc.
function extractEvidenceRefs(infoText: string): string[] {
  const refs = new Set<string>();
  const re = /\[\[\?([^\]]+)\]\]/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(infoText)) !== null) refs.add(m[1].trim());
  return [...refs];
}

// Strip HTML tags and markdown headings from prose text for descriptions.
// Also strips triple-bracket biblio refs like [[[?EIP3076]]] which leave stray "]" otherwise.
function cleanDescription(raw: string): string {
  return raw
    .split('\n')
    .filter(l => !l.match(/^#{1,6}\s/) && !l.match(/^<div/) && !l.match(/^<\/div/))
    .join('\n')
    .replace(/\[\[\[.*?\]\]\]/g, '')   // triple-bracket biblio refs first
    .replace(/<[^>]+>/g, ' ')
    .replace(/\[\[.*?\]\]/g, '')       // double-bracket refs
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

// Extract tools from all <details class="tools"> blocks within a mitigation's block lines.
// Returns a flat Tool[] (multiple blocks concatenated, for mitigations like doppelganger-protection).
function extractTools(blockLines: string[]): { tools: Tool[]; detailsLineRanges: [number, number][] } {
  const tools: Tool[] = [];
  const detailsLineRanges: [number, number][] = [];
  const text = blockLines.join('\n');

  // Find each <details class="tools">…</details> block
  const detailsRe = /<details class="tools">([\s\S]*?)<\/details>/g;
  let dm: RegExpExecArray | null;
  while ((dm = detailsRe.exec(text)) !== null) {
    const inner = dm[1];
    // Track character offsets to compute line ranges for stripping
    const startChar = dm.index;
    const endChar = dm.index + dm[0].length;
    const startLine = text.slice(0, startChar).split('\n').length - 1;
    const endLine = text.slice(0, endChar).split('\n').length - 1;
    detailsLineRanges.push([startLine, endLine]);

    // Extract each <li> item — may contain <a href> or plain text, possibly nested <ul>
    const liRe = /<li[^>]*>([\s\S]*?)<\/li>/g;
    let lm: RegExpExecArray | null;
    while ((lm = liRe.exec(inner)) !== null) {
      const liContent = lm[1];
      // Try to find a direct <a href="..."> (skip nested-ul wrappers which start with <ul>)
      if (liContent.trimStart().startsWith('<ul>')) continue;
      const aMatch = liContent.match(/<a\s+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/);
      if (aMatch) {
        const url = aMatch[1].trim();
        const name = aMatch[2].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
        if (name) tools.push({ name, url });
      } else {
        // Text-only item (no link)
        const name = liContent.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
        if (name) tools.push({ name });
      }
    }
  }

  return { tools, detailsLineRanges };
}

// Remove <details class="tools">…</details> blocks from a line array before building description.
function stripToolsBlocks(blockLines: string[]): string[] {
  const text = blockLines.join('\n');
  const cleaned = text.replace(/<details class="tools">[\s\S]*?<\/details>/g, '');
  return cleaned.split('\n');
}

// Clean a control description: drop 🔗 anchor lines and lines that look like adjacent control bleed.
function cleanControlDescription(raw: string): string {
  return raw
    .split('\n')
    .filter(l => {
      const t = l.trim();
      if (!t) return false;
      if (t.includes('🔗')) return false;
      if (t.startsWith('<a href=')) return false;
      if (t.match(/^<\/?[a-z]/)) return false; // stray HTML tags
      return true;
    })
    .join('\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\[\[\[.*?\]\]\]/g, '')
    .replace(/\[\[.*?\]\]/g, '')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

// ─── T-003: Parse risks ───────────────────────────────────────────────────────

function parseCategories(headings: HeadingInfo[]): RiskCategory[] {
  return headings
    .filter(h => h.level === 3 && h.anchor?.startsWith('sec-risks-'))
    .map(h => {
      const slug = h.anchor!.replace('sec-risks-', '');
      const id = SLUG_TO_CATEGORY_ID[slug];
      if (!id) throw new Error(`Unknown category slug: ${slug}`);
      return { id, name: h.text, slug, description: '' };
    });
}

function parseRisks(
  rawHtml: string,
  categories: RiskCategory[],
): { risks: Risk[]; aliases: RiskAlias[] } {
  const $ = cheerioLoad(rawHtml);
  const risks: Risk[] = [];
  const aliases: RiskAlias[] = [];

  $('tr[id^="risk-"]').each((_, el) => {
    const id = $(el).attr('id')!;
    const cells = $(el).find('> td');

    // Deprecated row: 2 cells (ID + colspan replacement text)
    if (cells.length <= 2 || $(cells.eq(1)).attr('colspan')) {
      const href = $(el).find('a[href^="#risk-"]').attr('href');
      if (href) {
        aliases.push({ id, replacedBy: href.slice(1) });
      }
      return;
    }

    // Active row: 5 cells (ID, RiskGroup, RiskVector/title, description, autofill-mits)
    // Some IDs carry a "(replaces …)" suffix (e.g. "HCK1 (replaces SLS8, KEC2)").
    // That deprecation info is already captured via aliases, so keep only the
    // short canonical ID token (e.g. "HCK1") for display.
    const rawDisplayId = cells.eq(0).text().trim();
    const displayId = rawDisplayId.match(/^[A-Z]+\d+/)?.[0] ?? rawDisplayId;
    const riskGroup = cells.eq(1).text().trim();
    const title = cells.eq(2).text().trim();
    const description = cells.eq(3).text().trim();

    // Derive categoryId from id prefix e.g. "risk-fin-1" → "fin"
    const prefix = id.split('-')[1] as CategoryId;
    if (!categories.find(c => c.id === prefix)) {
      console.warn(`  WARN: unknown category prefix "${prefix}" for ${id}`);
      return;
    }

    risks.push({
      id,
      displayId,
      categoryId: prefix,
      riskGroup: riskGroup as Risk['riskGroup'],
      title,
      description,
      mitigationIds: [],
      controlIds: [],
    });
  });

  return { risks, aliases };
}

// ─── T-004: Parse mitigations ─────────────────────────────────────────────────

function parseMitigations(
  lines: string[],
  headings: HeadingInfo[],
  startLine: number,
  endLine: number,
  allRiskIds: Set<string>,
  risksByCategory: Map<CategoryId, string[]>,
): Mitigation[] {
  const mitigations: Mitigation[] = [];

  // Filter headings within the mitigations section
  const sectionHeadings = headings.filter(
    h => h.lineNum >= startLine && h.lineNum < endLine,
  );

  let currentDomainId = '';

  for (let i = 0; i < sectionHeadings.length; i++) {
    const h = sectionHeadings[i];

    // Track domain headings (level 3, sec-mitigations-*)
    if (h.level === 3 && h.anchor?.startsWith('sec-mitigations-')) {
      currentDomainId = h.anchor;
      continue;
    }

    // Leaf mitigation: level 4, anchor starts with sec-mit- (not sec-mitigations-/sec-mitigating-)
    if (h.level === 4 && h.anchor?.startsWith('sec-mit-')) {
      const blockEnd = sectionEnd(sectionHeadings, i, endLine);
      const blockLines = lines.slice(h.lineNum + 1, blockEnd);

      const infoBlocks = extractInfoBlocks(blockLines);
      const infoText = infoBlocks.join('\n');
      const { riskIds, appliesToAll } = extractRiskLinks(infoText, allRiskIds, risksByCategory);

      // Extract tools from <details class="tools"> blocks before building description
      const { tools } = extractTools(blockLines);
      // Strip tools blocks from prose so they don't bleed into the description
      const strippedLines = stripToolsBlocks(blockLines);

      // Description: prose before first <div class="info"> (using stripped lines)
      const infoStart = strippedLines.findIndex(l => l.includes('<div class="info">'));
      const proseLines = infoStart >= 0 ? strippedLines.slice(0, infoStart) : strippedLines;
      const description = cleanDescription(proseLines.join('\n'));

      mitigations.push({
        id: h.anchor,
        title: h.text,
        description,
        domainId: currentDomainId,
        riskIds,
        appliesToAll,
        controlIds: [],
        tools,
      });
    }
  }

  return mitigations;
}

// ─── T-005: Parse controls ────────────────────────────────────────────────────

function parseControls(
  rawHtml: string,
  lines: string[],
  ctrlLineStart: number,
  allRiskIds: Set<string>,
  risksByCategory: Map<CategoryId, string[]>,
): { controls: Control[]; evidenceTypes: EvidenceType[] } {
  const controls: Control[] = [];
  const evidenceSet = new Map<string, EvidenceType>();

  // Extract the controls section as a substring for position-based lookup
  const ctrlCharStart = lines.slice(0, ctrlLineStart).join('\n').length + 1;
  const ctrlHtml = rawHtml.slice(ctrlCharStart);

  // Pre-compute all info-block positions in the controls section
  const infoBlockRe = /<div class="info">([\s\S]*?)<\/div>/g;
  const infoBlocks: { start: number; text: string }[] = [];
  let im: RegExpExecArray | null;
  while ((im = infoBlockRe.exec(ctrlHtml)) !== null) {
    infoBlocks.push({ start: im.index, text: im[1] });
  }

  // Pre-compute group headings (#### lines) and their positions in ctrlHtml
  const groupHeadingRe = /^####\s+(.*?)(?:\s*\{#[^}]+\})?\s*$/gm;
  const groupHeadings: { pos: number; text: string }[] = [];
  let ghm: RegExpExecArray | null;
  while ((ghm = groupHeadingRe.exec(ctrlHtml)) !== null) {
    groupHeadings.push({ pos: ghm.index, text: ghm[1].trim() });
  }

  function findGroup(controlPos: number): string {
    let group = '';
    for (const gh of groupHeadings) {
      if (gh.pos < controlPos) group = gh.text;
      else break;
    }
    return group;
  }

  // Pre-compute control-domain headings (### "Controls for …") and their positions.
  // Within ctrlHtml (sliced from the Controls Catalog start) every ### is a control
  // domain — groups are ####, external-control notes are #####, so no collisions.
  const domainHeadingRe = /^###\s+(.*?)(?:\s*\{#(sec-controls-[^}]+)\})?\s*$/gm;
  const domainHeadings: { pos: number; text: string; slug: string }[] = [];
  let dhm: RegExpExecArray | null;
  while ((dhm = domainHeadingRe.exec(ctrlHtml)) !== null) {
    domainHeadings.push({ pos: dhm.index, text: dhm[1].trim(), slug: dhm[2] ?? '' });
  }

  function findDomain(controlPos: number): { domainId: string; domainName: string } {
    let domainName = '';
    let domainId = '';
    for (const dh of domainHeadings) {
      if (dh.pos < controlPos) {
        domainName = dh.text;
        domainId = dh.slug;
      } else break;
    }
    return { domainId, domainName };
  }

  // Use multiline regex to find every <b id="req-..."> — handles multi-line and same-line controls
  const controlRe = /<b id="(req-[a-z0-9-]+)">([\s\S]*?)<\/b>/g;
  let cm: RegExpExecArray | null;
  while ((cm = controlRe.exec(ctrlHtml)) !== null) {
    const id = cm[1];
    const title = cm[2].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
    const controlPos = cm.index;

    // Find the nearest info block after this control
    const nextInfo = infoBlocks.find(b => b.start > controlPos);
    const infoText = nextInfo?.text ?? '';

    const { riskIds } = extractRiskLinks(infoText, allRiskIds, risksByCategory);
    const evidenceRefs = extractEvidenceRefs(infoText);
    for (const ref of evidenceRefs) {
      if (!evidenceSet.has(ref)) evidenceSet.set(ref, { id: ref, name: ref });
    }

    // Description: raw text between end of <b>...</b> and next info block
    const afterBoldEnd = controlPos + cm[0].length;
    const descRaw = ctrlHtml.slice(afterBoldEnd, nextInfo?.start ?? afterBoldEnd + 500);
    const description = cleanControlDescription(descRaw.split('\n').slice(0, 8).join('\n'));

    const { domainId, domainName } = findDomain(controlPos);
    controls.push({
      id,
      title,
      description,
      groupId: findGroup(controlPos),
      domainId,
      domainName,
      riskIds,
      evidenceTypeIds: evidenceRefs,
      mitigationIds: [],
    });
  }

  return { controls, evidenceTypes: [...evidenceSet.values()] };
}

// ─── T-006: Invert edges & derive mitigation↔control links ────────────────────

function invertEdges(
  risks: Risk[],
  mitigations: Mitigation[],
  controls: Control[],
): {
  riskMitigation: RelationshipEdge[];
  mitigationControl: RelationshipEdge[];
  controlEvidence: RelationshipEdge[];
} {
  // Build risk lookup
  const riskMap = new Map(risks.map(r => [r.id, r]));

  // Invert mitigation→risk into risk.mitigationIds
  for (const mit of mitigations) {
    for (const riskId of mit.riskIds) {
      const risk = riskMap.get(riskId);
      if (risk && !risk.mitigationIds.includes(mit.id)) {
        risk.mitigationIds.push(mit.id);
      }
    }
  }

  // Invert control→risk into risk.controlIds
  for (const ctrl of controls) {
    for (const riskId of ctrl.riskIds) {
      const risk = riskMap.get(riskId);
      if (risk && !risk.controlIds.includes(ctrl.id)) {
        risk.controlIds.push(ctrl.id);
      }
    }
  }

  // Derive Mitigation↔Control edges via shared risks
  const mitMap = new Map(mitigations.map(m => [m.id, m]));
  const ctrlMap = new Map(controls.map(c => [c.id, c]));

  // For each pair, count shared risks
  // Build a risk→[mitIds] and risk→[ctrlIds] index
  const riskToMits = new Map<string, string[]>();
  const riskToCtrls = new Map<string, string[]>();
  for (const mit of mitigations) {
    for (const rId of mit.riskIds) {
      if (!riskToMits.has(rId)) riskToMits.set(rId, []);
      riskToMits.get(rId)!.push(mit.id);
    }
  }
  for (const ctrl of controls) {
    for (const rId of ctrl.riskIds) {
      if (!riskToCtrls.has(rId)) riskToCtrls.set(rId, []);
      riskToCtrls.get(rId)!.push(ctrl.id);
    }
  }

  // Count shared risks between each mit↔ctrl pair
  const mitCtrlWeight = new Map<string, number>();
  for (const [rId, mitIds] of riskToMits) {
    const ctrlIds = riskToCtrls.get(rId) ?? [];
    for (const mId of mitIds) {
      for (const cId of ctrlIds) {
        const key = `${mId}::${cId}`;
        mitCtrlWeight.set(key, (mitCtrlWeight.get(key) ?? 0) + 1);
      }
    }
  }

  // Populate control.mitigationIds and mitigation.controlIds
  for (const [key, count] of mitCtrlWeight) {
    const [mId, cId] = key.split('::');
    const mit = mitMap.get(mId);
    const ctrl = ctrlMap.get(cId);
    if (mit && ctrl) {
      if (!mit.controlIds.includes(cId)) mit.controlIds.push(cId);
      if (!ctrl.mitigationIds.includes(mId)) ctrl.mitigationIds.push(mId);
    }
  }

  // Build edge arrays
  const riskMitigation: RelationshipEdge[] = [];
  for (const risk of risks) {
    for (const mId of risk.mitigationIds) {
      riskMitigation.push({ source: risk.id, target: mId });
    }
  }

  const mitigationControl: RelationshipEdge[] = [];
  for (const [key, count] of mitCtrlWeight) {
    const [source, target] = key.split('::');
    mitigationControl.push({ source, target, sharedRiskCount: count });
  }

  const controlEvidence: RelationshipEdge[] = [];
  for (const ctrl of controls) {
    for (const evId of ctrl.evidenceTypeIds) {
      controlEvidence.push({ source: ctrl.id, target: evId });
    }
  }

  return { riskMitigation, mitigationControl, controlEvidence };
}

// ─── T-007: Invariant assertions ──────────────────────────────────────────────

function validate(
  risks: Risk[],
  aliases: RiskAlias[],
  mitigations: Mitigation[],
  controls: Control[],
  allRiskIds: Set<string>,
): void {
  const errors: string[] = [];

  if (risks.length < 70 || risks.length > 90) {
    errors.push(`Active risks: ${risks.length} — expected 70–90`);
  }
  if (mitigations.length !== 43) {
    errors.push(`Leaf mitigations: ${mitigations.length} — expected exactly 43`);
  }
  if (controls.length !== 64) {
    errors.push(`Controls: ${controls.length} — expected exactly 64`);
  }

  // Every alias target must resolve to a known risk
  for (const alias of aliases) {
    if (!allRiskIds.has(alias.replacedBy)) {
      errors.push(`Alias ${alias.id} → ${alias.replacedBy} does not resolve`);
    }
  }

  // Every risk link in mitigations must resolve
  for (const mit of mitigations) {
    for (const rId of mit.riskIds) {
      if (!allRiskIds.has(rId)) {
        errors.push(`Mitigation ${mit.id} references unknown risk ${rId}`);
      }
    }
  }

  // Every risk link in controls must resolve
  for (const ctrl of controls) {
    for (const rId of ctrl.riskIds) {
      if (!allRiskIds.has(rId)) {
        errors.push(`Control ${ctrl.id} references unknown risk ${rId}`);
      }
    }
  }

  if (errors.length > 0) {
    console.error('\n❌  Invariant violations:');
    for (const e of errors) console.error(`   • ${e}`);
    process.exit(1);
  }
}

// ─── Main ─────────────────────────────────────────────────────────────────────

console.log('📖  Reading spec…');
const rawHtml = readFileSync(SPEC_PATH, 'utf-8');
const lines = rawHtml.split('\n');
const headings = scanHeadings(lines);

console.log('📂  Parsing categories…');
const categories = parseCategories(headings);
console.log(`     ${categories.length} categories found`);

console.log('⚠️   Parsing risks…');
const { risks, aliases } = parseRisks(rawHtml, categories);
console.log(`     ${risks.length} active risks, ${aliases.length} deprecated aliases`);

const allRiskIds = new Set(risks.map(r => r.id));
const risksByCategory = new Map<CategoryId, string[]>();
for (const r of risks) {
  if (!risksByCategory.has(r.categoryId)) risksByCategory.set(r.categoryId, []);
  risksByCategory.get(r.categoryId)!.push(r.id);
}

// Section boundaries
const mitLineStart = headings.find(h => h.anchor === 'sec-mitigation')?.lineNum ?? 0;
const ctrlLineStart = headings.find(h => h.anchor === 'sec-controls-catalog')?.lineNum ?? lines.length;

console.log('🛡️   Parsing mitigations…');
const mitigations = parseMitigations(lines, headings, mitLineStart, ctrlLineStart, allRiskIds, risksByCategory);
console.log(`     ${mitigations.length} leaf mitigations found`);

console.log('🔒  Parsing controls…');
const { controls, evidenceTypes } = parseControls(rawHtml, lines, ctrlLineStart, allRiskIds, risksByCategory);
console.log(`     ${controls.length} controls, ${evidenceTypes.length} evidence types found`);

console.log('🔗  Inverting edges…');
const edges = invertEdges(risks, mitigations, controls);
console.log(`     ${edges.riskMitigation.length} risk↔mitigation edges`);
console.log(`     ${edges.mitigationControl.length} mitigation↔control edges`);

console.log('✅  Validating…');
validate(risks, aliases, mitigations, controls, allRiskIds);

// Summary table
console.log('\n─── Summary ───────────────────────────────────────────');
console.log(`  Categories:        ${categories.map(c => c.id.toUpperCase()).join(', ')}`);
const byCategory = Object.fromEntries(
  categories.map(c => [c.id, risks.filter(r => r.categoryId === c.id).length]),
);
for (const [cat, count] of Object.entries(byCategory)) {
  console.log(`  ${cat.toUpperCase().padEnd(6)}: ${count} active risks`);
}
console.log(`  Total active:      ${risks.length}`);
console.log(`  Deprecated:        ${aliases.length}`);
console.log(`  Mitigations:       ${mitigations.length}`);
console.log(`  Controls:          ${controls.length}`);
console.log(`  Evidence types:    ${evidenceTypes.map(e => e.id).join(', ')}`);
console.log('───────────────────────────────────────────────────────\n');

// Write output
const data: ValosData = {
  meta: {
    generatedAt: new Date().toISOString(),
    sourceFile: 'references/valos-spec.html',
    counts: {
      categories: categories.length,
      risks: risks.length,
      aliases: aliases.length,
      mitigations: mitigations.length,
      controls: controls.length,
      evidenceTypes: evidenceTypes.length,
      riskMitigationEdges: edges.riskMitigation.length,
      mitigationControlEdges: edges.mitigationControl.length,
    },
  },
  categories,
  risks,
  aliases,
  mitigations,
  controls,
  evidenceTypes,
  edges,
};

if (!existsSync(join(ROOT, 'src/data'))) {
  mkdirSync(join(ROOT, 'src/data'), { recursive: true });
}
writeFileSync(OUT_PATH, JSON.stringify(data, null, 2));
console.log(`✨  Written to ${OUT_PATH}`);
