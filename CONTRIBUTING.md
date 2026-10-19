# Contributing to Track Automotive Automation

Thank you for your interest in contributing to **Track Automotive Automation**! This guide outlines how to contribute effectively to the Python/Django backend and React frontend.

---

## 🛠️ Development Workflow

### Prerequisites
- **Python:** 3.11+
- **Node.js:** 18+ & npm
- **Docker & Docker Compose:** (Optional, for running PostgreSQL locally)
- **Git**

### Backend Setup (Django + DRF)
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Create and activate a virtual environment:
   ```bash
   python -m venv venv
   # Windows:
   .\venv\Scripts\activate
   # macOS/Linux:
   source venv/bin/activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Copy the environment template:
   ```bash
   cp .env.example .env
   ```
   *(For fast SQLite local development without PostgreSQL, set `USE_SQLITE=True` in `.env`)*
5. Apply database migrations:
   ```bash
   python manage.py migrate
   ```
6. (Optional) Seed demo accounts and sample data:
   ```bash
   python manage.py seed_data
   ```
7. Run the development server:
   ```bash
   python manage.py runserver
   ```
8. Run backend tests:
   ```bash
   pytest
   ```

### Frontend Setup (React + Vite + Tailwind CSS)
1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Copy the environment template:
   ```bash
   cp .env.example .env
   ```
4. Start the Vite dev server:
   ```bash
   npm run dev
   ```
5. Build production bundle:
   ```bash
   npm run build
   ```

---

## 🔒 Security & Secrets
- Never commit `.env` files, API keys, passwords, database dumps, or real credentials.
- All configuration keys should be documented in `.env.example` with safe placeholder values.
- Verify changes with `git status` before committing.

---

## 🧪 Testing Guidelines
- All new backend endpoints, permissions, and business logic must include corresponding `pytest` tests under `backend/tests/`.
- Ensure all 28+ test cases pass and the frontend builds cleanly before submitting pull requests.

---

## 📝 Pull Request Process
1. Fork or branch from `main` (e.g., `feature/your-feature-name` or `fix/issue-description`).
2. Keep changes focused and self-contained.
3. Ensure CI checks pass.
4. Submit a Pull Request describing your changes, test evidence, and any deployment considerations.
