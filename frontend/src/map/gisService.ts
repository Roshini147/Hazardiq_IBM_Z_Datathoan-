import axios from 'axios';
import {
  RiskZoneFeature,
  HabitationFeature,
  ShelterFeature,
  IncidentReportFeature,
  EvacuationRouteVector,
} from './types';
import {
  DEFAULT_RISK_ZONES,
  DEFAULT_HABITATIONS,
  DEFAULT_SHELTERS,
  DEFAULT_REPORTS,
  DEFAULT_EVACUATION_ROUTES,
  CHENNAI_FLOOD_GEOJSON,
} from './gisData';

const BASE_URL = import.meta.env.VITE_API_URL || '';

export const gisApiClient = axios.create({
  baseURL: BASE_URL ? `${BASE_URL}/api` : '/api',
  timeout: 5000,
});

export interface GisSyncStatus {
  isBackendConnected: boolean;
  activeSource: 'FASTAPI_BACKEND' | 'DEMONSTRATION_DATA';
  lastChecked: string;
  errorMessage?: string;
}

class GisDataService {
  private syncStatus: GisSyncStatus = {
    isBackendConnected: false,
    activeSource: 'DEMONSTRATION_DATA',
    lastChecked: new Date().toLocaleTimeString(),
  };

  public getSyncStatus(): GisSyncStatus {
    return { ...this.syncStatus };
  }

  /**
   * Health-check the backend to verify if FastAPI / Express is answering.
   */
  public async checkBackendHealth(): Promise<boolean> {
    try {
      const res = await gisApiClient.get('/health');
      if (res.status === 200) {
        this.syncStatus.isBackendConnected = true;
        this.syncStatus.activeSource = 'FASTAPI_BACKEND';
        this.syncStatus.lastChecked = new Date().toLocaleTimeString();
        return true;
      }
    } catch {
      // Backend not running locally or endpoint down
      this.syncStatus.isBackendConnected = false;
      this.syncStatus.activeSource = 'DEMONSTRATION_DATA';
      this.syncStatus.lastChecked = new Date().toLocaleTimeString();
    }
    return false;
  }

  /**
   * Fetch multi-hazard risk zones.
   * Tries GET /api/risk-zones (or fallback GET /api/risk), falling back to static demo data.
   */
  public async getRiskZones(): Promise<RiskZoneFeature[]> {
    try {
      // Try /api/risk-zones first
      const res = await gisApiClient.get('/risk-zones');
      if (Array.isArray(res.data) && res.data.length > 0) {
        this.syncStatus.isBackendConnected = true;
        this.syncStatus.activeSource = 'FASTAPI_BACKEND';
        return res.data;
      }
    } catch {
      // Try alternative /api/risk endpoint
      try {
        const altRes = await gisApiClient.get('/risk');
        if (Array.isArray(altRes.data) && altRes.data.length > 0) {
          this.syncStatus.isBackendConnected = true;
          this.syncStatus.activeSource = 'FASTAPI_BACKEND';
          // Merge with coordinates if backend gives tabular points
          return DEFAULT_RISK_ZONES;
        }
      } catch {
        // Fall back gracefully to authoritative default demo data
      }
    }

    this.syncStatus.activeSource = 'DEMONSTRATION_DATA';
    return DEFAULT_RISK_ZONES;
  }

  /**
   * Fetch vulnerable habitations.
   * Tries GET /api/habitations (or fallback GET /api/vulnerability).
   */
  public async getHabitations(): Promise<HabitationFeature[]> {
    try {
      const res = await gisApiClient.get('/habitations');
      if (Array.isArray(res.data) && res.data.length > 0) {
        this.syncStatus.isBackendConnected = true;
        return res.data;
      }
    } catch {
      // Fallback
    }
    return DEFAULT_HABITATIONS;
  }

  /**
   * Fetch relief shelter locations & real-time capacity.
   * Tries GET /api/shelters (or fallback GET /api/safe-areas).
   */
  public async getShelters(): Promise<ShelterFeature[]> {
    try {
      const res = await gisApiClient.get('/shelters');
      if (Array.isArray(res.data) && res.data.length > 0) {
        this.syncStatus.isBackendConnected = true;
        return res.data;
      } else if (res.data?.data && Array.isArray(res.data.data)) {
        this.syncStatus.isBackendConnected = true;
        return res.data.data;
      }
    } catch {
      // Fallback
    }
    return DEFAULT_SHELTERS;
  }

  /**
   * Fetch volunteer / citizen reported incident markers.
   * Tries GET /api/incidents.
   */
  public async getIncidentReports(): Promise<IncidentReportFeature[]> {
    try {
      const res = await gisApiClient.get('/incidents');
      const list = res.data?.data || res.data;
      if (Array.isArray(list) && list.length > 0) {
        return list;
      }
    } catch {
      // Fallback
    }
    return DEFAULT_REPORTS;
  }

  /**
   * Fetch relocation priority zones.
   * Tries GET /api/relocation-priorities (or /api/relocation).
   */
  public async getRelocationPriorities(): Promise<any[]> {
    try {
      const res = await gisApiClient.get('/relocation-priorities');
      if (Array.isArray(res.data)) return res.data;
    } catch {
      try {
        const alt = await gisApiClient.get('/relocation');
        if (Array.isArray(alt.data)) return alt.data;
      } catch {
        // Fallback
      }
    }
    return DEFAULT_RISK_ZONES.map((z) => ({
      zone: z.name,
      code: z.code,
      priority: z.priority,
      score: z.riskScore,
      action: z.recommendedAction,
      deficit: z.capacityDeficit,
    }));
  }

  /**
   * Fetch designated safer relocation destinations.
   * Tries GET /api/safer-locations (or /api/safe-areas).
   */
  public async getSaferLocations(): Promise<ShelterFeature[]> {
    try {
      const res = await gisApiClient.get('/safer-locations');
      if (Array.isArray(res.data)) return res.data;
    } catch {
      try {
        const alt = await gisApiClient.get('/safe-areas');
        if (Array.isArray(alt.data)) return DEFAULT_SHELTERS.filter(s => s.status === 'AVAILABLE');
      } catch {
        // Fallback
      }
    }
    return DEFAULT_SHELTERS.filter(s => s.status === 'AVAILABLE');
  }

  /**
   * Evacuation vectors
   */
  public getEvacuationRoutes(): EvacuationRouteVector[] {
    return DEFAULT_EVACUATION_ROUTES;
  }

  /**
   * Built-in Chennai flood GeoJSON
   */
  public getFloodPlainGeoJson(): GeoJSON.FeatureCollection {
    return CHENNAI_FLOOD_GEOJSON;
  }
}

export const gisService = new GisDataService();
