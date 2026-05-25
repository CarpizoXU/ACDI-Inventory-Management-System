import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const navItems = [
  { label: 'Dashboard', to: '/dashboard' },
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
        `block rounded-2xl px-4 py-3 text-sm font-semibold transition ${
          isActive ? 'bg-white/10 text-white' : 'text-slate-200 hover:bg-white/5 hover:text-white'
        }`
      }
    >
      {label}
    </NavLink>
  );
}

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="flex min-h-screen flex-col lg:flex-row">
        <aside className="w-full border-b border-white/10 bg-sidebar p-6 lg:w-72 lg:border-b-0 lg:border-r">
          <div className="mb-8">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-lg font-bold text-white">AC</div>
            <div className="mt-4">
              <p className="text-xs uppercase tracking-[0.3em] text-slate-300">ACDI IMS</p>
              <p className="mt-2 text-xl font-semibold text-white">General Services Unit</p>
            </div>
          </div>

          <nav className="space-y-2">
            {navItems.map((item) => (
              <SidebarLink key={item.to} label={item.label} to={item.to} />
            ))}
          </nav>

          <div className="mt-10 rounded-2xl bg-white/5 p-4">
            <p className="text-[11px] uppercase tracking-[0.3em] text-slate-300">Signed in as</p>
            <p className="mt-2 text-sm font-semibold text-white">{user?.name || user?.email}</p>
            <p className="text-sm text-slate-300">{user?.role}</p>
            <button
              onClick={handleLogout}
              className="mt-4 inline-flex w-full items-center justify-center rounded-2xl bg-white/10 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/15"
            >
              Logout
            </button>
          </div>
        </aside>

        <main className="flex-1 p-6 lg:p-8">
          <div className="mb-6 flex flex-col gap-4 border-b border-slate-200 pb-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm text-slate-500">Operations dashboard</p>
              <h1 className="text-3xl font-semibold text-slate-900">Inventory Management</h1>
            </div>
            <div className="inline-flex items-center gap-3 rounded-2xl bg-white px-4 py-3 shadow-sm">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-700">👤</span>
              <div>
                <p className="text-sm font-semibold text-slate-900">{user?.name}</p>
                <p className="text-xs text-slate-500">{user?.role}</p>
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
