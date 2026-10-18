# HAZARDIQ — Frontend to API Mapping Specification

## 1. Overview
This document specifies the exact mapping between frontend components, user interactions, and backend REST API endpoints across both the Public Emergency Portal and the Authority Command Center.

---

## 2. Public Portal Mapping

| Frontend Page / Component | User Action / Trigger | HTTP Method & Route | Request Payload | Response Data |
| :--- | :--- | :--- | :--- | :--- |
| **Header** (`AppLayout.tsx`) | Notification bell click | `GET /api/v1/notifications` | Header: `Bearer <token>` | List of unread/recent targeted notifications |
| **Header** (`AppLayout.tsx`) | Language toggle (EN/TA) | Client-side `useTranslation` | N/A | Language state saved to `localStorage` |
| **Dashboard** (`/`) | Page load | `GET /api/dashboard` or `GET /api/v1/analytics/overview` | None | `{assessed_areas, high_risk_areas, critical_vulnerability_areas, capacity_deficit_areas, relocation_priority_areas, safe_capacity}` |
| **Risk Map** (`/map`) | Page load / Layer toggle | `GET /api/risk` or `GET /api/v1/gis/risk-points` | Query: `?zone=...` | Geo-referenced risk assessment points with factors |
| **Risk Map** (`/map`) | Click shelter marker | `GET /api/v1/shelters/:id/capacity` | URL param `id` | Total, Occupied, Available, Capacity Status |
| **Safe Areas** (`/safe-areas`) | Page load | `GET /api/safe-areas` or `GET /api/v1/shelters?status=AVAILABLE` | None | Available safe locations ranked by suitability & distance |
| **Check My Area** (`/my-area`) | Select Zone / Ward | `GET /api/v1/areas/search?q=...` & `GET /api/v1/alerts?zone=...` | Query params | Local risk level, active alerts, nearest relief shelters |
| **Report Incident** (`/report-incident`)| Form submission | `POST /api/v1/incidents` | `{incident_type, description, severity, people_affected, zone, ward, latitude, longitude}` | `{success: true, data: {incident_id, status: "REPORTED"}}` |
| **Public Alerts** (`/alerts`) | Page load / filter | `GET /api/v1/alerts` | Query: `?severity=...&zone=...` | Active alerts with severity, action, verification status |
| **User Sign In** (`/auth/login`) | Form submit | `POST /api/v1/auth/login` | `{email, password}` | `{token, user: {id, username, role, preferred_zone}}` |
| **User Sign Up** (`/auth/register`)| Form submit | `POST /api/v1/auth/register`| `{username, email, password, preferred_zone, preferred_ward, preferred_language}` | `{token, user: {...}}` |

---

## 3. Authority Command Center Mapping

| Command Center Section | User Action / Trigger | HTTP Method & Route | Request Payload | Response Data |
| :--- | :--- | :--- | :--- | :--- |
| **Authority Auth** (`/authority/login`)| Login submit | `POST /api/v1/auth/authority-login` | `{username, password, role}` | Access token with claims (`OPERATOR`, `ANALYST`, `ADMIN`) |
| **Shelter Capacity Manager** | View shelter list | `GET /api/v1/shelters` | Query: `?zone=...&status=...` | Full capacity list (total, occupied, available, status) |
| **Relocation Allocation** | Allocate people to shelter | `POST /api/v1/shelters/:id/allocate` | `{count: number, affected_area_id: number, notes?: string}` | Transactional result; throws 400 if `count > available` |
| **Shelter Check-In** | Rapid registration | `POST /api/v1/shelters/:id/check-in` | `{count: number}` | Updated shelter occupancy |
| **Shelter Check-Out** | Discharge / transfer | `POST /api/v1/shelters/:id/check-out` | `{count: number}` | Updated shelter occupancy |
| **Create Targeted Alert** | Publish emergency alert | `POST /api/v1/alerts` | `{title, severity, affected_zone, affected_ward, message, recommended_action}` | Alert created; notifications auto-dispatched to users in target area |
| **Incident Review** | Change status | `PATCH /api/v1/incidents/:id/status` | `{status: "UNDER_REVIEW" \| "VERIFIED" \| "RESOLVED"}` | Updated incident record + Audit log entry |
| **Audit Log Viewer** | Inspect audit trail | `GET /api/v1/audit-logs` | Query: `?limit=50&action=...` | Chronological audit logs with operator identity, action, entity, timestamp |
| **Data Sources** | Transparency view | `GET /api/data-sources` or `GET /api/v1/data-sources` | None | Provenance, methodology, and update timestamps |
