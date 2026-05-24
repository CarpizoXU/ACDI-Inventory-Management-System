# Quick Start Guide

## Prerequisites
- Node.js v14+
- MongoDB (local or MongoDB Atlas account)

## Step 1: Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file (copy from `.env.example` and update):
```bash
# Windows PowerShell
Copy-Item .env.example .env

# macOS/Linux
cp .env.example .env
```

4. Update `.env` with your MongoDB connection:
```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/acdi_inventory
JWT_SECRET=YourSecretKeyHere_MinimumLength32Chars
JWT_EXPIRES_IN=7d
NODE_ENV=development
```

5. Start the backend:
```bash
npm run dev
```

You should see: `Server running on port 5000` and `MongoDB connected`

## Step 2: Frontend Setup

1. In a new terminal, navigate to frontend:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env.local` file:
```
VITE_API_BASE_URL=http://localhost:5000/api/v1
```

4. Start the frontend:
```bash
npm run dev
```

You should see: `Local: http://localhost:5173/`

## Step 3: Access the Application

1. Open browser: http://localhost:5173
2. Register a new account with email and password
3. Login with your credentials
4. Navigate through the menu:
   - **Dashboard**: Overview of inventory status
   - **Inventory**: View all products
   - **Stock In**: Add stock to products
   - **Stock Out**: Remove stock from products
   - **Reports**: View transaction reports and analytics
   - **Physical Count**: Conduct physical inventory counts (NEW!)

## Physical Count Feature - Quick Test

1. Go to **Physical Count** page
2. Enter a location (e.g., "Main Warehouse")
3. Enter actual counts for products
4. Click **Submit Count**
5. A reference number (e.g., PC-12345678) confirms submission
6. Data is now persisted in MongoDB

## Verify Everything Works

### Backend Tests
```bash
cd backend
npm test
```

Expected result: 2 test suites, 7 tests passed ✓

### Frontend Build
```bash
cd frontend
npm run build
```

Expected result: dist folder created, no errors

## MongoDB Setup (if using local)

### On Windows:
```bash
# If installed via installer, MongoDB should start automatically
# Or start manually: mongod
```

### On macOS (using Homebrew):
```bash
brew services start mongodb-community
```

### On Linux (Ubuntu):
```bash
sudo systemctl start mongod
```

## MongoDB Setup (Cloud - MongoDB Atlas)

1. Create account at https://www.mongodb.com/cloud/atlas
2. Create a free cluster
3. Get connection string from Connect button
4. Update MONGO_URI in backend/.env with your connection string

## API Testing

You can test the Physical Count API endpoints using curl or Postman:

```bash
# Create a physical count (after logging in and getting JWT token)
curl -X POST http://localhost:5000/api/v1/physical-counts/create \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "location": "Main Warehouse",
    "items": [
      {
        "product": "PRODUCT_ID_HERE",
        "countedQuantity": 50,
        "notes": ""
      }
    ],
    "notes": "Initial physical count"
  }'

# List all physical counts
curl http://localhost:5000/api/v1/physical-counts/list \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Environment Setup Summary

Your app is configured with:

| Component | Running On | Status |
|-----------|-----------|--------|
| Backend API | http://localhost:5000 | ✓ |
| Frontend App | http://localhost:5173 | ✓ |
| MongoDB | localhost:27017 or MongoDB Atlas | ✓ |
| Physical Count Feature | Fully Integrated | ✓ |

## Troubleshooting

**Q: Backend says "MongoDB connection failed"**
A: Start MongoDB or update MONGO_URI to a valid connection string

**Q: Frontend shows "API connection refused"**
A: Make sure backend is running on port 5000

**Q: Port 5000 already in use**
A: Change PORT in backend/.env or kill the process using that port

**Q: CORS errors**
A: Ensure your frontend URL matches CORS_ORIGIN setting in backend (usually localhost:5173)

## File Structure

```
backend/
├── src/
│   ├── models/
│   │   ├── Product.js
│   │   ├── Transaction.js
│   │   ├── User.js
│   │   └── PhysicalCount.js (NEW!)
│   ├── repositories/
│   │   ├── productRepository.js
│   │   ├── transactionRepository.js
│   │   ├── userRepository.js
│   │   └── physicalCountRepository.js (NEW!)
│   ├── services/
│   │   ├── authService.js
│   │   ├── stockService.js
│   │   └── physicalCountService.js (NEW!)
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── stockController.js
│   │   └── physicalCountController.js (NEW!)
│   ├── routes/
│   │   ├── auth.js
│   │   ├── stock.js
│   │   └── physicalCount.js (NEW!)
│   └── app.js
├── .env.example
└── package.json

frontend/
├── src/
│   ├── pages/
│   │   ├── Dashboard.jsx
│   │   ├── Inventory.jsx
│   │   ├── StockIn.jsx
│   │   ├── StockOut.jsx
│   │   ├── Reports.jsx
│   │   ├── PhysicalCount.jsx (UPDATED!)
│   │   └── Login.jsx
│   ├── components/
│   │   └── Layout/
│   │       └── Layout.jsx (UPDATED!)
│   ├── App.jsx (UPDATED!)
│   └── services/
├── .env.local (create this)
└── package.json
```

## What's New in This Version

✨ **Physical Count Feature**
- Backend: Full API for creating, submitting, and reconciling physical counts
- Frontend: Complete UI for entering physical counts and tracking variances
- Database: New PhysicalCount model with MongoDB persistence
- Validation: Full input validation and error handling
- Authorization: Role-based access control (admin, inventory_manager)

All existing features (Stock In/Out, Reports, Inventory) continue to work as before.
