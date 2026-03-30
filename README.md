# SehatSetu 🩺

**SehatSetu** is a modern, full-stack healthcare platform designed to bridge the gap between citizens (rural/urban) and healthcare providers. It provides a secure, role-based ecosystem to manage health records, facilitate communication, and manage healthcare operations efficiently.

---

## 🏗️ Architecture & Tech Stack

The project is divided into two main components: an interactive **Frontend** client and a robust **Backend** API service.

### 🎨 Frontend
- **Framework:** Next.js (App Router)
- **Styling:** Tailwind CSS
- **UI Components:** Shadcn UI (Radix UI), Lucide React (Icons)
- **Form Handling & Validation:** React Hook Form + Zod
- **Data Visualization:** Recharts
- **Key Modules:**
  - `admin/`: System-wide administration dashboard.
  - `asha/`: Dashboard for ASHA workers to manage local community health.
  - `citizen/`: Personal health portal for patients/citizens.
  - `doctor/`: Remote assessment and clinical dashboard for medical professionals.
  - `clinical/` & `sub-center/`: Local healthcare facility management.

### ⚙️ Backend
- **Framework:** Node.js with Express.js
- **Database:** PostgreSQL (using `pg` driver)
- **Authentication:** JSON Web Tokens (JWT) & bcryptjs for password hashing.
- **File Storage:** AWS S3 (`@aws-sdk/client-s3`) for secure medical record and image storage.
- **Key Services:**
  - **Auth Service:** Secure login and registration.
  - **Role-Based Access Control (RBAC):** Middleware to restrict routing based on user roles (`admin`, `asha`, `doctor`, `citizen`, `sub-center`, `clinical`).
  - **Dashboard APIs:** Data feeding to the Next.js frontend interfaces.
  - **Health Query Service:** Processing queries and health data storage.

---

## ✨ Key Features

1. **Role-Based Workflows:** 
   Tailored dashboards for 6 distinct user roles, ensuring the right person sees the right data.
2. **Secure Patient Data:** 
   Healthcare records are stored in PostgreSQL with sensitive files securely stored in AWS S3.
3. **Interactive Dashboards:** 
   Real-time reporting and charts using Recharts.
4. **ASHA Worker Integration:** 
   Empowers ground-level health workers (ASHA) to digitize citizen health data effectively.
5. **RESTful Architecture:** 
   Modular Backend API design making the system scalable and easy to maintain.

---

## 🚀 Setup & Installation

### Prerequisites
- Node.js (v18+)
- PostgreSQL Database
- AWS S3 Bucket Credentials

### 1. Backend Setup
```bash
cd backend
npm install
```
**Environment Variables (`backend/.env`):**
```env
PORT=5000
DB_HOST=localhost
DB_PORT=5432
DB_USER=your_db_user
DB_PASSWORD=your_db_password
DB_NAME=sehatsetu_db
JWT_SECRET=your_super_secret_key
# AWS S3 Credentials...
```
**Run Server:**
```bash
npm run dev
# OR
node server.js
```

### 2. Frontend Setup
```bash
cd frontend
npm install
```
**Run Frontend Server:**
```bash
npm run dev
```
The frontend will be available at `http://localhost:9002` (configurable via package.json).

---
*Built with ❤️ for accessible healthcare.*
