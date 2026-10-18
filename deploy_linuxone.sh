#!/usr/bin/env bash
# =============================================================================
# HAZARDIQ — IBM LinuxONE Community Cloud (Ubuntu 24.04 s390x) Deployment Script
# Target: 3 vCPUs, 8192 MB RAM, user: linux1
# =============================================================================

set -e

echo "============================================================"
echo "HAZARDIQ — Deploying on IBM LinuxONE (s390x)"
echo "============================================================"
ARCH=$(uname -m)
echo "Detected System Architecture: $ARCH"
echo "Kernel: $(uname -r)"

# 1. Update OS Packages & Toolchain
echo "[1/6] Installing OS dependencies on Ubuntu 24.04..."
sudo apt-get update -y
sudo apt-get install -y \
    build-essential \
    python3 \
    python3-pip \
    python3-venv \
    python3-dev \
    curl \
    git \
    libgdal-dev \
    libpq-dev

# 2. Ensure Node.js 22+ & npm are installed
if ! command -v node &> /dev/null || [ $(node -v | cut -d'.' -f1 | tr -d 'v') -lt 20 ]; then
    echo "[2/6] Installing Node.js 22 LTS for s390x..."
    curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
    sudo apt-get install -y nodejs
else
    echo "[2/6] Node.js is already installed: $(node -v)"
fi

# 3. Setup Python Virtual Environment for ML Engine
echo "[3/6] Setting up Python ML environment..."
python3 -m venv .venv
source .venv/bin/activate
pip install --upgrade pip
pip install \
    numpy \
    pandas \
    scikit-learn \
    fastapi \
    uvicorn \
    pydantic-settings \
    matplotlib

# 4. Train LinuxONE ML Models on Grounded Chennai Data
echo "[4/6] Executing LinuxONE AI/ML Training Pipeline..."
python3 backend/app/ml/linuxone_ml_pipeline.py

# 5. Build Frontend Web Application
echo "[5/6] Building Production Frontend Application..."
cd frontend
npm install
npm run build
cd ..

# 6. Configure and Start Unified Node/Express Server
echo "[6/6] Initializing HAZARDIQ Backend Server..."
cd server
npm install
cd ..

echo "============================================================"
echo "HAZARDIQ is Ready on IBM LinuxONE!"
echo "To run the platform interactively:"
echo "  source .venv/bin/activate && cd server && npm run start"
echo ""
echo "To run as a background systemd service:"
echo "  sudo cp hazardiq.service /etc/systemd/system/"
echo "  sudo systemctl daemon-reload"
echo "  sudo systemctl enable --now hazardiq"
echo "============================================================"
