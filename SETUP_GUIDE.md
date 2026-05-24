# ACDI Inventory Management System - Setup & Run Guide

## Prerequisites
- Node.js (v14 or higher)
- MongoDB (local or cloud instance)
- Git
- npm or yarn

---

## Backend Setup

### 1. Navigate to Backend Directory
```bash
cd backend
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Create `.env` File
Create a file named `.env` in the `backend/` directory with the following variables:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database Configuration
MONGODB_URI=mongodb://localhost:27017/acdi-inventory
# OR for MongoDB Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/acdi-inventory?retryWrites=true&w=majority

# JWT Configuration
JWT_SECRET=your_jwt_secret_key_here_change_this_in_production
JWT_EXPIRY=7d

# CORS Configuration
CORS_ORIGIN=http://localhost:5173
```

### 4. MongoDB Setup
**Option A: Local MongoDB**
```bash
# If you have MongoDB installed locally, ensure it's running
mongod
```

**Option B: MongoDB Atlas (Cloud)**
1. Create a free account at https://www.mongodb.com/cloud/atlas
2. Create a cluster
3. Get your connection string from Atlas dashboard
4. Update `MONGODB_URI` in `.env` with your connection string

### 5. Run Backend
```bash
# Development mode (with auto-reload)
npm run dev

# Production mode
npm start

# Run Tests
npm test
```

Backend will be available at: `http://localhost:5000`

---

## Frontend Setup

### 1. Navigate to Frontend Directory
```bash
cd frontend
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Create `.env.local` File
Create a file named `.env.local` in the `frontend/` directory:

```env
VITE_API_BASE_URL=http://localhost:5000/api/v1
```

### 4. Run Frontend
```bash
# Development mode with hot reload
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run tests
npm test
```

Frontend will be available at: `http://localhost:5173`

---

## Running the Full Application

### Terminal 1 - Start MongoDB (if using local)
```bash
mongod
```

### Terminal 2 - Start Backend
```bash
cd backend
npm run dev
```

You should see:
```
Server running on port 5000
MongoDB connected: mongodb://localhost:27017/acdi-inventory
```

### Terminal 3 - Start Frontend
```bash
cd frontend
npm run dev
```

You should see:
```
VITE v5.4.21 ready in 123 ms
➜  Local:   http://localhost:5173/
```

---

## Verification Checklist

- [ ] MongoDB is running and accessible
- [ ] Backend server is running on port 5000
- [ ] Frontend dev server is running on port 5173
- [ ] Can access http://localhost:5173 in browser
- [ ] Can register a new user at `/login`
- [ ] Can log in with created credentials
- [ ] Dashboard loads successfully
- [ ] Can navigate to all menu items (Dashboard, Inventory, Stock In/Out, Reports, Physical Count)

---

## API Endpoints Reference

### Authentication
- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/login` - Login user

### Products
- `GET /api/v1/products/list` - List all products
- `POST /api/v1/products/create` - Create new product

### Stock Management
- `POST /api/v1/stock/stock-in` - Record stock in
- `POST /api/v1/stock/stock-out` - Record stock out

### Physical Count (NEW)
- `POST /api/v1/physical-counts/create` - Create physical count
- `GET /api/v1/physical-counts/list` - List all physical counts
- `GET /api/v1/physical-counts/:id` - Get specific physical count
- `POST /api/v1/physical-counts/:id/submit` - Submit physical count
- `POST /api/v1/physical-counts/:id/reconcile` - Reconcile physical count

### Reports
- `GET /api/v1/transactions/list` - Get all transactions

---

## Physical Count Feature - How to Use

### From Frontend
1. Navigate to **Physical Count** page from the sidebar menu
2. Enter count location and optional notes
3. Enter the actual counted quantity for each product
4. Review the variance column to identify discrepancies
5. Click **Submit Count** to save to database
6. System generates a reference number (e.g., PC-12345678)

### Behind the Scenes
- Physical counts are stored in MongoDB with status: `draft` → `submitted` → `reconciled`
- Each count item tracks:
  - Product ID
  - Counted Quantity (what you actually counted)
  - System Quantity (what's in database)
  - Variance (difference between counted and system)
- Counts can be queried, updated, and reconciled via the backend API

---

## Environment Variables Summary

### Backend (.env)
| Variable | Default | Description |
|----------|---------|-------------|
| PORT | 5000 | Server port |
| NODE_ENV | development | Environment mode |
| MONGODB_URI | mongodb://localhost:27017/acdi-inventory | Database connection string |
| JWT_SECRET | (required) | Secret key for JWT signing |
| JWT_EXPIRY | 7d | Token expiration time |
| CORS_ORIGIN | http://localhost:5173 | Allowed frontend origin |

### Frontend (.env.local)
| Variable | Default | Description |
|----------|---------|-------------|
| VITE_API_BASE_URL | http://localhost:5000/api/v1 | Backend API base URL |

---

## Troubleshooting

### Backend Won't Start
```
Error: connect ECONNREFUSED 127.0.0.1:27017
```
→ MongoDB is not running. Start MongoDB with `mongod` or update `MONGODB_URI` to point to a cloud instance.

### Frontend Can't Connect to Backend
```
GET http://localhost:5000/api/v1/... net::ERR_CONNECTION_REFUSED
```
→ Backend is not running. Run `npm run dev` in the backend directory.

### Port Already in Use
```
Error: listen EADDRINUSE :::5000
```
→ Port 5000 is already in use. Either kill the process using it or change PORT in `.env`

### CORS Errors in Console
```
Access to XMLHttpRequest blocked by CORS policy
```
→ Ensure `CORS_ORIGIN` in backend `.env` matches your frontend URL (http://localhost:5173)

---

## Testing

### Run Backend Tests
```bash
cd backend
npm test
```

All tests should pass:
- Authentication API tests
- Stock Transaction tests

### Run Frontend Tests (optional)
```bash
cd frontend
npm test
```

---

## Next Steps

1. **Database Initialization**: Consider seeding sample products and users
2. **API Documentation**: Generate Swagger/OpenAPI docs
3. **Error Handling**: Monitor error logs for debugging
4. **Performance**: Monitor database query performance as data grows
5. **Deployment**: Deploy to cloud services (Heroku, AWS, etc.)

---

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review error messages in both backend and frontend consoles
3. Verify all `.env` variables are set correctly
4. Ensure MongoDB connection is valid
