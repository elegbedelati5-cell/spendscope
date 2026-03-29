export default function AuthTextField({
  id,
  label,
  type = 'text',
  autoComplete,
  required,
  value,
  onChange,
  placeholder,
  icon: Icon,
  minLength,
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-white/90">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type={type}
          autoComplete={autoComplete}
          required={required}
          minLength={minLength}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className="w-full rounded-xl border border-white/10 bg-white/5 py-2.5 pl-3.5 pr-11 text-sm text-white placeholder:text-slate-500 outline-none transition focus:border-cyan-500/40 focus:bg-white/[0.08] focus:ring-2 focus:ring-cyan-500/20"
        />
        {Icon ? (
          <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2">
            <Icon />
          </span>
        ) : null}
      </div>
    </div>
  )
}
