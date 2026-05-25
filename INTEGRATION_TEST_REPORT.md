# ACDI Inventory Management System - Integration Test Report

## Test Suite: Stock and Inventory Integration

| Test Case ID | Feature | Description | Expected Result | Actual Result | Status |
|--------------|---------|-------------|-----------------|---------------|--------|
| CIT001 | Add Inventory | Create a new product through the inventory API | Response status 201, product created with correct fields and stockStatus `ok` | As expected | Pass |
| CIT002 | Stock In | Increase quantity for an existing product through stock-in API | Response status 200, quantity increases by requested amount, transaction type `stock-in` | As expected | Pass |
| CIT003 | Stock Out | Decrease quantity for an existing product through stock-out API | Response status 200, quantity decreases by requested amount, transaction type `stock-out` | As expected | Pass |
| CIT004 | Stock Out Negative | Reject stock-out request when requested quantity exceeds available stock | Response status 400, error message `Insufficient product quantity` | As expected | Pass |

## Environment
- Node.js: expected v14+
- MongoDB: in-memory for integration tests (MongoMemoryServer)
- Backend: Express, Mongoose, JWT
- Test Runner: Jest
- HTTP Testing: Supertest

## Execution Notes
- Run from backend directory:
  ```bash
  cd backend
  npm test
  ```
- The test suite exercises the actual API routes and database persistence
- Auth tokens are generated during test setup by registering and logging in an admin user

## Test Data
| Case | Admin User | Product Payload | Stock Adjustment |
|------|------------|-----------------|------------------|
| CIT001 | integration-admin@acdi.test | Office Laptop, quantity 20, reorderThreshold 5, unitPrice 850.5 | N/A |
| CIT002 | integration-admin@acdi.test | Existing Office Laptop | +10 |
| CIT003 | integration-admin@acdi.test | Existing Office Laptop | -6 |
| CIT004 | integration-admin@acdi.test | Existing Office Laptop | -100 |

## Summary
This report covers the critical stock and inventory workflows required for integration testing:
1. Add inventory (product creation)
2. Stock in
3. Stock out
4. Stock out validation for insufficient quantity

Use this report together with the test file `backend/src/tests/stockInventory.integration.test.js` to execute and verify the application behavior.
