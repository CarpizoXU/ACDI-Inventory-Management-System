# System Architecture

## Overview

The ACDI Inventory Management System follows a modular, layered architecture with clear separation of concerns.

## Layers

- Presentation: React + Vite UI, responsive dashboard, protected routes
- API: Express.js REST endpoints, JSON contracts, validation middleware
- Service: Business logic, authorization, transaction orchestration
- Repository: MongoDB data access abstraction via Mongoose
- Infrastructure: Database connection, logging, error handling, security middleware

## Backend Modules

- Authentication
- Users
- Products
- Categories
- Suppliers
- Transactions
- Audit logs
- Reports
- Physical counts

## Frontend Modules

- Auth flow
- Dashboard analytics
- Inventory catalog pages
- Transaction pages
- Reports pages
- Audit logs pages
- Settings and profile pages

## Security

- JWT access tokens
- bcrypt password hashing
- Helmet and CORS
- Role-based middleware
- Input validation with express-validator
- Environment-based configuration

## Deployment

- Local network-ready server host
- Backend listens on configurable LAN port
- Frontend served by Vite in development or static build for production
- MongoDB local installation or local network MongoDB instance
