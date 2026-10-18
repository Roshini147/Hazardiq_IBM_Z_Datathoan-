# HAZARDIQ — Data Mapping Specification

## 1. Relational Entity Mapping

This document maps all raw CSV attributes to normalized database entities used in the PostgreSQL / PostGIS and SQLite engines.

---

## 2. Shelter Entity Mapping

| Raw CSV Field (`chennai_evacuation_relief_shelter_capacity.csv`) | Database Column (`shelters`) | Type | Transformation / Business Rules |
| :--- | :--- | :--- | :--- |
| `shelter_id` | `external_id` | `VARCHAR(80) UNIQUE` | Cleaned alphanumeric ID (e.g. `CHS001`) |
| `shelter_name` | `name` | `VARCHAR(255)` | Trimmed string |
| `facility_type` | `facility_type` | `VARCHAR(120)` | Corporation School, Govt School, Community Hall, etc. |
| `shelter_status` | `operational_status` | `VARCHAR(80)` | Official status string |
| `address` | `address` | `TEXT` | Full postal address |
| `area` | `area` | `VARCHAR(160)` | Locality / Neighbourhood |
| `zone` | `zone` | `VARCHAR(120)` | Zone 1 to Zone 15 |
| `ward` | `ward` | `VARCHAR(80)` | Ward 1 to Ward 200 |
| `latitude` | `latitude` | `DECIMAL(10,7)` | Parsed coordinate; NULL if missing |
| `longitude` | `longitude` | `DECIMAL(10,7)` | Parsed coordinate; NULL if missing |
| `capacity_persons` | `total_capacity` | `INTEGER` | Parsed positive integer |
| *(Derived / Tracked)* | `current_occupancy` | `INTEGER` | Current people checked in / allocated (Default: 0) |
| *(Derived)* | `available_capacity` | `INTEGER` | `total_capacity - current_occupancy` |
| *(Derived)* | `capacity_status` | `VARCHAR(30)` | `AVAILABLE`, `LIMITED`, `FULL`, `NOT_AVAILABLE` |
| `backup_generator` | `has_generator` | `BOOLEAN` | `True` if 'True' else `False` |
| `drinking_water` | `has_water` | `BOOLEAN` | `True` if 'True' else `False` |
| `toilets_available` | `has_toilets` | `BOOLEAN` | `True` if 'True' else `False` |
| `medical_support_available`| `has_medical` | `BOOLEAN` | `True` if 'True' else `False` |
| `last_verified` | `last_updated` | `TIMESTAMP` | ISO timestamp |

### Capacity Status Computation Logic
```sql
CASE
  WHEN operational_status = 'Closed' OR operational_status = 'Maintenance' THEN 'NOT_AVAILABLE'
  WHEN (total_capacity - current_occupancy) <= 0 THEN 'FULL'
  WHEN (CAST(current_occupancy AS FLOAT) / total_capacity) >= 0.90 THEN 'LIMITED'
  ELSE 'AVAILABLE'
END
```

---

## 3. Hospital & Emergency Resource Mapping

| Raw CSV Field (`chennai_hospitals_emergency_facilities.csv`) | Database Column (`resources`) | Type | Notes |
| :--- | :--- | :--- | :--- |
| `facility_id` | `external_id` | `VARCHAR(80)` | e.g. `CH001` |
| `facility_name` | `name` | `VARCHAR(255)` | Hospital name |
| `facility_type` | `resource_type` | `VARCHAR(120)` | Hospital category |
| `address` | `address` | `TEXT` | Address |
| `area` | `area` | `VARCHAR(160)` | Locality |
| `zone` | `zone` | `VARCHAR(120)` | Administrative zone |
| `latitude` | `latitude` | `DECIMAL(10,7)` | WGS84 Latitude |
| `longitude` | `longitude` | `DECIMAL(10,7)` | WGS84 Longitude |
| `total_beds` | `capacity` | `INTEGER` | Parsed integer bed capacity |
| `emergency_24x7` | `is_emergency_24x7` | `BOOLEAN` | 24x7 trauma care readiness |
| `operational_status` | `status` | `VARCHAR(80)` | Operational status |

---

## 4. Historical Disaster Damage Mapping

| Raw CSV Field (`chennai_historical_disaster_damage.csv`) | Database Column (`disaster_events`) | Type | Notes |
| :--- | :--- | :--- | :--- |
| `event_id` | `event_id` | `VARCHAR(80) PRIMARY KEY` | e.g. `EVT2015FL-001` |
| `disaster_name` | `name` | `VARCHAR(255)` | Event name |
| `disaster_type` | `disaster_type` | `VARCHAR(80)` | `Flood`, `Cyclone` |
| `event_date` | `event_date` | `DATE` | ISO Date |
| `affected_area` | `affected_area` | `VARCHAR(160)` | Neighbourhood or aggregate |
| `affected_zone` | `affected_zone` | `VARCHAR(120)` | Administrative zone |
| `severity_level` | `severity` | `VARCHAR(40)` | `Extreme`, `High`, `Moderate` |
| `rainfall_mm` | `rainfall_mm` | `FLOAT` | 24h rainfall amount |
| `people_affected` | `people_affected` | `INTEGER` | Count of affected population |
| `people_evacuated` | `people_evacuated` | `INTEGER` | Evacuation count |
| `deaths` | `deaths` | `INTEGER` | Reported casualties |
| `primary_cause` | `primary_cause` | `TEXT` | Meteorological/hydrological factors |
