# ACDI Inventory Management System

A production-quality MERN-based Inventory Management System designed for **LAN deployment with centralized cloud database synchronization (MongoDB Atlas)**. The system supports multi-device access where each workstation runs a local copy of the application while sharing a unified database.

---

# Overview

The system provides a complete inventory workflow solution for organizational use, including:

* Inventory catalog management
* Stock-in and stock-out tracking
* Real-time inventory monitoring
* Low-stock alert system
* Transaction history logging
* User authentication and role-based access control (RBAC)
* Physical inventory counting
* Reporting and analytics
* Spreadsheet import/export utilities
* Audit trail logging

---

# Tech Stack

## Frontend

* React (Vite)
* React Router
* Redux Toolkit
* Tailwind CSS
* Axios

## Backend

* Node.js
* Express.js
* MongoDB (Mongoose)
* JWT Authentication
* bcryptjs
* express-validator

## Testing

* Jest (Backend)
* Supertest (API testing)
* Vitest (Frontend)

---

# System Architecture

## Deployment Architecture (LAN + Cloud Database)

The system follows a **distributed LAN client architecture with centralized database synchronization**.

## Key Characteristics

* Each device runs its own local copy of the system
* All devices connect to a shared MongoDB Atlas database
* No centralized hosting server required
* Suitable for LAN-based organizational deployment
* Supports offline development + online synchronization

---

# Project Structure

```
/backend     - Express API, services, controllers, models
/frontend    - React application UI
/docs        - System documentation (architecture, schema, use case)
/tests       - Integration and unit tests
```

---

# Getting Started

## 1. Clone Repository

```bash
git clone https://github.com/your-repo/acdi-inventory.git
cd acdi-inventory
```

---

## 2. Install Dependencies

### Backend

```bash
cd backend
npm install
```

### Frontend

```bash
cd frontend
npm install
```

---

# Environment Setup (.env Files)

## Backend `.env`

Create a `.env` file inside `/backend`:

```env
PORT=5000

MONGO_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/acdi_inventory

JWT_SECRET=your_secret_key_here
JWT_EXPIRES_IN=7d

NODE_ENV=development
CORS_ORIGIN=http://localhost:5173

ADMIN_EMAIL=admin@acdi.local
ADMIN_PASSWORD=ChangeMe123
ADMIN_NAME=ACDI Admin
```

---

## Frontend `.env`

Create `.env.local` inside `/frontend`:

```env
VITE_API_BASE_URL=http://localhost:5000/api/v1
```

---

# Running the Application

## Option 1: Using BAT Files (Recommended)

### Start Full System

```bash
start-all.bat
```

### Start Backend Only

```bash
start-backend.bat
```

### Start Frontend Only

```bash
start-frontend.bat
```

---

## Option 2: Manual Run

### Backend

```bash
cd backend
npm run dev
```

### Frontend

```bash
cd frontend
npm run dev
```

---

## Access URLs

