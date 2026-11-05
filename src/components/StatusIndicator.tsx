import {
  AlertTriangle,
  ArrowLeftRight,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import { CatchballStatus, STATUS_LABELS } from '../types/strategy';

interface StatusIndicatorProps {
  status: CatchballStatus;
}

export function StatusIndicator({ status }: StatusIndicatorProps) {
  switch (status) {
    case 'AGREED':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-medium bg-[#059669]/10 text-[#059669] border border-[#059669]/25 whitespace-nowrap shrink-0">
          <CheckCircle2 className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
          <span>{STATUS_LABELS[status]}</span>
        </span>
      );
    case 'COUNTER_OFFERED':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-medium bg-amber-50 text-amber-800 border border-amber-200 whitespace-nowrap shrink-0">
          <ArrowLeftRight className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
          <span>{STATUS_LABELS[status]}</span>
        </span>
      );
    case 'AT_RISK':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-medium bg-red-50 text-red-700 border border-red-200 whitespace-nowrap shrink-0">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
          <span>{STATUS_LABELS[status]}</span>
        </span>
      );
    case 'PROPOSED':
    default:
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-medium bg-[#3730A3]/10 text-[#3730A3] border border-[#3730A3]/20 whitespace-nowrap shrink-0">
          <Clock className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
          <span>{STATUS_LABELS[status]}</span>
        </span>
      );
  }
}
