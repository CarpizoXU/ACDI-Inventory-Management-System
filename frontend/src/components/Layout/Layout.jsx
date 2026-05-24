import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../../store/authSlice';

const navItems = [
  { label: 'Dashboard', to: '/' },
  { label: 'Inventory', to: '/inventory' },
  { label: 'Stock In', to: '/stock-in' },
  { label: 'Stock Out', to: '/stock-out' },
  { label: 'Reports', to: '/reports' },
  { label: 'Physical Count', to: '/physical-count' },
];

function SidebarLink({ label, to }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `block rounded-2xl px-4 py-3 text-sm font-medium transition ${
          isActive ? 'bg-sky-600 text-white' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
        }`
      }
    >
      {label}
    </NavLink>
  );
}

export default function Layout() {
  const auth = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  function handleLogout() {
    dispatch(logout());
    navigate('/login');
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="flex min-h-screen">
        <aside className="w-72 bg-white border-r border-slate-200 p-6 shadow-sm">
          <div className="mb-10">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-600 text-xl font-bold text-white">AC</div>
            <div className="mt-4">
              <p className="text-sm uppercase tracking-[0.2em] text-slate-400">ACDI IMS</p>
              <p className="mt-2 text-xl font-semibold text-slate-900">Inventory</p>
            </div>
          </div>

          <nav className="space-y-2">
            {navItems.map((item) => (
              <SidebarLink key={item.to} label={item.label} to={item.to} />
            ))}
          </nav>

          <div className="mt-10 border-t border-slate-200 pt-6">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Signed in as</p>
            <p className="mt-2 text-sm font-semibold text-slate-900">{auth.user?.name || auth.user?.email}</p>
            <p className="text-sm text-slate-500">{auth.user?.role}</p>
            <button
              onClick={handleLogout}
              className="mt-4 inline-flex w-full items-center justify-center rounded-2xl bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-200"
            >
              Logout
            </button>
          </div>
        </aside>

        <main className="flex-1 p-6">
          <div className="mb-6 flex items-center justify-between gap-4">
            <div>
              <p className="text-sm text-slate-500">General Services Unit</p>
              <h1 className="text-3xl font-semibold text-slate-900">Inventory Management</h1>
            </div>
            <div className="inline-flex items-center gap-3 rounded-2xl bg-white px-4 py-3 shadow-sm">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-700">👤</span>
              <div>
                <p className="text-sm font-semibold text-slate-900">{auth.user?.name}</p>
                <p className="text-xs text-slate-500">{auth.user?.role}</p>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
