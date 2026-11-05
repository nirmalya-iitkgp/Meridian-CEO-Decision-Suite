import {
  CatchballStatus,
  FlightLevel,
  OgsmType,
  StrategyNode,
  StrategyPlanDocument,
} from '../types/strategy';
import { clampConfidence } from './alignmentEngine';

const MAX_JSON_BYTES = 512 * 1024; // 512 KB limit
const MAX_NODES = 250;

const VALID_FLIGHT_LEVELS = new Set<FlightLevel>([
  'FL3_STRATEGIC',
  'FL2_COORDINATION',
  'FL1_OPERATIONAL',
]);

const VALID_OGSM_TYPES = new Set<OgsmType>([
  'OBJECTIVE',
  'GOAL',
  'STRATEGY',
  'MEASURE',
]);

const VALID_STATUSES = new Set<CatchballStatus>([
  'PROPOSED',
  'COUNTER_OFFERED',
  'AGREED',
  'AT_RISK',
]);

const SAFE_ID_REGEX = /^[a-zA-Z0-9_-]{1,64}$/;

function sanitizePlainObject<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map(sanitizePlainObject) as unknown as T;
  }
  if (value !== null && typeof value === 'object') {
    const clean: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      if (k === '__proto__' || k === 'constructor' || k === 'prototype') {
        continue;
      }
      clean[k] = sanitizePlainObject(v);
    }
    return clean as T;
  }
  return value;
}

function hasCircularReference(nodes: StrategyNode[]): boolean {
  const parentMap = new Map<string, string | null>();
  for (const n of nodes) {
    parentMap.set(n.id, n.parentId);
  }

  for (const n of nodes) {
    const visited = new Set<string>();
    let current: string | null = n.id;
    while (current !== null) {
      if (visited.has(current)) return true;
      visited.add(current);
      current = parentMap.get(current) ?? null;
    }
  }
  return false;
}

export function exportStrategyPlan(
  planTitle: string,
  fiscalYear: string,
  nodes: StrategyNode[]
): string {
  const doc: StrategyPlanDocument = {
    planTitle: planTitle.trim() || 'Enterprise Strategy Plan',
    fiscalYear: fiscalYear.trim() || 'FY2026',
    exportedAt: new Date().toISOString(),
    nodes,
  };
  return JSON.stringify(doc, null, 2);
}

