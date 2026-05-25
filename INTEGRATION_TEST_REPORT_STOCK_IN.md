# ACDI Inventory Management System - Stock In Integration Test Report

## Test Case Information

- **Test Case ID:** CIT002
- **Related Requirement:** RS005
- **Test Case Description:** Stock In feature integration test
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
| 3 | Stock-in payload: `productId`, `quantity: 10`, `note: 'Stock replenishment'` |
| 4 | API endpoint: `POST /api/v1/stock/stock-in` |

## Test Scenario

Verify that stock-in increases the product quantity correctly and records a `stock-in` transaction.

## Integration Test Result

| # | Test Case ID | Test Script | Expected Results | Actual Results | Pass / Fail |
|---|--------------|-------------|------------------|----------------|-------------|
| 1 | CIT002 | `POST /api/v1/stock/stock-in` for existing product | Response status `200`, product quantity increases by 10, transaction type `stock-in` | As expected, product quantity increased to `30` and transaction type was `stock-in` | Pass |

## Test Script

```javascript
const stockInResponse = await request(app)
  .post('/api/v1/stock/stock-in')
  .set('Authorization', `Bearer ${token}`)
  .send({
    productId,
    quantity: 10,
    note: 'Stock replenishment',
  });

expect(stockInResponse.statusCode).toBe(200);
expect(stockInResponse.body.success).toBe(true);
expect(stockInResponse.body.data.product.quantity).toBe(30);
expect(stockInResponse.body.data.transaction).toMatchObject({
  type: 'stock-in',
  quantity: 10,
  note: 'Stock replenishment',
});
```

## Notes
- The test first creates an inventory item using the add inventory API.
- Then it performs a stock-in operation and verifies the updated product quantity.
- The backend persists the transaction and updates the product in the in-memory test database.
