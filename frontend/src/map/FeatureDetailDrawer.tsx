import React from 'react';
import {
  X,
  AlertTriangle,
  Users,
  Building2,
  Navigation,
  Compass,
  Activity,
  HeartHandshake,
  CheckCircle2,
  PhoneCall,
  ExternalLink,
  ShieldCheck,
  Flame,
  ArrowRight,
  TrendingDown,
  Info,
} from 'lucide-react';
import { DataTransparencyBadge } from './DataTransparencyBadge';
import { RiskZoneFeature, HabitationFeature, ShelterFeature, IncidentReportFeature } from './types';

interface FeatureDetailDrawerProps {
  selectedFeature: {
    type: 'ZONE' | 'HABITATION' | 'SHELTER' | 'REPORT' | 'GEOJSON';
    data: any;
  } | null;
  onClose: () => void;
  onNavigateToShelter?: (shelterId: string) => void;
  onFocusCoordinates?: (coords: [number, number]) => void;
}

export const FeatureDetailDrawer: React.FC<FeatureDetailDrawerProps> = ({
  selectedFeature,
  onClose,
  onNavigateToShelter,
  onFocusCoordinates,
}) => {
  if (!selectedFeature) return null;

  const { type, data } = selectedFeature;

  return (
    <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[85vh] animate-in slide-in-from-right duration-200 text-slate-800">
      {/* ======================================================== */}
      {/* 1. ZONE INSPECTION VIEW */}
      {/* ======================================================== */}
      {type === 'ZONE' && (
        <>
          <div className="bg-slate-900 text-white px-5 py-4 flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-red-600 text-white uppercase">
                  {data.code}
                </span>
                <span
                  className="text-[10px] font-bold px-2 py-0.5 rounded text-white"
                  style={{ backgroundColor: data.color }}
                >
                  {data.riskLevel}
                </span>
              </div>
              <h3 className="text-base font-black text-white">{data.name}</h3>
              <p className="text-xs text-slate-300 flex items-center gap-1.5 mt-0.5">
                <Compass className="h-3.5 w-3.5 text-red-400" />
                <span>Hazard Type: <strong>{data.hazardType}</strong></span>
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="p-5 overflow-y-auto space-y-4 text-xs">
            {/* Score & Priority highlight */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-red-50 border border-red-200 rounded-xl p-3">
                <span className="text-[10px] font-bold uppercase tracking-wider text-red-700 block">
                  Composite Risk Score
                </span>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-2xl font-black text-red-600">{data.riskScore}</span>
                  <span className="text-slate-500 font-bold">/ 100</span>
                </div>
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600 block">
                  Relocation Priority
                </span>
                <div className="mt-1">
                  <span className="text-xs font-black text-red-700 bg-red-100 border border-red-200 px-2 py-0.5 rounded inline-block">
                    {data.priority}
                  </span>
                </div>
              </div>
            </div>

            {/* Demographics & Exposed Population */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <span className="font-bold text-slate-700 flex items-center gap-1.5">
                  <Users className="h-4 w-4 text-blue-600" /> Exposed Population
                </span>
                <span className="font-mono font-black text-sm text-slate-900">
                  {data.exposedPopulation.toLocaleString()} persons
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 pt-1 text-[11px] text-slate-600">
                <div>Households: <strong>{data.households.toLocaleString()}</strong></div>
                <div>Children: <strong>{data.vulnerableGroups.children}</strong></div>
                <div>Elderly: <strong>{data.vulnerableGroups.elderly}</strong></div>
                <div>Persons with Disabilities: <strong>{data.vulnerableGroups.pwd}</strong></div>
              </div>
            </div>

            {/* Carrying Capacity & Deficit */}
            <div className="bg-amber-50/60 border border-amber-200 rounded-xl p-3.5 space-y-2">
              <span className="font-bold text-amber-900 text-xs block">
                Shelter Carrying Capacity Analysis
              </span>
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div>Local Capacity: <strong>{data.carryingCapacity}</strong></div>
                <div>Available Shelter: <strong>{data.availableShelterCapacity}</strong></div>
              </div>
              <div className="bg-amber-100/80 p-2 rounded-lg text-amber-900 font-medium">
                Capacity Deficit: <strong className="text-red-700">+{data.capacityDeficit} persons</strong> must be relocated to external safe hubs.
              </div>
            </div>

            {/* Recommended Action */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-3.5 space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-800 block">
                Recommended Relocation Action
              </span>
              <p className="text-blue-900 font-semibold leading-relaxed">
                {data.recommendedAction}
              </p>
            </div>

            {/* Risk factors */}
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1.5">
                Key Contributing Risk Drivers
              </span>
              <ul className="space-y-1 text-slate-600">
                {data.riskFactors.map((rf: string, i: number) => (
                  <li key={i} className="flex items-start gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-red-500 mt-1.5 shrink-0" />
                    <span>{rf}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Data transparency */}
            <div className="pt-2 border-t border-slate-200">
              <DataTransparencyBadge
                source={data.dataSource}
                attribution={data.sourceAttribution}
                showExplanation
              />
            </div>
          </div>
        </>
      )}

      {/* ======================================================== */}
      {/* 2. HABITATION INSPECTION VIEW */}
      {/* ======================================================== */}
      {type === 'HABITATION' && (
        <>
          <div className="bg-slate-900 text-white px-5 py-4 flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-amber-600 text-white uppercase">
                  WARD {data.wardNumber}
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-red-600 text-white">
                  {data.priorityCode} PRIORITY
                </span>
              </div>
              <h3 className="text-base font-black text-white">{data.name}</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                {data.zoneName} • Coordinates: {data.coordinates[0].toFixed(3)}, {data.coordinates[1].toFixed(3)}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="p-5 overflow-y-auto space-y-4 text-xs">
            {/* Habitation Demographics */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <span className="font-bold text-slate-700">Settlement Population</span>
                <span className="text-base font-mono font-black text-slate-900">
                  {data.population.toLocaleString()} residents
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600 pt-1">
                <div>Children under 12: <strong>{data.children}</strong></div>
                <div>Elderly (60+): <strong>{data.elderly}</strong></div>
                <div>Disabled / PwD: <strong className="text-red-700">{data.pwd}</strong></div>
                <div>Households: <strong>{data.households}</strong></div>
              </div>
            </div>

            {/* Vulnerability & Elevation factors */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl">
                <span className="text-[10px] font-bold uppercase tracking-wider text-red-700 block">
                  Vulnerability Score
                </span>
                <span className="text-2xl font-black text-red-600 mt-1 block">
                  {data.vulnerabilityScore} / 100
                </span>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600 block">
                  Composite Risk
                </span>
                <span className="text-2xl font-black text-slate-800 mt-1 block">
                  {data.riskScore} / 100
                </span>
              </div>
            </div>

            {/* Terrain & Drainage status */}
            <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-3.5 space-y-1.5 text-[11px]">
              <div>
                <strong>Terrain Elevation:</strong> {data.terrainElevation}
              </div>
              <div>
                <strong>Drainage Bottleneck:</strong> {data.drainageCapacity}
              </div>
            </div>

            {/* Recommended Relocation Hub */}
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3.5 space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 block">
                Designated Safe Evacuation Destination
              </span>
              <p className="text-emerald-950 font-bold text-xs">
                {data.recommendedSafeArea}
              </p>
              {data.recommendedShelterId && onNavigateToShelter && (
                <button
                  onClick={() => onNavigateToShelter(data.recommendedShelterId)}
                  className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 hover:text-emerald-900 mt-1"
                >
                  <span>Locate Designated Shelter on Map</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* Transparency Badge */}
            <div className="pt-2 border-t border-slate-200">
              <DataTransparencyBadge
                source={data.dataSource}
                attribution={data.sourceAttribution}
                showExplanation
              />
            </div>
          </div>
        </>
      )}

      {/* ======================================================== */}
      {/* 3. SHELTER INSPECTION VIEW */}
      {/* ======================================================== */}
      {type === 'SHELTER' && (
        <>
          <div className="bg-slate-900 text-white px-5 py-4 flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-600 text-white uppercase">
                  {data.code}
                </span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded text-white ${
                    data.status === 'AVAILABLE'
                      ? 'bg-emerald-600'
                      : data.status === 'LIMITED'
                      ? 'bg-amber-500'
                      : 'bg-rose-600'
                  }`}
                >
                  {data.status}
                </span>
              </div>
              <h3 className="text-base font-black text-white">{data.name}</h3>
              <p className="text-xs text-slate-400 mt-0.5">{data.location}</p>
            </div>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="p-5 overflow-y-auto space-y-4 text-xs">
            {/* Warning if FULL */}
            {data.fullWarning && (
              <div className="p-3 bg-red-50 border border-red-300 rounded-xl text-red-800 flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
                <span className="font-bold">{data.fullWarning}</span>
              </div>
            )}

            {/* Capacity Progress Bar */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                <span>Shelter Occupancy</span>
                <span>
                  {data.occupancy.toLocaleString()} / {data.capacity.toLocaleString()} beds
                </span>
              </div>
              {/* Progress bar */}
              <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
                <div
                  className={`h-full transition-all duration-500 ${
                    data.status === 'AVAILABLE'
                      ? 'bg-emerald-500'
                      : data.status === 'LIMITED'
                      ? 'bg-amber-500'
                      : 'bg-rose-600'
                  }`}
                  style={{
                    width: `${Math.min(100, (data.occupancy / data.capacity) * 100)}%`,
                  }}
                />
              </div>
              <div className="flex items-center justify-between text-[11px] pt-1">
                <span className="text-emerald-700 font-bold">
                  Available Capacity: {data.available.toLocaleString()} persons
                </span>
                <span className="text-slate-500">
                  {Math.round((data.occupancy / data.capacity) * 100)}% full
                </span>
              </div>
            </div>

            {/* Suitability & Accessibility */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 block">
                  Suitability Score
                </span>
                <span className="text-2xl font-black text-emerald-600 mt-1 block">
                  {data.suitabilityScore} / 100
                </span>
              </div>
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl">
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-800 block">
                  Accessibility Score
                </span>
                <span className="text-2xl font-black text-blue-600 mt-1 block">
                  {data.accessibilityScore} / 100
                </span>
              </div>
            </div>

            {/* Amenities Checklist */}
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-2">
                Facility Amenities & Logistics
              </span>
              <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-700">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2
                    className={`h-3.5 w-3.5 ${
                      data.medicalSupport ? 'text-emerald-600' : 'text-slate-300'
                    }`}
                  />
                  <span>Medical Ward</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2
                    className={`h-3.5 w-3.5 ${
                      data.powerBackup ? 'text-emerald-600' : 'text-slate-300'
                    }`}
                  />
                  <span>Generator Backup</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2
                    className={`h-3.5 w-3.5 ${
                      data.drinkingWater ? 'text-emerald-600' : 'text-slate-300'
                    }`}
                  />
                  <span>Drinking Water Supply</span>
                </div>
              </div>
              <ul className="mt-2 space-y-1 text-slate-600 text-[11px]">
                {data.amenities.map((am: string, i: number) => (
                  <li key={i} className="flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />
                    <span>{am}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Contact Person */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                Nodal Liaison Officer
              </span>
              <div className="font-bold text-slate-900">{data.contactPerson}</div>
              <div className="flex items-center gap-1.5 text-blue-600 font-mono font-bold mt-0.5">
                <PhoneCall className="h-3.5 w-3.5" />
                <span>{data.contactPhone}</span>
              </div>
            </div>

            {/* Transparency Badge */}
            <div className="pt-2 border-t border-slate-200">
              <DataTransparencyBadge
                source={data.dataSource}
                attribution={data.sourceAttribution}
                showExplanation
              />
            </div>
          </div>
        </>
      )}

      {/* ======================================================== */}
      {/* 4. INCIDENT REPORT VIEW */}
      {/* ======================================================== */}
      {type === 'REPORT' && (
        <>
          <div className="bg-slate-900 text-white px-5 py-4 flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-red-600 text-white uppercase">
                  {data.reportId}
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-800 text-amber-300 border border-slate-700">
                  {data.severity} SEVERITY
                </span>
              </div>
              <h3 className="text-base font-black text-white">{data.hazardType} Incident</h3>
              <p className="text-xs text-slate-400 mt-0.5">{data.location}</p>
            </div>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="p-5 overflow-y-auto space-y-4 text-xs">
            {data.photoUrl && (
              <div className="rounded-xl overflow-hidden border border-slate-200 max-h-48">
                <img
                  src={data.photoUrl}
                  alt="Incident field capture"
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                Field Dispatch Description
              </span>
              <p className="text-slate-800 leading-relaxed font-medium">
                {data.description}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600">
              <div>Zone: <strong>{data.zone}</strong></div>
              <div>Reported: <strong>{data.timestamp}</strong></div>
              <div>Status: <strong className="text-emerald-700">{data.status}</strong></div>
              <div>Verified By: <strong>{data.verifiedBy || 'Citizen Nodal Desk'}</strong></div>
            </div>

            {/* Transparency Badge */}
            <div className="pt-2 border-t border-slate-200">
              <DataTransparencyBadge
                source={data.dataSource}
                attribution={data.sourceAttribution}
                showExplanation
              />
            </div>
          </div>
        </>
      )}

      {/* ======================================================== */}
      {/* 5. GEOJSON FEATURE VIEW */}
      {/* ======================================================== */}
      {type === 'GEOJSON' && (
        <>
          <div className="bg-slate-900 text-white px-5 py-4 flex items-start justify-between">
            <div>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-blue-600 text-white uppercase">
                GEOJSON VECTOR LAYER
              </span>
              <h3 className="text-base font-black text-white mt-1">
                {data.name || 'Hydro-Hazard Spatial Envelope'}
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                {data.type || 'Catchment Basin Polygon'}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="p-5 overflow-y-auto space-y-4 text-xs">
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2">
              <div><strong>Category:</strong> {data.riskCategory || 'Flood Buffer'}</div>
              {data.peakDischargeCusecs && (
                <div><strong>Peak Discharge:</strong> {data.peakDischargeCusecs}</div>
              )}
              {data.waterDepthAvg && (
                <div><strong>Average Water Depth:</strong> {data.waterDepthAvg}</div>
              )}
              {data.waveHeightEstimate && (
                <div><strong>Estimated Wave Surge:</strong> {data.waveHeightEstimate}</div>
              )}
            </div>

            <div className="pt-2 border-t border-slate-200">
              <DataTransparencyBadge
                source={data.dataSource || 'AUTHORITATIVE'}
                attribution={data.attribution || 'Official GCC / PWD GIS Hydrology'}
                showExplanation
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
};
