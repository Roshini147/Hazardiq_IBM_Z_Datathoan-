import L from 'leaflet';
import { PriorityCode, ShelterStatus } from './types';

/**
 * Creates custom SVG DivIcons for Leaflet so that no external PNG icon assets are required.
 * This guarantees zero broken images, crisp retina rendering, and dynamic color styling.
 */

export const createHabitationIcon = (priority: PriorityCode, isSelected: boolean = false) => {
  const colorMap: Record<PriorityCode, { bg: string; border: string; badge: string }> = {
    P1: { bg: '#dc2626', border: '#991b1b', badge: '#fef2f2' },
    P2: { bg: '#ea580c', border: '#c2410c', badge: '#fff7ed' },
    P3: { bg: '#eab308', border: '#ca8a04', badge: '#fefce8' },
    P4: { bg: '#16a34a', border: '#15803d', badge: '#f0fdf4' },
  };

  const style = colorMap[priority] || colorMap.P1;
  const pulseClass = priority === 'P1' ? 'animate-ping' : '';
  const scale = isSelected ? 'scale-125 ring-4 ring-white shadow-2xl' : 'hover:scale-110';

  const html = `
    <div class="relative flex items-center justify-center transition-transform ${scale}" style="width: 36px; height: 36px;">
      ${priority === 'P1' ? `
        <span class="absolute inline-flex h-full w-full rounded-full opacity-75 ${pulseClass}" style="background-color: ${style.bg};"></span>
      ` : ''}
      <div class="relative flex items-center justify-center rounded-full shadow-lg border-2" style="width: 32px; height: 32px; background-color: ${style.bg}; border-color: ${style.border};">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
          <circle cx="9" cy="7" r="4"/>
          <path d="M22 21v-2a4 4 0 0 0-3-3.87"/>
          <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
        </svg>
      </div>
      <span class="absolute -bottom-1 -right-1 text-[9px] font-black px-1 rounded shadow" style="background-color: #ffffff; color: ${style.bg}; border: 1px solid ${style.border};">
        ${priority}
      </span>
    </div>
  `;

  return L.divIcon({
    html,
    className: 'custom-leaflet-icon habitation-icon',
    iconSize: [36, 36],
    iconAnchor: [18, 18],
    popupAnchor: [0, -18],
  });
};

export const createShelterIcon = (status: ShelterStatus, isSelected: boolean = false) => {
  const statusConfig: Record<ShelterStatus, { bg: string; border: string; text: string }> = {
    AVAILABLE: { bg: '#10b981', border: '#047857', text: 'SAFE' },
    LIMITED: { bg: '#f59e0b', border: '#b45309', text: 'LIM' },
    FULL: { bg: '#ef4444', border: '#b91c1c', text: 'FULL' },
  };

  const cfg = statusConfig[status] || statusConfig.AVAILABLE;
  const scale = isSelected ? 'scale-125 ring-4 ring-white shadow-2xl' : 'hover:scale-110';

  const html = `
    <div class="relative flex items-center justify-center transition-transform ${scale}" style="width: 38px; height: 38px;">
      <div class="relative flex items-center justify-center rounded-xl shadow-lg border-2" style="width: 34px; height: 34px; background-color: ${cfg.bg}; border-color: ${cfg.border};">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z"/>
          <path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2"/>
          <path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2"/>
          <path d="M10 6h4"/>
          <path d="M10 10h4"/>
          <path d="M10 14h4"/>
          <path d="M10 18h4"/>
        </svg>
      </div>
      <span class="absolute -top-1.5 -right-1 text-[8px] font-black px-1 rounded shadow uppercase" style="background-color: #0f172a; color: #ffffff; border: 1px solid ${cfg.border};">
        ${cfg.text}
      </span>
    </div>
  `;

  return L.divIcon({
    html,
    className: 'custom-leaflet-icon shelter-icon',
    iconSize: [38, 38],
    iconAnchor: [19, 19],
    popupAnchor: [0, -19],
  });
};

export const createReportIcon = (severity: string, isSelected: boolean = false) => {
  const isCritical = severity === 'Critical' || severity === 'High';
  const color = isCritical ? '#dc2626' : '#d97706';
  const scale = isSelected ? 'scale-125 ring-4 ring-white shadow-2xl' : 'hover:scale-110';

  const html = `
    <div class="relative flex items-center justify-center transition-transform ${scale}" style="width: 32px; height: 32px;">
      ${isCritical ? `
        <span class="absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping" style="background-color: ${color};"></span>
      ` : ''}
      <div class="relative flex items-center justify-center rounded-full shadow-lg border-2" style="width: 28px; height: 28px; background-color: #ffffff; border-color: ${color};">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/>
          <line x1="12" y1="9" x2="12" y2="13"/>
          <line x1="12" y1="17" x2="12.01" y2="17"/>
        </svg>
      </div>
    </div>
  `;

  return L.divIcon({
    html,
    className: 'custom-leaflet-icon report-icon',
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -16],
  });
};
