import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getApiErrorMessage } from '../utils/apiErrorMessage'
import AuroraBackdrop from '../components/auth/AuroraBackdrop'
import GlassAuthCard from '../components/auth/GlassAuthCard'
import AuthTextField from '../components/auth/AuthTextField'
import { LockIcon, MailIcon } from '../components/auth/AuthIcons'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = location.state?.from || '/dashboard'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(email, password)
      navigate(from, { replace: true })
    } catch (err) {
      setError(getApiErrorMessage(err, 'Could not log in'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuroraBackdrop>
      <div className="flex min-h-screen flex-col items-center justify-center px-4 py-12">
        <GlassAuthCard title="Sign In" subtitle="Access your secure account">
          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            {error ? (
              <p className="rounded-xl border border-red-500/30 bg-red-950/50 px-3 py-2.5 text-sm text-red-200 backdrop-blur-sm">
                {error}
              </p>
            ) : null}
            <AuthTextField
              id="email"
              label="Email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              icon={MailIcon}
            />
            <AuthTextField
              id="password"
              label="Password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              icon={LockIcon}
            />
            <div className="flex items-center justify-between gap-3 text-sm">
              <label className="flex cursor-pointer items-center gap-2 text-slate-300">
                <input
                  name="remember"
                  type="checkbox"
                  className="h-4 w-4 rounded border-white/20 bg-white/5 text-cyan-500 focus:ring-cyan-500/30"
                />
                Remember me
              </label>
              <span className="text-cyan-400/90 hover:text-cyan-300">Forgot password?</span>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-linear-to-r from-indigo-600 to-violet-600 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-900/40 transition hover:from-indigo-500 hover:to-violet-500 disabled:opacity-60"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
            <p className="text-center text-sm text-slate-400">
              New here?{' '}
              <Link to="/signup" className="font-medium text-cyan-400 hover:text-cyan-300">
                Create an account
              </Link>
            </p>
          </form>
        </GlassAuthCard>
        <p className="mt-8 text-center text-xs text-slate-500">SpendScope · Personal finance clarity</p>
      </div>
    </AuroraBackdrop>
  )
}
