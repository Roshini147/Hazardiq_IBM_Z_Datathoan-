export type DataSourceProvenance = 'AUTHORITATIVE' | 'DERIVED' | 'SIMULATED';

export type RiskLevel = 'Critical' | 'High' | 'Moderate' | 'Low';

export type HazardType =
  | 'Flood'
  | 'Cyclone'
  | 'Storm Surge'
  | 'Waterlogging'
  | 'Industrial Runoff'
  | 'Multi-Hazard';

export type RelocationPriority =
  | 'P1 — IMMEDIATE'
  | 'P2 — WITHIN 6 HRS'
  | 'P3 — PREPARE'
  | 'P4 — MONITOR';

export type PriorityCode = 'P1' | 'P2' | 'P3' | 'P4';

export type ShelterStatus = 'AVAILABLE' | 'LIMITED' | 'FULL';

export interface VulnerableGroups {
  children: number;
  elderly: number;
  pwd: number; // Persons with disabilities
  otherVulnerable: number;
}

export interface RiskZoneFeature {
  id: string;
  code: string;
  name: string;
  nameTa?: string;
  areaName: string;
  riskLevel: RiskLevel;
  hazardType: HazardType | string;
  riskScore: number;
  exposedPopulation: number;
  households: number;
  vulnerableGroups: VulnerableGroups;
  priority: RelocationPriority;
  priorityCode: PriorityCode;
  riskFactors: string[];
  historicalRisk: number;
  accessibilityScore: number;
  color: string;
  coordinates: [number, number][]; // [lat, lng] polygon vertices
  center: [number, number];        // [lat, lng] centroid
  carryingCapacity: number;
  capacityDeficit: number;
  availableShelterCapacity: number;
  recommendedAction: string;
  recommendedActionTa?: string;
  recommendedShelterId?: string;
  dataSource: DataSourceProvenance;
  sourceAttribution: string;
  lastUpdated: string;
}

export interface HabitationFeature {
  id: string;
  name: string;
  zoneId: string;
  zoneName: string;
  wardNumber: number;
  population: number;
  households: number;
  children: number;
  elderly: number;
  pwd: number;
  otherVulnerable: number;
  hazardScore: number;
  vulnerabilityScore: number;
  riskScore: number;
  relocationPriority: RelocationPriority;
  priorityCode: PriorityCode;
  terrainElevation: string;
  drainageCapacity: string;
  recommendedSafeArea: string;
  recommendedShelterId?: string;
  coordinates: [number, number]; // [lat, lng]
  dataSource: DataSourceProvenance;
  sourceAttribution: string;
}

export interface ShelterFeature {
  id: string;
  code: string;
  name: string;
  type: string;
  location: string;
  address: string;
  capacity: number;
  occupancy: number;
  available: number;
  status: ShelterStatus;
  distanceKm: number;
  accessibilityScore: number; // 0-100
  suitabilityScore: number;   // 0-100
  coordinates: [number, number]; // [lat, lng]
  amenities: string[];
  medicalSupport: boolean;
  powerBackup: boolean;
  drinkingWater: boolean;
  contactPerson: string;
  contactPhone: string;
  fullWarning?: string;
  dataSource: DataSourceProvenance;
  sourceAttribution: string;
}

export interface IncidentReportFeature {
  id: string;
  reportId: string;
  location: string;
  zone: string;
  hazardType: string;
  severity: 'Low' | 'Medium' | 'High' | 'Critical';
  description: string;
  photoUrl?: string;
  coordinates: [number, number];
  timestamp: string;
  status: 'NEW' | 'VERIFIED' | 'ACTIONED' | 'DISMISSED';
  verifiedBy?: string;
  dataSource: DataSourceProvenance;
  sourceAttribution: string;
}

export interface EvacuationRouteVector {
  id: string;
  fromName: string;
  toName: string;
  fromCoords: [number, number];
  toCoords: [number, number];
  priority: PriorityCode;
  status: 'Clear' | 'Congested' | 'Flooded' | 'Recommended';
  distanceKm: number;
}

export type DecisionFlowStep =
  | 'all'
  | 'hazard'
  | 'exposure'
  | 'vulnerability'
  | 'capacity'
  | 'relocation';

export interface LayerVisibilityState {
  baseMap: boolean;
  highRiskZones: boolean;
  mediumRiskZones: boolean;
  lowRiskZones: boolean;
  habitations: boolean;
  shelters: boolean;
  reports: boolean;
  evacuationRoutes: boolean;
  shelterBuffers: boolean;
  floodPlainGeoJson: boolean;
  customGeoJson: boolean;
}

export interface FilterState {
  hazardType: string;
  riskLevel: string;
  priorityCode: string;
  shelterStatus: string;
  decisionStep: DecisionFlowStep;
  searchQuery: string;
}

export interface SelectedFeatureState {
  type: 'ZONE' | 'HABITATION' | 'SHELTER' | 'REPORT' | 'GEOJSON';
  data: any;
}
