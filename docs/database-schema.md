# Database Schema Design

## Collections

### users
- name
- email
- passwordHash
- role
- status
- profile
- createdAt
- updatedAt
- deletedAt (soft delete)

### products
- name
- sku
- barcode
- category
- description
- unit
- supplier
- quantity
- reorderLevel
- costPrice
- sellingPrice
- expiryDate
- batchNumber
- serialNumber
- status
- images
- tags
- createdAt
- updatedAt
- deletedAt

### categories
- name
- description
- parentCategory
- status
- createdAt
- updatedAt
- deletedAt

### suppliers
- name
- contact
- address
- email
- phone
- status
- createdAt
- updatedAt
- deletedAt

### transactions
- referenceNumber
- product
- type (stock-in, stock-out, transfer, adjustment)
- quantity
- unitCost
- user
- status
- notes
- sourceLocation
- destinationLocation
- createdAt
- updatedAt

### auditLogs
- user
- action
- entity
- entityId
- metadata
- ipAddress
- timestamp

### physicalCounts
- sessionName
- product
- expectedQuantity
- countedQuantity
- variance
- status
- countedBy
- approvedBy
- notes
- createdAt
- updatedAt

## Indexes

- users.email (unique)
- products.sku (unique)
- products.barcode (unique)
- categories.name
- transactions.referenceNumber (unique)
- auditLogs.timestamp
- physicalCounts.sessionName

## Notes

- Timestamps are enabled on all schemas.
- Soft delete uses `deletedAt` and `status`.
- Relationships are managed via ObjectId references.
- Query patterns will use pagination and filtering for performance.
