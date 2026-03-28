import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

function navClass(isActive) {
  if (isActive) {
    return 'block rounded-lg px-3 py-2 text-sm font-medium bg-indigo-600 text-white shadow-sm'
  }
  return 'block rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100'
}

export default function Layout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  function handleLogout() {
    logout()
    navigate('/')
  }

  return (
    <div className="flex min-h-screen bg-[#F8FAFC]">
      <aside className="flex w-56 shrink-0 flex-col border-r border-slate-200 bg-white px-3 py-6">
        <div className="mb-8 px-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            SpendScope
          </p>
          <p className="mt-1 truncate text-sm text-slate-700">{user?.email}</p>
        </div>
        <nav className="flex flex-1 flex-col gap-1">
          <NavLink end to="/dashboard" className={({ isActive }) => navClass(isActive)}>
            Home
          </NavLink>
          <NavLink to="/dashboard/add" className={({ isActive }) => navClass(isActive)}>
            Add expense
          </NavLink>
          <NavLink to="/dashboard/transactions" className={({ isActive }) => navClass(isActive)}>
            Transactions
          </NavLink>
        </nav>
        <button
          type="button"
          onClick={handleLogout}
          className="mt-6 rounded-lg px-3 py-2 text-left text-sm font-medium text-slate-600 hover:bg-slate-100"
        >
          Log out
        </button>
      </aside>
      <main className="min-w-0 flex-1 p-6 md:p-8">
        <Outlet />
      </main>
    </div>
  )
}
