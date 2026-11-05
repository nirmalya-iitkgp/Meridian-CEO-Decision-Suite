import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { BASELINE_STRATEGY_NODES } from '../src/data/baselineStrategy';
import {
  acceptCatchballAgreement,
  addStrategyNode,
  computeAlignmentTelemetry,
  computeNodeAlignment,
  deleteStrategyNode,
  detectExecutionGaps,
  submitCatchballCounterOffer,
} from '../src/engine/alignmentEngine';
import {
  exportStrategyPlan,
  parseAndValidateStrategyJson,
} from '../src/engine/jsonSerializer';

describe('Blue-Pill Functional Tests: Alignment & Catchball Engine', () => {
  it('computes baseline telemetry and detects expected execution gaps', () => {
    const telemetry = computeAlignmentTelemetry(BASELINE_STRATEGY_NODES);
    assert.equal(telemetry.totalNodes, BASELINE_STRATEGY_NODES.length);
    assert.ok(
      telemetry.enterpriseAlignmentIndex > 0 &&
        telemetry.enterpriseAlignmentIndex <= 100
    );
    assert.ok(telemetry.gaps.length > 0);
  });

  it('transitions node to COUNTER_OFFERED or AT_RISK on Catchball counter-offer', () => {
    const updated = submitCatchballCounterOffer(
      BASELINE_STRATEGY_NODES,
      'strat-3',
      15,
      78,
      'Adjusted for Q2 pricing rollout.'
    );
    const targetNode = updated.find((n) => n.id === 'strat-3');
    assert.ok(targetNode);
    assert.equal(targetNode.counterTarget, 15);
    assert.equal(targetNode.confidence, 78);
    assert.equal(targetNode.status, 'COUNTER_OFFERED');

    const atRiskUpdate = submitCatchballCounterOffer(
      updated,
      'strat-3',
      10,
      42,
      'Engineering capacity shortfall.'
    );
    const atRiskNode = atRiskUpdate.find((n) => n.id === 'strat-3');
    assert.equal(atRiskNode?.status, 'AT_RISK');
  });

  it('locks in AGREED status and optionally adopts counter-offer target', () => {
    const agreed = acceptCatchballAgreement(
      BASELINE_STRATEGY_NODES,
      'goal-2',
      true
    );
    const goal2 = agreed.find((n) => n.id === 'goal-2');
    assert.ok(goal2);
    assert.equal(goal2.status, 'AGREED');
    assert.equal(goal2.proposedTarget, 118);
    assert.equal(goal2.counterTarget, 118);
    assert.ok(computeNodeAlignment(goal2) > 80);
  });

  it('detects orphan nodes when parent is missing or strategic node has no children', () => {
    const withOrphan = addStrategyNode(BASELINE_STRATEGY_NODES, {
      parentId: 'non-existent-parent',
      flightLevel: 'FL1_OPERATIONAL',
      ogsmType: 'MEASURE',
      title: 'Orphaned Operational Measure',
      ownerTeam: 'QA Squad',
      unit: '%',
      proposedTarget: 99,
      counterTarget: 99,
      confidence: 90,
      status: 'AGREED',
      rationale: 'Test orphan detection',
    });
    const gaps = detectExecutionGaps(withOrphan);
    assert.ok(gaps.some((g) => g.type === 'ORPHAN_NODE'));
  });

  it('cascades deletion to child nodes cleanly', () => {
    const afterDelete = deleteStrategyNode(BASELINE_STRATEGY_NODES, 'strat-1');
    assert.equal(
      afterDelete.some((n) => n.id === 'strat-1'),
      false
    );
    assert.equal(
      afterDelete.some((n) => n.id === 'meas-1'),
      false
    );
    assert.equal(
      afterDelete.some((n) => n.id === 'meas-2'),
      false
    );
  });

  it('round-trips strategy plan through JSON export and validated import', () => {
    const json = exportStrategyPlan(
      'FY2026 Test Plan',
      'FY2026',
      BASELINE_STRATEGY_NODES
    );
    const parsed = parseAndValidateStrategyJson(json);
    assert.equal(parsed.ok, true);
    if (parsed.ok) {
      assert.equal(parsed.data.planTitle, 'FY2026 Test Plan');
      assert.equal(parsed.data.nodes.length, BASELINE_STRATEGY_NODES.length);
    }
  });
});

describe('Red-Pill Security Tests: JSON Import Hardening', () => {
  it('strips __proto__ and constructor keys to prevent prototype pollution', () => {
    const maliciousJson = JSON.stringify({
      planTitle: 'Malicious Plan',
      fiscalYear: 'FY2026',
      __proto__: { polluted: true },
      constructor: { prototype: { polluted: true } },
      nodes: [
        {
          id: 'obj-safe',
          parentId: null,
          flightLevel: 'FL3_STRATEGIC',
          ogsmType: 'OBJECTIVE',
          title: 'Safe Objective',
          ownerTeam: 'CSO',
          unit: '%',
          proposedTarget: 20,
          counterTarget: 20,
          confidence: 90,
          status: 'AGREED',
          rationale: 'Valid',
          updatedAt: '2026-01-01T00:00:00.000Z',
        },
      ],
    });

    const result = parseAndValidateStrategyJson(maliciousJson);
    assert.equal(result.ok, true);
    assert.equal(({} as Record<string, unknown>).polluted, undefined);
  });

  it('rejects circular parent-child references', () => {
    const cyclicJson = JSON.stringify({
      planTitle: 'Cyclic Plan',
      fiscalYear: 'FY2026',
      nodes: [
        {
          id: 'node-a',
          parentId: 'node-b',
          flightLevel: 'FL3_STRATEGIC',
          ogsmType: 'OBJECTIVE',
          title: 'Node A',
          ownerTeam: 'Team A',
          unit: '%',
          proposedTarget: 10,
          counterTarget: 10,
          confidence: 80,
          status: 'PROPOSED',
          rationale: '',
          updatedAt: '2026-01-01T00:00:00.000Z',
        },
        {
          id: 'node-b',
          parentId: 'node-a',
          flightLevel: 'FL2_COORDINATION',
          ogsmType: 'STRATEGY',
          title: 'Node B',
          ownerTeam: 'Team B',
          unit: '%',
          proposedTarget: 10,
          counterTarget: 10,
          confidence: 80,
          status: 'PROPOSED',
          rationale: '',
          updatedAt: '2026-01-01T00:00:00.000Z',
        },
      ],
    });

    const result = parseAndValidateStrategyJson(cyclicJson);
    assert.equal(result.ok, false);
  });

  it('rejects unsafe node IDs containing script or special characters', () => {
    const xssIdJson = JSON.stringify({
      planTitle: 'XSS ID Plan',
      fiscalYear: 'FY2026',
      nodes: [
        {
          id: '<script>alert(1)</script>',
          parentId: null,
          flightLevel: 'FL3_STRATEGIC',
          ogsmType: 'OBJECTIVE',
          title: 'Bad ID',
          ownerTeam: 'CSO',
          unit: '%',
          proposedTarget: 10,
          counterTarget: 10,
          confidence: 80,
          status: 'PROPOSED',
          rationale: '',
          updatedAt: '2026-01-01T00:00:00.000Z',
        },
      ],
    });

    const result = parseAndValidateStrategyJson(xssIdJson);
    assert.equal(result.ok, false);
  });

  it('rejects oversized payloads exceeding 512 KB', () => {
    const hugeString = 'x'.repeat(520 * 1024);
    const result = parseAndValidateStrategyJson(hugeString);
    assert.equal(result.ok, false);
  });
});
