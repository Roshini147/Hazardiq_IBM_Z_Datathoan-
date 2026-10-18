import React from 'react';
import { DataSourceProvenance } from './types';
import { ShieldCheck, Cpu, FlaskConical, Info } from 'lucide-react';

interface DataTransparencyBadgeProps {
  source: DataSourceProvenance;
  attribution?: string;
  showExplanation?: boolean;
}

export const DataTransparencyBadge: React.FC<DataTransparencyBadgeProps> = ({
  source,
  attribution,
  showExplanation = false,
}) => {
  const configs: Record<
    DataSourceProvenance,
    { label: string; icon: any; bg: string; text: string; border: string; desc: string }
  > = {
    AUTHORITATIVE: {
      label: 'Authoritative Official Data',
      icon: ShieldCheck,
      bg: 'bg-blue-50',
      text: 'text-blue-700',
      border: 'border-blue-300',
      desc: 'Sourced from official government bodies (Greater Chennai Corporation, Census of India, TNDRRA, IMD, INCOIS).',
    },
    DERIVED: {
      label: 'Derived / Calculated Metric',
      icon: Cpu,
      bg: 'bg-purple-50',
      text: 'text-purple-700',
      border: 'border-purple-300',
      desc: 'Calculated by the HAZARDIQ decision-support engine using spatial-risk weighting (Hazard × Exposure × Vulnerability ÷ Capacity).',
    },
    SIMULATED: {
      label: 'Simulated Demonstration Data',
      icon: FlaskConical,
      bg: 'bg-amber-50',
      text: 'text-amber-800',
      border: 'border-amber-300',
      desc: 'Demonstration and simulated field telemetry for academic evaluation. Not official government telemetry.',
    },
  };

  const c = configs[source] || configs.AUTHORITATIVE;
  const Icon = c.icon;

  return (
    <div className="inline-flex flex-col gap-1">
      <div
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold border shadow-xs ${c.bg} ${c.text} ${c.border}`}
        title={c.desc}
      >
        <Icon className="h-3.5 w-3.5 shrink-0" />
        <span>{c.label}</span>
      </div>
      {attribution && (
        <span className="text-[10px] text-slate-500 font-medium pl-0.5">
          Source: {attribution}
        </span>
      )}
      {showExplanation && (
        <div className="flex items-start gap-1 text-[10px] text-slate-500 bg-slate-50 p-2 rounded border border-slate-200 mt-1">
          <Info className="h-3 w-3 text-slate-400 mt-0.5 shrink-0" />
          <span>{c.desc}</span>
        </div>
      )}
    </div>
  );
};
