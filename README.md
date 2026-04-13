<div align="center">

# 🏥 HealthBridge_Al — HealthBridge_Al

**Bridging the gap between citizens and healthcare through intelligent, role-based digital health management.**

[![Node.js](https://img.shields.io/badge/Backend-Node.js%20%2B%20Express-green?style=for-the-badge&logo=node.js)](https://nodejs.org)
[![Next.js](https://img.shields.io/badge/Frontend-Next.js%2014-black?style=for-the-badge&logo=next.js)](https://nextjs.org)
[![PostgreSQL](https://img.shields.io/badge/Database-PostgreSQL-316192?style=for-the-badge&logo=postgresql)](https://www.postgresql.org)
[![Python](https://img.shields.io/badge/AI%20Model-Python%203-blue?style=for-the-badge&logo=python)](https://www.python.org)
[![AWS S3](https://img.shields.io/badge/Storage-AWS%20S3-FF9900?style=for-the-badge&logo=amazon-aws)](https://aws.amazon.com/s3/)

</div>

---

## 📖 About

**HealthBridge_Al** (meaning *"Health Bridge"*) is a full-stack, AI-powered healthcare platform designed to digitize and streamline healthcare delivery — especially in rural and semi-urban India. It connects **citizens**, **ASHA workers**, **doctors**, **sub-centers**, and **clinical facilities** under one secure, role-based ecosystem.

The AI module uses trained machine learning models (XGBoost, Random Forest, SVM, Logistic Regression, LSTM) on a large Indian healthcare symptom-disease dataset to predict likely illnesses from symptoms.

---

## 🏗️ Project Architecture

```
HealthBridge_Al/
├── frontend/          # Next.js 14 App Router (React UI)
├── backend/           # Node.js + Express REST API
├── training/          # Python ML pipeline (training, evaluation, prediction)
│   └── models/        # Trained model files (.pkl, .keras)
├── Final_Augmented_dataset_Diseases_and_Symptoms.csv   # Primary training dataset
└── Indian-Healthcare-Symptom-Disease-Dataset.csv       # Secondary dataset
```

---

## ✨ Key Features

| Feature | Description |
|--------|-------------|
| 🔐 **Role-Based Access Control** | 6 roles: Admin, ASHA, Doctor, Citizen, Sub-Center, Clinical |
| 🤖 **AI Disease Prediction** | ML models predict diseases from patient symptoms |
| 📋 **Health Records Management** | Secure storage of patient visits, vitals, and queries |
| ☁️ **Cloud File Storage** | Medical documents stored securely on AWS S3 |
| 📊 **Interactive Dashboards** | Real-time analytics with charts (Recharts) |
| 🔒 **JWT Authentication** | Secure, token-based session management |
| 📡 **SSE (Server-Sent Events)** | Real-time updates pushed to the frontend |

---

## 🎨 Frontend

Built with **Next.js 14** (App Router) and **Tailwind CSS**.

### Tech Stack

| Technology | Purpose |
|---|---|
| Next.js 14 | React framework with App Router |
| Tailwind CSS | Utility-first styling |
| Shadcn UI / Radix UI | Accessible component library |
| Lucide React | Icon set |
| React Hook Form + Zod | Form handling and schema validation |
| Recharts | Data visualization & charts |

### Role-Based Modules

- **`admin/`** — System administration, user management, platform-wide analytics
- **`asha/`** — ASHA worker dashboard for community health data entry
- **`citizen/`** — Personal health portal for patients
- **`doctor/`** — Remote assessment and clinical review dashboard
- **`clinical/`** — Clinical facility management
- **`sub-center/`** — Sub-center healthcare facility portal

### Setup

```bash
cd frontend
npm install
npm run dev
# Available at http://localhost:9002
```

---

## ⚙️ Backend

Built with **Node.js + Express.js**, connected to **PostgreSQL**.

### Tech Stack

| Technology | Purpose |
|---|---|
| Node.js + Express | REST API server |
| PostgreSQL (`pg`) | Relational database |
| JWT + bcryptjs | Auth & password hashing |
| AWS SDK v3 (`@aws-sdk/client-s3`) | File storage on AWS S3 |
| SSE (`sseManager.js`) | Real-time server-sent events |

### API Routes

| Route File | Endpoints |
|---|---|
| `auth.js` | Login, Register |
| `dashboard.js` | Role-specific dashboard data |
| `health-query.js` | Symptom queries & AI prediction calls |
| `symptoms.js` | Symptom management |
| `visits.js` | Patient visit records |
| `vitals.js` | Patient vitals |

### Setup

```bash
cd backend
npm install
```

**Create `backend/.env`:**

```env
PORT=5000
DB_HOST=localhost
DB_PORT=5432
DB_USER=your_db_user
DB_PASSWORD=your_db_password
DB_NAME=healthbridge_db
JWT_SECRET=your_jwt_secret_key
AWS_ACCESS_KEY_ID=your_aws_key
AWS_SECRET_ACCESS_KEY=your_aws_secret
AWS_REGION=your_region
S3_BUCKET_NAME=your_bucket
```

**Run:**

```bash
node server.js
# or
npm run dev
```

---

## 🤖 AI / ML Module

The `training/` directory hosts the full ML pipeline for disease prediction.

### Models Trained

| Model | File |
|---|---|
| ✅ Best Model (Ensemble) | `best_model.pkl` |
| Random Forest | `random_forest.pkl` |
| XGBoost | `xgboost.pkl` |
| SVM | `svm.pkl` |
| Logistic Regression | `logistic_regression.pkl` |
| LSTM (Deep Learning) | `lstm_model.keras` |

### Pipeline Scripts

| Script | Description |
|---|---|
| `preprocess_data.py` | Cleans and encodes the dataset |
| `train_model.py` | Trains a single model |
| `train_all_models.py` | Trains all models and saves them |
| `evaluate_models.py` | Evaluates and compares model performance |
| `predict_model.py` | Runs prediction given symptoms input |

### Dataset

- **`Final_Augmented_dataset_Diseases_and_Symptoms.csv`** — 190MB+ augmented dataset of diseases and symptoms
- **`Indian-Healthcare-Symptom-Disease-Dataset.csv`** — Focused Indian healthcare dataset

### Run Prediction

```bash
cd training
pip install -r requirements.txt
python predict_model.py
```

---

## 🚀 Full-Stack Setup Guide

### Prerequisites

- Node.js v18+
- Python 3.9+
- PostgreSQL
- AWS S3 Bucket

### 1. Clone the repository

```bash
git clone https://github.com/Princekrcoder/HealthBridge_Al.git
cd HealthBridge_Al
```

### 2. Start Backend

```bash
cd backend
npm install
# configure .env
node server.js
```

### 3. Start Frontend

```bash
cd frontend
npm install
npm run dev
```

### 4. Run AI Prediction

```bash
cd training
pip install -r requirements.txt
python predict_model.py
```

---

## 🗂️ Database Schema (Overview)

The PostgreSQL database manages:

- **Users** — with roles (`admin`, `asha`, `doctor`, `citizen`, `sub-center`, `clinical`)
- **Health Records** — visits, vitals, health queries
- **ASHA-Citizen Assignments** — linking ASHA workers to their assigned citizens

Initialize with:

```bash
cd backend
node seed.js
```

---

## 👥 User Roles

| Role | Description |
|---|---|
| 🛡️ Admin | Full platform control |
| 🌿 ASHA Worker | Community health data collection |
| 👨‍⚕️ Doctor | Remote clinical assessment |
| 🧑 Citizen | Personal health records |
| 🏥 Clinical | Clinical facility operations |
| 🏢 Sub-Center | Sub-center management |

---

## 📄 License

This project is for **educational and academic purposes**.

---

<div align="center">

Built with ❤️ for accessible healthcare in India 🇮🇳

**HealthBridge_Al — HealthBridge_Al**

</div>
