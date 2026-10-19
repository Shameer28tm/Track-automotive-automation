# Changelog

All notable changes to **Track Automotive Automation** will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.0.0] - Phase 1 Migration (Python + Django + React)

### Added
- **Full-Stack Architecture Migration:**
  - Modernized the application from legacy ASP.NET Core 8 to **Django 5 + Django REST Framework** backend and **React 18 + Vite + Tailwind CSS** frontend.
- **Backend & API Capabilities:**
  - **Custom User Model & RBAC:** Strict backend-enforced boundaries across `Admin`, `Mechanic`, and `Customer` roles with token & session authentication.
  - **Google OAuth 2.0:** Secure OAuth token verification and account synchronization.
  - **Vehicle Fleet Management:** Registration, license plate uniqueness, chassis/VIN tracking, and customer isolation.
  - **Conflict-Free Scheduling:** Appointment booking with mechanic assignment and slot conflict validation.
  - **Repair Jobs & Invoicing:** Repair tracking, parts catalog, multipoint inspection checklist, and print-ready digital receipts with automated tax/total calculation.
  - **Fault Reporting:** Customer issue logging and diagnostic workflows.
  - **In-App Notifications:** Real-time event notifications for booking, assignment, and completion.
  - **AI Automotive Diagnostics:** Multi-provider AI chatbot supporting Gemini, OpenAI, Groq, and domain-fallback knowledge engine.
  - **Automated Database Seeding:** `python manage.py seed_data` command generating comprehensive demo data.
  - **Docker Compose:** Containerized PostgreSQL 16 database configuration.
  - **Comprehensive Test Suite:** 28 passing `pytest` test cases covering authentication, vehicles, appointments, repair jobs, and AI diagnostics.
- **Frontend SPA Capabilities:**
  - Modern, responsive UI with Tailwind CSS and Lucide icons.
  - Dedicated role dashboards for Admin, Mechanic, and Customer.
  - Integrated Chatbot widget with interactive recommendations.
  - Digital receipt printing and status badge indicators.
- **CI/CD:**
  - Added GitHub Actions pipeline for automated backend pytest testing and Vite production building.

## [1.0.0] - Legacy Baseline

### Added
- Initial C# / ASP.NET Core 8 garage management system baseline.
