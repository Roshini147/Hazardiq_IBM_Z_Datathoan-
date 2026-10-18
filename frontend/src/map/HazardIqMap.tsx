import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  MapContainer,
  TileLayer,
  Polygon,
  Marker,
  CircleMarker,
  Popup,
  Tooltip,
  Polyline,
  GeoJSON,
  useMap,
} from 'react-leaflet';
import L from 'leaflet';
import {
  Search,
  Filter,
  Layers,
  ShieldCheck,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  Upload,
  CheckCircle2,
  X,
  Compass,
  Radio,
  Users,
  Building2,
  Database,
  ArrowRight,
} from 'lucide-react';
import {
  RiskZoneFeature,
  HabitationFeature,
  ShelterFeature,
  IncidentReportFeature,
  EvacuationRouteVector,
  LayerVisibilityState,
  FilterState,
  DecisionFlowStep,
  SelectedFeatureState,
} from './types';
import { gisService, GisSyncStatus } from './gisService';
import {
  createHabitationIcon,
  createShelterIcon,
  createReportIcon,
} from './customIcons';
import { MapControls, CHENNAI_CENTER, CHENNAI_BOUNDS } from './MapControls';
import { MapLegend } from './MapLegend';
import { LayerControlModal } from './LayerControlModal';
import { DecisionFlowStepper } from './DecisionFlowStepper';
import { FeatureDetailDrawer } from './FeatureDetailDrawer';
import { DataTransparencyBadge } from './DataTransparencyBadge';

// Helper controller to dynamically fly map to coordinates
const MapFlyToController: React.FC<{
  targetCoords: [number, number] | null;
  targetZoom?: number;
}> = ({ targetCoords, targetZoom = 14 }) => {
  const map = useMap();
  useEffect(() => {
    if (targetCoords) {
      map.flyTo(targetCoords, targetZoom, {
        duration: 1.2,
        easeLinearity: 0.25,
      });
    }
  }, [targetCoords, targetZoom, map]);
  return null;
};

interface HazardIqMapProps {
  onSelectFeature?: (feature: any) => void;
  selectedZoneId?: string;
  initialFilter?: string;
  className?: string;
}

