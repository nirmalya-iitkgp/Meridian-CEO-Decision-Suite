export type FlightLevel =
  | 'FL3_STRATEGIC'
  | 'FL2_COORDINATION'
  | 'FL1_OPERATIONAL';

export type OgsmType = 'OBJECTIVE' | 'GOAL' | 'STRATEGY' | 'MEASURE';

export type CatchballStatus =
  | 'PROPOSED'
  | 'COUNTER_OFFERED'
  | 'AGREED'
  | 'AT_RISK';

export interface StrategyNode {
  id: string;
  parentId: string | null;
  flightLevel: FlightLevel;
  ogsmType: OgsmType;
  title: string;
  ownerTeam: string;
  unit: string;
  proposedTarget: number;
  counterTarget: number;
  confidence: number;
  status: CatchballStatus;
  rationale: string;
  updatedAt: string;
}

export type ExecutionGapType =
  | 'ORPHAN_NODE'
  | 'TARGET_VARIANCE'
  | 'LOW_CONFIDENCE'
  | 'UNRESOLVED_COUNTER';

export interface ExecutionGap {
  id: string;
  nodeId: string;
  nodeTitle: string;
  flightLevel: FlightLevel;
  ownerTeam: string;
  type: ExecutionGapType;
  severity: 'HIGH' | 'MEDIUM';
  summary: string;
}

export interface FlightLevelSummary {
  flightLevel: FlightLevel;
  label: string;
  shortLabel: string;
  nodeCount: number;
  agreedCount: number;
  avgConfidence: number;
  alignmentScore: number;
}

export interface AlignmentTelemetry {
  enterpriseAlignmentIndex: number;
  agreementRate: number;
  avgConfidence: number;
  totalNodes: number;
  agreedNodes: number;
  gaps: ExecutionGap[];
  byFlightLevel: FlightLevelSummary[];
}

export interface StrategyPlanDocument {
  planTitle: string;
  fiscalYear: string;
  exportedAt: string;
  nodes: StrategyNode[];
}

export const FLIGHT_LEVEL_META: Record<
  FlightLevel,
  { label: string; shortLabel: string; tierNumber: number; description: string }
> = {
  FL3_STRATEGIC: {
    label: 'Flight Level 3 · Strategic',
    shortLabel: 'FL3 Strategic',
    tierNumber: 3,
    description: 'Executive Hoshin Objectives & Annual OGSM Goals',
  },
  FL2_COORDINATION: {
    label: 'Flight Level 2 · Coordination',
    shortLabel: 'FL2 Coordination',
    tierNumber: 2,
    description: 'Cross-Functional Value Stream Strategies & Milestones',
  },
  FL1_OPERATIONAL: {
    label: 'Flight Level 1 · Operational',
    shortLabel: 'FL1 Operational',
    tierNumber: 1,
    description: 'Team-Level Key Measures & Execution Commitments',
  },
};

export const OGSM_LABELS: Record<OgsmType, string> = {
  OBJECTIVE: 'Objective',
  GOAL: 'Goal',
  STRATEGY: 'Strategy',
  MEASURE: 'Measure',
};

export const STATUS_LABELS: Record<CatchballStatus, string> = {
  PROPOSED: 'Proposed',
  COUNTER_OFFERED: 'Counter-Offered',
  AGREED: 'Agreed',
  AT_RISK: 'At Risk',
};
