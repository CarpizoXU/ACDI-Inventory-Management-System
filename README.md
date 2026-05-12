# ACDI Inventory Management System

A production-quality MERN inventory management application built for LAN deployment in local network environments.

## Overview

This system supports:
- Inventory catalog management
- Stock-in/out tracking
- Real-time monitoring
- Low-stock alerts
- Usage analytics
- RBAC authentication
- Reporting and export
- Physical inventory validation
- Audit logging

## Architecture

- MongoDB with Mongoose
- Express.js REST API backend
- React.js Vite frontend
- JWT authentication
- Role-Based Access Control
- Modular layered architecture
- TDD-first development path

## Getting Started

1. Clone the repository.
2. Install backend dependencies: `cd backend && npm install`
3. Install frontend dependencies: `cd ../frontend && npm install`
4. Configure `.env` files.
5. Start MongoDB locally.
6. Run backend: `npm run dev`.
7. Run frontend: `npm run dev`.

## Project Structure

- `/backend` - Express API, services, Mongoose models, tests
- `/frontend` - React app, components, pages, routes, tests
- `/docs` - requirements, architecture, schema design

## Branching Strategy

- `main` - production-ready releases
- `develop` - integration branch
- `feature/*` - incremental feature branches
- `hotfix/*` - urgent fixes

## Testing

- Backend: Jest + Supertest
- Frontend: Vitest + React Testing Library

## LAN Deployment

This application is designed to run on a local server host and be accessible via local IP address from the same network.

## Environment Files

- `backend/.env.example`
- `frontend/.env.example`
