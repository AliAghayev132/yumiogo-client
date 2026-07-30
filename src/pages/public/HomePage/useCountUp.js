import { useEffect, useRef, useState } from 'react'
import { useInView } from 'framer-motion'

/**
 * useCountUp — counts from 0 to `target` the first time the element scrolls
 * into view. Returns [ref, displayValue].
 */
export const useCountUp = (target = 0, duration = 1400) => {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-60px' })
  const [value, setValue] = useState(0)

  useEffect(() => {
    if (!inView) return undefined
    let frame
    const start = performance.now()
    const tick = (now) => {
      const t = Math.min((now - start) / duration, 1)
      const eased = 1 - Math.pow(1 - t, 3)
      setValue(Math.round(eased * target))
      if (t < 1) frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [inView, target, duration])

  return [ref, value]
}
