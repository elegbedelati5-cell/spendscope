export default function AuroraBackdrop({ children, className = '' }) {
  return (
    <div className={`relative min-h-screen overflow-hidden bg-zinc-950 ${className}`}>
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <div className="aura-blob aura-blob-1" />
        <div className="aura-blob aura-blob-2" />
        <div className="aura-blob aura-blob-3" />
        <div className="aura-blob aura-blob-4" />
        <div className="aura-arc hidden sm:block" />
        <div className="aura-noise" />
      </div>
      <div className="relative z-10">{children}</div>
    </div>
  )
}
