# Architecture

React/Vite/TypeScript → FastAPI → Business Services → GIS + Explainable Risk/Capacity/Relocation Engines → PostgreSQL/PostGIS.

The frontend consumes API services rather than embedding dashboard values. The map uses OpenStreetMap tiles and the Greater Chennai Corporation administrative ward Feature Service at runtime. Backend-derived observations are separate from source datasets.

Risk is normalized to 0–100 using configurable weighted factors: hazard exposure 30%, population exposure 20%, vulnerability 25%, capacity deficit 15%, accessibility risk 10%.

Relocation priority uses 35% risk, 25% vulnerability, 20% capacity deficit, 10% population exposure and 10% accessibility risk. Safe-area suitability combines lower calculated risk with available capacity.
