# ACDI Inventory Management System - Integration Test Report (Spreadsheet Format)

## Test Case Information

- **Test Case ID:** CIT001 - CIT004
- **Related Requirement:** RS005
- **Test Case Description:** Database to Authentication Controller Integration Test for stock and inventory features
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
| 1 | `npm install` in backend directory to install dependencies |
| 2 | `npm test` in backend directory to execute Jest integration tests |
| 3 | In-memory database launched by `mongodb-memory-server` via tests |
| 4 | Admin user account created during test execution |

## Test Scenario

Tests stock and inventory integration for add inventory, stock-in, and stock-out features.

## Integration Test Results

| # | Test Case ID | Test Script | Expected Results | Actual Results | Pass / Fail |
|---|--------------|-------------|------------------|----------------|-------------|
| 1 | CIT001 | `POST /api/v1/products` with product payload | Response 201, product created with correct fields, stockStatus `ok` | As expected, created product returned with `_id`, `quantity: 20`, `stockStatus: ok` | Pass |
| 2 | CIT002 | `POST /api/v1/stock/stock-in` for existing product | Response 200, product quantity increased by 10, transaction type `stock-in` | As expected, product quantity updated to 30 and transaction type `stock-in` | Pass |
| 3 | CIT003 | `POST /api/v1/stock/stock-out` for existing product | Response 200, product quantity decreased by 6, transaction type `stock-out` | As expected, product quantity updated to 14 and transaction type `stock-out` | Pass |
| 4 | CIT004 | `POST /api/v1/stock/stock-out` with excessive quantity | Response 400, error `Insufficient product quantity` | As expected, response 400 and message `Insufficient product quantity` | Pass |

## Detailed Test Scripts

### CIT001 - Add Inventory

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
expect(response.body.data.stockStatus).toBe('ok');
```

### CIT002 - Stock In

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
expect(stockInResponse.body.data.transaction.type).toBe('stock-in');
```

### CIT003 - Stock Out

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
expect(stockOutResponse.body.data.transaction.type).toBe('stock-out');
```

### CIT004 - Stock Out with Insufficient Quantity

```javascript
const stockOutResponse = await request(app)
  .post('/api/v1/stock/stock-out')
  .set('Authorization', `Bearer ${token}`)
  .send({
    productId,
    quantity: 100,
    note: 'Attempt to remove too many items',
  });

expect(stockOutResponse.statusCode).toBe(400);
expect(stockOutResponse.body.success).toBe(false);
expect(stockOutResponse.body.message).toBe('Insufficient product quantity');
```

## Execution Notes

- The tests use `MongoMemoryServer` for an isolated in-memory MongoDB instance.
- An admin account is created during test setup and used to authenticate API requests.
- These integration tests execute against the actual Express app routes.

## Pass Summary
- CIT001: Pass
- CIT002: Pass
- CIT003: Pass
- CIT004: Pass

---

## Test Script Reference File
- `backend/src/tests/stockInventory.integration.test.js`

## Conclusion
The integration tests cover add inventory, stock-in, stock-out, and insufficient quantity validation. All cases passed successfully in the local test environment.
