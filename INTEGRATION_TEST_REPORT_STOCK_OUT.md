# ACDI Inventory Management System - Stock Out Integration Test Report

## Test Case Information

- **Test Case ID:** CIT003
- **Related Requirement:** RS005
- **Test Case Description:** Stock Out feature integration test
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
| 2 | Created product payload: `Office Laptop`, `Electronics`, `pcs`, quantity `20`, reorderThreshold `5`, unitPrice `850.5` |
| 3 | Stock-out payload: `productId`, `quantity: 6`, `note: 'Customer order fulfillment'` |
| 4 | API endpoint: `POST /api/v1/stock/stock-out` |

## Test Scenario

Verify that stock-out decreases the product quantity correctly and records a `stock-out` transaction.

## Integration Test Result

| # | Test Case ID | Test Script | Expected Results | Actual Results | Pass / Fail |
|---|--------------|-------------|------------------|----------------|-------------|
| 1 | CIT003 | `POST /api/v1/stock/stock-out` for existing product | Response status `200`, product quantity decreases by 6, transaction type `stock-out` | As expected, product quantity decreased to `14` and transaction type was `stock-out` | Pass |

## Test Script

```javascript
const stockOutResponse = await request(app)
  .post('/api/v1/stock/stock-out')
  .set('Authorization', `Bearer ${token}`)
  .send({
    productId,
    quantity: 6,
    note: 'Customer order fulfillment',
  });

expect(stockOutResponse.statusCode).toBe(200);
expect(stockOutResponse.body.success).toBe(true);
expect(stockOutResponse.body.data.product.quantity).toBe(14);
expect(stockOutResponse.body.data.transaction).toMatchObject({
  type: 'stock-out',
  quantity: 6,
  note: 'Customer order fulfillment',
});
```

## Notes
- The test ensures stock-out correctly deducts inventory from the product record.
- It also confirms the transaction object saves the correct type and quantity.
- The entry is validated in the in-memory MongoDB test environment.
