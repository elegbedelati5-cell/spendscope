import { Link } from 'react-router-dom'

export default function Landing() {
  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <span className="text-lg font-semibold text-indigo-600">SpendScope</span>
          <div className="flex gap-3">
            <Link
              to="/login"
              className="rounded-lg px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
            >
              Log in
            </Link>
            <Link
              to="/signup"
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700"
            >
              Sign up
            </Link>
          </div>
        </div>
      </header>
      <section className="mx-auto max-w-5xl px-6 py-16 md:py-24">
        <h1 className="text-4xl font-bold tracking-tight text-slate-900 md:text-5xl">
          See where your money goes
        </h1>
        <p className="mt-4 max-w-xl text-lg text-slate-600">
          A simple personal finance dashboard: log expenses, view spending clusters, and spot
          trends with clear charts.
        </p>
        <div className="mt-10 flex flex-wrap gap-4">
          <Link
            to="/signup"
            className="rounded-lg bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-md hover:bg-indigo-700"
          >
            Create account
          </Link>
          <Link
            to="/login"
            className="rounded-lg border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-800 hover:bg-slate-50"
          >
            I have an account
          </Link>
        </div>
      </section>
    </div>
  )
}
