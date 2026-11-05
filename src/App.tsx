import { useMemo, useState } from 'react';
import { Download, Plus, RotateCcw, Upload } from 'lucide-react';
import { AlignmentTelemetryView } from './components/AlignmentTelemetryView';
import { CascadingTreeView } from './components/CascadingTreeView';
import { CatchballSwimlanesView } from './components/CatchballSwimlanesView';
import { JsonImportModal } from './components/JsonImportModal';
import { NodeModal } from './components/NodeModal';
import {
  BASELINE_PLAN_META,
  BASELINE_STRATEGY_NODES,
} from './data/baselineStrategy';
import {
  acceptCatchballAgreement,
  addStrategyNode,
  computeAlignmentTelemetry,
  deleteStrategyNode,
  submitCatchballCounterOffer,
} from './engine/alignmentEngine';
import { exportStrategyPlan } from './engine/jsonSerializer';
import { StrategyNode, StrategyPlanDocument } from './types/strategy';

type ActiveTab = 'TREE' | 'CATCHBALL' | 'TELEMETRY';

export default function App() {
  const [planTitle, setPlanTitle] = useState(BASELINE_PLAN_META.planTitle);
  const [fiscalYear, setFiscalYear] = useState(BASELINE_PLAN_META.fiscalYear);
  const [nodes, setNodes] = useState<StrategyNode[]>(BASELINE_STRATEGY_NODES);
  const [activeTab, setActiveTab] = useState<ActiveTab>('TREE');
  const [highlightedNodeId, setHighlightedNodeId] = useState<string | null>(
    null
  );

  const [addModalParentId, setAddModalParentId] = useState<
    string | null | undefined
  >(undefined);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [bannerNotice, setBannerNotice] = useState<string | null>(null);

  const telemetry = useMemo(() => computeAlignmentTelemetry(nodes), [nodes]);

  const showNotice = (message: string) => {
    setBannerNotice(message);
    window.setTimeout(() => {
      setBannerNotice((prev) => (prev === message ? null : prev));
    }, 3500);
  };

  const handleSubmitCounterOffer = (
    nodeId: string,
    counterTarget: number,
    confidence: number,
    rationale: string
  ) => {
    setNodes((prev) =>
      submitCatchballCounterOffer(
        prev,
        nodeId,
        counterTarget,
        confidence,
        rationale
      )
    );
    showNotice('Catchball counter-offer recorded and alignment recalculated.');
  };

  const handleAcceptAgreement = (
    nodeId: string,
    adoptCounterTarget: boolean
  ) => {
    setNodes((prev) =>
      acceptCatchballAgreement(prev, nodeId, adoptCounterTarget)
    );
    showNotice('Catchball target ratified and marked Agreed.');
  };

  const handleAddNode = (input: Omit<StrategyNode, 'id' | 'updatedAt'>) => {
    setNodes((prev) => addStrategyNode(prev, input));
    showNotice('New strategy node added to cascade.');
  };

  const handleDeleteNode = (nodeId: string) => {
    setNodes((prev) => deleteStrategyNode(prev, nodeId));
    if (highlightedNodeId === nodeId) {
      setHighlightedNodeId(null);
    }
    showNotice('Strategy node removed from hierarchy.');
  };

  const handleJumpToCatchball = (nodeId: string) => {
    setHighlightedNodeId(nodeId);
    setActiveTab('CATCHBALL');
  };

  const handleExportJson = () => {
    const json = exportStrategyPlan(planTitle, fiscalYear, nodes);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${fiscalYear.toLowerCase()}-strategy-plan.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showNotice('Strategy plan exported as JSON snapshot.');
  };

  const handleImportPlan = (doc: StrategyPlanDocument) => {
    setPlanTitle(doc.planTitle);
    setFiscalYear(doc.fiscalYear);
    setNodes(doc.nodes);
    setHighlightedNodeId(null);
    showNotice(`Loaded "${doc.planTitle}" (${doc.nodes.length} nodes).`);
  };

  const handleResetBaseline = () => {
    setPlanTitle(BASELINE_PLAN_META.planTitle);
    setFiscalYear(BASELINE_PLAN_META.fiscalYear);
    setNodes(BASELINE_STRATEGY_NODES);
    setHighlightedNodeId(null);
    showNotice('Restored baseline FY2026 strategy deployment.');
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex flex-col">
      {/* Strict 3-Zone Top Bar Contract */}
      <header className="bg-white border-b border-slate-200 px-6 py-3.5">
        <div className="max-w-[1400px] mx-auto flex items-center justify-between gap-8">
          {/* Zone 1: Single-line Brand Wordmark */}
          <span className="font-display text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0">
            Meridian
          </span>

          {/* Zone 2: Primary View Tabs */}
          <nav
            aria-label="Primary workspace views"
            className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg"
          >
            <button
              type="button"
              onClick={() => setActiveTab('TREE')}
              className={`px-3.5 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                activeTab === 'TREE'
                  ? 'bg-white text-[#3730A3] shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Cascading Tree
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('CATCHBALL')}
              className={`px-3.5 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                activeTab === 'CATCHBALL'
                  ? 'bg-white text-[#3730A3] shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Catchball
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('TELEMETRY')}
              className={`px-3.5 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                activeTab === 'TELEMETRY'
                  ? 'bg-white text-[#3730A3] shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Alignment Telemetry
            </button>
          </nav>

          {/* Zone 3: Primary Action */}
          <div className="flex items-center shrink-0">
            <button
              type="button"
              onClick={() => setAddModalParentId(null)}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-[#3730A3] hover:bg-[#312E81] rounded-lg transition-colors whitespace-nowrap shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Node</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Executive Workspace */}
      <main className="flex-1 max-w-[1400px] w-full mx-auto px-6 py-6 space-y-6">
        {/* Workspace Context & Scenario Bar */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
              <span>{fiscalYear}</span>
              <span aria-hidden="true">·</span>
              <span>Hoshin Kanri &amp; OGSM Deployment</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono-tabular">
                {telemetry.totalNodes} Active Nodes
              </span>
            </div>
            <h1 className="text-xl font-bold text-slate-900 truncate">
              {planTitle}
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-6">
            {/* Live Executive Telemetry Strip */}
            <div className="flex items-center gap-6 pr-2 border-r border-slate-200">
              <div>
                <span className="block text-[11px] text-slate-500">
                  Alignment Index
                </span>
                <span className="text-base font-mono-tabular font-bold text-[#3730A3]">
                  {telemetry.enterpriseAlignmentIndex}/100
                </span>
              </div>
              <div>
                <span className="block text-[11px] text-slate-500">
                  Catchball Agreed
                </span>
                <span className="text-base font-mono-tabular font-bold text-[#059669]">
                  {telemetry.agreementRate}%
                </span>
              </div>
              <div>
                <span className="block text-[11px] text-slate-500">
                  Execution Gaps
                </span>
                <span
                  className={`text-base font-mono-tabular font-bold ${
                    telemetry.gaps.length > 0
                      ? 'text-amber-700'
                      : 'text-[#059669]'
                  }`}
                >
                  {telemetry.gaps.length}
                </span>
              </div>
            </div>

            {/* JSON Import / Export / Reset Controls */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsImportOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors whitespace-nowrap shrink-0"
              >
                <Upload className="w-3.5 h-3.5 text-slate-500" />
                <span>Import JSON</span>
              </button>
              <button
                type="button"
                onClick={handleExportJson}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors whitespace-nowrap shrink-0"
              >
                <Download className="w-3.5 h-3.5 text-slate-500" />
                <span>Export JSON</span>
              </button>
              <button
                type="button"
                onClick={handleResetBaseline}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 rounded-lg transition-colors whitespace-nowrap shrink-0"
                title="Reset to baseline FY2026 dataset"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>
            </div>
          </div>
        </div>

        {/* Transient Action Feedback */}
        {bannerNotice && (
          <div
            role="status"
            className="px-4 py-2.5 bg-[#059669]/10 border border-[#059669]/25 text-[#059669] text-xs font-medium rounded-lg"
          >
            {bannerNotice}
          </div>
        )}

        {/* Active View Canvas */}
        {activeTab === 'TREE' && (
          <CascadingTreeView
            nodes={nodes}
            highlightedNodeId={highlightedNodeId}
            onAddChild={(parentId) => setAddModalParentId(parentId)}
            onDeleteNode={handleDeleteNode}
            onJumpToCatchball={handleJumpToCatchball}
          />
        )}

        {activeTab === 'CATCHBALL' && (
          <CatchballSwimlanesView
            nodes={nodes}
            highlightedNodeId={highlightedNodeId}
            onSubmitCounterOffer={handleSubmitCounterOffer}
            onAcceptAgreement={handleAcceptAgreement}
          />
        )}

        {activeTab === 'TELEMETRY' && (
          <AlignmentTelemetryView
            nodes={nodes}
            telemetry={telemetry}
            onJumpToCatchball={handleJumpToCatchball}
          />
        )}
      </main>

      {/* Modals */}
      {addModalParentId !== undefined && (
        <NodeModal
          nodes={nodes}
          initialParentId={addModalParentId}
          onClose={() => setAddModalParentId(undefined)}
          onAdd={handleAddNode}
        />
      )}

      {isImportOpen && (
        <JsonImportModal
          onClose={() => setIsImportOpen(false)}
          onImport={handleImportPlan}
        />
      )}
    </div>
  );
}
