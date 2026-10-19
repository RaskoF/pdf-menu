import { createContext, forwardRef, useContext, type ComponentPropsWithoutRef, type ElementRef, type ReactNode } from 'react'
import * as TabsPrimitive from '@radix-ui/react-tabs'
import { cn } from '@/lib/utils'

// Figma : « Tab » (10:100) en deux types : Segmented (pastilles) et Underline (souligné).
type TabsType = 'segmented' | 'underline'
const TypeContext = createContext<TabsType>('segmented')

export const Tabs = TabsPrimitive.Root
export const TabsContent = TabsPrimitive.Content

export const TabsList = forwardRef<ElementRef<typeof TabsPrimitive.List>, ComponentPropsWithoutRef<typeof TabsPrimitive.List> & { type?: TabsType }>(
  ({ className, type = 'segmented', ...props }, ref) => (
    <TypeContext.Provider value={type}>
      <TabsPrimitive.List
        ref={ref}
        className={cn(type === 'segmented' ? 'inline-flex items-center gap-0.5 rounded-md bg-muted p-0.5' : 'flex items-center gap-4 border-b border-border', className)}
        {...props}
      />
    </TypeContext.Provider>
  ),
)
TabsList.displayName = 'TabsList'

export const TabsTrigger = forwardRef<
  ElementRef<typeof TabsPrimitive.Trigger>,
  ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger> & { icon?: ReactNode; count?: number }
>(({ className, icon, count, children, ...props }, ref) => {
  const type = useContext(TypeContext)
  return (
    <TabsPrimitive.Trigger
      ref={ref}
      className={cn(
        'focus-ring group inline-flex items-center gap-1.5 whitespace-nowrap text-label-sm text-muted-foreground transition-colors data-[state=active]:text-foreground [&_svg]:size-4',
        type === 'segmented'
          ? 'h-7 rounded-sm px-3 hover:bg-surface-2 data-[state=active]:bg-card data-[state=active]:shadow-xs'
          : '-mb-px h-10 border-b-2 border-transparent px-1 hover:border-line-strong data-[state=active]:border-foreground',
        className,
      )}
      {...props}
    >
      {icon}
      {children}
      {count !== undefined && (
        <span className="rounded-full bg-surface-1 px-1.5 text-meta-sm text-muted-foreground group-data-[state=active]:bg-surface-2">{count}</span>
      )}
    </TabsPrimitive.Trigger>
  )
})
TabsTrigger.displayName = 'TabsTrigger'
