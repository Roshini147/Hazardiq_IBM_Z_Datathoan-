import React from 'react';
import { DecisionFlowStep } from './types';
import {
  Flame,
  Users,
  HeartHandshake,
  Building2,
  Navigation,
  CheckCircle2,
  ChevronRight,
  Filter,
} from 'lucide-react';

interface DecisionFlowStepperProps {
  currentStep: DecisionFlowStep;
  onSelectStep: (step: DecisionFlowStep) => void;
}

export const DecisionFlowStepper: React.FC<DecisionFlowStepperProps> = ({
  currentStep,
  onSelectStep,
}) => {
  const steps: {
    id: DecisionFlowStep;
    label: string;
    labelTa: string;
    sublabel: string;
    icon: any;
    color: string;
  }[] = [
    {
      id: 'hazard',
      label: '1. Hazard',
      labelTa: '1. பேரிடர்',
      sublabel: 'Flood & Surge Polygons',
      icon: Flame,
      color: '#dc2626',
    },
    {
      id: 'exposure',
      label: '2. Exposure',
      labelTa: '2. வெளிப்பாடு',
      sublabel: 'Population at Risk',
      icon: Users,
      color: '#ea580c',
    },
    {
      id: 'vulnerability',
      label: '3. Vulnerability',
      labelTa: '3. பாதிப்புத்தன்மை',
      sublabel: 'Habitations & Demographics',
      icon: HeartHandshake,
      color: '#eab308',
    },
    {
      id: 'capacity',
      label: '4. Capacity',
      labelTa: '4. தாங்குதிறன்',
      sublabel: 'Shelter Surplus & Deficit',
      icon: Building2,
      color: '#10b981',
    },
    {
      id: 'relocation',
      label: '5. Relocation',
      labelTa: '5. மறுகுடியேற்றம்',
      sublabel: 'P1 Priorities & Safe Hubs',
      icon: Navigation,
      color: '#2563eb',
    },
  ];

  return (
    <div className="bg-slate-900/95 backdrop-blur-md text-white px-3 py-2.5 rounded-xl border border-slate-800 shadow-xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          <span className="flex h-2 w-2 rounded-full bg-red-500 animate-ping" />
          <span className="text-[11px] font-mono font-bold tracking-wider uppercase text-slate-300">
            HAZARDIQ DECISION SUPPORT FLOW
          </span>
        </div>
        <button
          onClick={() => onSelectStep('all')}
          className={`text-[11px] px-2.5 py-0.5 rounded font-bold transition-all ${
            currentStep === 'all'
              ? 'bg-red-600 text-white shadow'
              : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
          }`}
        >
          View Full Composite Stack
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5">
        {steps.map((st, idx) => {
          const isActive = currentStep === st.id;
          const Icon = st.icon;
          return (
            <button
              key={st.id}
              onClick={() => onSelectStep(st.id)}
              className={`flex flex-col items-start p-2 rounded-lg text-left transition-all relative border ${
                isActive
                  ? 'bg-slate-800 text-white border-red-500 ring-2 ring-red-500/50 shadow-md'
                  : 'bg-slate-900/60 hover:bg-slate-800/80 text-slate-400 border-slate-800'
              }`}
            >
              <div className="flex items-center justify-between w-full mb-1">
                <span
                  className="p-1 rounded-md"
                  style={{
                    backgroundColor: isActive ? st.color : 'rgba(255,255,255,0.06)',
                    color: isActive ? '#ffffff' : st.color,
                  }}
                >
                  <Icon className="h-3.5 w-3.5" />
                </span>
                {isActive && (
                  <CheckCircle2 className="h-3.5 w-3.5 text-red-400" />
                )}
              </div>
              <span className={`text-xs font-black leading-tight ${isActive ? 'text-white' : 'text-slate-200'}`}>
                {st.label}
              </span>
              <span className="text-[10px] text-slate-400 truncate w-full mt-0.5">
                {st.sublabel}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