| Service     | URL                                            |
| ----------- | ---------------------------------------------- |
| Frontend    | [http://localhost:5173](http://localhost:5173) |
| Backend API | [http://localhost:5000](http://localhost:5000) |

---

# Staging Environment

The system uses a **local staging deployment model** rather than cloud hosting.

## Staging Characteristics

* Runs on local machines (LAN-based deployment)
* Connected to MongoDB Atlas (central database)
* Each device runs identical application build
* Used for acceptance testing and validation

---

# CI/CD Pipeline (GitHub Actions)

The project includes automated testing for the staging branch:

* Backend test execution (Jest + Supertest)
* Frontend build verification (Vite)
* Dependency installation validation

Trigger: Push to `staging` branch

---

# Semantic Versioning

The project follows **Semantic Versioning (SemVer)**:

| Version        | Type    | Description                    |
| -------------- | ------- | ------------------------------ |
| v0.1.0-alpha.1 | Alpha   | Internal testing build         |
| v0.1.0-beta.1  | Beta    | User acceptance testing build  |
| v1.0.0         | Release | Final production-ready version |

All releases are published under:

* GitHub → Releases section
* Tagged builds for version tracking

---

# Deployment Notes

* No centralized web hosting (Vercel/Render not used)
* System is deployed via LAN client installation
* Database hosted on MongoDB Atlas
* Each workstation runs a local instance of frontend + backend

---

# Testing

## Backend Testing

```bash
cd backend
npm test
```

## Frontend Testing

```bash
cd frontend
npm test
```

---

# Branching Strategy

* `main` → production-ready code
* `develop` → integration branch
* `staging` → acceptance testing branch
* `feature/*` → feature development
* `hotfix/*` → urgent fixes

---

# Installation Process

The ACDI Inventory Management System is deployed as a packaged project directory containing both frontend and backend modules. The deployment is designed to be **simple, repeatable, and suitable for non-technical end users** within an organizational LAN environment.

The system uses automated scripts to minimize manual configuration and eliminate the need for individual dependency installation.

---

## Step 1: Extract System Files

The system is distributed as a compressed archive:

```
ACDI-Inventory-Management-System.zip
```

To begin installation:

* Extract the ZIP file using built-in extraction tools (Windows Extract / WinRAR / 7-Zip)
* Place the extracted folder in a local directory, such as:

  * Desktop
  * C:\ACDI-System\
  * Documents folder

After extraction, the project directory should contain both:

```
/backend
/frontend
/install.bat
/run-dev.bat
```

---

## Step 2: Configure Environment Settings

The system includes pre-configured environment files:

* `backend/.env`
* `frontend/.env.local`

These files define essential system configuration parameters:

### Backend Configuration Includes:

* MongoDB Atlas connection string (`MONGO_URI`)
* Server port (`PORT=5000`)
* JWT authentication settings
* CORS configuration for frontend access
* System admin credentials (default setup)

### Frontend Configuration Includes:

* API base URL (`VITE_API_BASE_URL`)
* Backend connection endpoint

### Important Note:

In most cases, **no manual modification is required**, unless deployment customization (such as database switching or port changes) is needed.

---

## Step 3: Install System Dependencies

To simplify deployment, the system includes an automated installation script:

```
install.bat
```

### When executed, this script will:

* Automatically check if Node.js is installed
* Install backend dependencies using `npm install`
* Install frontend dependencies using `npm install`
* Validate installation success
* Prepare the system for execution

### Key Advantage:

No manual installation of individual packages is required. The script ensures a consistent environment across all client machines.

---

## Step 4: Run the System

After successful installation, the system can be started using:

```
run-dev.bat
```

### When executed, this script will:

* Launch the backend server (Node.js + Express.js)
* Start the frontend application (React + Vite)
* Automatically open the system in the browser

---

## System Access

Once running, the system can be accessed via:

```
http://localhost:5173
```

---

## Important Execution Notes

To ensure proper system operation:

* Both backend and frontend terminal windows must remain open
* Closing either window will terminate system services
* If the system fails to load, restart using `run-dev.bat`

---

## Database Connectivity

The system connects to a centralized cloud database:

* MongoDB Atlas (cloud-hosted)
* Shared across all client devices
* Enables real-time synchronization of inventory data

---

# Installation Summary

The installation process follows a simplified 6-step deployment workflow:

1. Install Node.js (if not yet installed)
2. Install or configure MongoDB Atlas connection (already preconfigured in system)
3. Extract repository ZIP file to local directory
4. Configure environment files (`.env` and `.env.local`) if customization is required
5. Run automated installation script (`install.bat`)
6. Launch system using `run-dev.bat`
7. Access the application via browser at `http://localhost:5173`

---

## Deployment Design Principle

This system is designed under a **LAN-based distributed deployment model**, where:

* Each workstation runs a local copy of the application
* All devices connect to a centralized MongoDB Atlas database
* No centralized web hosting server is required
* System is optimized for institutional and internal organizational use

---

# GitHub Releases

All milestones and testing versions are documented in GitHub Releases:

* Alpha Release → Internal QA testing
* Beta Release → User Acceptance Testing
* Production Release → Final system deployment

---
