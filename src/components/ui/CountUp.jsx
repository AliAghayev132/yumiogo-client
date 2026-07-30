import { useEffect, useRef, useState } from 'react'

/**
 * CountUp — animates a number from 0 to `value` once it mounts.
 * Used by the dashboard stat cards.
 */
export const CountUp = ({ value = 0, duration = 900, className }) => {
  const [display, setDisplay] = useState(0)
  const frame = useRef(null)
  const target = Number(value) || 0

  useEffect(() => {
    const start = performance.now()
    const tick = (now) => {
      const t = Math.min((now - start) / duration, 1)
      const eased = 1 - Math.pow(1 - t, 3) // easeOutCubic
      setDisplay(Math.round(eased * target))
      if (t < 1) frame.current = requestAnimationFrame(tick)
    }
    frame.current = requestAnimationFrame(tick)
    return () => frame.current && cancelAnimationFrame(frame.current)
  }, [target, duration])

  return <span className={className}>{display.toLocaleString()}</span>
}
