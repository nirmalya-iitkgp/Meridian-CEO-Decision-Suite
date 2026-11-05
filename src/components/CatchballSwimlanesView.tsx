import React, { useState } from 'react';
import { Check, Send } from 'lucide-react';
import { computeNodeAlignment } from '../engine/alignmentEngine';
import {
  CatchballStatus,
  FLIGHT_LEVEL_META,
  FlightLevel,
  OGSM_LABELS,
  StrategyNode,
} from '../types/strategy';
import { StatusIndicator } from './StatusIndicator';

interface CatchballSwimlanesViewProps {
  nodes: StrategyNode[];
  highlightedNodeId: string | null;
  onSubmitCounterOffer: (
    nodeId: string,
    counterTarget: number,
    confidence: number,
    rationale: string
  ) => void;
  onAcceptAgreement: (nodeId: string, adoptCounterTarget: boolean) => void;
}

interface SwimlaneCardProps {
  node: StrategyNode;
  parentTitle: string | null;
  isHighlighted: boolean;
  onSubmitCounterOffer: (
    nodeId: string,
    counterTarget: number,
    confidence: number,
    rationale: string
  ) => void;
  onAcceptAgreement: (nodeId: string, adoptCounterTarget: boolean) => void;
}

function SwimlaneCard({
  node,
  parentTitle,
  isHighlighted,
  onSubmitCounterOffer,
  onAcceptAgreement,
}: SwimlaneCardProps) {
  const [draftCounter, setDraftCounter] = useState<string>(
    String(node.counterTarget)
  );
  const [draftConfidence, setDraftConfidence] = useState<number>(
    node.confidence
  );
  const [draftRationale, setDraftRationale] = useState<string>(node.rationale);

  const alignmentScore = computeNodeAlignment(node);
  const parsedCounter = Number(draftCounter);
  const hasCounterDelta =
    Number.isFinite(parsedCounter) && parsedCounter !== node.proposedTarget;

  const handleCounterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!Number.isFinite(parsedCounter)) return;
    onSubmitCounterOffer(
      node.id,
      parsedCounter,
      draftConfidence,
      draftRationale
    );
  };

  return (
    <form
      onSubmit={handleCounterSubmit}
      className={`bg-white border rounded-xl p-5 transition-colors ${
        isHighlighted
          ? 'border-[#3730A3] ring-2 ring-[#3730A3]/15'
          : 'border-slate-200'
      }`}
    >
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mb-1">
            <span className="font-medium text-slate-700">{node.ownerTeam}</span>
            <span aria-hidden="true">·</span>
            <span>{OGSM_LABELS[node.ogsmType]}</span>
            {parentTitle && (
              <>
                <span aria-hidden="true">·</span>
                <span className="truncate max-w-xs">
                  Cascades from: {parentTitle}
                </span>
              </>
            )}
          </div>
          <h4 className="text-sm font-semibold text-slate-900">{node.title}</h4>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <span className="text-xs font-mono-tabular text-slate-500">
            Align{' '}
            <strong className="text-slate-900 font-semibold">
              {alignmentScore}
            </strong>
          </span>
          <StatusIndicator status={node.status} />
        </div>
      </div>

      {/* Interactive Catchball Negotiation Controls */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 pt-3 border-t border-slate-100">
        {/* Leadership Proposed Target (Read-only baseline) */}
        <div className="md:col-span-2">
          <span className="block text-xs text-slate-500 mb-1">
            Proposed Target
          </span>
          <div className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-mono-tabular font-semibold text-slate-900">
            {node.proposedTarget}
            {node.unit}
          </div>
        </div>

        {/* Team Counter-Offer Target Input */}
        <div className="md:col-span-3">
          <label
            htmlFor={`counter-${node.id}`}
            className="block text-xs font-medium text-slate-700 mb-1"
          >
            Counter-Offer ({node.unit || 'val'})
          </label>
          <input
            id={`counter-${node.id}`}
            type="number"
            step="any"
            value={draftCounter}
            onChange={(e) => setDraftCounter(e.target.value)}
            className="w-full px-3 py-2 text-sm font-mono-tabular bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-[#3730A3]"
          />
        </div>

        {/* Confidence Slider */}
        <div className="md:col-span-3">
          <div className="flex items-center justify-between mb-1">
            <label
              htmlFor={`conf-${node.id}`}
              className="text-xs font-medium text-slate-700"
            >
              Team Confidence
            </label>
            <span
              className={`text-xs font-mono-tabular font-semibold ${
                draftConfidence >= 75
                  ? 'text-[#059669]'
                  : draftConfidence >= 65
                    ? 'text-amber-700'
                    : 'text-red-600'
              }`}
            >
              {draftConfidence}%
            </span>
          </div>
          <input
            id={`conf-${node.id}`}
            type="range"
            min={0}
            max={100}
            value={draftConfidence}
            onChange={(e) => setDraftConfidence(Number(e.target.value))}
            className="w-full mt-2 accent-[#3730A3] cursor-pointer"
          />
        </div>

        {/* Rationale */}
        <div className="md:col-span-4">
          <label
            htmlFor={`rat-${node.id}`}
            className="block text-xs font-medium text-slate-700 mb-1"
          >
            Catchball Rationale
          </label>
          <input
            id={`rat-${node.id}`}
            type="text"
            value={draftRationale}
            onChange={(e) => setDraftRationale(e.target.value)}
            placeholder="Capacity, dependency, or risk note..."
            maxLength={500}
            className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-[#3730A3]"
          />
        </div>
      </div>

      {/* Catchball Action Row */}
      <div className="flex flex-wrap items-center justify-end gap-2.5 mt-4 pt-3 border-t border-slate-100">
        <button
          type="submit"
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-[#3730A3] bg-[#3730A3]/8 hover:bg-[#3730A3]/15 rounded-lg transition-colors whitespace-nowrap shrink-0"
        >
          <Send className="w-3.5 h-3.5" />
          <span>Submit Counter-Offer</span>
        </button>

        {hasCounterDelta ? (
          <button
            type="button"
            onClick={() => onAcceptAgreement(node.id, true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-white bg-[#059669] hover:bg-[#047857] rounded-lg transition-colors whitespace-nowrap shrink-0"
          >
            <Check className="w-3.5 h-3.5" />
            <span>
              Adopt {parsedCounter}
              {node.unit} &amp; Agree
            </span>
          </button>
        ) : (
          <button
            type="button"
            onClick={() => onAcceptAgreement(node.id, false)}
            disabled={node.status === 'AGREED'}
            className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 ${
              node.status === 'AGREED'
                ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                : 'text-white bg-[#059669] hover:bg-[#047857]'
            }`}
          >
            <Check className="w-3.5 h-3.5" />
            <span>{node.status === 'AGREED' ? 'Agreed' : 'Accept & Agree'}</span>
          </button>
        )}
      </div>
    </form>
  );
}

export function CatchballSwimlanesView({
  nodes,
  highlightedNodeId,
  onSubmitCounterOffer,
  onAcceptAgreement,
}: CatchballSwimlanesViewProps) {
  const [statusFilter, setStatusFilter] = useState<'ALL' | CatchballStatus>(
    'ALL'
  );

  const nodeTitleMap = new Map(nodes.map((n) => [n.id, n.title]));
  const levels: FlightLevel[] = [
    'FL3_STRATEGIC',
    'FL2_COORDINATION',
    'FL1_OPERATIONAL',
  ];

  const filteredNodes =
    statusFilter === 'ALL'
      ? nodes
      : nodes.filter((n) => n.status === statusFilter);

  return (
    <div className="space-y-6">
      {/* Status Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white border border-slate-200 rounded-xl p-4">
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg overflow-x-auto">
          {(
            [
              ['ALL', 'All Negotiations'],
              ['COUNTER_OFFERED', 'Counter-Offered'],
              ['AT_RISK', 'At Risk'],
              ['PROPOSED', 'Proposed'],
              ['AGREED', 'Agreed'],
            ] as const
          ).map(([key, label]) => {
            const count =
              key === 'ALL'
                ? nodes.length
                : nodes.filter((n) => n.status === key).length;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setStatusFilter(key)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                  statusFilter === key
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {label} ({count})
              </button>
            );
          })}
        </div>

        <p className="text-xs text-slate-500">
          Adjust counter-offers or confidence sliders to recalculate alignment
          across tiers.
        </p>
      </div>

      {/* Flight Level Swimlanes */}
      <div className="space-y-8">
        {levels.map((fl) => {
          const laneNodes = filteredNodes.filter((n) => n.flightLevel === fl);
          const totalInTier = nodes.filter((n) => n.flightLevel === fl).length;
          const agreedInTier = nodes.filter(
            (n) => n.flightLevel === fl && n.status === 'AGREED'
          ).length;

          return (
            <section key={fl} className="space-y-3">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">
                    {FLIGHT_LEVEL_META[fl].label}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {FLIGHT_LEVEL_META[fl].description}
                  </p>
                </div>
                <div className="text-xs font-mono-tabular text-slate-600">
                  <span className="font-semibold text-[#059669]">
                    {agreedInTier}
                  </span>
                  /{totalInTier} Agreed
                </div>
              </div>

              {laneNodes.length === 0 ? (
                <div className="bg-white border border-slate-200 rounded-xl p-6 text-center text-xs text-slate-500">
                  No items in {FLIGHT_LEVEL_META[fl].shortLabel} match the
                  selected filter.
                </div>
              ) : (
                <div className="space-y-3">
                  {laneNodes.map((node) => (
                    <SwimlaneCard
                      key={`${node.id}-${node.updatedAt}`}
                      node={node}
                      parentTitle={
                        node.parentId
                          ? nodeTitleMap.get(node.parentId) ?? null
                          : null
                      }
                      isHighlighted={highlightedNodeId === node.id}
                      onSubmitCounterOffer={onSubmitCounterOffer}
                      onAcceptAgreement={onAcceptAgreement}
                    />
                  ))}
                </div>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}
