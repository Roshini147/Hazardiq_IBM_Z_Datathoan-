import React from 'react';
import { LayerVisibilityState } from './types';
import {
  Layers,
  X,
  Check,
  Eye,
  EyeOff,
  Flame,
  ShieldCheck,
  Users,
  Building2,
  AlertTriangle,
  Navigation,
  Globe,
  Radio,
} from 'lucide-react';

interface LayerControlModalProps {
  isOpen: boolean;
  onClose: () => void;
  layers: LayerVisibilityState;
  onToggleLayer: (layerKey: keyof LayerVisibilityState) => void;
  onResetLayers: () => void;
}

export const LayerControlModal: React.FC<LayerControlModalProps> = ({
  isOpen,
  onClose,
  layers,
  onToggleLayer,
  onResetLayers,
}) => {
  if (!isOpen) return null;

  const layerItems: {
    key: keyof LayerVisibilityState;
    label: string;
    sublabel: string;
    icon: any;
    color: string;
  }[] = [
    {
      key: 'baseMap',
      label: 'OpenStreetMap Base Layer',
      sublabel: 'Free standard OSM tiles (Zero cost)',
      icon: Globe,
      color: '#3b82f6',
    },
    {
      key: 'highRiskZones',
      label: 'High & Critical Risk Zones',
      sublabel: 'Red hazard polygons (Score 75–100)',
      icon: Flame,
      color: '#dc2626',
    },
    {
      key: 'mediumRiskZones',
      label: 'Moderate Risk Zones',
      sublabel: 'Yellow/Amber polygons (Score 50–74)',
      icon: Flame,
      color: '#eab308',
    },
    {
      key: 'lowRiskZones',
      label: 'Low Risk & Safer Havens',
      sublabel: 'Green polygons (Score < 50)',
      icon: ShieldCheck,
      color: '#16a34a',
    },
    {
      key: 'habitations',
      label: 'Vulnerable Habitations',
      sublabel: 'Settlement markers with demographic breakdown',
      icon: Users,
      color: '#f97316',
    },
    {
      key: 'shelters',
      label: 'Designated Relief Shelters',
      sublabel: 'Capacity-coded markers (Available / Limited / Full)',
      icon: Building2,
      color: '#10b981',
    },
    {
      key: 'reports',
      label: 'Citizen & Volunteer Field Reports',
      sublabel: 'Georeferenced live incident pins',
      icon: AlertTriangle,
      color: '#f59e0b',
    },
    {
      key: 'evacuationRoutes',
      label: 'Evacuation Corridors',
      sublabel: 'Vectors linking habitations to assigned safe shelters',
      icon: Navigation,
      color: '#2563eb',
    },
    {
      key: 'floodPlainGeoJson',
      label: 'Hydro-Hazard GeoJSON Envelopes',
      sublabel: 'Adyar flood envelope & Pallikaranai marsh boundary',
      icon: Radio,
      color: '#6366f1',
    },
    {
      key: 'shelterBuffers',
      label: 'Shelter 1.5km Service Radii',
      sublabel: 'Circle markers showing pedestrian evacuation reach',
      icon: ShieldCheck,
      color: '#06b6d4',
    },
  ];

  return (
    <div className="fixed inset-0 z-[1200] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-slate-900 text-white px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Layers className="h-5 w-5 text-blue-400" />
            <div>
              <h3 className="font-bold text-sm text-white">GIS Layer Visibility Controls</h3>
              <p className="text-[11px] text-slate-400">Toggle tactical layers on the interactive map</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Layer list */}
        <div className="p-4 space-y-2 max-h-[60vh] overflow-y-auto divide-y divide-slate-100">
          {layerItems.map((item) => {
            const isVisible = layers[item.key];
            const Icon = item.icon;
            return (
              <div
                key={item.key}
                onClick={() => onToggleLayer(item.key)}
                className="pt-2 first:pt-0 flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span
                    className="p-2 rounded-lg text-white"
                    style={{ backgroundColor: item.color }}
                  >
                    <Icon className="h-4 w-4" />
                  </span>
                  <div>
                    <h4 className="text-xs font-bold text-slate-800">{item.label}</h4>
                    <p className="text-[11px] text-slate-500">{item.sublabel}</p>
                  </div>
                </div>
                <div
                  className={`w-10 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors ${
                    isVisible ? 'bg-blue-600' : 'bg-slate-300'
                  }`}
                >
                  <div
                    className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                      isVisible ? 'translate-x-4' : 'translate-x-0'
                    }`}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-5 py-3 border-t border-slate-200 flex items-center justify-between">
          <button
            onClick={onResetLayers}
            className="text-xs font-semibold text-slate-600 hover:text-slate-900"
          >
            Reset All to Default
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm transition-colors"
          >
            Apply & Close
          </button>
        </div>
      </div>
    </div>
  );
};
