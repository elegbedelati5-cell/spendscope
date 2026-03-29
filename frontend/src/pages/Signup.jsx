import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getApiErrorMessage } from '../utils/apiErrorMessage'
import AuroraBackdrop from '../components/auth/AuroraBackdrop'
import GlassAuthCard from '../components/auth/GlassAuthCard'
import AuthTextField from '../components/auth/AuthTextField'
import { LockIcon, MailIcon } from '../components/auth/AuthIcons'

export default function Signup() {
  const { register } = useAuth()
  const navigate = useNavigate()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await register(email, password)
      navigate('/dashboard', { replace: true })
    } catch (err) {
      setError(getApiErrorMessage(err, 'Could not sign up'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuroraBackdrop>
      <div className="flex min-h-screen flex-col items-center justify-center px-4 py-12">
        <GlassAuthCard title="Create account" subtitle="Start tracking your spending in minutes">
          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            {error ? (
              <p className="rounded-xl border border-red-500/30 bg-red-950/50 px-3 py-2.5 text-sm text-red-200 backdrop-blur-sm">
                {error}
              </p>
            ) : null}
            <div>
              <label htmlFor="name" className="mb-1.5 block text-sm font-medium text-white/90">
                Name <span className="font-normal text-slate-500">(optional)</span>
              </label>
              <input
                id="name"
                type="text"
                autoComplete="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="How should we greet you?"
                className="w-full rounded-xl border border-white/10 bg-white/5 py-2.5 pl-3.5 pr-3 text-sm text-white placeholder:text-slate-500 outline-none transition focus:border-cyan-500/40 focus:bg-white/[0.08] focus:ring-2 focus:ring-cyan-500/20"
              />
            </div>
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
              autoComplete="new-password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Choose a password"
              icon={LockIcon}
            />
            <p className="text-xs text-slate-500">At least 6 characters</p>
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-linear-to-r from-indigo-600 to-violet-600 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-900/40 transition hover:from-indigo-500 hover:to-violet-500 disabled:opacity-60"
            >
              {loading ? 'Creating account...' : 'Create account'}
            </button>
            <p className="text-center text-sm text-slate-400">
              Already have an account?{' '}
              <Link to="/login" className="font-medium text-cyan-400 hover:text-cyan-300">
                Sign in
              </Link>
            </p>
          </form>
        </GlassAuthCard>
        <p className="mt-8 text-center text-xs text-slate-500">SpendScope · Personal finance clarity</p>
      </div>
    </AuroraBackdrop>
  )
}
