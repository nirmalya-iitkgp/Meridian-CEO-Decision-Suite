import { AlertTriangle, ArrowUpRight, CheckCircle2 } from 'lucide-react';
import {
  AlignmentTelemetry,
  ExecutionGapType,
  FLIGHT_LEVEL_META,
  OGSM_LABELS,
  OgsmType,
  StrategyNode,
} from '../types/strategy';
import { StatusIndicator } from './StatusIndicator';

interface AlignmentTelemetryViewProps {
  nodes: StrategyNode[];
  telemetry: AlignmentTelemetry;
  onJumpToCatchball: (nodeId: string) => void;
}

interface RadialGaugeProps {
  label: string;
  value: number;
  suffix?: string;
  subtitle: string;
  accentColor: string;
}

function RadialGauge({
  label,
  value,
  suffix = '',
  subtitle,
  accentColor,
}: RadialGaugeProps) {
  const clamped = Math.max(0, Math.min(100, value));
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference - (clamped / 100) * circumference;

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 flex items-center gap-5">
      <div className="relative w-24 h-24 shrink-0 flex items-center justify-center">
        <svg className="w-24 h-24 -rotate-90" viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            stroke="#F1F5F9"
            strokeWidth="8"
          />
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            stroke={accentColor}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            className="transition-all duration-300"
          />
        </svg>
        <span className="absolute text-lg font-mono-tabular font-bold text-slate-900">
          {clamped}
          {suffix}
        </span>
      </div>

      <div className="min-w-0">
        <h3 className="text-sm font-semibold text-slate-900">{label}</h3>
        <p className="text-xs text-slate-500 mt-1">{subtitle}</p>
      </div>
    </div>
  );
}

const GAP_TYPE_LABELS: Record<ExecutionGapType, string> = {
  ORPHAN_NODE: 'Cascade Break',
  TARGET_VARIANCE: 'Target Variance',
  LOW_CONFIDENCE: 'Low Confidence',
  UNRESOLVED_COUNTER: 'Pending Sign-Off',
};