export const HazardIqMap: React.FC<HazardIqMapProps> = ({
  onSelectFeature,
  selectedZoneId,
  initialFilter = 'all',
  className = '',
}) => {
  // Data state
  const [zones, setZones] = useState<RiskZoneFeature[]>([]);
  const [habitations, setHabitations] = useState<HabitationFeature[]>([]);
  const [shelters, setShelters] = useState<ShelterFeature[]>([]);
  const [reports, setReports] = useState<IncidentReportFeature[]>([]);
  const [evacuationRoutes, setEvacuationRoutes] = useState<EvacuationRouteVector[]>([]);
  const [floodGeoJson, setFloodGeoJson] = useState<GeoJSON.FeatureCollection | null>(null);
  const [customGeoJson, setCustomGeoJson] = useState<GeoJSON.FeatureCollection | null>(null);
  const [customGeoJsonName, setCustomGeoJsonName] = useState<string>('');

  // Sync / Backend status
  const [syncStatus, setSyncStatus] = useState<GisSyncStatus>(gisService.getSyncStatus());
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Selected feature & active inspection
  const [selectedFeature, setSelectedFeature] = useState<SelectedFeatureState | null>(null);
  const [flyTarget, setFlyTarget] = useState<[number, number] | null>(null);

  // UI Modals & Panels
  const [showLayerModal, setShowLayerModal] = useState<boolean>(false);
  const [showLegend, setShowLegend] = useState<boolean>(true);
  const [showFilters, setShowFilters] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Filter state
  const [filters, setFilters] = useState<FilterState>({
    hazardType: 'all',
    riskLevel: 'all',
    priorityCode: 'all',
    shelterStatus: 'all',
    decisionStep: 'all',
    searchQuery: '',
  });

  // Layer visibility state
  const [layers, setLayers] = useState<LayerVisibilityState>({
    baseMap: true,
    highRiskZones: true,
    mediumRiskZones: true,
    lowRiskZones: true,
    habitations: true,
    shelters: true,
    reports: true,
    evacuationRoutes: true,
    shelterBuffers: true,
    floodPlainGeoJson: true,
    customGeoJson: true,
  });

  // Load all initial GIS datasets from gisService (supports FastAPI backend + fallback)
  useEffect(() => {
    let isMounted = true;
    const loadData = async () => {
      setIsLoading(true);
      await gisService.checkBackendHealth();
      const [z, h, s, r] = await Promise.all([
        gisService.getRiskZones(),
        gisService.getHabitations(),
        gisService.getShelters(),
        gisService.getIncidentReports(),
      ]);

      if (isMounted) {
        setZones(z);
        setHabitations(h);
        setShelters(s);
        setReports(r);
        setEvacuationRoutes(gisService.getEvacuationRoutes());
        setFloodGeoJson(gisService.getFloodPlainGeoJson());
        setSyncStatus(gisService.getSyncStatus());
        setIsLoading(false);

        // Auto select zone if prop provided
        if (selectedZoneId) {
          const match = z.find((x) => x.id === selectedZoneId || x.code === selectedZoneId);
          if (match) {
            setSelectedFeature({ type: 'ZONE', data: match });
            setFlyTarget(match.center);
          }
        }
      }
    };

    loadData();
    return () => {
      isMounted = false;
    };
  }, [selectedZoneId]);

  // Handle Layer Toggle
  const handleToggleLayer = (key: keyof LayerVisibilityState) => {
    setLayers((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleResetLayers = () => {
    setLayers({
      baseMap: true,
      highRiskZones: true,
      mediumRiskZones: true,
      lowRiskZones: true,
      habitations: true,
      shelters: true,
      reports: true,
      evacuationRoutes: true,
      shelterBuffers: true,
      floodPlainGeoJson: true,
      customGeoJson: true,
    });
  };

  // Handle Feature Selection
  const handleSelect = (type: SelectedFeatureState['type'], data: any) => {
    setSelectedFeature({ type, data });
    if (data.center) {
      setFlyTarget(data.center);
    } else if (data.coordinates) {
      setFlyTarget(data.coordinates);
    }
    if (onSelectFeature) {
      onSelectFeature({ type, data });
    }
  };

  // Handle decision flow step change
  const handleDecisionStep = (step: DecisionFlowStep) => {
    setFilters((prev) => ({ ...prev, decisionStep: step }));
    if (step === 'hazard') {
      setLayers((prev) => ({ ...prev, highRiskZones: true, mediumRiskZones: true, floodPlainGeoJson: true }));
    } else if (step === 'exposure') {
      setLayers((prev) => ({ ...prev, habitations: true, highRiskZones: true }));
    } else if (step === 'vulnerability') {
      setLayers((prev) => ({ ...prev, habitations: true }));
    } else if (step === 'capacity') {
      setLayers((prev) => ({ ...prev, shelters: true, shelterBuffers: true }));
    } else if (step === 'relocation') {
      setLayers((prev) => ({ ...prev, evacuationRoutes: true, shelters: true, habitations: true }));
    }
  };

  // Filtered datasets based on multi-hazard filters & search
  const filteredZones = useMemo(() => {
    return zones.filter((z) => {
      // Risk level filter
      if (filters.riskLevel !== 'all' && z.riskLevel !== filters.riskLevel) return false;
      // Hazard type filter
      if (filters.hazardType !== 'all' && !z.hazardType.toLowerCase().includes(filters.hazardType.toLowerCase())) {
        return false;
      }
      // Decision step filter
      if (filters.decisionStep === 'hazard' && z.riskLevel === 'Low') return false;
      if (filters.decisionStep === 'relocation' && z.priorityCode !== 'P1' && z.priorityCode !== 'P2') {
        return false;
      }
      // Search filter
      if (filters.searchQuery) {
        const q = filters.searchQuery.toLowerCase();
        return (
          z.name.toLowerCase().includes(q) ||
          z.code.toLowerCase().includes(q) ||
          z.areaName.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [zones, filters]);

  const filteredHabitations = useMemo(() => {
    return habitations.filter((h) => {
      if (filters.priorityCode !== 'all' && h.priorityCode !== filters.priorityCode) return false;
      if (filters.decisionStep === 'vulnerability' && h.vulnerabilityScore < 70) return false;
      if (filters.searchQuery) {
        const q = filters.searchQuery.toLowerCase();
        return (
          h.name.toLowerCase().includes(q) ||
          h.zoneName.toLowerCase().includes(q) ||
          `ward ${h.wardNumber}`.includes(q)
        );
      }
      return true;
    });
  }, [habitations, filters]);

  const filteredShelters = useMemo(() => {
    return shelters.filter((s) => {
      if (filters.shelterStatus !== 'all' && s.status !== filters.shelterStatus) return false;
      if (filters.decisionStep === 'capacity' && s.available <= 0) return false;
      if (filters.searchQuery) {
        const q = filters.searchQuery.toLowerCase();
        return (
          s.name.toLowerCase().includes(q) ||
          s.location.toLowerCase().includes(q) ||
          s.code.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [shelters, filters]);

  // Handle Custom GeoJSON file upload
  const handleGeoJsonUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const json = JSON.parse(event.target?.result as string);
          setCustomGeoJson(json);
          setCustomGeoJsonName(file.name);
          setLayers((prev) => ({ ...prev, customGeoJson: true }));
        } catch {
          alert('Invalid GeoJSON file format.');
        }
      };
      reader.readAsText(file);
    }
  };

  // Instant Search Results list
  const searchResults = useMemo(() => {
    if (!filters.searchQuery || filters.searchQuery.length < 2) return [];
    const q = filters.searchQuery.toLowerCase();
    const results: { id: string; name: string; type: string; coords: [number, number]; raw: any }[] = [];

    zones.forEach((z) => {
      if (z.name.toLowerCase().includes(q) || z.code.toLowerCase().includes(q)) {
        results.push({ id: z.id, name: `${z.code} — ${z.name}`, type: 'Risk Zone', coords: z.center, raw: z });
      }
    });

    habitations.forEach((h) => {
      if (h.name.toLowerCase().includes(q) || `ward ${h.wardNumber}`.includes(q)) {
        results.push({ id: h.id, name: h.name, type: 'Habitation', coords: h.coordinates, raw: h });
      }
    });

    shelters.forEach((s) => {
      if (s.name.toLowerCase().includes(q) || s.location.toLowerCase().includes(q)) {
        results.push({ id: s.id, name: s.name, type: 'Shelter', coords: s.coordinates, raw: s });
      }
    });

    return results.slice(0, 5);
  }, [filters.searchQuery, zones, habitations, shelters]);

  return (
    <div className={`relative flex flex-col w-full h-[720px] rounded-2xl overflow-hidden border border-slate-200 shadow-xl bg-slate-900 ${className}`}>
      {/* ======================================================== */}
      {/* 1. TOP HEADER & DECISION FLOW CONTROLS */}
      {/* ======================================================== */}
      <div className="z-[1010] p-3 space-y-2.5 bg-slate-900/90 backdrop-blur-md border-b border-slate-800">
        {/* Row 1: Search bar, quick filters, backend sync pill */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Free instant search bar */}
          <div className="relative flex-1 max-w-md">
            <div className="relative flex items-center">
              <Search className="absolute left-3 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search zones, habitations, shelters, or wards (e.g. Velachery, Kasimedu)..."
                value={filters.searchQuery}
                onChange={(e) => setFilters((prev) => ({ ...prev, searchQuery: e.target.value }))}
                className="w-full pl-9 pr-8 py-2 bg-slate-800 text-white placeholder-slate-400 text-xs rounded-xl border border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              />
              {filters.searchQuery && (
                <button
                  onClick={() => setFilters((prev) => ({ ...prev, searchQuery: '' }))}
                  className="absolute right-2.5 text-slate-400 hover:text-white"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Instant search autocomplete results */}
            {searchResults.length > 0 && (
              <div className="absolute left-0 right-0 top-10 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl mt-1 overflow-hidden z-[1050]">
                {searchResults.map((res) => (
                  <button
                    key={res.id}
                    onClick={() => {
                      setFlyTarget(res.coords);
                      if (res.type === 'Risk Zone') handleSelect('ZONE', res.raw);
                      else if (res.type === 'Habitation') handleSelect('HABITATION', res.raw);
                      else if (res.type === 'Shelter') handleSelect('SHELTER', res.raw);
                      setFilters((prev) => ({ ...prev, searchQuery: '' }));
                    }}
                    className="w-full px-3.5 py-2.5 text-left text-xs hover:bg-slate-800 flex items-center justify-between border-b border-slate-800/80 last:border-0"
                  >
                    <div>
                      <div className="font-bold text-white">{res.name}</div>
                      <div className="text-[10px] text-slate-400">{res.type}</div>
                    </div>
                    <ArrowRight className="h-3.5 w-3.5 text-slate-400" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Quick Action Buttons & Backend Status */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Filter Toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all border ${
                showFilters || filters.hazardType !== 'all' || filters.riskLevel !== 'all'
                  ? 'bg-blue-600 text-white border-blue-500 shadow-md'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
              }`}
            >
              <Filter className="h-3.5 w-3.5" />
              <span>Filters</span>
            </button>

            {/* Layers Toggle */}
            <button
              onClick={() => setShowLayerModal(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-all"
            >
              <Layers className="h-3.5 w-3.5 text-blue-400" />
              <span>Layers</span>
            </button>

            {/* Upload GeoJSON button */}
            <label className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 cursor-pointer transition-all">
              <Upload className="h-3.5 w-3.5 text-emerald-400" />
              <span className="hidden sm:inline">Add GeoJSON</span>
              <input
                type="file"
                ref={fileInputRef}
                accept=".json,.geojson"
                onChange={handleGeoJsonUpload}
                className="hidden"
              />
            </label>

            {/* Data Provenance & Backend Connectivity Indicator */}
            <div
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[11px] font-mono font-bold border ${
                syncStatus.isBackendConnected
                  ? 'bg-emerald-950/60 text-emerald-300 border-emerald-800'
                  : 'bg-blue-950/60 text-blue-300 border-blue-800'
              }`}
              title={
                syncStatus.isBackendConnected
                  ? 'Connected to HAZARDIQ FastAPI Backend'
                  : 'Running on Authoritative Static Demonstration Cache'
              }
            >
              <span
                className={`h-2 w-2 rounded-full ${
                  syncStatus.isBackendConnected ? 'bg-emerald-400 animate-pulse' : 'bg-blue-400'
                }`}
              />
              <span>
                {syncStatus.isBackendConnected ? 'FastAPI Live' : 'Authoritative GIS Cache'}
              </span>
            </div>
          </div>
        </div>

        {/* Collapsible Filter Bar */}
        {showFilters && (
          <div className="pt-2 border-t border-slate-800 flex flex-wrap items-center gap-2 animate-in fade-in duration-150">
            {/* Hazard Type selector */}
            <select
              value={filters.hazardType}
              onChange={(e) => setFilters((prev) => ({ ...prev, hazardType: e.target.value }))}
              className="px-2.5 py-1.5 rounded-lg bg-slate-800 text-slate-200 text-xs border border-slate-700 focus:outline-none"
            >
              <option value="all">All Hazard Types</option>
              <option value="Flood">Flood & Riverine</option>
              <option value="Cyclone">Cyclone / Storm Surge</option>
              <option value="Waterlogging">Industrial Waterlogging</option>
            </select>

            {/* Risk level selector */}
            <select
              value={filters.riskLevel}
              onChange={(e) => setFilters((prev) => ({ ...prev, riskLevel: e.target.value }))}
              className="px-2.5 py-1.5 rounded-lg bg-slate-800 text-slate-200 text-xs border border-slate-700 focus:outline-none"
            >
              <option value="all">All Risk Levels</option>
              <option value="Critical">Critical Risk (Score 85+)</option>
              <option value="High">High Risk (Score 75–84)</option>
              <option value="Moderate">Moderate Risk (Score 50–74)</option>
              <option value="Low">Low / Safer Zone</option>
            </select>

            {/* Relocation Priority selector */}
            <select
              value={filters.priorityCode}
              onChange={(e) => setFilters((prev) => ({ ...prev, priorityCode: e.target.value }))}
              className="px-2.5 py-1.5 rounded-lg bg-slate-800 text-slate-200 text-xs border border-slate-700 focus:outline-none"
            >
              <option value="all">All Priorities</option>
              <option value="P1">P1 — Immediate Evacuation</option>
              <option value="P2">P2 — Within 6 Hours</option>
              <option value="P3">P3 — Prepare Logistics</option>
              <option value="P4">P4 — Monitor</option>
            </select>

            {/* Shelter status selector */}
            <select
              value={filters.shelterStatus}
              onChange={(e) => setFilters((prev) => ({ ...prev, shelterStatus: e.target.value }))}
              className="px-2.5 py-1.5 rounded-lg bg-slate-800 text-slate-200 text-xs border border-slate-700 focus:outline-none"
            >
              <option value="all">All Shelter Statuses</option>
              <option value="AVAILABLE">Available Capacity</option>
              <option value="LIMITED">Limited Capacity</option>
              <option value="FULL">Full Capacity</option>
            </select>

            {/* Reset Filters */}
            <button
              onClick={() =>
                setFilters({
                  hazardType: 'all',
                  riskLevel: 'all',
                  priorityCode: 'all',
                  shelterStatus: 'all',
                  decisionStep: 'all',
                  searchQuery: '',
                })
              }
              className="px-2.5 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300 text-xs flex items-center gap-1 font-bold"
            >
              <RotateCcw className="h-3 w-3" />
              <span>Reset</span>
            </button>
          </div>
        )}

        {/* Row 2: Decision Flow Stepper */}
        <DecisionFlowStepper
          currentStep={filters.decisionStep}
          onSelectStep={handleDecisionStep}
        />
      </div>

      {/* ======================================================== */}
      {/* 2. LEAFLET MAP VIEWPORT */}
      {/* ======================================================== */}
      <div className="relative flex-1 w-full h-full overflow-hidden">
        <MapContainer
          center={CHENNAI_CENTER}
          zoom={12}
          scrollWheelZoom={true}
          style={{ width: '100%', height: '100%' }}
          className="z-[1]"
        >
          {/* Dynamic FlyTo Controller */}
          <MapFlyToController targetCoords={flyTarget} />

          {/* Base OpenStreetMap Tile Layer (Completely free, no API key, zero cost) */}
          {layers.baseMap && (
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              maxZoom={19}
            />
          )}

          {/* Map navigation & zoom controls */}
          <MapControls
            onToggleLayers={() => setShowLayerModal(true)}
            onToggleLegend={() => setShowLegend(!showLegend)}
            showLegend={showLegend}
          />

          {/* ======================================================== */}
          {/* A. BUILT-IN & CUSTOM GEOJSON LAYERS */}
          {/* ======================================================== */}
          {layers.floodPlainGeoJson && floodGeoJson && (
            <GeoJSON
              data={floodGeoJson}
              style={(feature) => {
                const id = feature?.properties?.id;
                if (id === 'geojson-adyar-buffer') {
                  return {
                    color: '#3b82f6',
                    fillColor: '#60a5fa',
                    fillOpacity: 0.25,
                    weight: 2,
                    dashArray: '4, 4',
                  };
                }
                if (id === 'geojson-pallikaranai-marsh') {
                  return {
                    color: '#8b5cf6',
                    fillColor: '#a78bfa',
                    fillOpacity: 0.3,
                    weight: 2,
                  };
                }
                return {
                  color: '#0284c7',
                  fillColor: '#38bdf8',
                  fillOpacity: 0.2,
                  weight: 2,
                };
              }}
              onEachFeature={(feature, layer) => {
                const p = feature.properties;
                layer.bindTooltip(
                  `<strong>${p.name}</strong><br/><span style="font-size:10px; color:#475569;">${p.riskCategory}</span>`,
                  { sticky: true }
                );
                layer.on('click', () => {
                  handleSelect('GEOJSON', p);
                });
              }}
            />
          )}

          {layers.customGeoJson && customGeoJson && (
            <GeoJSON
              data={customGeoJson}
              style={{
                color: '#ec4899',
                fillColor: '#f472b6',
                fillOpacity: 0.35,
                weight: 2.5,
              }}
              onEachFeature={(feature, layer) => {
                layer.bindTooltip(`<strong>Custom Layer:</strong> ${customGeoJsonName}`);
                layer.on('click', () => {
                  handleSelect('GEOJSON', {
                    name: customGeoJsonName,
                    type: 'User Uploaded GeoJSON Boundary',
                    properties: feature.properties,
                  });
                });
              }}
            />
          )}

          {/* ======================================================== */}
          {/* B. MULTI-HAZARD RISK ZONE POLYGONS */}
          {/* ======================================================== */}
          {filteredZones.map((zone) => {
            const isHigh = zone.riskLevel === 'Critical' || zone.riskLevel === 'High';
            const isModerate = zone.riskLevel === 'Moderate';
            const isLow = zone.riskLevel === 'Low';

            if (isHigh && !layers.highRiskZones) return null;
            if (isModerate && !layers.mediumRiskZones) return null;
            if (isLow && !layers.lowRiskZones) return null;

            const isSelected = selectedFeature?.type === 'ZONE' && selectedFeature?.data?.id === zone.id;

            return (
              <Polygon
                key={zone.id}
                positions={zone.coordinates}
                pathOptions={{
                  color: isSelected ? '#ffffff' : zone.color,
                  fillColor: zone.color,
                  fillOpacity: isSelected ? 0.65 : 0.35,
                  weight: isSelected ? 4 : 2,
                }}
                eventHandlers={{
                  click: () => handleSelect('ZONE', zone),
                  mouseover: (e) => {
                    const l = e.target;
                    l.setStyle({ fillOpacity: 0.6, weight: 3 });
                  },
                  mouseout: (e) => {
                    const l = e.target;
                    if (!isSelected) {
                      l.setStyle({ fillOpacity: 0.35, weight: 2 });
                    }
                  },
                }}
              >
                <Tooltip sticky>
                  <div className="text-xs p-0.5">
                    <strong className="block font-bold">{zone.code} — {zone.name}</strong>
                    <div className="text-[11px] text-slate-600 mt-0.5">
                      Risk Level: <strong style={{ color: zone.color }}>{zone.riskLevel} ({zone.riskScore}/100)</strong>
                    </div>
                    <div className="text-[10px] text-slate-500">
                      Exposed: <strong>{zone.exposedPopulation.toLocaleString()}</strong> persons
                    </div>
                  </div>
                </Tooltip>

                <Popup>
                  <div className="text-xs space-y-2 p-1 min-w-[200px]">
                    <div className="flex items-center justify-between border-b pb-1">
                      <span className="font-bold text-slate-900">{zone.code}</span>
                      <span
                        className="px-1.5 py-0.5 rounded text-[10px] text-white font-bold"
                        style={{ backgroundColor: zone.color }}
                      >
                        {zone.riskLevel}
                      </span>
                    </div>
                    <div className="font-semibold text-slate-800">{zone.areaName}</div>
                    <div className="space-y-0.5 text-[11px] text-slate-600">
                      <div>Exposed: <strong>{zone.exposedPopulation.toLocaleString()}</strong></div>
                      <div>Priority: <strong className="text-red-700">{zone.priority}</strong></div>
                      <div>Deficit: <strong>{zone.capacityDeficit} persons</strong></div>
                    </div>
                    <button
                      onClick={() => handleSelect('ZONE', zone)}
                      className="w-full mt-2 py-1 px-2 rounded bg-slate-900 text-white font-bold text-[11px] hover:bg-slate-800"
                    >
                      Inspect Full Analysis
                    </button>
                  </div>
                </Popup>
              </Polygon>
            );
          })}

          {/* ======================================================== */}
          {/* C. VULNERABLE HABITATION MARKERS */}
          {/* ======================================================== */}
          {layers.habitations &&
            filteredHabitations.map((hab) => {
              const isSelected =
                selectedFeature?.type === 'HABITATION' &&
                selectedFeature?.data?.id === hab.id;

              return (
                <Marker
                  key={hab.id}
                  position={hab.coordinates}
                  icon={createHabitationIcon(hab.priorityCode, isSelected)}
                  eventHandlers={{
                    click: () => handleSelect('HABITATION', hab),
                  }}
                >
                  <Tooltip offset={[0, -20]} direction="top">
                    <div className="text-xs">
                      <strong>{hab.name}</strong>
                      <div className="text-[10px] text-slate-500">
                        {hab.population.toLocaleString()} pop • {hab.priorityCode} Priority
                      </div>
                    </div>
                  </Tooltip>

                  <Popup>
                    <div className="text-xs space-y-2 p-1 min-w-[220px]">
                      <div className="font-bold text-slate-900 border-b pb-1">
                        {hab.name}
                      </div>
                      <div className="text-[11px] text-slate-600">
                        <div>Zone: <strong>{hab.zoneName}</strong> (Ward {hab.wardNumber})</div>
                        <div>Population: <strong>{hab.population.toLocaleString()}</strong></div>
                        <div>Vulnerability: <strong className="text-red-600">{hab.vulnerabilityScore}/100</strong></div>
                        <div>Elevated Destination: <strong>{hab.recommendedSafeArea}</strong></div>
                      </div>
                      <button
                        onClick={() => handleSelect('HABITATION', hab)}
                        className="w-full mt-2 py-1 px-2 rounded bg-amber-600 text-white font-bold text-[11px] hover:bg-amber-700"
                      >
                        Inspect Habitation
                      </button>
                    </div>
                  </Popup>
                </Marker>
              );
            })}

          {/* ======================================================== */}
          {/* D. RELIEF SHELTERS & SERVICE BUFFERS */}
          {/* ======================================================== */}
          {layers.shelters &&
            filteredShelters.map((sh) => {
              const isSelected =
                selectedFeature?.type === 'SHELTER' &&
                selectedFeature?.data?.id === sh.id;

              return (
                <React.Fragment key={sh.id}>
                  {/* Optional Pedestrian Service Radius Buffer (1.5km circle) */}
                  {layers.shelterBuffers && (
                    <CircleMarker
                      center={sh.coordinates}
                      radius={32}
                      pathOptions={{
                        color: sh.status === 'AVAILABLE' ? '#10b981' : sh.status === 'LIMITED' ? '#f59e0b' : '#ef4444',
                        fillColor: sh.status === 'AVAILABLE' ? '#10b981' : '#f59e0b',
                        fillOpacity: 0.08,
                        weight: 1.5,
                        dashArray: '3, 6',
                      }}
                    />
                  )}

                  <Marker
                    position={sh.coordinates}
                    icon={createShelterIcon(sh.status, isSelected)}
                    eventHandlers={{
                      click: () => handleSelect('SHELTER', sh),
                    }}
                  >
                    <Tooltip offset={[0, -22]} direction="top">
                      <div className="text-xs">
                        <strong>{sh.name}</strong>
                        <div className="text-[10px] text-slate-500">
                          {sh.status}: {sh.available.toLocaleString()} beds free
                        </div>
                      </div>
                    </Tooltip>

                    <Popup>
                      <div className="text-xs space-y-2 p-1 min-w-[230px]">
                        <div className="flex items-center justify-between border-b pb-1">
                          <span className="font-bold text-slate-900">{sh.code}</span>
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] text-white font-bold ${
                              sh.status === 'AVAILABLE'
                                ? 'bg-emerald-600'
                                : sh.status === 'LIMITED'
                                ? 'bg-amber-500'
                                : 'bg-rose-600'
                            }`}
                          >
                            {sh.status}
                          </span>
                        </div>
                        <div className="font-semibold text-slate-800">{sh.name}</div>
                        <div className="text-[11px] text-slate-600 space-y-0.5">
                          <div>Total Capacity: <strong>{sh.capacity.toLocaleString()}</strong></div>
                          <div>Occupancy: <strong>{sh.occupancy.toLocaleString()}</strong></div>
                          <div className="text-emerald-700 font-bold">
                            Available: {sh.available.toLocaleString()} beds
                          </div>
                        </div>
                        <button
                          onClick={() => handleSelect('SHELTER', sh)}
                          className="w-full mt-2 py-1 px-2 rounded bg-emerald-600 text-white font-bold text-[11px] hover:bg-emerald-700"
                        >
                          View Shelter Capacity
                        </button>
                      </div>
                    </Popup>
                  </Marker>
                </React.Fragment>
              );
            })}

          {/* ======================================================== */}
          {/* E. CITIZEN & VOLUNTEER INCIDENT REPORTS */}
          {/* ======================================================== */}
          {layers.reports &&
            reports.map((rep) => {
              const isSelected =
                selectedFeature?.type === 'REPORT' &&
                selectedFeature?.data?.id === rep.id;

              return (
                <Marker
                  key={rep.id}
                  position={rep.coordinates}
                  icon={createReportIcon(rep.severity, isSelected)}
                  eventHandlers={{
                    click: () => handleSelect('REPORT', rep),
                  }}
                >
                  <Tooltip offset={[0, -18]} direction="top">
                    <div className="text-xs">
                      <strong>Incident: {rep.hazardType}</strong>
                      <div className="text-[10px] text-red-600 font-bold">{rep.severity} Severity</div>
                    </div>
                  </Tooltip>

                  <Popup>
                    <div className="text-xs space-y-2 p-1 min-w-[200px]">
                      <div className="font-bold text-slate-900 border-b pb-1">
                        {rep.reportId} — {rep.hazardType}
                      </div>
                      <p className="text-[11px] text-slate-700 leading-tight">
                        {rep.description}
                      </p>
                      <button
                        onClick={() => handleSelect('REPORT', rep)}
                        className="w-full mt-2 py-1 px-2 rounded bg-slate-900 text-white font-bold text-[11px] hover:bg-slate-800"
                      >
                        Inspect Report
                      </button>
                    </div>
                  </Popup>
                </Marker>
              );
            })}

          {/* ======================================================== */}
          {/* F. EVACUATION CORRIDORS (POLYLINES) */}
          {/* ======================================================== */}
          {layers.evacuationRoutes &&
            evacuationRoutes.map((route) => (
              <Polyline
                key={route.id}
                positions={[route.fromCoords, route.toCoords]}
                pathOptions={{
                  color: route.priority === 'P1' ? '#dc2626' : '#2563eb',
                  weight: 3.5,
                  dashArray: '6, 8',
                }}
              >
                <Tooltip sticky>
                  <div className="text-xs p-0.5">
                    <strong>Evacuation Vector ({route.priority})</strong>
                    <div className="text-[10px] text-slate-600">
                      From: {route.fromName}<br />
                      To: {route.toName} ({route.distanceKm} km)
                    </div>
                  </div>
                </Tooltip>
              </Polyline>
            ))}
        </MapContainer>

        {/* Collapsible Institutional Legend */}
        {showLegend && (
          <div className="absolute bottom-4 left-4 z-[1000] pointer-events-auto">
            <MapLegend />
          </div>
        )}

        {/* Side Feature Details Drawer */}
        {selectedFeature && (
          <div className="absolute top-4 right-16 z-[1005] max-w-sm w-full pointer-events-auto">
            <FeatureDetailDrawer
              selectedFeature={selectedFeature}
              onClose={() => setSelectedFeature(null)}
              onNavigateToShelter={(shelterId) => {
                const sh = shelters.find((s) => s.id === shelterId);
                if (sh) {
                  handleSelect('SHELTER', sh);
                }
              }}
            />
          </div>
        )}
      </div>

      {/* Layer Control Modal */}
      <LayerControlModal
        isOpen={showLayerModal}
        onClose={() => setShowLayerModal(false)}
        layers={layers}
        onToggleLayer={handleToggleLayer}
        onResetLayers={handleResetLayers}
      />
    </div>
  );
};
