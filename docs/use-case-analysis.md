# Use Case Analysis

## Actors

1. Admin
2. Inventory Manager
3. Staff
4. Auditor

## Use Cases

### Authentication
- Login
- Logout
- Forgot password
- Change password
- Profile management

### User Management
- Create user
- Update user
- Deactivate user
- Assign roles and permissions

### Inventory Catalog
- Create product
- Edit product
- Archive product
- Manage categories
- Search and filter products
- Upload product image
- Track SKU, barcode, batch, expiry, serials

### Stock Transactions
- Record stock-in
- Record stock-out
- Record transfers
- Record damage/loss
- Approve stock movements
- View transaction history

### Monitoring and Alerts
- View dashboard analytics
- Monitor low stock alerts
- View out-of-stock items
- Reorder threshold management

### Reporting
- Generate inventory report
- Generate stock movement report
- Generate low stock report
- Generate usage report
- Generate audit log report
- Generate physical count variance report

### Physical Inventory
- Start count session
- Record physical counts
- Reconcile differences
- Approve adjustments

## Actor-System Interactions

### Admin
- Full access to all modules
- Manage users, settings, inventory, reports, audit logs
- Can create, update, archive products
- Can approve or reject stock transactions

### Inventory Manager
- Manage products and categories
- Approve stock transactions and adjustments
- Generate operational reports
- Monitor thresholds and usage

### Staff
- Perform stock-in and stock-out operations
- View inventory and transaction history
- Record physical counts

### Auditor
- View reports and audit trails
- Access read-only financial and stock data
- Verify inventory adjustments and logs

## Functional Flows

### Stock-In Transaction
1. Staff submits stock-in form.
2. System validates product and quantity.
3. Service updates product quantity and transaction history.
4. Audit log records the operation.
5. Dashboard reflects updated stock.

### Low-Stock Alert
1. System checks reorder threshold for each product.
2. If quantity <= reorder level, mark product low stock.
3. Alert appears on dashboard and reporting pages.
4. Inventory Manager reviews and executes replenishment.

## Alternative Flows

- If product does not exist during transaction, show validation error.
- If quantity would go negative, reject transaction.
- If user lacks permissions, return authorization error.
- If physical count differs from system count, generate variance report.

## Error Flows

- Invalid credentials on login.
- Missing required fields in forms.
- Duplicate SKU or barcode.
- MongoDB connection failure.
- Token expiration or invalid JWT.
- Permission denied for restricted endpoints.

## Access Permissions

- Admin: Create, read, update, delete, and configure.
- Inventory Manager: CRUD inventory, approve transactions, read reports.
- Staff: Read inventory, create stock transactions, record counts.
- Auditor: Read-only access to reports and audit logs.

## Business Rules

- Quantity cannot drop below zero.
- SKU and barcode must be unique.
- Products with expiry dates must be tracked in reports.
- Low-stock alerts are triggered at reorder threshold.
- Audit logs capture user, action, timestamp, and metadata.
- Physical inventory reconciliation requires approval.

## Preconditions

- User must be authenticated.
- User role must be assigned.
- Product entries exist before stock transactions.
- MongoDB connection is live.

## Postconditions

- Stock changes update product quantity.
- Transactions generate audit logs.
- Dashboards reflect current inventory state.
- Reports provide accurate filtered results.
- Physical counts reconcile to adjusted balances.