export function AlignmentTelemetryView({
  nodes,
  telemetry,
  onJumpToCatchball,
}: AlignmentTelemetryViewProps) {
  const ogsmOrder: OgsmType[] = ['OBJECTIVE', 'GOAL', 'STRATEGY', 'MEASURE'];

  return (
    <div className="space-y-6">
      {/* Real-Time Alignment Index Gauges */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <RadialGauge
          label="Enterprise Alignment Index"
          value={telemetry.enterpriseAlignmentIndex}
          subtitle="Weighted across Catchball agreement, confidence & target variance"
          accentColor="#3730A3"
        />
        <RadialGauge
          label="Catchball Agreement Rate"
          value={telemetry.agreementRate}
          suffix="%"
          subtitle={`${telemetry.agreedNodes} of ${telemetry.totalNodes} strategy nodes ratified`}
          accentColor="#059669"
        />
        <RadialGauge
          label="Mean Team Confidence"
          value={telemetry.avgConfidence}
          suffix="%"
          subtitle="Aggregate delivery confidence across all Flight Levels"
          accentColor={telemetry.avgConfidence >= 75 ? '#059669' : '#D97706'}
        />
      </div>

      {/* Flight Level Density & Alignment Breakdown */}
      <div className="bg-white border border-slate-200 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">
              Flight Level Alignment Density
            </h3>
            <p className="text-xs text-slate-500">
              Tier-by-tier alignment score, Catchball ratification, and team
              confidence
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {telemetry.byFlightLevel.map((tier) => (
            <div
              key={tier.flightLevel}
              className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-900">
                  {tier.shortLabel}
                </span>
                <span className="text-xs font-mono-tabular font-semibold text-[#3730A3]">
                  Index {tier.alignmentScore}
                </span>
              </div>

              <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#3730A3] rounded-full transition-all duration-300"
                  style={{ width: `${tier.alignmentScore}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-xs text-slate-600 font-mono-tabular">
                <span>
                  {tier.agreedCount}/{tier.nodeCount} Agreed
                </span>
                <span>{tier.avgConfidence}% Conf</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Execution Gap Diagnostics Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">
              Execution Gap Diagnostics ({telemetry.gaps.length})
            </h3>
            <p className="text-xs text-slate-500">
              Automatically flagged cascade breaks, target divergences (&gt;15%),
              and low-confidence commitments
            </p>
          </div>
        </div>

        {telemetry.gaps.length === 0 ? (
          <div className="p-10 text-center">
            <CheckCircle2 className="w-6 h-6 text-[#059669] mx-auto mb-2" />
            <p className="text-sm font-medium text-slate-900">
              Zero Execution Gaps Detected
            </p>
            <p className="text-xs text-slate-500 mt-0.5">
              All Flight Levels are cascaded, agreed, and above the 65%
              confidence threshold.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  <th className="py-2.5 px-4">Gap Type</th>
                  <th className="py-2.5 px-4">Tier</th>
                  <th className="py-2.5 px-4">Strategy Node</th>
                  <th className="py-2.5 px-4">Diagnostic Summary</th>
                  <th className="py-2.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {telemetry.gaps.map((gap) => (
                  <tr
                    key={gap.id}
                    className="hover:bg-slate-50/80 transition-colors"
                  >
                    <td className="py-2.5 px-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1.5 font-medium ${
                          gap.severity === 'HIGH'
                            ? 'text-red-700'
                            : 'text-amber-700'
                        }`}
                      >
                        <AlertTriangle
                          className="w-3.5 h-3.5 shrink-0"
                          aria-hidden="true"
                        />
                        {GAP_TYPE_LABELS[gap.type]}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-slate-600 whitespace-nowrap">
                      {FLIGHT_LEVEL_META[gap.flightLevel].shortLabel}
                    </td>
                    <td className="py-2.5 px-4 font-medium text-slate-900 max-w-xs truncate">
                      {gap.nodeTitle}
                    </td>
                    <td className="py-2.5 px-4 text-slate-600">
                      {gap.summary}
                    </td>
                    <td className="py-2.5 px-4 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => onJumpToCatchball(gap.nodeId)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-[#3730A3] hover:bg-[#3730A3]/10 rounded-md transition-colors"
                      >
                        <span>Resolve</span>
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Consolidated OGSM Deployment Matrix */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200">
          <h3 className="text-sm font-semibold text-slate-900">
            OGSM Deployment Matrix
          </h3>
          <p className="text-xs text-slate-500">
            Objectives, Goals, Strategies, and Measures with live Catchball
            ratification status
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                <th className="py-2.5 px-4">OGSM</th>
                <th className="py-2.5 px-4">Title</th>
                <th className="py-2.5 px-4">Owner</th>
                <th className="py-2.5 px-4 text-right">Target</th>
                <th className="py-2.5 px-4 text-right">Counter</th>
                <th className="py-2.5 px-4 text-right">Conf</th>
                <th className="py-2.5 px-4 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {ogsmOrder.flatMap((ogsmType) =>
                nodes
                  .filter((n) => n.ogsmType === ogsmType)
                  .map((n) => (
                    <tr
                      key={n.id}
                      className="hover:bg-slate-50/80 transition-colors"
                    >
                      <td className="py-2.5 px-4 font-medium text-[#3730A3] whitespace-nowrap">
                        {OGSM_LABELS[n.ogsmType]}
                      </td>
                      <td className="py-2.5 px-4 font-medium text-slate-900 max-w-sm truncate">
                        {n.title}
                      </td>
                      <td className="py-2.5 px-4 text-slate-600 whitespace-nowrap">
                        {n.ownerTeam}
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono-tabular text-slate-900 whitespace-nowrap">
                        {n.proposedTarget}
                        {n.unit}
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono-tabular text-slate-700 whitespace-nowrap">
                        {n.counterTarget}
                        {n.unit}
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono-tabular text-slate-900 whitespace-nowrap">
                        {n.confidence}%
                      </td>
                      <td className="py-2.5 px-4 text-right whitespace-nowrap">
                        <StatusIndicator status={n.status} />
                      </td>
                    </tr>
                  ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
