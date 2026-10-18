# HAZARDIQ — Database Schema Specification

## 1. Engine & Extensions
- **Primary Engine**: PostgreSQL 15+ with PostGIS extension (`CREATE EXTENSION IF NOT EXISTS postgis;`).
- **Portable Local / Seed Engine**: Embedded SQLite 3 with atomic transaction isolation and in-memory spatial distance calculations.

---

## 2. Table Definitions

### `users`
Tracks public citizens and authorized emergency personnel.
```sql
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username VARCHAR(100) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(30) NOT NULL DEFAULT 'PUBLIC_USER' CHECK (role IN ('PUBLIC_USER', 'OPERATOR', 'ANALYST', 'ADMIN')),
    preferred_language VARCHAR(10) NOT NULL DEFAULT 'en',
    preferred_zone VARCHAR(120),
    preferred_ward VARCHAR(80),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### `shelters`
Maintains operational capacity and live occupancy for all 215 Chennai relief centers.
```sql
CREATE TABLE shelters (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    external_id VARCHAR(80) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    facility_type VARCHAR(120) NOT NULL,
    address TEXT NOT NULL,
    area VARCHAR(160) NOT NULL,
    zone VARCHAR(120) NOT NULL,
    ward VARCHAR(80) NOT NULL,
    latitude DECIMAL(10, 7),
    longitude DECIMAL(10, 7),
    total_capacity INTEGER NOT NULL CHECK (total_capacity >= 0),
    current_occupancy INTEGER NOT NULL DEFAULT 0 CHECK (current_occupancy >= 0),
    available_capacity INTEGER GENERATED ALWAYS AS (total_capacity - current_occupancy) STORED,
    capacity_status VARCHAR(30) NOT NULL DEFAULT 'AVAILABLE' CHECK (capacity_status IN ('AVAILABLE', 'LIMITED', 'FULL', 'NOT_AVAILABLE')),
    operational_status VARCHAR(80) NOT NULL DEFAULT 'Operational',
    has_generator BOOLEAN DEFAULT FALSE,
    has_water BOOLEAN DEFAULT FALSE,
    has_toilets BOOLEAN DEFAULT FALSE,
    has_medical BOOLEAN DEFAULT FALSE,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_occupancy_limit CHECK (current_occupancy <= total_capacity)
);
CREATE INDEX ix_shelters_zone ON shelters(zone);
CREATE INDEX ix_shelters_ward ON shelters(ward);
CREATE INDEX ix_shelters_status ON shelters(capacity_status);
```

### `relocation_allocations`
Records all relocation allocation events executed by emergency operators.
```sql
CREATE TABLE relocation_allocations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    shelter_id INTEGER NOT NULL REFERENCES shelters(id) ON DELETE CASCADE,
    affected_zone VARCHAR(120) NOT NULL,
    affected_ward VARCHAR(80),
    allocated_count INTEGER NOT NULL CHECK (allocated_count > 0),
    authorized_by_id INTEGER REFERENCES users(id),
    status VARCHAR(30) NOT NULL DEFAULT 'ALLOCATED' CHECK (status IN ('ALLOCATED', 'TRANSFERRED', 'DISCHARGED', 'CANCELLED')),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX ix_allocations_shelter ON relocation_allocations(shelter_id);
```

### `alerts`
Targeted geographic disaster notifications published by authorities.
```sql
CREATE TABLE alerts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title VARCHAR(255) NOT NULL,
    title_ta VARCHAR(255),
    severity VARCHAR(30) NOT NULL CHECK (severity IN ('INFORMATION', 'ADVISORY', 'WARNING', 'EMERGENCY')),
    hazard_type VARCHAR(80) NOT NULL,
    affected_district VARCHAR(100) DEFAULT 'Chennai',
    affected_zone VARCHAR(120),
    affected_ward VARCHAR(80),
    message TEXT NOT NULL,
    message_ta TEXT,
    recommended_action TEXT NOT NULL,
    recommended_action_ta TEXT,
    source VARCHAR(255) NOT NULL,
    verification_status VARCHAR(40) NOT NULL DEFAULT 'VERIFIED' CHECK (verification_status IN ('UNVERIFIED', 'UNDER_REVIEW', 'VERIFIED')),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    issued_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP
);
CREATE INDEX ix_alerts_zone ON alerts(affected_zone);
CREATE INDEX ix_alerts_active ON alerts(is_active);
```

### `notifications`
Targeted in-app message deliveries generated from active alerts.
```sql
CREATE TABLE notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    alert_id INTEGER REFERENCES alerts(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX ix_notifications_user ON notifications(user_id, is_read);
```

### `incidents`
Public hazard and incident reports submitted through the citizen portal.
```sql
CREATE TABLE incidents (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    incident_type VARCHAR(80) NOT NULL,
    description TEXT NOT NULL,
    severity VARCHAR(30) NOT NULL CHECK (severity IN ('LOW', 'MODERATE', 'HIGH', 'CRITICAL')),
    people_affected INTEGER DEFAULT 0,
    area_name VARCHAR(160) NOT NULL,
    zone VARCHAR(120) NOT NULL,
    ward VARCHAR(80),
    latitude DECIMAL(10, 7),
    longitude DECIMAL(10, 7),
    status VARCHAR(30) NOT NULL DEFAULT 'REPORTED' CHECK (status IN ('REPORTED', 'UNDER_REVIEW', 'VERIFIED', 'RESOLVED')),
    reporter_name VARCHAR(120),
    reporter_phone VARCHAR(50),
    reported_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX ix_incidents_status ON incidents(status);
CREATE INDEX ix_incidents_zone ON incidents(zone);
```

### `audit_logs`
Tamper-evident operational audit trail capturing all critical actions.
```sql
CREATE TABLE audit_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER REFERENCES users(id),
    username VARCHAR(100) NOT NULL,
    role VARCHAR(30) NOT NULL,
    action VARCHAR(100) NOT NULL,
    entity VARCHAR(80) NOT NULL,
    entity_id VARCHAR(80),
    details TEXT,
    ip_address VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX ix_audit_entity ON audit_logs(entity, entity_id);
CREATE INDEX ix_audit_created ON audit_logs(created_at);
```

### `areas`, `resources`, `data_sources`, `risk_assessments`
Maintains geographic units, emergency healthcare facilities, open data metadata, and risk indices.
