import { useState } from 'react'
import { fmt } from '../utils'

export interface Series { name: string; color: string; values: number[] }

// Barres groupées en SVG, une seule échelle, survol avec infobulle.
export default function BarChart({ labels, series, height = 220, highlight }: { labels: string[]; series: Series[]; height?: number; highlight?: number }) {
  const [hover, setHover] = useState<number | null>(null)
  const W = 720, H = height, padL = 44, padB = 26, padT = 12
  const max = Math.max(1, ...series.flatMap((s) => s.values))
  const step = niceStep(max / 4)
  const top = Math.ceil(max / step) * step
  const y = (v: number) => padT + (H - padT - padB) * (1 - v / top)
  const band = (W - padL) / labels.length
  const bw = Math.min(22, (band * 0.62) / series.length)
  return (
    <div className="relative">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label={series.map((s) => s.name).join(' et ')}>
        {Array.from({ length: Math.round(top / step) + 1 }, (_, i) => i * step).map((v) => (
          <g key={v}>
            <line x1={padL} x2={W} y1={y(v)} y2={y(v)} stroke="#e0dfce" strokeWidth={1} />
            <text x={padL - 8} y={y(v) + 4} textAnchor="end" fontSize={11} fill="#595849" fontFamily="DM Mono">{v >= 1000 ? `${v / 1000}k` : v}</text>
          </g>
        ))}
        {labels.map((l, i) => {
          const x0 = padL + i * band + (band - bw * series.length - 2 * (series.length - 1)) / 2
          return (
            <g key={l} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}>
              <rect x={padL + i * band} y={padT} width={band} height={H - padT - padB} fill={hover === i ? '#e0dfce55' : 'transparent'} />
              {series.map((s, si) => {
                const v = s.values[i] ?? 0
                const h = Math.max(0, y(0) - y(v))
                return <path key={s.name} d={roundTop(x0 + si * (bw + 2), y(v), bw, h)} fill={s.color} opacity={highlight !== undefined && highlight !== i ? 0.45 : 1} />
              })}
              <text x={padL + i * band + band / 2} y={H - 8} textAnchor="middle" fontSize={11} fill="#595849" fontFamily="Hanken Grotesk">{l}</text>
            </g>
          )
        })}
      </svg>
      {hover !== null && (
        <div className="pointer-events-none absolute top-0 rounded-lg bg-ink px-3 py-2 text-[12px] text-ondark shadow-lg"
          style={{ left: `${((padL + (hover + 0.5) * band) / W) * 100}%`, transform: 'translateX(-50%)' }}>
          <div className="font-semibold">{labels[hover]}</div>
          {series.map((s) => <div key={s.name} className="flex items-center gap-2"><span className="h-2 w-2 rounded-sm" style={{ background: s.color }} />{s.name} : {fmt(s.values[hover] ?? 0)}</div>)}
        </div>
      )}
      <div className="mt-2 flex gap-4 text-[12px] text-ink2">
        {series.map((s) => <span key={s.name} className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm" style={{ background: s.color }} />{s.name}</span>)}
      </div>
    </div>
  )
}

function niceStep(raw: number) {
  const p = Math.pow(10, Math.floor(Math.log10(raw || 1)))
  const n = raw / p
  return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10) * p
}
function roundTop(x: number, y: number, w: number, h: number) {
  const r = Math.min(4, h, w / 2)
  return `M${x},${y + h} V${y + r} Q${x},${y} ${x + r},${y} H${x + w - r} Q${x + w},${y} ${x + w},${y + r} V${y + h} Z`
}
