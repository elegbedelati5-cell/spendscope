import { animate } from 'framer-motion'
import { useEffect, useState } from 'react'
import { formatNaira } from '../../utils/format'

const ease = [0.16, 1, 0.3, 1]

export function CountUpNaira({ value, className }) {
  const target = Number(value) || 0
  const [display, setDisplay] = useState(0)

  useEffect(() => {
    const controls = animate(0, target, {
      duration: 1.25,
      ease,
      onUpdate: (v) => setDisplay(v),
    })
    return () => controls.stop()
  }, [target])

  return <span className={className}>{formatNaira(display)}</span>
}

export function CountUpInteger({ value, className, suffix = '' }) {
  const target = Math.round(Number(value) || 0)
  const [display, setDisplay] = useState(0)

  useEffect(() => {
    const controls = animate(0, target, {
      duration: 1.15,
      ease,
      onUpdate: (v) => setDisplay(Math.round(v)),
    })
    return () => controls.stop()
  }, [target])

  return (
    <span className={className}>
      {display}
      {suffix}
    </span>
  )
}
