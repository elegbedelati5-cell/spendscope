import { Link } from 'react-router-dom'
import AuroraBackdrop from '../components/auth/AuroraBackdrop'

export default function Landing() {
  return (
    <AuroraBackdrop>
      <header className="border-b border-white/10 bg-white/[0.04] backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <span className="text-lg font-semibold tracking-tight text-white">SpendScope</span>
          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              to="/login"
              className="rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm font-medium text-white/90 backdrop-blur-sm transition hover:bg-white/10"
            >
              Log in
            </Link>
            <Link
              to="/signup"
              className="rounded-xl bg-linear-to-r from-indigo-600 to-violet-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-indigo-900/30 transition hover:from-indigo-500 hover:to-violet-500"
            >
              Sign up
            </Link>
          </div>
        </div>
      </header>
      <section className="mx-auto flex max-w-5xl flex-col items-center px-6 py-16 md:py-28">
        <div className="auth-landing-hero w-full max-w-2xl rounded-3xl border border-white/10 bg-white/[0.06] p-8 shadow-[0_0_0_1px_rgba(255,255,255,0.05)_inset,0_25px_50px_-12px_rgba(0,0,0,0.45)] backdrop-blur-xl md:p-12">
          <div className="mb-6 inline-flex rounded-full border border-cyan-500/25 bg-cyan-500/10 px-3 py-1 text-xs font-medium text-cyan-300">
            Clarity for every naira
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-white md:text-5xl md:leading-tight">
            See where your money goes
          </h1>
          <p className="mt-5 max-w-xl text-lg leading-relaxed text-slate-400">
            A simple personal finance dashboard: log expenses, view spending clusters, and spot trends
            with clear charts — all in one secure place.
          </p>
          <div className="mt-10 flex flex-wrap gap-4">
            <Link
              to="/signup"
              className="rounded-xl bg-linear-to-r from-indigo-600 to-violet-600 px-7 py-3.5 text-sm font-semibold text-white shadow-xl shadow-indigo-900/35 transition hover:from-indigo-500 hover:to-violet-500"
            >
              Create account
            </Link>
            <Link
              to="/login"
              className="rounded-xl border border-white/15 bg-white/5 px-7 py-3.5 text-sm font-semibold text-white backdrop-blur-sm transition hover:bg-white/10"
            >
              I have an account
            </Link>
          </div>
        </div>
      </section>
    </AuroraBackdrop>
  )
}
