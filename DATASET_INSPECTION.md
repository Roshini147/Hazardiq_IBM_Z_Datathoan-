# HAZARDIQ — Dataset Inspection & Provenance Report

## 1. Overview
This document provides an exhaustive inspection of all raw datasets supplied for the **HAZARDIQ — Disaster Risk Intelligence & Emergency Information Platform**. Each dataset was inspected directly from the project source records, verifying row counts, field names, data types, geographic fields, missing value representations, and data source citations.

---

## 2. Inspected Datasets

### A. Chennai Evacuation Relief Shelter Capacity
- **File**: `data/chennai_evacuation_relief_shelter_capacity.csv`
- **Total Records**: 215 rows
- **Primary Source**: Greater Chennai Corporation (GCC) — *Details of Relief Centres in GCC - 2025* ([official document](https://chennaicorporation.gov.in/gcc/pdf/Relief_Center_details.pdf)).
- **Verification Date**: 2026-09-05
- **Key Columns**:
  - `shelter_id`: Unique identifier (`CHS001` to `CHS215`).
  - `shelter_name`: Official institution name (Corporation School, Govt Higher Secondary School, Community Centre, Marriage Hall).
  - `facility_type`: Categorization (e.g. Corporation School, Government School, Private School, Community Hall, Night Shelter, Marriage Hall).
  - `address`: Detailed postal address across Chennai.
  - `area`: Locality (e.g., Ennore, Kodungaiyur, Shenoy Nagar, Velachery, Mylapore, Sholinganallur).
  - `zone`: Administrative Zone (Zone 1 - Thiruvottiyur through Zone 15 - Sholinganallur).
  - `ward`: Greater Chennai Corporation Ward number (`Ward 1` to `Ward 200`).
  - `capacity_persons`: Rated shelter capacity in persons (range: 30 to 3,000 persons).
  - `official_relief_centre`, `flood_relief_shelter`, `cyclone_shelter`, `temporary_evacuation_shelter`: Boolean eligibility flags.
  - `toilets_available`, `drinking_water`, `electricity`, `backup_generator`, `food_facility`, `kitchen_available`, `medical_support_available`, `ambulance_access`: Critical emergency infrastructure flags.
  - `operational_status`: Activation state during disaster declarations.
- **Handling of Missing Values**:
  - Missing capacities or attributes are indicated as `NA` or `Unknown` in raw data.
  - In our schema, these are strictly preserved as `NULL` or calculated dynamically; they are never converted to zero or assumed to be unlimited.

---

### B. Chennai Hospitals & Emergency Facilities
- **File**: `data/chennai_hospitals_emergency_facilities.csv`
- **Total Records**: 95 rows
- **Primary Source**: Official Chennai District Government Directory (`chennai.nic.in`), Google Places, and State Health Department records.
- **Verification Date**: 2026-09-05
- **Key Columns**:
  - `facility_id`: Unique identifier (`CH001` to `CH095`).
  - `facility_name`: Hospital name (e.g., Rajiv Gandhi Government General Hospital, Kilpauk Medical College, MIOT International, Government Stanley Hospital).
  - `facility_type`: Teaching Hospital, Super-Specialty, Peripheral Hospital, Corporate Hospital.
  - `address`, `area`, `zone`, `pincode`: Postal and zone details.
  - `latitude`, `longitude`: WGS84 coordinates.
  - `total_beds`: Number of hospital beds (e.g., RGGGH: 2,722, MIOT: 1,000, KCSSH, etc.).
  - `emergency_24x7`, `trauma_care`, `ambulance_available`: 24x7 emergency readiness indicators.
  - `operational_status`: Current operational status.

---

### C. Historical Disaster Records & Damage Assessments
- **File**: `data/chennai_historical_disaster_damage.csv` & `data/chennai_district_disaster_loss_history.csv`
- **Total Records**: 27 localized impact records + 5 macro disaster events.
- **Primary Sources**: NDMA (via FloodList), World Weather Attribution, Tamil Nadu Government Press Releases, IMD, Lok Sabha official statements.
- **Key Events Covered**:
  1. **2015 Chennai Floods (Northeast Monsoon)**: Extreme rainfall (>490mm at Tambaram), reservoir releases into Adyar river, 1.8M people affected, 40,000 evacuated, 269 state-wide casualties.
  2. **Cyclone Vardah (2016)**: Very severe cyclonic storm, wind speeds >130 km/h, 23,000 evacuated, >1.5 lakh trees uprooted.
  3. **Cyclone Nivar (2020)**: Precautionary evacuation of >227,000 people across TN, widespread inundation in Mudichur, Velachery.
  4. **2021 November Northeast Monsoon Floods**: 1044.3 mm rainfall in November, severe inundation in Kolathur, Ambattur, Pallikaranai.
  5. **Cyclone Michaung / 2023 Floods**: Severe rainfall (>530mm in Nungambakkam), Cooum and Adyar overflowing, 32,158 evacuated, 4,967 relief centres activated across coastal districts.

---

### D. Chennai Demographics (Census 2011 & PCA Summary)
- **File**: `data/chennai_district_population_census2011.csv` & `data/district_pca_summary.csv`
- **Primary Source**: Census of India 2011 / Tamil Nadu Dept. of Economics & Statistics.
- **Key Figures**:
  - Pre-2018 core city limits (175 sq.km): 4,646,732 total population (2,335,844 male, 2,310,888 female).
  - Post-2018 expanded district limits (426 sq.km): 6,748,026 total population.
  - Literates: 3,776,276.
  - Scheduled Castes: 16.78%, Scheduled Tribes: 0.22%.
  - Sex Ratio: 989 females per 1,000 males.

---

### E. Digital Elevation Model (DEM)
- **File**: `data/chennai_elevation.csv`
- **Total Records**: Sampling of Chennai terrain elevation in meters across latitude 12.85 to 13.15 and longitude 80.10 to 80.28.
- **Usage**: Calculating low-lying elevation vulnerability to storm surge and river backflow.

---

### F. Administrative Region Boundaries (KML / GeoJSON)
- **File**: `data/tneb_region_boundary.kml` and Greater Chennai Corporation ArcGIS REST Feature Service.
- **Usage**: PostGIS spatial boundaries and client-side vector rendering of Chennai's 15 administrative zones and 200 wards.