export function parseAndValidateStrategyJson(
  rawJson: string
): { ok: true; data: StrategyPlanDocument } | { ok: false; error: string } {
  if (typeof rawJson !== 'string' || rawJson.trim().length === 0) {
    return { ok: false, error: 'Empty JSON input provided.' };
  }

  if (new TextEncoder().encode(rawJson).length > MAX_JSON_BYTES) {
    return {
      ok: false,
      error: 'Strategy file exceeds the 512 KB security size limit.',
    };
  }

  let parsed: unknown;
  try {
    parsed = sanitizePlainObject(JSON.parse(rawJson));
  } catch {
    return { ok: false, error: 'Malformed JSON syntax.' };
  }

  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    return { ok: false, error: 'Root JSON value must be an object.' };
  }

  const record = parsed as Record<string, unknown>;
  const planTitle =
    typeof record.planTitle === 'string' && record.planTitle.trim().length > 0
      ? record.planTitle.trim().slice(0, 120)
      : 'Imported Strategy Plan';
  const fiscalYear =
    typeof record.fiscalYear === 'string' && record.fiscalYear.trim().length > 0
      ? record.fiscalYear.trim().slice(0, 24)
      : 'FY2026';

  if (!Array.isArray(record.nodes)) {
    return { ok: false, error: 'Missing or invalid "nodes" array.' };
  }

  if (record.nodes.length === 0) {
    return { ok: false, error: 'Strategy plan must contain at least 1 node.' };
  }

  if (record.nodes.length > MAX_NODES) {
    return {
      ok: false,
      error: `Strategy plan exceeds maximum of ${MAX_NODES} nodes.`,
    };
  }

  const seenIds = new Set<string>();
  const validatedNodes: StrategyNode[] = [];

  for (let i = 0; i < record.nodes.length; i++) {
    const item = record.nodes[i];
    if (!item || typeof item !== 'object' || Array.isArray(item)) {
      return { ok: false, error: `Node at index ${i} is not a valid object.` };
    }
    const n = item as Record<string, unknown>;

    if (typeof n.id !== 'string' || !SAFE_ID_REGEX.test(n.id)) {
      return {
        ok: false,
        error: `Node at index ${i} has an invalid or unsafe "id".`,
      };
    }
    if (seenIds.has(n.id)) {
      return { ok: false, error: `Duplicate node id "${n.id}" detected.` };
    }
    seenIds.add(n.id);

    if (
      n.parentId !== null &&
      (typeof n.parentId !== 'string' || !SAFE_ID_REGEX.test(n.parentId))
    ) {
      return {
        ok: false,
        error: `Node "${n.id}" has an invalid "parentId".`,
      };
    }

    if (
      typeof n.flightLevel !== 'string' ||
      !VALID_FLIGHT_LEVELS.has(n.flightLevel as FlightLevel)
    ) {
      return {
        ok: false,
        error: `Node "${n.id}" has an invalid "flightLevel".`,
      };
    }

    if (
      typeof n.ogsmType !== 'string' ||
      !VALID_OGSM_TYPES.has(n.ogsmType as OgsmType)
    ) {
      return {
        ok: false,
        error: `Node "${n.id}" has an invalid "ogsmType".`,
      };
    }

    if (typeof n.title !== 'string' || n.title.trim().length === 0) {
      return {
        ok: false,
        error: `Node "${n.id}" must have a non-empty "title".`,
      };
    }

    if (typeof n.ownerTeam !== 'string' || n.ownerTeam.trim().length === 0) {
      return {
        ok: false,
        error: `Node "${n.id}" must have a non-empty "ownerTeam".`,
      };
    }

    if (
      typeof n.proposedTarget !== 'number' ||
      !Number.isFinite(n.proposedTarget) ||
      typeof n.counterTarget !== 'number' ||
      !Number.isFinite(n.counterTarget)
    ) {
      return {
        ok: false,
        error: `Node "${n.id}" must have finite numeric targets.`,
      };
    }

    if (typeof n.confidence !== 'number' || !Number.isFinite(n.confidence)) {
      return {
        ok: false,
        error: `Node "${n.id}" must have a numeric "confidence".`,
      };
    }

    if (
      typeof n.status !== 'string' ||
      !VALID_STATUSES.has(n.status as CatchballStatus)
    ) {
      return {
        ok: false,
        error: `Node "${n.id}" has an invalid "status".`,
      };
    }

    validatedNodes.push({
      id: n.id,
      parentId: n.parentId as string | null,
      flightLevel: n.flightLevel as FlightLevel,
      ogsmType: n.ogsmType as OgsmType,
      title: n.title.trim().slice(0, 160),
      ownerTeam: n.ownerTeam.trim().slice(0, 80),
      unit: typeof n.unit === 'string' ? n.unit.trim().slice(0, 24) : '',
      proposedTarget: n.proposedTarget,
      counterTarget: n.counterTarget,
      confidence: clampConfidence(n.confidence),
      status: n.status as CatchballStatus,
      rationale:
        typeof n.rationale === 'string' ? n.rationale.trim().slice(0, 500) : '',
      updatedAt:
        typeof n.updatedAt === 'string'
          ? n.updatedAt.slice(0, 40)
          : new Date().toISOString(),
    });
  }

  if (hasCircularReference(validatedNodes)) {
    return {
      ok: false,
      error: 'Circular parent-child hierarchy detected in strategy nodes.',
    };
  }

  return {
    ok: true,
    data: {
      planTitle,
      fiscalYear,
      exportedAt:
        typeof record.exportedAt === 'string'
          ? record.exportedAt
          : new Date().toISOString(),
      nodes: validatedNodes,
    },
  };
}
