// Generated from the user's asGenerator sourceBundle. See receipt.json.
import { useEffect, useState, type CSSProperties, type ReactNode } from 'react'
import { ArrowRight, ArrowUpRight, Bell, Check, Download, Heart, LoaderCircle, Plus, ShoppingBag, Sparkles, Star } from 'lucide-react'


export type AsBadgeState = 'default' | 'hover' | 'pressed' | 'loading' | 'disabled'

export type AsBadgeProps = {
  material?: ReactNode
  media?: ReactNode
  children?: ReactNode
  label?: string
  secondaryLabel?: string
  eyebrow?: string
  title?: string
  description?: string
  state?: AsBadgeState
  className?: string
  style?: CSSProperties
  disabled?: boolean
  icon?: ReactNode
  defaultChecked?: boolean
  defaultTab?: number
  progress?: number
  inputPlaceholder?: string
  onAction?: () => void
  onToggle?: (checked: boolean) => void
  onTabChange?: (index: number) => void
  onSubmit?: (value: string) => void
}

function useReducedMotionPreference() {
  const [reduced, setReduced] = useState(() => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches)
  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => setReduced(media.matches)
    media.addEventListener('change', update)
    return () => media.removeEventListener('change', update)
  }, [])
  return reduced
}

export function AsBadge({
  label = "", secondaryLabel = "", eyebrow = "",
  title = "", description = "", state = "default",
  material, media, children, className = '', style, disabled = false, icon, defaultChecked = true, defaultTab = 0, progress = 72,
  inputPlaceholder = 'you@studio.com', onAction, onToggle, onTabChange, onSubmit,
}: AsBadgeProps) {
  const reducedMotion = useReducedMotionPreference()
  const [checked, setChecked] = useState(defaultChecked)
  const [activeTab, setActiveTab] = useState(Math.min(2, Math.max(0, defaultTab)))
  const tabs = [label, secondaryLabel || 'Activity', 'Settings']
  const safeProgress = Math.min(100, Math.max(0, progress))
  const isLoading = state === 'loading'
  const isDisabled = disabled || state === 'disabled' || isLoading
  const leadingIcon = icon ?? <ArrowRight size={16} />
  const vars = {
    '--drop-a': '#8f8fd6', '--drop-b': '#212159', '--drop-base': '#111122',
    '--drop-radius': '999px', '--drop-grain': '0.18',
    width: '168px', height: '44px',
    ...style,
  } as CSSProperties
  const shaderSpeed = reducedMotion ? 0 : 0.00
  const shader = material
  return (<div data-as-generator-recipe="badge" className={["generated generated-badge finish-glass material-plasma", "preview-" + state, className].filter(Boolean).join(" ")} style={vars} role="status">{shader}<span className="live-dot" />{label}</div>)
}
