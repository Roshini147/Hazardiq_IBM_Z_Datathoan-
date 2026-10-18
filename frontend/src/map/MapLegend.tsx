import React, { useState } from 'react';
import {
  ChevronDown,
  ChevronUp,
  ShieldAlert,
  Building2,
  Users,
  AlertTriangle,
  Navigation,
  Info,
} from 'lucide-react';

export const MapLegend: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="bg-slate-900/95 backdrop-blur-md text-white rounded-xl shadow-2xl border border-slate-800 text-xs w-72 overflow-hidden transition-all">
      {/* Header */}
      <div
        onClick={() => setCollapsed(!collapsed)}
        className="px-3.5 py-2.5 flex items-center justify-between cursor-pointer hover:bg-slate-800/60 select-none border-b border-slate-800"
      >
        <div className="flex items-center gap-2">
          <ShieldAlert className="h-4 w-4 text-red-500" />
          <span className="font-mono font-bold text-[12px] tracking-wide text-slate-100">
            MAP LEGEND & RISK MATRIX
          </span>
        </div>
        <button className="text-slate-400 hover:text-white">
          {collapsed ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>
      </div>

      {!collapsed && (
        <div className="p-3.5 space-y-3.5 max-h-96 overflow-y-auto">
          {/* Risk Level Categories */}
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
              Multi-Hazard Risk Severity
            </span>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between p-1.5 rounded bg-slate-800/40 border border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-sm bg-red-600 ring-1 ring-red-400" />
                  <span className="font-bold text-red-400">Critical / High Risk</span>
                </div>
                <span className="text-[10px] text-slate-400">Score 75–100 (P1)</span>
              </div>
              <div className="flex items-center justify-between p-1.5 rounded bg-slate-800/40 border border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-sm bg-amber-500 ring-1 ring-amber-400" />
                  <span className="font-bold text-amber-400">Moderate Risk</span>
                </div>
                <span className="text-[10px] text-slate-400">Score 50–74 (P2/P3)</span>
              </div>
              <div className="flex items-center justify-between p-1.5 rounded bg-slate-800/40 border border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-sm bg-emerald-600 ring-1 ring-emerald-400" />
                  <span className="font-bold text-emerald-400">Low / Safer Zone</span>
                </div>
                <span className="text-[10px] text-slate-400">Score &lt; 50 (P4)</span>
              </div>
            </div>
          </div>

          {/* Map Entities */}
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
              Tactical Map Entities
            </span>
            <div className="grid grid-cols-1 gap-1.5 text-[11px]">
              <div className="flex items-center gap-2">
                <div className="h-5 w-5 rounded-full bg-red-600 flex items-center justify-center text-[10px] text-white font-bold shrink-0">
                  <Users className="h-3 w-3" />
                </div>
                <span className="text-slate-300">Vulnerable Habitation (P1/P2)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-5 w-5 rounded-lg bg-emerald-500 flex items-center justify-center text-white shrink-0">
                  <Building2 className="h-3 w-3" />
                </div>
                <span className="text-slate-300">Relief Shelter (Available capacity)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-5 w-5 rounded-lg bg-amber-500 flex items-center justify-center text-white shrink-0">
                  <Building2 className="h-3 w-3" />
                </div>
                <span className="text-slate-300">Relief Shelter (Limited capacity)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-5 w-5 rounded-lg bg-rose-600 flex items-center justify-center text-white shrink-0">
                  <Building2 className="h-3 w-3" />
                </div>
                <span className="text-slate-300">Relief Shelter (FULL capacity)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-5 w-5 rounded-full bg-amber-600 flex items-center justify-center text-white shrink-0">
                  <AlertTriangle className="h-3 w-3" />
                </div>
                <span className="text-slate-300">Citizen / Volunteer Field Report</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-5 h-0.5 border-t-2 border-dashed border-blue-400 shrink-0" />
                <span className="text-slate-300">Prioritized Evacuation Corridor</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-5 h-2 bg-blue-500/30 border border-blue-400 shrink-0 rounded-xs" />
                <span className="text-slate-300">Riverine / Coastal Flood Buffer (GeoJSON)</span>
              </div>
            </div>
          </div>

          {/* Data Provenance Transparency */}
          <div className="pt-2 border-t border-slate-800 text-[10px] space-y-1">
            <span className="font-bold text-slate-400 block uppercase tracking-wider">
              Data Transparency Guide
            </span>
            <div className="flex items-center gap-1.5 text-blue-400">
              <span className="h-1.5 w-1.5 rounded-full bg-blue-400" />
              <span><strong>Authoritative:</strong> GCC Census 2011, TNDRRA</span>
            </div>
            <div className="flex items-center gap-1.5 text-purple-400">
              <span className="h-1.5 w-1.5 rounded-full bg-purple-400" />
              <span><strong>Derived:</strong> HAZARDIQ Decision Matrix</span>
            </div>
            <div className="flex items-center gap-1.5 text-amber-400">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
              <span><strong>Simulated:</strong> Prototype Telemetry</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
