# 🚗 Track Automotive Automation — Garage & Service Management Platform

<div align="center">

**A modern, responsive, full-stack Garage and Automotive Service Management System**

[![Python](https://img.shields.io/badge/Python-3.11-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://www.python.org/)
[![Django](https://img.shields.io/badge/Django-5.1-092E20?style=for-the-badge&logo=django&logoColor=white)](https://www.djangoproject.com/)
[![DRF](https://img.shields.io/badge/Django_REST_Framework-3.17-red?style=for-the-badge)](https://www.django-rest-framework.org/)
[![React](https://img.shields.io/badge/React-18.3-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-6.0-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](LICENSE)

</div>

---

## 📋 Overview

**Track Automotive Automation** is an enterprise-grade automotive service management platform built for garage owners, certified mechanics, and vehicle owners. The application unifies customer accounts, vehicle registration, service booking, repair jobs, replacement parts, multipoint inspections, printable invoices, in-app notifications, and an AI-powered automotive diagnostic advisor into a seamless SaaS platform.

### Key Capabilities

- 🛡️ **Role-Based Access Control (RBAC):** Strict backend-enforced boundaries across **Admin**, **Mechanic**, and **Customer** roles.
- 🔐 **Authentication & Google OAuth:** Secure password hashing, token/cookie session authentication, and Google Sign-In integration.
- 🚙 **Vehicle Fleet Management:** Detailed vehicle records, VIN/chassis tracking, fuel types, mileage, and service logs.
- 📅 **Conflict-Free Service Appointments:** Real-time scheduling with double-booking prevention and mechanic assignments.
- 🔧 **Repair Jobs & Digital Invoices:** Service bay tracking, parts catalog, multipoint inspection checklist, and print-ready receipts.
- ⚠️ **Vehicle Fault Reporting:** Customer issue logging with mechanic diagnosis and resolution workflows.
- 🔔 **In-App Notifications:** Real-time alerts for booking confirmations, technician assignments, and service completions.
- 🤖 **AI Automotive Advisor:** Multi-provider AI chatbot (Gemini / OpenAI / Groq) with server-side key management, safety disclaimers, and built-in domain fallback.

---

## 🏗️ Architecture & Project Structure

The project is organized as a clean, decoupled monorepo:

```text
Track-automotive-automation/
├── backend/                         # Django 5 + Django REST Framework API
│   ├── config/                      # Project configuration (settings, urls, asgi, wsgi)
│   ├── apps/
│   │   ├── accounts/                # Custom User model, auth views, permissions, seed command
│   │   ├── customers/               # Customer roster & admin operations
│   │   ├── vehicles/                # Vehicle records & customer isolation
│   │   ├── appointments/            # Booking engine & conflict prevention
│   │   ├── services/                # Repair jobs, parts, inspections, faults, dashboard summary
│   │   ├── notifications/           # In-app notification center & delivery service
│   │   └── chatbot/                 # AI service abstraction & safety guardrails
│   ├── tests/                       # Automated test suite (pytest-django)
│   ├── requirements.txt             # Python dependencies
│   ├── pytest.ini                  # Pytest configuration
│   ├── manage.py                    # Django management script
│   └── .env.example                 # Backend environment template
├── frontend/                        # React 18 + Vite + Tailwind CSS Single-Page Application
│   ├── src/
│   │   ├── api/client.js            # Axios client with interceptors
│   │   ├── context/AuthContext.jsx  # Authentication state & role checks
│   │   ├── components/
│   │   │   ├── common/              # Navbar, Sidebar, StatCard, StatusBadge, Modal, Spinner
│   │   │   ├── chatbot/             # Floating AI Chatbot widget
│   │   │   └── notifications/       # Notification dropdown with unread badge
│   │   ├── layouts/                 # DashboardLayout with responsive drawer
│   │   ├── pages/                   # Auth, Dashboard, Vehicles, Appointments, Services, Faults
│   │   └── routes/                  # App routing with ProtectedRoute
│   ├── package.json                 # Node dependencies & build scripts
│   ├── vite.config.js               # Vite bundler configuration
│   ├── tailwind.config.js           # Automotive SaaS styling palette
│   └── .env.example                 # Frontend public environment template
├── docker-compose.yml               # PostgreSQL 16 container definition
├── .gitignore                       # Git exclusion rules
├── LICENSE                          # Original project license
└── README.md                        # Documentation
```

---

## ⚡ Prerequisites

Before running the application locally, verify the following are installed on your machine:

- **Python 3.11+** (`python --version`)
- **Node.js 18+** (`node --version`) and **npm** (`npm --version`)
- **Docker Desktop** (optional, recommended for PostgreSQL) or local **PostgreSQL 14+**
- **Git** (`git --version`)
- **Windows PowerShell** (or Bash on macOS/Linux)

---

## 🚀 Quick Start Guide (Windows PowerShell)

### Step 1: Database Setup

#### Option A: Using Docker Compose (Recommended)

Start the PostgreSQL 16 container:

```powershell
# From the project root directory
docker compose up -d
```

This launches a containerized PostgreSQL instance on port `5432` with database `trackautomotive`.

#### Option B: Zero-Config Local SQLite (Instant Development)

If Docker or PostgreSQL is not available on your system, the backend is pre-configured with an automatic SQLite fallback. In `backend/.env`, set:

```env
USE_SQLITE=True
```

The database will be automatically created at `backend/db.sqlite3` with zero setup.

---

### Step 2: Backend Setup (Terminal 1)

1. Open Windows PowerShell and navigate to the `backend` directory:
   ```powershell
   cd backend
   ```

2. Activate the virtual environment:
   ```powershell
   # If not already created: python -m venv venv
   .\venv\Scripts\Activate.ps1
   ```

3. Ensure dependencies are installed:
   ```powershell
   pip install -r requirements.txt
   ```

4. Configure your environment variables:
   ```powershell
   # Copy the example file if .env does not exist
   Copy-Item .env.example .env
   ```

5. Run database migrations:
   ```powershell
   python manage.py migrate
   ```

6. Seed initial test data (Admin, Mechanics, Customers, Vehicles, Appointments, Repairs):
   ```powershell
   python manage.py seed_data
   ```

   *Alternatively, create a fresh custom administrator:*
   ```powershell
   python manage.py createsuperuser
   ```

7. Start the Django development API server:
   ```powershell
   python manage.py runserver 127.0.0.1:8000
   ```

The backend is now live at `http://127.0.0.1:8000/api/`!
- Health check: `http://127.0.0.1:8000/api/health/`
- Django Admin: `http://127.0.0.1:8000/admin/`

---

### Step 3: Frontend Setup (Terminal 2)

1. Open a **second** Windows PowerShell terminal and navigate to `frontend`:
   ```powershell
   cd frontend
   ```

2. Ensure Node dependencies are installed:
   ```powershell
   npm install
   ```

3. Verify environment configuration:
   ```powershell
   Copy-Item .env.example .env
   ```
   *`VITE_API_BASE_URL` is set to `http://localhost:8000/api`.*

4. Launch the Vite development server:
   ```powershell
   npm run dev
   ```

5. Open your browser and visit: **`http://localhost:5173`**

---

## 🔑 Pre-Configured Test Credentials

The `seed_data` command creates ready-to-test accounts representing each role:

| Role | Email | Password | Access Capabilities |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@trackautomotive.com` | `AdminPass123!` | Complete system oversight, all customers & vehicles, confirm bookings, create staff/mechanics, open repair jobs, manage invoices |
| **Mechanic** | `john.mechanic@trackautomotive.com` | `MechPass123!` | Technician dashboard, update assigned repairs, add parts, log multipoint inspections, diagnose faults |
| **Mechanic** | `mike.mechanic@trackautomotive.com` | `MechPass123!` | Second technician account for assignment & isolation testing |
| **Customer** | `sarah.customer@example.com` | `CustomerPass123!` | Customer portal, manage own registered vehicles, book service appointments, report vehicle faults, view receipts |

*Note: You can click the "Quick Demo Accounts" pill buttons directly on the Login page to autofill any of these test credentials.*

---

## 🌐 Google OAuth 2.0 Integration Setup

The backend and frontend are architected for end-to-end Google OAuth sign-in. To connect real Google credentials:

1. **Google Cloud Console:**
   - Go to [Google Cloud Console -> APIs & Services -> Credentials](https://console.cloud.google.com/apis/credentials).
   - Create an **OAuth 2.0 Client ID** (Application type: *Web application*).
   - Add Authorized JavaScript Origins:
     - `http://localhost:5173`
     - `http://127.0.0.1:5173`
   - Add Authorized Redirect URIs:
     - `http://localhost:5173/auth/google/callback`
     - `http://127.0.0.1:8000/api/auth/google/`
2. **Backend Configuration (`backend/.env`):**
   ```env
   GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET=your-google-client-secret
   ```
3. **Frontend Configuration (`frontend/.env`):**
   ```env
   VITE_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
   ```
4. **Behavior:**
   - When configured, Google Sign-In validates JWT ID tokens directly against Google's public tokeninfo endpoint.
   - New Google users are automatically registered and assigned the `CUSTOMER` role. Existing accounts are authenticated securely.
   - When `VITE_GOOGLE_CLIENT_ID` is empty in development, the Google button activates the simulated one-click development driver profile.

---

## 🤖 AI Chatbot Advisor Configuration

The AI chatbot endpoint is powered by a server-side provider abstraction:

```text
Client (React Widget) ──> Django API (/api/chatbot/chat/) ──> Provider Service (Gemini / OpenAI / Groq)
```

### Supported Providers

Configure `backend/.env` with your preferred AI provider:

#### 1. Google Gemini (Default)
```env
AI_PROVIDER=gemini
AI_API_KEY=your_gemini_api_key_here
AI_MODEL=gemini-1.5-flash
```

#### 2. OpenAI
```env
AI_PROVIDER=openai
AI_API_KEY=your_openai_api_key_here
AI_MODEL=gpt-3.5-turbo
```

#### 3. Groq
```env
AI_PROVIDER=groq
AI_API_KEY=your_groq_api_key_here
AI_MODEL=llama-3.1-70b-versatile
```

#### 4. Built-In Domain Fallback (`mock`)
If no API key is set or `AI_PROVIDER=mock`, the system automatically engages an intelligent automotive knowledge fallback that answers questions about synthetic oil intervals, brake squeals, check engine codes, tire rotations, and garage booking procedures.

All responses strictly include safety disclaimers reminding drivers that AI guidance does not replace a hands-on mechanical inspection.

---

## 🧪 Testing & Verification

### Run Backend Tests

From the `backend` directory with the virtualenv active:

```powershell
pytest
```

**Results:** 28 automated unit and integration tests covering:
- User registration and role enforcement (`CUSTOMER` by default)
- Password confirmation and validation
- Google OAuth token verification and user provisioning
- Admin staff creation vs. unauthorized non-admin attempts
- Customer vehicle isolation (customers cannot access other customers' records)
- Duplicate registration plate rejection
- Appointment scheduling, vehicle conflict prevention, and slot verification
- Mechanic repair job access (mechanics can only modify their assigned tickets)
- Multipoint inspection and replacement parts financial aggregation
- Vehicle fault reporting and diagnostic resolution
- Real database metric calculations on role-based dashboards
- AI chatbot validation, safety disclaimers, and provider error handling

### Build Frontend Production Bundle

From the `frontend` directory:

```powershell
npm run build
```

The production assets compile into `frontend/dist/` in under 3 seconds with zero build warnings.

---

## 📚 API Endpoints Reference

| Method | Endpoint | Description | Permitted Roles |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/health/` | Service health status check | Public |
| `POST` | `/api/auth/register/` | Public customer registration | Public |
| `POST` | `/api/auth/login/` | User login (returns token) | Public |
| `POST` | `/api/auth/logout/` | Token invalidation & logout | Authenticated |
| `GET/PATCH` | `/api/auth/me/` | Current user profile | Authenticated |
| `POST` | `/api/auth/google/` | Google OAuth token exchange | Public |
| `GET/POST` | `/api/auth/users/` | User listing & mechanic creation | Admin |
| `GET` | `/api/auth/mechanics/` | Available mechanics list | Authenticated |
| `GET/POST` | `/api/vehicles/` | Vehicle CRUD (isolated to owner) | Authenticated |
| `GET/POST` | `/api/appointments/` | Appointment scheduling | Authenticated |
| `POST` | `/api/appointments/{id}/cancel/` | Appointment cancellation | Owner / Admin |
| `GET/POST` | `/api/services/jobs/` | Service repair orders | Authenticated |
| `POST` | `/api/services/jobs/{id}/add_part/` | Log replacement part | Mechanic / Admin |
| `POST` | `/api/services/jobs/{id}/add_inspection/` | Add checkpoint result | Mechanic / Admin |
| `GET` | `/api/services/jobs/{id}/receipt/` | Service receipt & invoice breakdown | Authenticated |
| `GET` | `/api/services/dashboard/summary/` | Role-specific dashboard metrics | Authenticated |
| `GET/POST` | `/api/services/faults/` | Defect reporting & diagnostics | Authenticated |
| `GET` | `/api/notifications/` | List user in-app notifications | Authenticated |
| `POST` | `/api/notifications/{id}/read/` | Mark single notification read | Authenticated |
| `POST` | `/api/notifications/mark-all-read/` | Mark all notifications read | Authenticated |
| `GET` | `/api/notifications/unread-count/` | Unread notifications badge counter | Authenticated |
| `POST` | `/api/chatbot/chat/` | AI Automotive Advisor inquiry | Authenticated |

---

## 🛠️ Common Errors & Troubleshooting

### 1. `ImportError: DLL load failed while importing _rust`
- **Cause:** Windows AppLocker or Application Control policy blocking local compiled Rust C-extensions inside virtual environment packages.
- **Fix:** The application uses Google's standard public HTTP tokeninfo API directly with standard libraries, completely eliminating reliance on compiled Rust DLLs.

### 2. `Connection refused to PostgreSQL on localhost:5432`
- **Cause:** Docker Desktop is not running or PostgreSQL service is stopped.
- **Fix:** Set `USE_SQLITE=True` in `backend/.env` for instant zero-dependency startup, or start Docker Desktop and run `docker compose up -d`.

### 3. CORS / CSRF Origin Errors
- **Cause:** Frontend running on a different port than default `5173`.
- **Fix:** Update `CORS_ALLOWED_ORIGINS` and `CSRF_TRUSTED_ORIGINS` in `backend/.env` to include your client URL (e.g., `http://localhost:5173`).

---

## 🔮 Phase 1 Limitations & Phase 2 Roadmap

### Intentionally Deferred to Phase 2 (Per Architectural Specification)
- **Celery & Redis:** Background task queuing and periodic scheduled workers.
- **SMS & External Messaging:** Twilio SMS / WhatsApp gateway dispatch.
- **Email Delivery:** SendGrid or SMTP background email delivery.

### Phase 2 Architecture Ready
The `apps.notifications.services.send_notification` helper and `apps.appointments` models have been designed with clean service hooks so that background Celery tasks, SMS dispatch, and scheduled maintenance reminder crons can be connected in Phase 2 without schema alterations or breaking changes.

---

## 📄 License & Attributions

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.
Historical C# application source files and legacy configurations have been preserved in the verified backup archive.