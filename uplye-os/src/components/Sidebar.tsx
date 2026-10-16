import { NavLink } from 'react-router-dom'
import {
  MagnifyingGlass, SquaresFour, CalendarBlank, Kanban, ChartBar, FileText, UsersThree, Handshake,
  Folder, Microphone, Users, Tag, ChartLine, Sparkle, Bell, GearSix, ArrowCounterClockwise,
} from '@phosphor-icons/react'
import { useState, type ReactNode } from 'react'
import { Avatar } from './ui'
import { useStore } from '../store'

const Item = ({ to, icon, label }: { to: string; icon: ReactNode; label: string }) => (
  <NavLink to={to} className={({ isActive }) =>
    `flex items-center gap-3 rounded-xl px-3.5 py-2 text-[15px] font-medium ${isActive ? 'bg-accent text-ink' : 'text-ondark hover:bg-white/5'}`}>
    {icon}{label}
  </NavLink>
)
const Group = ({ label }: { label: string }) => <div className="mt-3 mb-1 px-3 font-mono text-[10px] uppercase tracking-wide text-ondarkm">{label}</div>

export default function Sidebar() {
  const { dispatch } = useStore()
  const [armed, setArmed] = useState(false)
  const s = 20
  return (
    <aside className="flex h-full w-[248px] shrink-0 flex-col bg-side px-4 py-6 text-ondark">
      <div className="px-2 font-title text-[24px] font-semibold uppercase">Uplye OS</div>
      <div className="mt-5 flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-ondarkm">
        <MagnifyingGlass size={18} /> <span className="flex-1">Rechercher…</span>
        <span className="rounded bg-white/10 px-1.5 font-mono text-[10px]">⌘K</span>
      </div>
      <nav className="mt-2 flex-1 overflow-y-auto">
        <Group label="Pilotage" />
        <Item to="/bientot/dashboard" icon={<SquaresFour size={s} />} label="Dashboard" />
        <Item to="/bientot/planning" icon={<CalendarBlank size={s} />} label="Planning" />
        <Item to="/bientot/kanban" icon={<Kanban size={s} />} label="Kanban" />
        <Item to="/bientot/workload" icon={<ChartBar size={s} />} label="Workload" />
        <Group label="Commercial" />
        <Item to="/devis" icon={<FileText size={s} weight="fill" />} label="Devis" />
        <Item to="/clients" icon={<UsersThree size={s} />} label="Clients" />
        <Item to="/bientot/evenements" icon={<Handshake size={s} />} label="Événements" />
        <Group label="Production" />
        <Item to="/bientot/projets" icon={<Folder size={s} />} label="Projets" />
        <Item to="/bientot/azurpod" icon={<Microphone size={s} />} label="Azurpod" />
        <Group label="Admin" />
        <Item to="/bientot/equipe" icon={<Users size={s} />} label="Équipe" />
        <Item to="/bientot/catalogue" icon={<Tag size={s} />} label="Catalogue" />
        <Item to="/bientot/finance" icon={<ChartLine size={s} />} label="Finance" />
      </nav>
      <div className="mt-3 flex items-center gap-2 rounded-xl border border-accent/30 bg-accent/10 px-3.5 py-2.5 font-medium">
        <Sparkle size={18} className="text-accent" /> <span className="flex-1">Assistant IA</span>
        <span className="rounded bg-white/10 px-1.5 font-mono text-[10px] text-ondarkm">⌘J</span>
      </div>
      <div className="mt-3 flex items-center gap-3 border-t border-white/10 px-2 pt-4">
        <Avatar text="E" size={32} />
        <div className="flex-1 leading-tight"><div className="font-semibold">Enzo</div><div className="text-[12px] text-ondarkm">Admin</div></div>
        <Bell size={18} className="text-ondarkm" /><GearSix size={18} className="text-ondarkm" />
      </div>
      {/* confirmation dans la page : les boîtes confirm() natives ne s'affichent pas partout */}
      <button onClick={() => { if (armed) { dispatch({ type: 'reset' }); setArmed(false) } else { setArmed(true); setTimeout(() => setArmed(false), 4000) } }}
        className={`mt-3 flex items-center gap-1.5 px-2 text-[12px] ${armed ? 'text-accent' : 'text-ondarkm hover:text-ondark'}`}>
        <ArrowCounterClockwise size={13} />{armed ? 'Cliquer à nouveau pour tout remettre à zéro' : 'Remettre les données de démo'}
      </button>
    </aside>
  )
}
