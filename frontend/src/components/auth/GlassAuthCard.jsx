import { ShieldCheckIcon, UserCircleIcon } from './AuthIcons'

export default function GlassAuthCard({ title, subtitle, children }) {
  return (
    <div className="auth-card-enter w-full max-w-md overflow-hidden rounded-3xl border border-white/10 bg-white/[0.07] shadow-[0_0_0_1px_rgba(255,255,255,0.05)_inset,0_25px_50px_-12px_rgba(0,0,0,0.5)] backdrop-blur-xl">
      <div className="relative flex h-36 items-center justify-center overflow-hidden border-b border-white/5 bg-linear-to-b from-white/12 to-transparent">
        <div
          className="auth-float-orb-1 absolute -left-2 top-6 h-20 w-20 rounded-full bg-emerald-400/30 blur-2xl"
          aria-hidden
        />
        <div
          className="auth-float-orb-2 absolute -right-4 top-10 h-24 w-24 rounded-full bg-purple-500/35 blur-2xl"
          aria-hidden
        />
        <div
          className="auth-float-orb-3 absolute bottom-2 left-1/3 h-16 w-16 rounded-full bg-cyan-400/30 blur-xl"
          aria-hidden
        />
        <div className="relative flex h-18 w-18 items-center justify-center rounded-full border border-white/20 bg-white/6 shadow-inner backdrop-blur-sm">
          <UserCircleIcon />
        </div>
        <div className="absolute bottom-3 right-4 flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-950/60 px-2.5 py-1 text-[11px] font-medium text-emerald-400 backdrop-blur-sm">
          <ShieldCheckIcon />
          Secure
        </div>
      </div>
      <div className="px-8 pb-8 pt-7">
        <h1 className="text-center text-2xl font-bold tracking-tight text-white">{title}</h1>
        {subtitle ? (
          <p className="mt-1.5 text-center text-sm text-slate-400">{subtitle}</p>
        ) : null}
        {children}
      </div>
    </div>
  )
}
