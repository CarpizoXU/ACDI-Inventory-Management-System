# Test-Driven Development Plan

## Phase 1
- Write unit tests for backend authentication and input validation.
- Build minimal auth controllers, services, and routes.
- Confirm base API and health routes.

## Phase 2
- Create frontend component tests for login pages and protected routes.
- Add integration tests for Redux state updates.
- Implement initial login screen and dashboard layout.

## Phase 3
- Design product catalog API tests.
- Implement Mongoose schemas and repository methods.
- Build inventory pages and product tables.

## Phase 4
- Add stock transaction tests for stock-in and stock-out flows.
- Build robust validation for negative inventory and approval workflows.
- Add audit log and reporting coverage.

## Phase 5
- Expand UI tests for dashboard widgets, filters, and modal forms.
- Add end-to-end coverage around role-based access.
- Ensure at least 80% coverage on core modules.

## Strategy
- Tests first for every feature.
- Keep implementation minimal to satisfy tests.
- Refactor after passing tests.
- Maintain clean architecture and separation of concerns.
