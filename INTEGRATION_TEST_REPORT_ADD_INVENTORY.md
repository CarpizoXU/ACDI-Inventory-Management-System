# ACDI Inventory Management System - Add Inventory Integration Test Report

## Test Case Information

- **Test Case ID:** CIT001
- **Related Requirement:** RS005
- **Test Case Description:** Add Inventory Product feature integration test
- **Created By:** Gerard Vega
- **Version:** 0.20.0
- **QA Tester's Name:** Lorenz Abonitalla
- **Date Tested:** May 24 2026
- **Test Case Status:** Pass
- **Test Environment:** Windows 11

## Prerequisites

1. Node.js
2. Source Code/Repository
3. MongoDB Memory Server / In-memory database environment
4. Jest
5. Supertest
6. Bcrypt

## Test Data

| # | Test Data |
|---|-----------|
| 1 | Admin user credentials created during test: `integration-admin@acdi.test` / `Integration123` |
| 2 | Product payload: `Office Laptop`, `Electronics`, `pcs`, quantity `20`, reorderThreshold `5`, unitPrice `850.5` |
| 3 | API endpoint: `POST /api/v1/products` |
| 4 | Authorization: Bearer token from login |

## Test Scenario

Verify that the add inventory API accepts a valid product payload and creates a product record with the correct fields and stock status.

## Integration Test Result

| # | Test Case ID | Test Script | Expected Results | Actual Results | Pass / Fail |
|---|--------------|-------------|------------------|----------------|-------------|
| 1 | CIT001 | `POST /api/v1/products` with valid product payload | Response status `201`, created product should include `_id`, `quantity: 20`, `stockStatus: ok` | As expected, API returned `201`, created product had `_id`, `quantity: 20`, `stockStatus: ok` | Pass |

## Test Script

```javascript
const response = await request(app)
  .post('/api/v1/products')
  .set('Authorization', `Bearer ${token}`)
  .send({
    name: 'Office Laptop',
    category: 'Electronics',
    unit: 'pcs',
    vendor: 'ACDI Supplies',
    supplier: 'ACDI Supplier',
    receivedBy: 'warehouse.team',
    notes: 'Initial inventory batch',
    quantity: 20,
    reorderThreshold: 5,
    unitPrice: 850.5,
  });

expect(response.statusCode).toBe(201);
expect(response.body.success).toBe(true);
expect(response.body.data).toHaveProperty('_id');
expect(response.body.data).toMatchObject({
  name: 'Office Laptop',
  category: 'Electronics',
  unit: 'pcs',
  quantity: 20,
  reorderThreshold: 5,
  unitPrice: 850.5,
});
expect(response.body.data.stockStatus).toBe('ok');
```

## Notes
- The test uses authentication to create the product.
- The backend creates the product record in an in-memory MongoDB instance for test isolation.
- This feature is confirmed to be working based on the test outcome.
