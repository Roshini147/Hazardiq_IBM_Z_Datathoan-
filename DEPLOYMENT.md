# HAZARDIQ — Production Deployment & Configuration Guide

## 1. System Architecture & Topology
HAZARDIQ is packaged as a unified, high-performance Node.js / Express / TypeScript application that serves both:
1. The **REST API** (`/api/v1` and `/api` compatibility endpoints)
2. The **Compiled Frontend Single Page Application** (production React 19 bundle from `frontend/dist`)

This ensures low-latency co-location, zero cross-origin configuration friction in production, and unified session/authentication cookies.

---

## 2. Environment Variables

Create `.env` in the repository root:
```ini
PORT=3000
NODE_ENV=production
JWT_SECRET=hazardiq_super_secure_production_secret_key_2026
DATABASE_PATH=./hazardiq_production.db
# Optional: PostgreSQL / Supabase connection string:
# DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[REF].supabase.co:5432/postgres
```

---

## 3. Build & Execution Workflow

### Step 1: Install Dependencies
```bash
# In frontend directory:
cd frontend
npm install

# In server directory:
cd ../server
npm install
```

### Step 2: Build the Frontend
```bash
cd frontend
npm run build
```
This compiles TypeScript and generates the production asset bundle into `frontend/dist`.

### Step 3: Run the Server
```bash
cd ../server
npm run start
```
The server binds to `http://localhost:3000`, initializes and seeds database tables from `data/*.csv`, and begins serving both the API and the web interface.

---

## 4. Public Deployment & Tunneling
To make HAZARDIQ publicly accessible from the internet over HTTPS:
```bash
npx untun tunnel http://localhost:3000
# or Cloudflare Tunnel:
# cloudflared tunnel --url http://localhost:3000
```
This generates a live public HTTPS URL accessible globally.

---

## 5. Production Health Check & Verification
- Health Endpoint: `GET /api/v1/health`
- Web Portal: `GET /`
- Tamil i18n Verification: Switch language to Tamil -> verify headers, table labels, and alerts render in Tamil.
- Capacity Guard Verification: Attempt to allocate more than remaining capacity -> verify rejection response.
