# HAZARDIQ — Disaster Risk Intelligence Methodology & Scoring Framework

## 1. Principles
The HAZARDIQ Risk Engine implements a deterministic, explainable, and transparent multi-factor scoring methodology tailored for Chennai's coastal and riverine hydrology. It explicitly isolates objective primary data from derived model scores.

---

## 2. Risk Score Formulation (0–100 Scale)

The composite **Risk Score ($R$)** for an administrative zone or ward is computed as a weighted combination of five empirical factors:

$$R = w_h \cdot H + w_p \cdot P + w_v \cdot V + w_c \cdot C + w_a \cdot A$$

Where weights sum to $1.00$:
- **Hazard Exposure Factor ($H$, weight $w_h = 0.30$)**: Combines terrain elevation ($E_{DEM}$ from `chennai_elevation.csv`) and historical disaster frequency (`chennai_historical_disaster_damage.csv`). Low elevation points (< 5m above sea level) adjacent to Cooum, Adyar, Buckingham Canal, or Pallikaranai marsh receive higher hazard exposure.
- **Population Exposure Factor ($P$, weight $w_p = 0.20$)**: Normalizes Census 2011 population density and vulnerable age cohorts per ward against the district benchmark.
- **Socio-Physical Vulnerability ($V$, weight $w_v = 0.25$)**: Assesses structural housing characteristics, basic services (drinking water, sanitation), and proportion of marginal workers (`district_pca_summary.csv`).
- **Carrying Capacity Deficit ($C$, weight $w_c = 0.15$)**: Computed dynamically from live relief shelter capacity:
  $$C = \max\left(0, \frac{\text{Required Emergency Shelter} - \text{Available Shelter Capacity}}{\text{Required Emergency Shelter}}\right) \times 100$$
  Where required emergency capacity is modeled at 8% of ward population.
- **Accessibility & Critical Facility Risk ($A$, weight $w_a = 0.10$)**: Evaluates average distance to the nearest operational 24x7 trauma hospital (`chennai_hospitals_emergency_facilities.csv`) and arterial road accessibility during flood events.

---

## 3. Risk Level Classification

| Risk Score Range | Classification | Color Hex | Semantic Definition | Recommended Authority Action |
| :--- | :--- | :--- | :--- | :--- |
| **0.0 – 29.9** | `LOW` | `#10B981` (Emerald) | Minimal historical inundation; safe carrying capacity. | Designated as potential relocation destination area. |
| **30.0 – 49.9** | `MODERATE` | `#3B82F6` (Blue) | Manageable risk; localized waterlogging possible. | Regular monitoring; standard drainage clearance. |
| **50.0 – 69.9** | `HIGH` | `#F59E0B` (Amber) | Elevated flood risk; moderate shelter constraints. | Issue Weather Advisory; pre-position rescue teams. |
| **70.0 – 84.9** | `VERY HIGH` | `#EA580C` (Orange) | Significant hazard exposure; carrying capacity deficit. | Issue Warning; prepare relief centers for check-in. |
| **85.0 – 100.0** | `CRITICAL` | `#DC2626` (Red) | Extreme inundation expected; severe capacity deficit. | Immediate Emergency Alert; initiate managed relocation. |

---

## 4. Relocation Priority Engine

When evacuating people from high-risk zones, relocation priority ($RP$) is calculated as:

$$RP = 0.35 \cdot R + 0.25 \cdot V + 0.20 \cdot C + 0.10 \cdot P + 0.10 \cdot A$$

Areas with $RP \ge 70$ are prioritized for immediate transfer to designated safe shelters.

---

## 5. Safe Area Suitability Scoring

Candidate receiving shelters are ranked by a **Suitability Index ($S$)**:

$$S = 0.65 \cdot (100 - R_{\text{destination}}) + 0.35 \cdot \left(\min\left(100, \frac{\text{Available Capacity}}{\text{Total Capacity}} \times 100\right)\right)$$

Locations where `Available Capacity = 0` are strictly excluded from recommended evacuation routes.
