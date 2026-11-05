import {
  AlignmentTelemetry,
  CatchballStatus,
  ExecutionGap,
  FLIGHT_LEVEL_META,
  FlightLevel,
  FlightLevelSummary,
  StrategyNode,
} from '../types/strategy';

const STATUS_WEIGHTS: Record<CatchballStatus, number> = {
  AGREED: 1.0,
  PROPOSED: 0.78,
  COUNTER_OFFERED: 0.65,
  AT_RISK: 0.35,
};

export function clampConfidence(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, Math.round(value)));
}

export function computeTargetVarianceRatio(
  proposedTarget: number,
  counterTarget: number
): number {
  const denom = Math.max(Math.abs(proposedTarget), 1);
  return Math.abs(proposedTarget - counterTarget) / denom;
}

export function computeNodeAlignment(node: StrategyNode): number {
  const statusWeight = STATUS_WEIGHTS[node.status] ?? 0.5;
  const confidenceFactor = clampConfidence(node.confidence) / 100;
  const varianceRatio = Math.min(
    1,
    computeTargetVarianceRatio(node.proposedTarget, node.counterTarget)
  );
  const variancePenalty = varianceRatio * 0.35;
  const raw = (statusWeight * 0.55 + confidenceFactor * 0.45 - variancePenalty) * 100;
  return Math.max(0, Math.min(100, Math.round(raw)));
}

export function detectExecutionGaps(nodes: StrategyNode[]): ExecutionGap[] {
  const gaps: ExecutionGap[] = [];
  const nodeIds = new Set(nodes.map((n) => n.id));
  const parentIds = new Set(
    nodes.map((n) => n.parentId).filter((id): id is string => id !== null)
  );

  for (const node of nodes) {
    // 1. Orphaned child (missing parent) or un-cascaded strategic/coordination node
    if (node.parentId !== null && !nodeIds.has(node.parentId)) {
      gaps.push({
        id: `gap-orphan-parent-${node.id}`,
        nodeId: node.id,
        nodeTitle: node.title,
        flightLevel: node.flightLevel,
        ownerTeam: node.ownerTeam,
        type: 'ORPHAN_NODE',
        severity: 'HIGH',
        summary: 'References a missing parent objective; cascade link is broken.',
      });
    } else if (
      node.flightLevel !== 'FL1_OPERATIONAL' &&
      !parentIds.has(node.id)
    ) {
      gaps.push({
        id: `gap-orphan-leaf-${node.id}`,
        nodeId: node.id,
        nodeTitle: node.title,
        flightLevel: node.flightLevel,
        ownerTeam: node.ownerTeam,
        type: 'ORPHAN_NODE',
        severity: 'HIGH',
        summary: `No downstream ${
          node.flightLevel === 'FL3_STRATEGIC' ? 'Coordination' : 'Operational'
        } tier linked to execute this item.`,
      });
    }

    // 2. Target variance > 15%
    const varianceRatio = computeTargetVarianceRatio(
      node.proposedTarget,
      node.counterTarget
    );
    if (varianceRatio > 0.15) {
      const pct = Math.round(varianceRatio * 100);
      gaps.push({
        id: `gap-variance-${node.id}`,
        nodeId: node.id,
        nodeTitle: node.title,
        flightLevel: node.flightLevel,
        ownerTeam: node.ownerTeam,
        type: 'TARGET_VARIANCE',
        severity: pct >= 30 ? 'HIGH' : 'MEDIUM',
        summary: `Counter-offer (${node.counterTarget}${node.unit}) diverges by ${pct}% from proposed target (${node.proposedTarget}${node.unit}).`,
      });
    }

    // 3. Low team confidence (< 65%)
    if (node.confidence < 65) {
      gaps.push({
        id: `gap-confidence-${node.id}`,
        nodeId: node.id,
        nodeTitle: node.title,
        flightLevel: node.flightLevel,
        ownerTeam: node.ownerTeam,
        type: 'LOW_CONFIDENCE',
        severity: node.confidence < 50 ? 'HIGH' : 'MEDIUM',
        summary: `Team confidence is ${node.confidence}%, below the 65% execution threshold.`,
      });
    }

    // 4. Unresolved counter-offer or at-risk state
    if (node.status === 'COUNTER_OFFERED' || node.status === 'AT_RISK') {
      gaps.push({
        id: `gap-status-${node.id}`,
        nodeId: node.id,
        nodeTitle: node.title,
        flightLevel: node.flightLevel,
        ownerTeam: node.ownerTeam,
        type: 'UNRESOLVED_COUNTER',
        severity: node.status === 'AT_RISK' ? 'HIGH' : 'MEDIUM',
        summary:
          node.status === 'AT_RISK'
            ? 'Flagged At Risk during Catchball review; requires executive intervention.'
            : 'Pending leadership sign-off on team counter-offer.',
      });
    }
  }

  return gaps;
}

