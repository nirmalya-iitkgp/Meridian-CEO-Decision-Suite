import React, { useMemo, useState } from 'react';
import {
  ChevronDown,
  ChevronRight,
  Plus,
  Search,
  Trash2,
} from 'lucide-react';
import { computeNodeAlignment } from '../engine/alignmentEngine';
import {
  FLIGHT_LEVEL_META,
  FlightLevel,
  OGSM_LABELS,
  StrategyNode,
} from '../types/strategy';
import { StatusIndicator } from './StatusIndicator';

interface CascadingTreeViewProps {
  nodes: StrategyNode[];
  highlightedNodeId: string | null;
  onAddChild: (parentId: string) => void;
  onDeleteNode: (nodeId: string) => void;
  onJumpToCatchball: (nodeId: string) => void;
}

export function CascadingTreeView({
  nodes,
  highlightedNodeId,
  onAddChild,
  onDeleteNode,
  onJumpToCatchball,
}: CascadingTreeViewProps) {
  const [levelFilter, setLevelFilter] = useState<'ALL' | FlightLevel>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [collapsedIds, setCollapsedIds] = useState<Set<string>>(new Set());

  const toggleCollapse = (id: string) => {
    setCollapsedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const childrenMap = useMemo(() => {
    const map = new Map<string | null, StrategyNode[]>();
    for (const node of nodes) {
      const key =
        node.parentId && nodes.some((n) => n.id === node.parentId)
          ? node.parentId
          : null;
      const list = map.get(key) ?? [];
      list.push(node);
      map.set(key, list);
    }
    return map;
  }, [nodes]);

  const matchesFilter = (node: StrategyNode): boolean => {
    const matchesLevel =
      levelFilter === 'ALL' || node.flightLevel === levelFilter;
    const q = searchQuery.trim().toLowerCase();
    const matchesSearch =
      !q ||
      node.title.toLowerCase().includes(q) ||
      node.ownerTeam.toLowerCase().includes(q) ||
      OGSM_LABELS[node.ogsmType].toLowerCase().includes(q);
    return matchesLevel && matchesSearch;
  };

  const hasMatchingDescendant = (nodeId: string): boolean => {
    const kids = childrenMap.get(nodeId) ?? [];
    for (const kid of kids) {
      if (matchesFilter(kid) || hasMatchingDescendant(kid.id)) {
        return true;
      }
    }
    return false;
  };

  const renderBranch = (node: StrategyNode, depth: number): React.ReactNode => {
    const isVisible = matchesFilter(node) || hasMatchingDescendant(node.id);
    if (!isVisible) return null;

    const children = childrenMap.get(node.id) ?? [];
    const visibleChildren = children.filter(
      (c) => matchesFilter(c) || hasMatchingDescendant(c.id)
    );
    const isCollapsed = collapsedIds.has(node.id);
    const alignmentScore = computeNodeAlignment(node);
    const isHighlighted = highlightedNodeId === node.id;
    const hasVariance = node.proposedTarget !== node.counterTarget;

    return (
      <div key={node.id} className="relative">
        <div
          className={`group relative bg-white border rounded-xl p-4 transition-colors ${
            isHighlighted
              ? 'border-[#3730A3] ring-2 ring-[#3730A3]/15'
              : 'border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="min-w-0 flex-1">
              {/* Quiet unboxed metadata line with typographic separators */}
              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mb-1">
                <span className="font-medium text-[#3730A3]">
                  {FLIGHT_LEVEL_META[node.flightLevel].shortLabel}
                </span>
                <span aria-hidden="true">·</span>
                <span>{OGSM_LABELS[node.ogsmType]}</span>
                <span aria-hidden="true">·</span>
                <span>{node.ownerTeam}</span>
              </div>

              <div className="flex items-center gap-2.5">
                {children.length > 0 && (
                  <button
                    type="button"
                    onClick={() => toggleCollapse(node.id)}
                    className="p-1 -ml-1 text-slate-400 hover:text-[#3730A3] rounded transition-colors shrink-0"
                    aria-label={
                      isCollapsed ? 'Expand child nodes' : 'Collapse child nodes'
                    }
                  >
                    {isCollapsed ? (
                      <ChevronRight className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </button>
                )}
                <h3 className="text-sm font-semibold text-slate-900 truncate">
                  {node.title}
                </h3>
              </div>
            </div>

            {/* Tabular metrics & semantic status */}
            <div className="flex flex-wrap items-center gap-5 shrink-0">
              <div className="flex items-center gap-4 text-xs">
                <div>
                  <span className="text-slate-400 block">Target</span>
                  <span className="font-mono-tabular font-semibold text-slate-900">
                    {node.proposedTarget}
                    {node.unit}
                  </span>
                </div>

                {hasVariance && (
                  <div>
                    <span className="text-amber-600 block">Counter</span>
                    <span className="font-mono-tabular font-semibold text-amber-700">
                      {node.counterTarget}
                      {node.unit}
                    </span>
                  </div>
                )}

                <div>
                  <span className="text-slate-400 block">Confidence</span>
                  <span className="font-mono-tabular font-semibold text-slate-900">
                    {node.confidence}%
                  </span>
                </div>

                <div>
                  <span className="text-slate-400 block">Alignment</span>
                  <span
                    className={`font-mono-tabular font-semibold ${
                      alignmentScore >= 80
                        ? 'text-[#059669]'
                        : alignmentScore >= 60
                          ? 'text-amber-700'
                          : 'text-red-600'
                    }`}
                  >
                    {alignmentScore}
                  </span>
                </div>
              </div>

              <StatusIndicator status={node.status} />

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => onJumpToCatchball(node.id)}
                  className="px-2.5 py-1.5 text-xs font-medium text-[#3730A3] bg-[#3730A3]/8 hover:bg-[#3730A3]/15 rounded-lg transition-colors whitespace-nowrap shrink-0"
                >
                  Catchball
                </button>
                {node.flightLevel !== 'FL1_OPERATIONAL' && (
                  <button
                    type="button"
                    onClick={() => onAddChild(node.id)}
                    className="p-1.5 text-slate-500 hover:text-[#3730A3] hover:bg-slate-100 rounded-lg transition-colors"
                    title="Cascade child objective or measure"
                    aria-label="Cascade child node"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => onDeleteNode(node.id)}
                  className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="Remove node"
                  aria-label="Remove node"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Deep Indigo (#3730A3) Cascading Connector Lines & Children */}
        {!isCollapsed && visibleChildren.length > 0 && (
          <div className="relative pl-8 mt-3 space-y-3">
            {/* Vertical indigo trunk line */}
            <svg
              className="absolute left-3 top-0 bottom-4 w-5 h-full pointer-events-none"
              aria-hidden="true"
            >
              <line
                x1="2"
                y1="0"
                x2="2"
                y2="100%"
                stroke="#3730A3"
                strokeWidth="1.75"
                strokeOpacity="0.35"
              />
            </svg>

            {visibleChildren.map((child) => (
              <div key={child.id} className="relative">
                {/* Horizontal indigo branch connector */}
                <svg
                  className="absolute -left-5 top-6 w-5 h-4 pointer-events-none"
                  viewBox="0 0 20 16"
                  fill="none"
                  aria-hidden="true"
                >
                  <path
                    d="M 2 0 Q 2 10 12 10 L 20 10"
                    stroke="#3730A3"
                    strokeWidth="1.75"
                    strokeOpacity="0.55"
                    fill="none"
                  />
                  <circle cx="18" cy="10" r="2" fill="#3730A3" fillOpacity="0.7" />
                </svg>
                {renderBranch(child, depth + 1)}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const rootNodes = childrenMap.get(null) ?? [];
  const visibleRoots = rootNodes.filter(
    (r) => matchesFilter(r) || hasMatchingDescendant(r.id)
  );

  return (
    <div className="space-y-6">
      {/* Filter & Search Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-slate-200 rounded-xl p-4">
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg overflow-x-auto">
          <button
            type="button"
            onClick={() => setLevelFilter('ALL')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
              levelFilter === 'ALL'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All Tiers ({nodes.length})
          </button>
          {(Object.keys(FLIGHT_LEVEL_META) as FlightLevel[]).map((fl) => {
            const count = nodes.filter((n) => n.flightLevel === fl).length;
            return (
              <button
                key={fl}
                type="button"
                onClick={() => setLevelFilter(fl)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                  levelFilter === fl
                    ? 'bg-white text-[#3730A3] shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {FLIGHT_LEVEL_META[fl].shortLabel} ({count})
              </button>
            );
          })}
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filter objectives, teams, OGSM..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:bg-white focus:border-[#3730A3]"
          />
        </div>
      </div>

      {/* Cascading Goal Tree */}
      {visibleRoots.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center">
          <p className="text-sm font-medium text-slate-900 mb-1">
            No matching strategy nodes found
          </p>
          <p className="text-xs text-slate-500">
            Adjust your Flight Level filter or search query to inspect the
            cascading hierarchy.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {visibleRoots.map((root) => renderBranch(root, 0))}
        </div>
      )}
    </div>
  );
}
