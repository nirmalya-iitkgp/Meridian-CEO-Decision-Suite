import React, { useState } from 'react';
import { Upload, X } from 'lucide-react';
import { parseAndValidateStrategyJson } from '../engine/jsonSerializer';
import { StrategyPlanDocument } from '../types/strategy';

interface JsonImportModalProps {
  onClose: () => void;
  onImport: (doc: StrategyPlanDocument) => void;
}

export function JsonImportModal({ onClose, onImport }: JsonImportModalProps) {
  const [rawText, setRawText] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 512 * 1024) {
      setError('Selected file exceeds the 512 KB security limit.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setRawText(reader.result);
        setError(null);
      }
    };
    reader.onerror = () => {
      setError('Failed to read the selected file.');
    };
    reader.readAsText(file);
  };

  const handleApply = (e: React.FormEvent) => {
    e.preventDefault();
    const result = parseAndValidateStrategyJson(rawText);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    onImport(result.data);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-[1px] p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="import-json-title"
    >
      <div className="w-full max-w-lg bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <h2
            id="import-json-title"
            className="text-base font-semibold text-slate-900"
          >
            Import Strategy Plan JSON
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

        <form onSubmit={handleApply} className="p-6 space-y-4">
          {error && (
            <div className="p-3 text-xs font-medium text-red-700 bg-red-50 border border-red-200 rounded-lg">
              {error}
            </div>
          )}

          <div>
            <label className="inline-flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg cursor-pointer transition-colors">
              <Upload className="w-3.5 h-3.5 text-[#3730A3]" />
              <span>Choose .json Snapshot File</span>
              <input
                type="file"
                accept=".json,application/json"
                onChange={handleFileChange}
                className="sr-only"
              />
            </label>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1.5">
              Or Paste Strategy JSON Payload
            </label>
            <textarea
              rows={8}
              value={rawText}
              onChange={(e) => {
                setRawText(e.target.value);
                if (error) setError(null);
              }}
              placeholder='{"planTitle": "FY2026 Plan", "fiscalYear": "FY2026", "nodes": [...]}'
              className="w-full px-3 py-2 text-xs font-mono-tabular bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-[#3730A3] focus:bg-white"
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
              Validate &amp; Load Plan
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
