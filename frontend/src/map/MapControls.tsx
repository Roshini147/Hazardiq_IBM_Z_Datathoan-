import React from 'react';
import { useMap } from 'react-leaflet';
import {
  Plus,
  Minus,
  Maximize2,
  Crosshair,
  Layers,
  RotateCcw,
} from 'lucide-react';
import L from 'leaflet';

interface MapControlsProps {
  onToggleLayers: () => void;
  onToggleLegend: () => void;
  showLegend: boolean;
}

export const CHENNAI_CENTER: [number, number] = [13.045, 80.23];
export const CHENNAI_BOUNDS: L.LatLngBoundsExpression = [
  [12.85, 80.10],
  [13.24, 80.35],
];

export const MapControls: React.FC<MapControlsProps> = ({
  onToggleLayers,
  onToggleLegend,
  showLegend,
}) => {
  const map = useMap();

  const handleZoomIn = () => map.zoomIn();
  const handleZoomOut = () => map.zoomOut();

  const handleFitChennai = () => {
    map.fitBounds(CHENNAI_BOUNDS, { padding: [20, 20], maxZoom: 14 });
  };

  const handleLocateMe = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          map.flyTo([lat, lng], 14, { duration: 1.5 });
          L.circleMarker([lat, lng], {
            radius: 8,
            fillColor: '#3b82f6',
            color: '#ffffff',
            weight: 3,
            fillOpacity: 1,
          })
            .addTo(map)
            .bindPopup('<strong>Your Current Position</strong>')
            .openPopup();
        },
        () => {
          // If permission denied or unavailable, center on Chennai
          handleFitChennai();
        }
      );
    } else {
      handleFitChennai();
    }
  };

  return (
    <div className="absolute top-4 right-4 z-[1000] flex flex-col gap-2">
      {/* Zoom controls */}
      <div className="bg-white/95 backdrop-blur-md rounded-xl shadow-xl border border-slate-200 overflow-hidden flex flex-col divide-y divide-slate-100">
        <button
          onClick={handleZoomIn}
          className="p-2.5 hover:bg-slate-100 text-slate-700 transition-colors"
          title="Zoom In"
        >
          <Plus className="h-4 w-4" />
        </button>
        <button
          onClick={handleZoomOut}
          className="p-2.5 hover:bg-slate-100 text-slate-700 transition-colors"
          title="Zoom Out"
        >
          <Minus className="h-4 w-4" />
        </button>
        <button
          onClick={handleFitChennai}
          className="p-2.5 hover:bg-slate-100 text-slate-700 transition-colors"
          title="Fit Greater Chennai Bounds"
        >
          <Maximize2 className="h-4 w-4" />
        </button>
        <button
          onClick={handleLocateMe}
          className="p-2.5 hover:bg-slate-100 text-slate-700 transition-colors"
          title="Locate Current Position"
        >
          <Crosshair className="h-4 w-4" />
        </button>
      </div>

      {/* Layer Controls & Legend buttons */}
      <div className="bg-white/95 backdrop-blur-md rounded-xl shadow-xl border border-slate-200 overflow-hidden flex flex-col divide-y divide-slate-100">
        <button
          onClick={onToggleLayers}
          className="p-2.5 hover:bg-slate-100 text-slate-700 transition-colors relative"
          title="Toggle Map Layers"
        >
          <Layers className="h-4 w-4 text-blue-600" />
        </button>
        <button
          onClick={onToggleLegend}
          className={`p-2.5 hover:bg-slate-100 transition-colors ${
            showLegend ? 'bg-slate-100 text-red-600 font-bold' : 'text-slate-700'
          }`}
          title="Toggle Legend"
        >
          <span className="text-[11px] font-mono font-bold">KEY</span>
        </button>
      </div>
    </div>
  );
};
