import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { HazardIqMap } from '../map/HazardIqMap';
import { RedZonePanel } from '../components/RedZonePanel';
import {
  MapPin,
  Layers,
  Building2,
  Users,
  AlertTriangle,
  RotateCcw,
  Hospital,
  Info,
  ShieldCheck,
  Compass,
} from 'lucide-react';

export const RiskMapPage: React.FC = () => {
  const { zones, shelters, selectedZone, setSelectedZone, language } = useApp();
  const [activeZone, setActiveZone] = useState<any | null>(selectedZone || zones[0]);

  const handleSelectZone = (zone: any) => {
    setActiveZone(zone);
    setSelectedZone(zone);
  };

  const handleFeatureSelect = (feature: any) => {
    if (feature.type === 'ZONE' || feature.type === 'RISK_AREA') {
      const match = zones.find(
        (z) => z.code === feature.data.code || z.id === feature.data.id
      );
      if (match) {
        handleSelectZone(match);
      } else {
        setActiveZone(feature.data);
      }
    }
  };

  return (
    <div className="space-y-4 pb-12">
      {/* Top Header */}
      <div className="bg-slate-900 text-white px-5 py-4 rounded-2xl border border-slate-800 shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-red-600 text-white">
                {language === 'ta' ? 'அதிகாரப்பூர்வ புவிசார் பேரிடர் வரைபடம்' : 'OPERATIONAL LEAFLET GIS MAP'}
              </span>
              <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
                {language === 'ta' ? 'பெருநகர சென்னை பகுதி' : 'GREATER CHENNAI REGION'}
              </span>
              <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
                OpenStreetMap Free Base
              </span>
            </div>
            <h1 className="text-xl md:text-2xl font-black text-white">
              {language === 'ta'
                ? 'சென்னை பல-அபாய சிவப்பு மண்டலங்கள் & புவிசார் தகவல் வரைபடம்'
                : 'Chennai Multi-Hazard Red Zone & GIS Intelligence Map'}
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              {language === 'ta'
                ? 'அபாய மண்டலங்களை கிளிக் செய்து மக்கள் வெளிப்பாடு, பாதிப்புத்தன்மை, நிவாரண முகாம்கள் மற்றும் வெளியேற்ற வழிகளை ஆராயவும்.'
                : 'Interactive Leaflet + OpenStreetMap platform: Click hazard zone polygons, vulnerable habitations, relief shelters, and citizen reports.'}
            </p>
          </div>

          {/* Quick Zone Selector Buttons */}
          <div className="flex flex-wrap items-center gap-1.5">
            {zones.map((zone) => {
              const isSelected = activeZone?.id === zone.id || activeZone?.code === zone.code;
              return (
                <button
                  key={zone.id}
                  onClick={() => handleSelectZone(zone)}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-red-600 text-white shadow-md ring-2 ring-red-400'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
                  }`}
                >
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: zone.color }}
                  />
                  <span>{zone.code}</span>
                  <span className="text-[10px] opacity-75">({zone.riskLevel})</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Leaflet Map + Side Panel Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* Real Leaflet GIS Engine */}
        <div className="lg:col-span-8">
          <HazardIqMap
            onSelectFeature={handleFeatureSelect}
            selectedZoneId={activeZone?.id || activeZone?.code}
            className="w-full h-[720px]"
          />
        </div>

        {/* Side Detailed Inspection Panel */}
        <div className="lg:col-span-4">
          {activeZone ? (
            <RedZonePanel zone={activeZone} onClose={() => setActiveZone(null)} />
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-500 shadow-sm space-y-3">
              <Info className="h-10 w-10 text-slate-400 mx-auto" />
              <h3 className="text-base font-bold text-slate-800">
                {language === 'ta' ? 'மண்டலம் தேர்ந்தெடுக்கப்படவில்லை' : 'No Zone Selected'}
              </h3>
              <p className="text-xs text-slate-500">
                {language === 'ta'
                  ? 'வரைபடத்தில் உள்ள வண்ண பலகோணத்தை கிளிக் செய்து முழு விவரங்களை பார்க்கவும்.'
                  : 'Click on any colored hazard polygon on the map or use the zone buttons at the top to inspect risk parameters.'}
              </p>
              <button
                onClick={() => handleSelectZone(zones[0])}
                className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow"
              >
                {language === 'ta' ? 'மண்டலம் A (தீவிர அபாயம்) காண்க' : 'Inspect Zone A (Critical)'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
