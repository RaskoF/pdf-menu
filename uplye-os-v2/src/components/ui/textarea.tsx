import { forwardRef, type TextareaHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'
import { fieldBase } from './input'

// Figma : « Textarea » (9:79)
export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(({ className, ...props }, ref) => (
  <textarea ref={ref} className={cn(fieldBase, 'min-h-24 px-3 py-2', className)} {...props} />
))
Textarea.displayName = 'Textarea'
