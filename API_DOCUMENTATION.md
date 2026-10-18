# HAZARDIQ — REST API Reference Documentation

## 1. Base URL & Protocol
- **API Version**: `v1`
- **Prefix**: `/api/v1` (with `/api` backwards-compatibility alias)
- **Format**: `application/json`
- **Response Structure**:
```json
{
  "success": true,
  "data": {}
}
```
- **Error Response Structure**:
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable message"
  }
}
```

---

## 2. Authentication & RBAC (`/api/v1/auth`)

### Public User Registration
- `POST /api/v1/auth/register`
- **Body**: `{ "username": "string", "email": "string", "password": "string", "preferred_zone": "string", "preferred_ward": "string", "preferred_language": "en" | "ta" }`
- **Response**: `{ "success": true, "data": { "token": "jwt...", "user": { "id": 1, "username": "...", "role": "PUBLIC_USER" } } }`

### User / Authority Login
- `POST /api/v1/auth/login`
- **Body**: `{ "email": "string", "password": "string" }`
- **Response**: `{ "success": true, "data": { "token": "jwt...", "user": { "id": 1, "role": "OPERATOR" } } }`

### Current Profile
- `GET /api/v1/auth/me`
- **Headers**: `Authorization: Bearer <token>`
- **Response**: User record with zone/ward preferences and role.

---

## 3. Relief Shelters & Capacity (`/api/v1/shelters`)

### List Shelters
- `GET /api/v1/shelters`
- **Query Params**: `zone`, `ward`, `status` (`AVAILABLE`, `LIMITED`, `FULL`, `NOT_AVAILABLE`)
- **Response**: Array of 215 Chennai shelters with capacity, occupancy, and status.

### Get Shelter Capacity Details
- `GET /api/v1/shelters/:id/capacity`
- **Response**:
```json
{
  "success": true,
  "data": {
    "shelter_id": "CHS001",
    "name": "Government High School",
    "total_capacity": 100,
    "current_occupancy": 85,
    "available_capacity": 15,
    "occupancy_rate": 0.85,
    "capacity_status": "AVAILABLE",
    "last_updated": "2026-09-12T08:00:00Z"
  }
}
```

### Allocate Relocation Capacity (Transactional)
- `POST /api/v1/shelters/:id/allocate`
- **Headers**: `Authorization: Bearer <token>` (Requires `OPERATOR`, `ANALYST`, or `ADMIN`)
- **Body**: `{ "count": 20, "affected_zone": "Zone 1", "affected_ward": "Ward 2", "notes": "Monsoon flood evacuation" }`
- **Validation**:
  - If requested count > available capacity:
    HTTP 400 with message: `"Insufficient capacity. Only {available} places remain available."`
  - Atomic database transaction locks row, updates occupancy, re-evaluates status to `LIMITED` or `FULL`, and generates audit log.

### Check-in & Check-out
- `POST /api/v1/shelters/:id/check-in`: `{ "count": number }`
- `POST /api/v1/shelters/:id/check-out`: `{ "count": number }`

---

## 4. Targeted Alerts & In-App Notifications (`/api/v1/alerts`)

### Publish Targeted Alert
- `POST /api/v1/alerts`
- **Headers**: `Authorization: Bearer <token>` (Authority only)
- **Body**:
```json
{
  "title": "Advisory: Adyar River Water Level Warning",
  "title_ta": "அறிவுறுத்தல்: அடையாறு ஆற்றில் வெள்ள நீர் எச்சரிக்கை",
  "severity": "WARNING",
  "hazard_type": "Flood",
  "affected_zone": "Zone 13 - Adyar",
  "affected_ward": "Ward 172",
  "message": "Water levels rising near Saidapet bridge. Evacuation centers activated.",
  "message_ta": "சைதாப்பேட்டை பாலம் அருகே நீர்மட்டம் உயர்ந்துள்ளது. நிவாரண முகாம்கள் தயார் நிலையில் உள்ளன.",
  "recommended_action": "Move to nearest high-ground relief shelter immediately.",
  "recommended_action_ta": "உடனடியாக அருகிலுள்ள நிவாரண மையத்திற்குச் செல்லவும்.",
  "source": "State Disaster Management Authority"
}
```
- **Automated Side-Effect**: Identifies all registered users with `preferred_zone = 'Zone 13 - Adyar'` and inserts in-app notification rows.

### Get User Notifications
- `GET /api/v1/notifications`
- **Headers**: `Authorization: Bearer <token>`
- **Response**: Array of unread and past targeted alerts with read state.

### Mark Notification as Read
- `PATCH /api/v1/notifications/:id/read`

---

## 5. Citizen Incident Reporting (`/api/v1/incidents`)

### Submit Incident Report
- `POST /api/v1/incidents`
- **Body**: `{ "incident_type": "Waterlogging", "description": "Street flooded waist-deep", "severity": "HIGH", "people_affected": 45, "area_name": "Velachery", "zone": "Zone 13 - Adyar", "ward": "Ward 172", "latitude": 12.9756, "longitude": 80.2207 }`
- **Response**: `{ "success": true, "data": { "id": 1, "status": "REPORTED" } }`

### Authority Incident Status Update
- `PATCH /api/v1/incidents/:id/status`
- **Headers**: `Authorization: Bearer <token>`
- **Body**: `{ "status": "UNDER_REVIEW" | "VERIFIED" | "RESOLVED" }`

---

## 6. Audit Logging (`/api/v1/audit-logs`)
- `GET /api/v1/audit-logs`
- **Headers**: `Authorization: Bearer <token>` (Admin/Analyst)
- **Response**: Complete chronological history of logins, shelter allocations, alert publications, and incident resolutions.
