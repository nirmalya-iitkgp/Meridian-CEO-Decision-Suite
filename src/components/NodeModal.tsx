import React, { useState } from 'react';
import { X } from 'lucide-react';
import {
  FLIGHT_LEVEL_META,
  FlightLevel,
  OGSM_LABELS,
  OgsmType,
  StrategyNode,
} from '../types/strategy';

interface NodeModalProps {
  nodes: StrategyNode[];
  initialParentId?: string | null;
  onClose: () => void;
  onAdd: (node: Omit<StrategyNode, 'id' | 'updatedAt'>) => void;
}

const DEFAULT_OGSM_FOR_LEVEL: Record<FlightLevel, OgsmType> = {
  FL3_STRATEGIC: 'GOAL',
  FL2_COORDINATION: 'STRATEGY',
  FL1_OPERATIONAL: 'MEASURE',
};

export function NodeModal({
  nodes,
  initialParentId = null,
  onClose,
  onAdd,
}: NodeModalProps) {
  const parentNode = nodes.find((n) => n.id === initialParentId) ?? null;
  const defaultLevel: FlightLevel =
    parentNode?.flightLevel === 'FL3_STRATEGIC'
      ? 'FL2_COORDINATION'
      : parentNode?.flightLevel === 'FL2_COORDINATION'
        ? 'FL1_OPERATIONAL'
        : 'FL3_STRATEGIC';

  const [flightLevel, setFlightLevel] = useState<FlightLevel>(defaultLevel);
  const [ogsmType, setOgsmType] = useState<OgsmType>(
    DEFAULT_OGSM_FOR_LEVEL[defaultLevel]
  );
  const [parentId, setParentId] = useState<string>(initialParentId ?? '');
  const [title, setTitle] = useState('');
  const [ownerTeam, setOwnerTeam] = useState('');
  const [unit, setUnit] = useState('%');
  const [proposedTarget, setProposedTarget] = useState('25');
  const [confidence, setConfidence] = useState(80);
  const [rationale, setRationale] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleLevelChange = (nextLevel: FlightLevel) => {
    setFlightLevel(nextLevel);
    setOgsmType(DEFAULT_OGSM_FOR_LEVEL[nextLevel]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedTitle = title.trim();
    const trimmedTeam = ownerTeam.trim();
    const numericTarget = Number(proposedTarget);

    if (!trimmedTitle) {
      setError('Please enter an objective, strategy, or measure title.');
      return;
    }
    if (!trimmedTeam) {
      setError('Please specify an owner team or executive sponsor.');
      return;
    }
    if (!Number.isFinite(numericTarget)) {
      setError('Proposed target must be a valid number.');
      return;
    }

    onAdd({
      parentId: parentId || null,
      flightLevel,
      ogsmType,
      title: trimmedTitle,
      ownerTeam: trimmedTeam,
      unit: unit.trim(),
      proposedTarget: numericTarget,
      counterTarget: numericTarget,
      confidence,
      status: 'PROPOSED',
      rationale:
        rationale.trim() || 'Initial target proposed for Catchball review.',
    });
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-[1px] p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-node-title"
    >
      <div className="w-full max-w-lg bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <h2
            id="add-node-title"
            className="text-base font-semibold text-slate-900"
          >
            Add Cascading Strategy Node
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg transition-colors"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 text-xs font-medium text-red-700 bg-red-50 border border-red-200 rounded-lg">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5">
                Flight Level
              </label>
              <select
                value={flightLevel}
                onChange={(e) =>
                  handleLevelChange(e.target.value as FlightLevel)
                }
                className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-[#3730A3]"
              >
                {(Object.keys(FLIGHT_LEVEL_META) as FlightLevel[]).map((fl) => (
                  <option key={fl} value={fl}>
                    {FLIGHT_LEVEL_META[fl].shortLabel}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5">
                OGSM Classification
              </label>
              <select
                value={ogsmType}
                onChange={(e) => setOgsmType(e.target.value as OgsmType)}
                className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-[#3730A3]"
              >
                {(Object.keys(OGSM_LABELS) as OgsmType[]).map((type) => (
                  <option key={type} value={type}>
                    {OGSM_LABELS[type]}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1.5">
              Cascades From (Parent Node)
            </label>
            <select
              value={parentId}
              onChange={(e) => setParentId(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-[#3730A3]"
            >
              <option value="">None (Top-Level Root Objective)</option>
              {nodes.map((n) => (
                <option key={n.id} value={n.id}>
                  [{FLIGHT_LEVEL_META[n.flightLevel].shortLabel}] {n.title}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1.5">
              Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Reduce Mean Time to Recovery Across Core APIs"
              maxLength={160}
              className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-[#3730A3]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-1">
              <label className="block text-xs font-medium text-slate-700 mb-1.5">
                Owner Team
              </label>
              <input
                type="text"
                value={ownerTeam}
                onChange={(e) => setOwnerTeam(e.target.value)}
                placeholder="e.g., Platform SRE"
                maxLength={80}
                className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-[#3730A3]"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5">
                Proposed Target
              </label>
              <input
                type="number"
                step="any"
                value={proposedTarget}
                onChange={(e) => setProposedTarget(e.target.value)}
                className="w-full px-3 py-2 text-sm font-mono-tabular bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-[#3730A3]"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5">
                Unit
              </label>
              <input
                type="text"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                placeholder="%, ms, $"
                maxLength={24}
                className="w-full px-3 py-2 text-sm font-mono-tabular bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-[#3730A3]"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-medium text-slate-700">
                Initial Confidence
              </label>
              <span className="text-xs font-mono-tabular font-semibold text-[#3730A3]">
                {confidence}%
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              value={confidence}
              onChange={(e) => setConfidence(Number(e.target.value))}
              className="w-full accent-[#3730A3] cursor-pointer"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1.5">
              Strategic Context / Rationale
            </label>
            <textarea
              rows={2}
              value={rationale}
              onChange={(e) => setRationale(e.target.value)}
              placeholder="Optional context for Catchball negotiation..."
              maxLength={500}
              className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-[#3730A3]"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-medium text-white bg-[#3730A3] hover:bg-[#312E81] rounded-lg transition-colors"
            >
              Create Strategy Node
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
