import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../api/client'
import { APP_NAME, APP_VERSION } from '../constants/appMeta'
import { useAuth } from '../context/AuthContext'
import { getApiErrorMessage } from '../utils/apiErrorMessage'

const CURRENCIES = [
  { value: 'NGN', label: '₦ Nigerian Naira' },
  { value: 'USD', label: '$ US Dollar' },
  { value: 'EUR', label: '€ Euro' },
]

export default function Settings() {
  const { user, updateSessionUser, logout } = useAuth()
  const navigate = useNavigate()

  const [name, setName] = useState(user?.name ?? '')
  const [profileMsg, setProfileMsg] = useState('')
  const [profileErr, setProfileErr] = useState('')
  const [profileLoading, setProfileLoading] = useState(false)

  const [pwCurrent, setPwCurrent] = useState('')
  const [pwNew, setPwNew] = useState('')
  const [pwConfirm, setPwConfirm] = useState('')
  const [pwMsg, setPwMsg] = useState('')
  const [pwErr, setPwErr] = useState('')
  const [pwLoading, setPwLoading] = useState(false)

  const [currency, setCurrency] = useState(user?.currency ?? 'NGN')
  const [currencyMsg, setCurrencyMsg] = useState('')
  const [currencyLoading, setCurrencyLoading] = useState(false)

  const [notifyReminders, setNotifyReminders] = useState(user?.notifyReminders ?? true)
  const [notifyReports, setNotifyReports] = useState(user?.notifyReports ?? true)
  const [notifMsg, setNotifMsg] = useState('')
  const [notifLoading, setNotifLoading] = useState(false)

  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deletePassword, setDeletePassword] = useState('')
  const [deleteErr, setDeleteErr] = useState('')
  const [deleteLoading, setDeleteLoading] = useState(false)

  useEffect(() => {
    setName(user?.name ?? '')
    setCurrency(user?.currency ?? 'NGN')
    setNotifyReminders(user?.notifyReminders ?? true)
    setNotifyReports(user?.notifyReports ?? true)
  }, [user])

  async function saveProfile(e) {
    e.preventDefault()
    setProfileErr('')
    setProfileMsg('')
    setProfileLoading(true)
    try {
      const { data } = await api.patch('/me', { name: name.trim() })
      updateSessionUser(data)
      setProfileMsg('Profile saved.')
    } catch (err) {
      setProfileErr(getApiErrorMessage(err, 'Could not save profile'))
    } finally {
      setProfileLoading(false)
    }
  }

  async function saveCurrency(e) {
    e.preventDefault()
    setCurrencyMsg('')
    setCurrencyLoading(true)
    try {
      const { data } = await api.patch('/me', { currency })
      updateSessionUser(data)
      setCurrencyMsg('Currency preference saved.')
    } catch (err) {
      setCurrencyMsg(getApiErrorMessage(err, 'Could not save'))
    } finally {
      setCurrencyLoading(false)
    }
  }

  async function saveNotifications() {
    setNotifMsg('')
    setNotifLoading(true)
    try {
      const { data } = await api.patch('/me', { notifyReminders, notifyReports })
      updateSessionUser(data)
      setNotifMsg('Notification preferences saved.')
    } catch (err) {
      setNotifMsg(getApiErrorMessage(err, 'Could not save'))
    } finally {
      setNotifLoading(false)
    }
  }

  async function submitPassword(e) {
    e.preventDefault()
    setPwErr('')
    setPwMsg('')
    if (pwNew !== pwConfirm) {
      setPwErr('New passwords do not match.')
      return
    }
    setPwLoading(true)
    try {
      await api.post('/me/password', { currentPassword: pwCurrent, newPassword: pwNew })
      setPwMsg('Password updated.')
      setPwCurrent('')
      setPwNew('')
      setPwConfirm('')
    } catch (err) {
      setPwErr(getApiErrorMessage(err, 'Could not change password'))
    } finally {
      setPwLoading(false)
    }
  }

  async function confirmDeleteAccount() {
    setDeleteErr('')
    setDeleteLoading(true)
    try {
      await api.delete('/me', { data: { password: deletePassword } })
      logout()
      navigate('/', { replace: true })
    } catch (err) {
      setDeleteErr(getApiErrorMessage(err, 'Could not delete account'))
    } finally {
      setDeleteLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-10 pb-8">
      <section>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">Settings</h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
          Manage your profile, security, and preferences.
        </p>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900/90">
        <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Profile</h2>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Your name appears in the sidebar and dashboard greeting.</p>
        <form onSubmit={saveProfile} className="mt-5 space-y-4">
          {profileErr ? (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/50 dark:text-red-200">
              {profileErr}
            </p>
          ) : null}
          {profileMsg ? (
            <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-200">
              {profileMsg}
            </p>
          ) : null}
          <div>
            <label htmlFor="settings-name" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              Name
            </label>
            <input
              id="settings-name"
              type="text"
              autoComplete="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/25 dark:border-slate-600 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-indigo-400 dark:focus:ring-indigo-400/25"
            />
          </div>
          <div>
            <label htmlFor="settings-email" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              Email
            </label>
            <input
              id="settings-email"
              type="email"
              disabled
              value={user?.email ?? ''}
              className="mt-1 w-full cursor-not-allowed rounded-xl border border-slate-100 bg-slate-50 px-3 py-2 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-400"
            />
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Email cannot be changed yet.</p>
          </div>
          <button
            type="submit"
            disabled={profileLoading}
            className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
          >
            {profileLoading ? 'Saving…' : 'Save profile'}
          </button>
        </form>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900/90">
        <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Change password</h2>
        <form onSubmit={submitPassword} className="mt-5 space-y-4">
          {pwErr ? (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/50 dark:text-red-200">{pwErr}</p>
          ) : null}
          {pwMsg ? (
            <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-200">
              {pwMsg}
            </p>
          ) : null}
          <div>
            <label htmlFor="pw-current" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              Current password
            </label>
            <input
              id="pw-current"
              type="password"
              autoComplete="current-password"
              value={pwCurrent}
              onChange={(e) => setPwCurrent(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/25 dark:border-slate-600 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-indigo-400 dark:focus:ring-indigo-400/25"
            />
          </div>
          <div>
            <label htmlFor="pw-new" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              New password
            </label>
            <input
              id="pw-new"
              type="password"
              autoComplete="new-password"
              value={pwNew}
              onChange={(e) => setPwNew(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/25 dark:border-slate-600 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-indigo-400 dark:focus:ring-indigo-400/25"
            />
          </div>
          <div>
            <label htmlFor="pw-confirm" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              Confirm new password
            </label>
            <input
              id="pw-confirm"
              type="password"
              autoComplete="new-password"
              value={pwConfirm}
              onChange={(e) => setPwConfirm(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/25 dark:border-slate-600 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-indigo-400 dark:focus:ring-indigo-400/25"
            />
          </div>
          <button
            type="submit"
            disabled={pwLoading}
            className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
          >
            {pwLoading ? 'Updating…' : 'Update password'}
          </button>
        </form>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900/90">
        <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Currency</h2>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          Default is Nigerian Naira. Amounts in the app currently display as ₦; this preference is stored for
          future use.
        </p>
        <form onSubmit={saveCurrency} className="mt-5 flex flex-wrap items-end gap-3">
          <div className="min-w-[200px] flex-1">
            <label htmlFor="currency" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              Preferred currency
            </label>
            <select
              id="currency"
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/25 dark:border-slate-600 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-indigo-400 dark:focus:ring-indigo-400/25"
            >
              {CURRENCIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            disabled={currencyLoading}
            className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
          >
            {currencyLoading ? 'Saving…' : 'Save'}
          </button>
        </form>
        {currencyMsg ? (
          <p className="mt-3 text-sm text-emerald-700 dark:text-emerald-400">{currencyMsg}</p>
        ) : null}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900/90">
        <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Notifications</h2>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          Preferences are saved to your account. In-app reminders and reports will respect these when enabled.
        </p>
        <div className="mt-5 space-y-4">
          <label className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50/80 px-4 py-3 dark:border-slate-700 dark:bg-slate-800/60">
            <span className="text-sm text-slate-700 dark:text-slate-200">Expense reminders</span>
            <input
              type="checkbox"
              checked={notifyReminders}
              onChange={(e) => setNotifyReminders(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 dark:border-slate-500 dark:bg-slate-900"
            />
          </label>
          <label className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50/80 px-4 py-3 dark:border-slate-700 dark:bg-slate-800/60">
            <span className="text-sm text-slate-700 dark:text-slate-200">Monthly spending summaries</span>
            <input
              type="checkbox"
              checked={notifyReports}
              onChange={(e) => setNotifyReports(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 dark:border-slate-500 dark:bg-slate-900"
            />
          </label>
          <button
            type="button"
            onClick={saveNotifications}
            disabled={notifLoading}
            className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
          >
            {notifLoading ? 'Saving…' : 'Save notification preferences'}
          </button>
          {notifMsg ? <p className="text-sm text-emerald-700 dark:text-emerald-400">{notifMsg}</p> : null}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900/90">
        <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Data & export</h2>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
          Export your transactions as CSV from the Transactions page (filters apply to the export batch).
        </p>
        <Link
          to="/dashboard/transactions"
          className="mt-4 inline-flex rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-indigo-600 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-indigo-400 dark:hover:bg-slate-700"
        >
          Go to transactions
        </Link>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900/90">
        <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">About</h2>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
          {APP_NAME} helps you see where your money goes with simple charts and filters.
        </p>
        <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">Version {APP_VERSION}</p>
      </section>

      <section className="rounded-2xl border border-red-200 bg-red-50/50 p-6 shadow-sm dark:border-red-900/50 dark:bg-red-950/30">
        <h2 className="text-sm font-semibold text-red-900 dark:text-red-200">Delete account</h2>
        <p className="mt-2 text-sm text-red-800/90 dark:text-red-200/90">
          Permanently delete your account and all associated expenses. This cannot be undone.
        </p>
        {!deleteOpen ? (
          <button
            type="button"
            onClick={() => setDeleteOpen(true)}
            className="mt-4 rounded-xl border border-red-300 bg-white px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-50 dark:border-red-800 dark:bg-slate-900 dark:text-red-300 dark:hover:bg-red-950/50"
          >
            Delete my account…
          </button>
        ) : (
          <div className="mt-4 space-y-3">
            {deleteErr ? (
              <p className="text-sm text-red-700 dark:text-red-300">{deleteErr}</p>
            ) : null}
            <div>
              <label htmlFor="delete-pw" className="block text-sm font-medium text-red-900 dark:text-red-200">
                Confirm with your password
              </label>
              <input
                id="delete-pw"
                type="password"
                autoComplete="current-password"
                value={deletePassword}
                onChange={(e) => setDeletePassword(e.target.value)}
                className="mt-1 w-full max-w-sm rounded-xl border border-red-200 bg-white px-3 py-2 text-sm text-slate-900 dark:border-red-900/60 dark:bg-slate-950 dark:text-slate-100"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={confirmDeleteAccount}
                disabled={deleteLoading || !deletePassword}
                className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60"
              >
                {deleteLoading ? 'Deleting…' : 'Permanently delete account'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setDeleteOpen(false)
                  setDeletePassword('')
                  setDeleteErr('')
                }}
                className="rounded-xl bg-white px-4 py-2 text-sm font-medium text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50 dark:bg-slate-800 dark:text-slate-200 dark:ring-slate-600 dark:hover:bg-slate-700"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </section>

      <div className="border-t border-slate-200 pt-6 dark:border-slate-700">
        <button
          type="button"
          onClick={() => {
            logout()
            navigate('/')
          }}
          className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
        >
          Log out
        </button>
      </div>
    </div>
  )
}
