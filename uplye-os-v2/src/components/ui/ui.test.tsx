import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Button, Chip, Field, IconButton, Input } from '.'

describe('Button', () => {
  it('déclenche onClick et est de type button par défaut', async () => {
    const onClick = vi.fn()
    render(<Button onClick={onClick}>Créer</Button>)
    const btn = screen.getByRole('button', { name: 'Créer' })
    expect(btn).toHaveAttribute('type', 'button')
    await userEvent.click(btn)
    expect(onClick).toHaveBeenCalledOnce()
  })

  it('se bloque pendant le chargement', () => {
    render(<Button loading>Envoyer</Button>)
    const btn = screen.getByRole('button', { name: 'Envoyer' })
    expect(btn).toBeDisabled()
    expect(btn).toHaveAttribute('aria-busy', 'true')
  })

  it('peut habiller un lien (asChild)', () => {
    render(
      <Button asChild>
        <a href="/devis">Voir les devis</a>
      </Button>,
    )
    expect(screen.getByRole('link', { name: 'Voir les devis' })).toHaveAttribute('href', '/devis')
  })
})

describe('IconButton', () => {
  it('a un nom accessible', () => {
    render(<IconButton label="Fermer">x</IconButton>)
    expect(screen.getByRole('button', { name: 'Fermer' })).toBeInTheDocument()
  })
})

describe('Chip', () => {
  it('expose son état actif', () => {
    render(
      <Chip active count={3}>
        Commercial
      </Chip>,
    )
    expect(screen.getByRole('button', { name: /Commercial/ })).toHaveAttribute('aria-pressed', 'true')
  })
})

describe('Field', () => {
  it('relie le libellé et l’erreur au champ', () => {
    render(
      <Field label="E-mail" error="Adresse invalide">
        <Input />
      </Field>,
    )
    const input = screen.getByLabelText('E-mail')
    expect(input).toHaveAttribute('aria-invalid', 'true')
    expect(input).toHaveAccessibleDescription('Adresse invalide')
  })
})
