# HealthBridge_Al (HealthBridge_Al) Project Report

---

## Abstract
HealthBridge_Al is a full‑stack healthcare management platform designed to bridge the gap between citizens in rural areas and healthcare professionals such as doctors and ASHA workers. The system provides role‑based access for six distinct user types (Admin, ASHA Worker, Citizen, Doctor, Clinical, Sub‑Center) and integrates secure authentication, PostgreSQL data storage, and AWS S3 for medical record handling.

---

## 1. Introduction
- **Problem Statement**: Rural healthcare delivery in India suffers from fragmented communication, limited access to qualified professionals, and insecure data handling.
- **Objectives**: Build a scalable, secure web application that enables citizens to register, health workers to submit updates, and doctors to review patient data in real‑time.
- **Key Benefits**: Improved accessibility, role‑based data privacy, and a unified dashboard for health monitoring.

---

## 2. System Architecture
### 2.1 High‑Level Flow
```
Citizen → Register / Submit health updates → ASHA Worker → Review & Forward → Doctor → Diagnosis & Feedback
```
- Data flows through a RESTful API layer, stored in PostgreSQL, and optional media files are persisted in AWS S3.

### 2.2 Technology Stack
| Layer | Technology | Reason |
|-------|------------|--------|
| Frontend | **Next.js (App Router)**, **React**, **Tailwind CSS**, **Shadcn UI**, **React Hook Form**, **Zod**, **Recharts** | Fast SSR, component‑driven UI, utility‑first styling, robust form validation, rich data visualisation |
| Backend | **Node.js**, **Express.js** | Non‑blocking I/O, lightweight API development |
| Database | **PostgreSQL** | Structured relational storage for health records |
| Authentication | **JWT**, **bcrypt.js** | Stateless token‑based auth, secure password hashing |
| Cloud Storage | **AWS S3** | Scalable object storage for medical images/documents |


---

## 3. Module Description (Roles)
| Role | Primary Capabilities |
|------|----------------------|
| **Admin** | Full system management, user CRUD, role assignment, view all records |
| **ASHA Worker** | Register citizens, submit periodic health updates, view assigned citizen data |
| **Citizen** | Register, view personal health summary, receive notifications |
| **Doctor** | Access patient records, add diagnoses, view analytics dashboards |
| **Clinical** | Manage clinical data, generate reports, oversee lab results |
| **Sub‑Center** | Aggregate data from multiple ASHA workers, provide regional overview |

---

## 4. Technical Implementation
### 4.1 Frontend
- **Pages & Routing**: Utilises Next.js App Router (`src/app/...`). Example: `src/app/asha/dashboard/page.jsx` renders the ASHA dashboard.
- **State Management**: React hooks (`useState`, `useEffect`, `useMemo`, `useCallback`) manage UI state and API calls.
- **Styling**: Tailwind CSS utility classes (`flex`, `grid`, `bg-primary`, `rounded-lg`, responsive prefixes like `md:grid-cols-2`).
- **Form Handling**: `react-hook-form` paired with `zod` schemas ensures robust validation.
- **Data Visualisation**: `recharts` renders charts on dashboards (e.g., health risk distribution).

### 4.2 Backend
- **Entry Point**: `backend/server.js` (or similar) creates an Express app, applies JSON parsing middleware, and mounts route modules.
- **Authentication Middleware**: `middleware/auth.js` verifies JWT tokens and injects `req.user`.
- **RBAC Middleware**: `middleware/role.js` checks `req.user.role` against allowed roles for each route.
- **API Structure**: Routes are grouped by domain (`/api/auth`, `/api/patients`, `/api/admin`). Example file: `backend/list-models.js` demonstrates a simple endpoint.
- **Database Layer**: Uses `pg` library for PostgreSQL queries; models are defined in `backend/models/*.js`.
- **Security**: Passwords hashed with `bcryptjs`; environment variables store secrets.
- **S3 Integration**: `backend/s3Client.js` configures AWS SDK; file uploads handled via signed URLs.

### 4.3 Database Schema (PostgreSQL)
```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE health_updates (
  id SERIAL PRIMARY KEY,
  citizen_id INT REFERENCES users(id),
  asha_id INT REFERENCES users(id),
  data JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Additional tables: patients, doctor_notes, s3_files, audit_logs, etc.
```

---

## 5. Key Features
- **Role‑Based Access Control (RBAC)** – Middleware enforces per‑endpoint permissions.
- **Secure Authentication** – JWT with short‑lived access tokens and refresh tokens.
- **Health Records Management** – CRUD operations for citizen health updates.
- **Cloud Storage** – Medical images stored in AWS S3, accessed via signed URLs.
- **Real‑Time Dashboard** – Recharts visualises risk scores, appointment stats.
- **Scalability** – Stateless backend, ready for container deployment.

---

## 6. Implementation Methodology
1. **Requirement Gathering** – Stakeholder interviews, user stories for each role.
2. **Design** – Wireframes, component hierarchy, API contract (OpenAPI spec).
3. **Development** – Iterative feature branches, CI with linting and unit tests.
4. **Testing** – Jest for frontend, Supertest for backend, manual UI walkthroughs.
5. **Future Deployment** – Platform‑agnostic deployment can be added when ready.

---

## 7. Conclusion & Future Scope
HealthBridge_Al demonstrates a modern, secure, and role‑centric approach to rural healthcare delivery. Future enhancements could include:
- **Machine Learning** – Predictive health risk models (training pipeline resides in `training/` directory).
- **Offline Support** – Service workers for ASHA workers with intermittent connectivity.
- **Telemedicine Integration** – Video call APIs for remote consultations.
- **Multi‑Language Support** – Internationalisation using i18n libraries.

---

*Prepared by the development team on 2026‑04‑08.*
