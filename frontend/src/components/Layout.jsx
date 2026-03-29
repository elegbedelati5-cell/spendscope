import { useEffect, useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getDisplayName, getInitials } from '../utils/userDisplay'

const COLLAPSE_KEY = 'spendscope_sidebar_collapsed'

function IconHome({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
      />
    </svg>
  )
}

function IconPlus({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
    </svg>
  )
}

function IconList({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M4 6h16M4 10h16M4 14h16M4 18h16"
      />
    </svg>
  )
}

function IconSettings({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
      />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  )
}

function IconLogout({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
      />
    </svg>
  )
}

function CollapseToggleIcon({ collapsed, className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden>
      {collapsed ? (
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
      ) : (
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
      )}
    </svg>
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

function navLinkClass(isActive, collapsed) {
  return [
    'group flex w-full min-w-0 items-center rounded-xl border border-transparent text-sm font-medium transition-all duration-200',
    collapsed ? 'justify-center px-0 py-2.5' : 'gap-3 px-3 py-2.5',
    isActive
      ? 'border-indigo-200 bg-indigo-600 text-white shadow-md shadow-indigo-600/25 ring-2 ring-indigo-500/30'
      : 'text-slate-600 hover:border-slate-200 hover:bg-slate-100 hover:text-slate-900',
  ].join(' ')
}

function iconClass(isActive) {
  return [
    'h-5 w-5 shrink-0 transition-colors',
    isActive ? 'text-white' : 'text-slate-500 group-hover:text-slate-700',
  ].join(' ')
}

function SidebarNav({ collapsed, onNavigate }) {
  const items = [
    { to: '/dashboard', end: true, label: 'Home', Icon: IconHome },
    { to: '/dashboard/add', end: false, label: 'Add expense', Icon: IconPlus },
    { to: '/dashboard/transactions', end: false, label: 'Transactions', Icon: IconList },
  ]

  return (
    <nav className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto overflow-x-hidden">
      {items.map(({ to, end, label, Icon }) => (
        <NavLink key={to} to={to} end={end} onClick={onNavigate} title={collapsed ? label : undefined}>
          {({ isActive }) => (
            <span className={navLinkClass(isActive, collapsed)}>
              <Icon className={iconClass(isActive)} />
              <span className={collapsed ? 'sr-only' : ''}>{label}</span>
            </span>
          )}
        </NavLink>
      ))}
      <NavLink to="/dashboard/settings" onClick={onNavigate} title={collapsed ? 'Settings' : undefined}>
        {({ isActive }) => (
          <span className={navLinkClass(isActive, collapsed)}>
            <IconSettings className={iconClass(isActive)} />
            <span className={collapsed ? 'sr-only' : ''}>Settings</span>
          </span>
        )}
      </NavLink>
    </nav>
  )
}

function UserBlock({ user, collapsed }) {
  const display = getDisplayName(user)
  const initials = getInitials(user)
  return (
    <div
      className={`flex min-w-0 items-center rounded-xl border border-slate-200 bg-slate-50/90 px-2 py-2.5 ${
        collapsed ? 'justify-center border-0 bg-transparent p-0' : 'gap-3'
      }`}
    >
      <div
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-indigo-500 to-violet-600 text-xs font-bold text-white shadow-sm"
        aria-hidden
      >
        {initials}
      </div>
      {!collapsed ? (
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-slate-900">{display}</p>
          <p className="truncate text-xs text-slate-500">{user?.email}</p>
        </div>
      ) : null}
    </div>
  )
}

function LogoutButton({ collapsed, onLogout }) {
  return (
    <button
      type="button"
      onClick={onLogout}
      className={`flex w-full items-center rounded-xl border border-transparent text-sm font-medium text-red-700 transition-colors hover:bg-red-50 ${collapsed ? 'justify-center px-0 py-2.5' : 'gap-3 px-3 py-2.5'}`}
      title={collapsed ? 'Log out' : undefined}
    >
      <IconLogout className="h-5 w-5 shrink-0" />
      <span className={collapsed ? 'sr-only' : ''}>Log out</span>
    </button>
  )
}

/** Inner column for desktop rail + mobile drawer */
function SidebarShell({ children, className = '' }) {
  return <div className={`flex h-full min-h-0 flex-col ${className}`}>{children}</div>
}

export default function Layout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem(COLLAPSE_KEY) === '1')

  useEffect(() => {
    setMenuOpen(false)
  }, [location.pathname])

  function toggleCollapsed() {
    setCollapsed((c) => {
      const next = !c
      localStorage.setItem(COLLAPSE_KEY, next ? '1' : '0')
      return next
    })
  }

  function handleLogout() {
    setMenuOpen(false)
    logout()
    navigate('/')
  }

  function closeMenu() {
    setMenuOpen(false)
  }

  const desktopSidebarClass = [
    'fixed left-0 top-0 z-30 hidden h-screen flex-col overflow-hidden border-r border-slate-200 bg-white py-7 shadow-sm transition-[width,padding] duration-200 ease-out lg:flex',
    collapsed ? 'w-[4.75rem] px-2' : 'w-64 px-4',
  ].join(' ')

  /* literal classes so Tailwind includes arbitrary calc() values */
  const mainOffsetClass = collapsed ? 'lg:pl-[calc(4.75rem+1.25rem)]' : 'lg:pl-[calc(16rem+1.25rem)]'

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#F8FAFC]">
      <header className="fixed left-0 right-0 top-0 z-40 flex h-14 items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur-sm lg:hidden">
        <span className="text-lg font-bold tracking-tight text-indigo-600">SpendScope</span>
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
            className="absolute left-0 top-0 flex h-full w-[min(20rem,90vw)] flex-col overflow-hidden border-r border-slate-200 bg-white px-4 py-6 shadow-xl"
          >
            <SidebarShell>
              <div className="mb-8 px-1">
                <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-indigo-600">SpendScope</p>
                <p className="mt-1 text-xs text-slate-500">Personal finance</p>
              </div>
              <SidebarNav collapsed={false} onNavigate={closeMenu} />
              <div className="mt-auto space-y-3 border-t border-slate-200 pt-6">
                <UserBlock user={user} collapsed={false} />
                <LogoutButton collapsed={false} onLogout={handleLogout} />
              </div>
            </SidebarShell>
          </aside>
        </div>
      ) : null}

      {/* Desktop: fixed rail — does not scroll with page */}
      <aside className={desktopSidebarClass}>
        <SidebarShell>
          <div
            className={`mb-6 flex shrink-0 gap-2 ${collapsed ? 'flex-col items-center px-0' : 'items-start justify-between px-1'}`}
          >
            {!collapsed ? (
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-indigo-600">SpendScope</p>
                <p className="mt-1.5 text-[11px] text-slate-500">Personal finance</p>
              </div>
            ) : (
              <div
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-base font-bold text-white shadow-sm"
                aria-label="SpendScope"
                title="SpendScope"
              >
                S
              </div>
            )}
            <button
              type="button"
              onClick={toggleCollapsed}
              className="shrink-0 rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800"
              aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              <CollapseToggleIcon collapsed={collapsed} className="h-5 w-5" />
            </button>
          </div>
          <SidebarNav collapsed={collapsed} />
          <div className="mt-auto shrink-0 space-y-3 border-t border-slate-200 pt-5">
            <UserBlock user={user} collapsed={collapsed} />
            <LogoutButton collapsed={collapsed} onLogout={handleLogout} />
          </div>
        </SidebarShell>
      </aside>

      <main
        className={`relative z-10 min-h-screen min-w-0 px-4 pb-12 pt-18 transition-[padding] duration-200 sm:px-6 lg:px-10 lg:pt-10 ${mainOffsetClass}`}
      >
        <Outlet />
      </main>
    </div>
  )
}
