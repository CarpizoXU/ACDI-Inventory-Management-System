import { Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/Login';
import DashboardPage from './pages/Dashboard';
import InventoryPage from './pages/Inventory';
import StockInPage from './pages/StockIn';
import StockOutPage from './pages/StockOut';
import ReportsPage from './pages/Reports';
import PhysicalCountPage from './pages/PhysicalCount';
import ProtectedRoute from './routes/ProtectedRoute';
import Layout from './components/Layout/Layout';

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<DashboardPage />} />
        <Route path="inventory" element={<InventoryPage />} />
        <Route path="stock-in" element={<StockInPage />} />
        <Route path="stock-out" element={<StockOutPage />} />
        <Route path="reports" element={<ReportsPage />} />
        <Route path="physical-count" element={<PhysicalCountPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
