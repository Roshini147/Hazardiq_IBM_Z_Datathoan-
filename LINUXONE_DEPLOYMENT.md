# HAZARDIQ — IBM LinuxONE Community Cloud Deployment Guide

## 1. Overview
This guide provides complete instructions for deploying the **HAZARDIQ Multi-Hazard Risk & Relocation Intelligence Platform** onto an **IBM LinuxONE Community Cloud Virtual Machine** running **Ubuntu 24.04 (s390x architecture)**.

- **Target OS**: Ubuntu 24.04 LTS (s390x)
- **Resources**: 3 vCPUs, 8192 MB RAM
- **Default User**: `linux1`
- **Event Code**: `SSF2026`
- **Dashboard**: [https://linuxone.cloud.marist.edu/#/login](https://linuxone.cloud.marist.edu/#/login)
- **Fast Start Guides**: [https://community.ibm.com/zsystems/l1cc/faststart/](https://community.ibm.com/zsystems/l1cc/faststart/)

---

## 2. Secure SSH Connection (Without Hardcoding Keys)

Save your downloaded RSA private key to a secure local directory with restricted permissions:

```bash
# On Linux / macOS / WSL:
chmod 600 ~/.ssh/linuxone_key.pem
ssh -i ~/.ssh/linuxone_key.pem linux1@<YOUR_VM_IP>

# On Windows PowerShell:
ssh -i "C:\path\to\your_key.pem" linux1@<YOUR_VM_IP>
```

> [!SECURITY]
> Never commit your private key or hardcode VM IP addresses into git repositories. Always pass the key path dynamically via the `-i` flag.

---

## 3. Transferring & Deploying Project to LinuxONE

### Option A: Clone from GitHub (Recommended)
Once connected to your LinuxONE VM:
```bash
git clone https://github.com/Roshini147/Hazardiq_IBM_Z_Datathoan-.git HAZARDIQ
cd HAZARDIQ
chmod +x deploy_linuxone.sh
./deploy_linuxone.sh
```

### Option B: Direct SCP Transfer
From your local development machine:
```bash
scp -i ~/.ssh/linuxone_key.pem -r . linux1@<YOUR_VM_IP>:~/HAZARDIQ
```

---

## 4. Running the Machine Learning Engine on s390x

The ML pipeline is pre-configured to train on grounded Chennai elevation, historical damage, and shelter capacity data:

```bash
cd ~/HAZARDIQ
source .venv/bin/activate
python3 backend/app/ml/linuxone_ml_pipeline.py
```

### Outputs Generated:
- Multi-Hazard Risk Classification (`LOW`, `MODERATE`, `HIGH`, `CRITICAL`) with 5-fold cross-validation.
- Evacuation Displacement Regression ($R^2 > 0.99$).
- Feature importances saved to `data/linuxone_model_metadata.json`.

---

## 5. JupyterLab ML Environment Integration

If using the IBM LinuxONE JupyterLab environment:
1. Clone the JupyterLab ML repository:
   ```bash
   git clone https://github.com/linuxone-community-cloud/jupyter-lab-ml.git
   ```
2. Launch JupyterLab on port 8888.
3. Open `notebooks/HAZARDIQ_LinuxONE_ML.ipynb` to view interactive training, feature weight charts, and scenario simulations.

---

## 6. Running as a Production Systemd Service

To keep HAZARDIQ running continuously in the background on LinuxONE:

```bash
sudo cp ~/HAZARDIQ/hazardiq.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now hazardiq
```

Check service status:
```bash
sudo systemctl status hazardiq
```

---

## 7. Verification & Health Checks

Test the live endpoints on the LinuxONE VM:
```bash
# 1. Health check
curl http://localhost:3000/api/v1/health

# 2. Shelters & Live Capacity
curl http://localhost:3000/api/v1/shelters

# 3. Preserved legacy compatibility
curl http://localhost:3000/api/dashboard
```

---

## 8. Automated Test Execution

Run the built-in test suites:
```bash
cd ~/HAZARDIQ
node tests/test_capacity_engine.mjs
node tests/test_legacy_endpoints.mjs
node tests/test_incidents.mjs
node tests/test_targeted_notifications.mjs
```
