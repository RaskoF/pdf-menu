import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { TooltipProvider } from '@/components/ui'
import { Sidebar } from './sidebar'

const user = { name: 'Enzo Navarro', role: 'Admin', initials: 'EN' }

function renderSidebar(path = '/', props: Partial<Parameters<typeof Sidebar>[0]> = {}) {
  return render(
    <TooltipProvider>
      <MemoryRouter initialEntries={[path]}>
        <Sidebar user={user} theme="dark" onToggleTheme={() => {}} counts={{ '/kanban': 12 }} {...props} />
      </MemoryRouter>
    </TooltipProvider>,
  )
}

describe('Sidebar', () => {
  it('marque la page courante', () => {
    renderSidebar('/devis')
    expect(screen.getByRole('link', { name: 'Devis' })).toHaveAttribute('aria-current', 'page')
    expect(screen.getByRole('link', { name: 'Aujourd’hui' })).not.toHaveAttribute('aria-current')
  })

  it('affiche les compteurs', () => {
    renderSidebar()
    expect(screen.getByRole('link', { name: /Kanban/ })).toHaveTextContent('12')
  })

  it('peut se replier', async () => {
    const onToggle = vi.fn()
    renderSidebar('/', { onToggleCollapsed: onToggle })
    await userEvent.click(screen.getByRole('button', { name: 'Replier le menu' }))
    expect(onToggle).toHaveBeenCalledOnce()
  })

  it('reste navigable une fois replié', () => {
    renderSidebar('/', { collapsed: true })
    expect(screen.getByRole('link', { name: 'Finance' })).toBeInTheDocument()
  })
})
