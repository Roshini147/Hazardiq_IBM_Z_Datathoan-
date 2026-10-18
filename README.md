# HAZARDIQ — AI-Powered Multi-Hazard Risk & Relocation Intelligence Platform
> **Enterprise Decision-Support Platform for Disaster Resilience, Multi-Hazard Risk Scoring & Humanitarian Relocation Planning**  
> *Integrated for High-Availability Deployment on IBM LinuxONE (s390x)*

[![Architecture: s390x / LinuxONE](https://img.shields.io/badge/Architecture-IBM%20LinuxONE%20(s390x)-052F5F?logo=ibm)](https://linuxone.cloud.marist.edu/)
[![OS: Ubuntu 24.04 LTS](https://img.shields.io/badge/OS-Ubuntu%2024.04%20LTS-E95420?logo=ubuntu)](https://ubuntu.com/)
[![React 19](https://img.shields.io/badge/Frontend-React%2019%20+%20Vite-61DAFB?logo=react)](https://react.dev/)
[![Node 22+](https://img.shields.io/badge/Backend-Node%2022%20+%20FastAPI-339933?logo=node.js)](https://nodejs.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

---

## 🌟 Executive Summary & Mission
**HAZARDIQ** is an AI-powered, GIS-integrated multi-hazard disaster intelligence platform designed to empower civic authorities and citizens with actionable real-time situational awareness. Specifically calibrated for Greater Chennai Corporation (GCC) and coastal riverine plain environments, HAZARDIQ transforms raw meteorological, topographic, and demographic data into deterministic risk ratings and humanitarian evacuation plans.

```text
Multi-Hazard Data (Rainfall, DEM, Historical Inundation)
               ↓
    Hazard & Exposure Identification
               ↓
Socio-Physical Vulnerability & Habitation Mapping
               ↓
  Dynamic Carrying-Capacity Assessment (215 GCC Shelters)
               ↓
AI/GIS Multi-Factor Risk Scoring (LinuxONE s390x Engine)
               ↓
 Relocation Prioritisation & Over-Allocation Prevention
               ↓
  Safe-Area Recommendations & Targeted In-App Alerts
```

---

## 🚀 Key Capabilities

1. **Deterministic Multi-Factor Risk Engine (0–100 Scale)**:
   - Hazard Exposure ($30\%$, DEM elevation + historical disaster frequency)
   - Population Exposure ($20\%$, Census 2011 density & vulnerable cohorts)
   - Socio-Physical Vulnerability ($25\%$, structural housing & critical services)
   - Capacity Deficit ($15\%$, dynamic shortfall vs. $8\%$ planning standard)
   - Accessibility Risk ($10\%$, proximity to 24x7 trauma facilities)

2. **Grounded Real-World Datasets**:
   - **215 GCC Evacuation Relief Centers**: Live tracking of total capacity, occupancy, and remaining beds.
   - **95 Chennai Hospitals & Emergency Facilities**: Verified trauma care readiness.
   - **Historical Disaster Inundation**: Grounded in NDMA/IMD records from 2015, 2016 (Vardah), 2020 (Nivar), 2021, and 2023 (Michaung).
   - **Digital Elevation Model (DEM)**: High-resolution terrain gradient analysis.

3. **Strict Capacity Protection & Over-Allocation Prevention**:
   - Transactional SQLite / PostgreSQL row locking prevents allocating evacuees beyond physical shelter capacity.
   - Transparent capacity states: `AVAILABLE` (green), `LIMITED` (amber), `FULL` (red), `NOT_AVAILABLE` (slate).

4. **Public & Authority Dual Portals**:
   - **Citizen Emergency Portal**: Multilingual (English & Tamil), hyper-local risk lookup, interactive evacuation vectors, nearest safe shelters, and citizen incident reporting with audit trails.
   - **Authority Command Center**: Protected login with role-based access control (`OPERATOR`, `ANALYST`, `ADMIN`), live shelter capacity manager, rapid check-in/out, and broadcast targeted advisories dispatched to specific zones.

---

## 🖥️ IBM LinuxONE (s390x) Integration

HAZARDIQ is packaged for deployment on the **IBM LinuxONE Community Cloud**:
- **Target OS**: Ubuntu 24.04 LTS (s390x architecture)
- **VM Spec**: 3 vCPUs, 8192 MB RAM (user `linux1`)
- **Machine Learning**: Random Forest multi-hazard classification and Gradient Boosting displacement estimation executed natively on s390x.
- **JupyterLab ML**: Includes interactive notebook `notebooks/HAZARDIQ_LinuxONE_ML.ipynb` optimized for the IBM LinuxONE JupyterLab environment.
- **Deployment Automation**: Single-command setup via `deploy_linuxone.sh` and production background daemon via `hazardiq.service`.

See [LINUXONE_DEPLOYMENT.md](LINUXONE_DEPLOYMENT.md) for full LinuxONE setup and SSH connection instructions.

---

## 🛠️ Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 19, TypeScript, Vite, Tailwind CSS v4, Lucide Icons, Recharts |
| **GIS & Mapping** | Leaflet, React-Leaflet, OpenStreetMap, GeoJSON polygons & vectors |
| **Backend API** | Node.js 22 LTS (Express + TypeScript) & Python 3.12+ (FastAPI) |
| **Database** | Node built-in `node:sqlite` (zero-friction deployment) + PostgreSQL/PostGIS |
| **AI / ML Engine** | Scikit-Learn (Random Forest & Gradient Boosting) on s390x architecture |
| **Localization** | Full bilingual support (English `en` & Tamil `ta`) |

---

## ⚡ Quick Start

### 1. Install & Build
```bash
# Frontend
cd frontend
npm install
npm run build
cd ..

# Server
cd server
npm install
npm run start
```
The application will be live at **`http://localhost:3000`**.

### 2. Run Machine Learning Pipeline on LinuxONE
```bash
python3 backend/app/ml/linuxone_ml_pipeline.py
```

### 3. Run Automated Test Suites
```bash
node tests/test_capacity_engine.mjs
node tests/test_legacy_endpoints.mjs
node tests/test_incidents.mjs
node tests/test_targeted_notifications.mjs
```

---

## 📜 Compliance & Verification Notice
This codebase represents the HAZARDIQ disaster-management platform. When preparing submissions for competitive events like the IBM Z Datathon, refer to event rules regarding prior codebase usage and ensure independent execution of eligible milestones.
