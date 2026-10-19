import { useEffect, useState } from 'react'

// Célébration de la signature (maquettes « Signé / Confettis » 129:2643 à 129:3371).
// Purement décoratif : masqué aux lecteurs d'écran et désactivé si l'utilisateur réduit les animations.
const COLORS = ['var(--brand)', 'var(--dot-green)', 'var(--dot-blue)', 'var(--dot-orange)', 'var(--dot-violet)', 'var(--foreground)']
const PIECES = Array.from({ length: 36 }, (_, i) => {
  const angle = (i / 36) * Math.PI * 2
  const distance = 160 + ((i * 37) % 140)
  return {
    color: COLORS[i % COLORS.length],
    x: `${Math.round(Math.cos(angle) * distance)}px`,
    y: `${Math.round(Math.sin(angle) * distance * 0.7 + 120)}px`,
    r: `${(i * 47) % 360}deg`,
    delay: `${(i % 6) * 30}ms`,
    w: i % 3 === 0 ? 10 : 6,
  }
})

export function ConfettiBurst({ burstKey }: { burstKey: number }) {
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    if (!burstKey) return
    setVisible(true)
    const t = setTimeout(() => setVisible(false), 1800)
    return () => clearTimeout(t)
  }, [burstKey])
  if (!visible) return null
  return (
    <div aria-hidden className="pointer-events-none fixed left-1/2 top-1/3 z-[70] motion-reduce:hidden">
      {PIECES.map((p, i) => (
        <span
          key={`${burstKey}-${i}`}
          className="absolute block h-2.5 animate-confetti rounded-[2px]"
          style={{
            width: p.w,
            background: p.color,
            animationDelay: p.delay,
            ['--confetti-x' as string]: p.x,
            ['--confetti-y' as string]: p.y,
            ['--confetti-r' as string]: p.r,
          }}
        />
      ))}
    </div>
  )
}