export function computeAlignmentTelemetry(
  nodes: StrategyNode[]
): AlignmentTelemetry {
  const levels: FlightLevel[] = [
    'FL3_STRATEGIC',
    'FL2_COORDINATION',
    'FL1_OPERATIONAL',
  ];

  const byFlightLevel: FlightLevelSummary[] = levels.map((fl) => {
    const group = nodes.filter((n) => n.flightLevel === fl);
    const nodeCount = group.length;
    const agreedCount = group.filter((n) => n.status === 'AGREED').length;
    const avgConfidence =
      nodeCount > 0
        ? Math.round(group.reduce((acc, n) => acc + n.confidence, 0) / nodeCount)
        : 0;
    const alignmentScore =
      nodeCount > 0
        ? Math.round(
            group.reduce((acc, n) => acc + computeNodeAlignment(n), 0) / nodeCount
          )
        : 0;

    return {
      flightLevel: fl,
      label: FLIGHT_LEVEL_META[fl].label,
      shortLabel: FLIGHT_LEVEL_META[fl].shortLabel,
      nodeCount,
      agreedCount,
      avgConfidence,
      alignmentScore,
    };
  });

  const totalNodes = nodes.length;
  const agreedNodes = nodes.filter((n) => n.status === 'AGREED').length;
  const agreementRate =
    totalNodes > 0 ? Math.round((agreedNodes / totalNodes) * 100) : 0;
  const avgConfidence =
    totalNodes > 0
      ? Math.round(nodes.reduce((acc, n) => acc + n.confidence, 0) / totalNodes)
      : 0;

  const gaps = detectExecutionGaps(nodes);
  const rawNodeAvg =
    totalNodes > 0
      ? nodes.reduce((acc, n) => acc + computeNodeAlignment(n), 0) / totalNodes
      : 0;
  const orphanPenalty =
    gaps.filter((g) => g.type === 'ORPHAN_NODE').length * 4;
  const enterpriseAlignmentIndex =
    totalNodes > 0
      ? Math.max(0, Math.min(100, Math.round(rawNodeAvg - orphanPenalty)))
      : 0;

  return {
    enterpriseAlignmentIndex,
    agreementRate,
    avgConfidence,
    totalNodes,
    agreedNodes,
    gaps,
    byFlightLevel,
  };
}

export function submitCatchballCounterOffer(
  nodes: StrategyNode[],
  nodeId: string,
  counterTarget: number,
  confidence: number,
  rationale: string
): StrategyNode[] {
  const safeConfidence = clampConfidence(confidence);
  const safeCounter = Number.isFinite(counterTarget) ? counterTarget : 0;
  const nextStatus: CatchballStatus =
    safeConfidence < 50 ? 'AT_RISK' : 'COUNTER_OFFERED';

  return nodes.map((node) =>
    node.id === nodeId
      ? {
          ...node,
          counterTarget: safeCounter,
          confidence: safeConfidence,
          rationale: rationale.trim() || node.rationale,
          status: nextStatus,
          updatedAt: new Date().toISOString(),
        }
      : node
  );
}

export function acceptCatchballAgreement(
  nodes: StrategyNode[],
  nodeId: string,
  adoptCounterTarget: boolean
): StrategyNode[] {
  return nodes.map((node) => {
    if (node.id !== nodeId) return node;
    const finalizedTarget = adoptCounterTarget
      ? node.counterTarget
      : node.proposedTarget;
    return {
      ...node,
      proposedTarget: finalizedTarget,
      counterTarget: finalizedTarget,
      status: 'AGREED',
      updatedAt: new Date().toISOString(),
    };
  });
}

export function addStrategyNode(
  nodes: StrategyNode[],
  input: Omit<StrategyNode, 'id' | 'updatedAt'>
): StrategyNode[] {
  const id = `node-${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .slice(2, 6)}`;
  const newNode: StrategyNode = {
    ...input,
    id,
    confidence: clampConfidence(input.confidence),
    proposedTarget: Number.isFinite(input.proposedTarget)
      ? input.proposedTarget
      : 0,
    counterTarget: Number.isFinite(input.counterTarget)
      ? input.counterTarget
      : 0,
    updatedAt: new Date().toISOString(),
  };
  return [...nodes, newNode];
}

export function deleteStrategyNode(
  nodes: StrategyNode[],
  nodeId: string
): StrategyNode[] {
  const toRemove = new Set<string>([nodeId]);
  let added = true;
  while (added) {
    added = false;
    for (const n of nodes) {
      if (n.parentId && toRemove.has(n.parentId) && !toRemove.has(n.id)) {
        toRemove.add(n.id);
        added = true;
      }
    }
  }
  return nodes.filter((n) => !toRemove.has(n.id));
}
