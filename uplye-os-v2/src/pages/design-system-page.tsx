import { useState } from 'react'
import { DotsThree, PencilSimple, Plus, Trash, MagnifyingGlass, Copy } from '@phosphor-icons/react'
import {
  Alert, Avatar, Badge, Button, Card, CardHeader, Checkbox, Chip, Dialog, DialogContent, DialogTrigger, DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger, Field, IconButton, Input, Kbd, Progress, RadioGroup, RadioGroupItem, Select, SelectContent,
  SelectItem, SelectTrigger, SelectValue, Skeleton, Switch, Tabs, TabsContent, TabsList, TabsTrigger, Textarea, Tooltip, useToast,
} from '@/components/ui'
import { PageHeader } from '@/components/app/page-header'

const BUTTON_VARIANTS = ['default', 'brand', 'secondary', 'outline', 'ghost', 'destructive'] as const
const BADGE_VARIANTS = ['default', 'brand', 'secondary', 'outline', 'destructive', 'yellow', 'orange', 'green', 'blue', 'violet', 'teal', 'red'] as const

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card>
      <CardHeader title={title} />
      <div className="flex flex-wrap items-center gap-3">{children}</div>
    </Card>
  )
}

/** Vitrine des composants de base (référence vivante du Figma « 02 Components »). */
export function DesignSystemPage() {
  const toast = useToast()
  const [checked, setChecked] = useState(true)
  return (
    <div className="flex flex-col gap-5 p-layout-margin">
      <PageHeader title="Design system" subtitle="Composants de base de la v2, générés depuis les variables et composants du Figma." />
      <Section title="Boutons">
        {BUTTON_VARIANTS.map((v) => (
          <Button key={v} variant={v} leadingIcon={<Plus />}>
            {v}
          </Button>
        ))}
        <Button size="sm">Petit</Button>
        <Button size="lg">Grand</Button>
        <Button loading>Envoi</Button>
        <Button disabled>Désactivé</Button>
      </Section>
      <Section title="Boutons icône">
        {(['default', 'brand', 'secondary', 'outline', 'ghost'] as const).map((v) => (
          <IconButton key={v} label={`Modifier (${v})`} variant={v}>
            <PencilSimple />
          </IconButton>
        ))}
      </Section>
      <Section title="Badges, chips, raccourcis, avatars">
        {BADGE_VARIANTS.map((v) => (
          <Badge key={v} variant={v}>
            {v}
          </Badge>
        ))}
        <Chip active count={2}>Chauds</Chip>
        <Chip count={5}>Tièdes</Chip>
        <Kbd keys="K" command />
        <Avatar initials="EN" tone="yellow" />
        <Avatar initials="AX" />
        <Avatar initials="AL" tone="dark" size="lg" />
      </Section>
      <Card>
        <CardHeader title="Formulaires" />
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Client" helper="Nom affiché sur le devis">
            <Input placeholder="Institut Lumière du Sud" />
          </Field>
          <Field label="E-mail" error="Adresse e-mail invalide">
            <Input defaultValue="contact@" leadingIcon={<MagnifyingGlass />} />
          </Field>
          <Field label="Pôle">
            <Select>
              <SelectTrigger>
                <SelectValue placeholder="Choisir un pôle" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="studio">Uplye Studio</SelectItem>
                <SelectItem value="azurpod">Azurpod</SelectItem>
                <SelectItem value="academy">Uplye Academy</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label="Note" optional>
            <Textarea placeholder="Contexte du projet…" />
          </Field>
          <label className="flex items-center gap-2 text-body-md">
            <Checkbox checked={checked} onCheckedChange={(v) => setChecked(v === true)} /> Relance automatique
          </label>
          <label className="flex items-center gap-2 text-body-md">
            <Switch defaultChecked /> Notifications par e-mail
          </label>
          <RadioGroup defaultValue="eur" aria-label="Type de remise" className="flex gap-4">
            <label className="flex items-center gap-2 text-body-md">
              <RadioGroupItem value="eur" /> En euros
            </label>
            <label className="flex items-center gap-2 text-body-md">
              <RadioGroupItem value="pct" /> En pourcentage
            </label>
          </RadioGroup>
        </div>
      </Card>
      <Card>
        <CardHeader title="Navigation et superpositions" />
        <Tabs defaultValue="liste">
          <TabsList>
            <TabsTrigger value="liste" count={12}>Liste</TabsTrigger>
            <TabsTrigger value="pipeline">Pipeline</TabsTrigger>
          </TabsList>
          <TabsContent value="liste" className="pt-3 text-body-sm text-muted-foreground">Contenu « Liste »</TabsContent>
          <TabsContent value="pipeline" className="pt-3 text-body-sm text-muted-foreground">Contenu « Pipeline »</TabsContent>
        </Tabs>
        <Tabs defaultValue="a">
          <TabsList type="underline">
            <TabsTrigger value="a">Général</TabsTrigger>
            <TabsTrigger value="b">Notifications</TabsTrigger>
            <TabsTrigger value="c">Sécurité</TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="flex flex-wrap gap-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <IconButton label="Actions" variant="outline">
                <DotsThree />
              </IconButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuLabel>Devis</DropdownMenuLabel>
              <DropdownMenuItem icon={<PencilSimple />}>Modifier</DropdownMenuItem>
              <DropdownMenuItem icon={<Copy />} shortcut="⌘D">Dupliquer</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem icon={<Trash />} destructive>Supprimer</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Tooltip label="Infobulle" shortcut="⌘I">
            <Button variant="outline">Survoler</Button>
          </Tooltip>
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="secondary">Ouvrir une boîte de dialogue</Button>
            </DialogTrigger>
            <DialogContent title="Supprimer le devis ?" description="Cette action est définitive." footer={<Button variant="destructive">Supprimer</Button>}>
              <p className="text-body-md">Le devis D-2026-042 et ses relances seront supprimés.</p>
            </DialogContent>
          </Dialog>
          <Button variant="outline" onClick={() => toast({ message: 'Devis envoyé à Mayli Spa & Beauty', variant: 'success', action: { label: 'Annuler', onClick: () => {} } })}>
            Afficher un toast
          </Button>
        </div>
      </Card>
      <Card>
        <CardHeader title="Retours et chargement" />
        <Alert variant="info" title="Information">Le devis a été ouvert 3 fois.</Alert>
        <Alert variant="success" title="Signé">Mayli Spa & Beauty a signé le devis.</Alert>
        <Alert variant="warning" title="Attention">Le compte Instagram Azurpod est à reconnecter.</Alert>
        <Alert variant="destructive" title="Échec d’envoi">Le serveur e-mail ne répond pas.</Alert>
        <Alert variant="brand" title="Suggestion">Relancer les 3 contacts du BNI aujourd’hui.</Alert>
        <Progress value={60} label="Avancement" />
        <Progress value={100} label="Terminé" />
        <Progress value={120} max={100} label="Dépassement" />
        <Skeleton className="w-60" />
      </Card>
    </div>
  )
}
