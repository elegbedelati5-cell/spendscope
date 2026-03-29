import { useEffect, useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

function navClass(isActive) {
  if (isActive) {
    return 'block rounded-lg px-3 py-2 text-sm font-medium bg-indigo-600 text-white shadow-sm'
  }
  return 'block rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100'
}

function SidebarNav({ onNavigate }) {
  return (
    <nav className="flex flex-1 flex-col gap-1">
      <NavLink
        end
        to="/dashboard"
        className={({ isActive }) => navClass(isActive)}
        onClick={onNavigate}
      >
        Home
      </NavLink>
      <NavLink
        to="/dashboard/add"
        className={({ isActive }) => navClass(isActive)}
        onClick={onNavigate}
      >
        Add expense
      </NavLink>
      <NavLink
        to="/dashboard/transactions"
        className={({ isActive }) => navClass(isActive)}
        onClick={onNavigate}
      >
        Transactions
      </NavLink>
    </nav>
  )
}

function MenuIcon() {
  return (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  )
}

function CloseIcon() {
  return (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  )
}

export default function Layout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    setMenuOpen(false)
  }, [location.pathname])

  function handleLogout() {
    setMenuOpen(false)
    logout()
    navigate('/')
  }

  function closeMenu() {
    setMenuOpen(false)
  }

  return (
    <div className="flex min-h-screen bg-[#F8FAFC]">
      <header className="fixed left-0 right-0 top-0 z-40 flex h-14 items-center justify-between border-b border-slate-200 bg-white px-4 lg:hidden">
        <span className="text-lg font-semibold text-indigo-600">SpendScope</span>
        <button
          type="button"
          className="rounded-lg p-2 text-slate-700 hover:bg-slate-100"
          aria-expanded={menuOpen}
          aria-controls="mobile-nav-panel"
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          onClick={() => setMenuOpen((o) => !o)}
        >
          {menuOpen ? <CloseIcon /> : <MenuIcon />}
        </button>
      </header>

      {menuOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-slate-900/40"
            aria-label="Close menu"
            onClick={closeMenu}
          />
          <aside
            id="mobile-nav-panel"
            className="absolute left-0 top-0 flex h-full w-72 max-w-[88vw] flex-col border-r border-slate-200 bg-white px-3 py-6 shadow-xl"
          >
            <div className="mb-6 px-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                SpendScope
              </p>
              <p className="mt-1 break-all text-sm text-slate-700">{user?.email}</p>
            </div>
            <SidebarNav onNavigate={closeMenu} />
            <button
              type="button"
              onClick={handleLogout}
              className="mt-6 rounded-lg px-3 py-2 text-left text-sm font-medium text-slate-600 hover:bg-slate-100"
            >
              Log out
            </button>
          </aside>
        </div>
      ) : null}

      <aside className="hidden w-56 shrink-0 flex-col border-r border-slate-200 bg-white px-3 py-6 lg:flex">
        <div className="mb-8 px-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            SpendScope
          </p>
          <p className="mt-1 truncate text-sm text-slate-700">{user?.email}</p>
        </div>
        <SidebarNav />
        <button
          type="button"
          onClick={handleLogout}
          className="mt-6 rounded-lg px-3 py-2 text-left text-sm font-medium text-slate-600 hover:bg-slate-100"
        >
          Log out
        </button>
      </aside>

      <main className="min-w-0 flex-1 px-4 pb-8 pt-[4.5rem] sm:px-6 lg:px-8 lg:pt-8">
        <Outlet />
      </main>
    </div>
  )
}
