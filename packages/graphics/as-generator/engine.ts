export type ComponentKind = 'button' | 'card' | 'toggle' | 'input' | 'badge' | 'alert' | 'tabs' | 'progress' | 'profile' | 'pricing' | 'navbar' | 'hero' | 'dialog' | 'select' | 'checkbox' | 'stat'
export type ComponentRecipe = 'foundation' | 'magnetic' | 'shimmer' | 'interactive'
export type IconName = 'sparkles' | 'arrow' | 'star' | 'heart' | 'download' | 'cart' | 'plus' | 'none'
export type ShaderKind = 'edge' | 'aurora' | 'liquid' | 'plasma' | 'metal' | 'smoke'
export type Finish = 'glass' | 'solid' | 'outline'
export type ComponentState = 'default' | 'hover' | 'pressed' | 'loading' | 'disabled'
export type PaletteKey = keyof typeof colorSets
export type Density = 'compact' | 'comfortable' | 'spacious'
export type Tone = 'confident' | 'calm' | 'playful' | 'editorial' | 'technical'
export type Composition = 'centered' | 'split' | 'stacked'

export type BuildBrief = {
  componentType: ComponentKind
  componentRecipe: ComponentRecipe
  iconName: IconName
  primaryAction: string
  secondaryAction: string
  eyebrow: string
  title: string
  description: string
  showcaseTitle: string
  showcaseDescription: string
  purpose: string
  materialFamily: ShaderKind
  palette: PaletteKey
  finish: Finish
  state: ComponentState
  density: Density
  tone: Tone
  radius: number
  width: number
  height: number
  intensity: number
  speed: number
  grain: number
  composition: Composition
}

export type ComponentSpec = {
  id: string
  prompt: string
  kind: ComponentKind
  componentRecipe: ComponentRecipe
  iconName: IconName
  shader: ShaderKind
  finish: Finish
  state: ComponentState
  palette: PaletteKey
  label: string
  secondaryLabel: string
  eyebrow: string
  title: string
  description: string
  showcaseTitle: string
  showcaseDescription: string
  purpose: string
  density: Density
  tone: Tone
  composition: Composition
  colors: string[]
  radius: number
  width: number
  height: number
  intensity: number
  speed: number
  grain: number
  generationMode: 'ai' | 'preset'
  model?: string
  generationMs?: number
}

export const colorSets = {
  cobalt: ['#0663F2', '#2F88FF', '#8CC4FF', '#020B1C'],
  ultraviolet: ['#8B5CF6', '#F06BFF', '#587BFF', '#12071D'],
  mint: ['#69F7D1', '#43A5FF', '#A7FF8B', '#061916'],
  ember: ['#FFB45C', '#FF5D91', '#8A5CFF', '#1A090C'],
  titanium: ['#F7F8FF', '#9DA7BA', '#D8E0F3', '#0A0C10'],
  gold: ['#FFE29A', '#D99B36', '#FFF4C8', '#160E04'],
} as const

export type WebsitePreset = {
  group: 'Buttons' | 'Website UI'
  label: string
  detail: string
  prompt: string
  kit?: boolean
}

export const websitePresets: readonly WebsitePreset[] = [
  { group: 'Buttons', label: 'Primary CTA', detail: 'Clear conversion action', prompt: 'A confident #0663F2 primary button called "Start building" with a restrained cobalt edge light', kit: true },
  { group: 'Buttons', label: 'Shimmer CTA', detail: 'Premium launch action', prompt: 'A #0663F2 shimmer button called "Get early access" with a quiet perimeter edge light' },
  { group: 'Buttons', label: 'Magnetic action', detail: 'Tactile product action', prompt: 'A magnetic #0663F2 button called "Open workspace" with a focused cobalt edge', kit: true },
  { group: 'Buttons', label: 'Hover reveal', detail: 'Editorial link action', prompt: 'An interactive hover #0663F2 button called "Explore the work" with a restrained cobalt edge', kit: true },
  { group: 'Website UI', label: 'Waitlist field', detail: 'Email capture and submit', prompt: 'A #0663F2 email input field for joining a product waitlist with a calm mesh gradient', kit: true },
  { group: 'Website UI', label: 'Navigation tabs', detail: 'Product section switcher', prompt: 'Compact #0663F2 navigation tabs for Overview, Features, and Updates with a focused edge material', kit: true },
  { group: 'Website UI', label: 'Feature card', detail: 'Website benefit block', prompt: 'A #0663F2 feature card for instant collaboration with a calm mesh gradient', kit: true },
  { group: 'Website UI', label: 'Pricing card', detail: 'Conversion-ready plan', prompt: 'A #0663F2 pricing card for a $24 Pro plan with a focused plasma material', kit: true },
  { group: 'Website UI', label: 'Status badge', detail: 'Compact live signal', prompt: 'A compact #0663F2 status badge called "Live now" with a restrained pulsing edge' },
  { group: 'Website UI', label: 'Notification toggle', detail: 'Clear settings control', prompt: 'A #0663F2 notification toggle for product updates with a soft liquid material' },
] as const

export type SourceRecord = { name: string; exportName?: string; source: string; license: string; acquisition: string }

export const foundationSources: Record<ComponentKind, SourceRecord> = {
  button: { name: 'shadcn Button', source: 'https://ui.shadcn.com/docs/components/base/button', license: 'MIT', acquisition: 'npx shadcn@latest add button' },
  card: { name: 'shadcn Card', source: 'https://ui.shadcn.com/docs/components/base/card', license: 'MIT', acquisition: 'npx shadcn@latest add card button' },
  toggle: { name: 'shadcn Switch', source: 'https://ui.shadcn.com/docs/components/base/switch', license: 'MIT', acquisition: 'npx shadcn@latest add switch' },
  input: { name: 'shadcn Input', source: 'https://ui.shadcn.com/docs/components/base/input', license: 'MIT', acquisition: 'npx shadcn@latest add input button' },
  badge: { name: 'shadcn Badge', source: 'https://ui.shadcn.com/docs/components/base/badge', license: 'MIT', acquisition: 'npx shadcn@latest add badge' },
  alert: { name: 'shadcn Alert', source: 'https://ui.shadcn.com/docs/components/base/alert', license: 'MIT', acquisition: 'npx shadcn@latest add alert button' },
  tabs: { name: 'shadcn Tabs', source: 'https://ui.shadcn.com/docs/components/base/tabs', license: 'MIT', acquisition: 'npx shadcn@latest add tabs' },
  progress: { name: 'shadcn Progress', source: 'https://ui.shadcn.com/docs/components/base/progress', license: 'MIT', acquisition: 'npx shadcn@latest add progress' },
  profile: { name: 'shadcn Card profile composition', source: 'https://ui.shadcn.com/docs/components/base/card', license: 'MIT', acquisition: 'npx shadcn@latest add card avatar button' },
  pricing: { name: 'shadcn Card pricing composition', source: 'https://ui.shadcn.com/docs/components/base/card', license: 'MIT', acquisition: 'npx shadcn@latest add card button badge' },
  navbar: { name: 'shadcn Navigation Menu', source: 'https://ui.shadcn.com/docs/components/base/navigation-menu', license: 'MIT', acquisition: 'npx shadcn@latest add navigation-menu button' },
  hero: { name: 'shadcn Card and Button hero composition', source: 'https://ui.shadcn.com/docs/components/base/card', license: 'MIT', acquisition: 'npx shadcn@latest add card button badge' },
  dialog: { name: 'shadcn Dialog', source: 'https://ui.shadcn.com/docs/components/base/dialog', license: 'MIT', acquisition: 'npx shadcn@latest add dialog button' },
  select: { name: 'shadcn Select', source: 'https://ui.shadcn.com/docs/components/base/select', license: 'MIT', acquisition: 'npx shadcn@latest add select' },
  checkbox: { name: 'shadcn Checkbox', source: 'https://ui.shadcn.com/docs/components/base/checkbox', license: 'MIT', acquisition: 'npx shadcn@latest add checkbox label' },
  stat: { name: 'shadcn Card metric composition', source: 'https://ui.shadcn.com/docs/components/base/card', license: 'MIT', acquisition: 'npx shadcn@latest add card badge' },
}

export const componentSources: Record<ComponentRecipe, SourceRecord> = {
  foundation: foundationSources.button,
  magnetic: { name: 'Motion Primitives Magnetic', source: 'https://motion-primitives.com/docs/magnetic', license: 'MIT', acquisition: 'npx motion-primitives@latest add magnetic' },
  shimmer: { name: 'Magic UI Shimmer Button', source: 'https://magicui.design/docs/components/shimmer-button', license: 'MIT', acquisition: 'npx shadcn@latest add @magicui/shimmer-button' },
  interactive: { name: 'Magic UI Interactive Hover Button', source: 'https://magicui.design/docs/components/interactive-hover-button', license: 'MIT', acquisition: 'npx shadcn@latest add @magicui/interactive-hover-button' },
}

export function componentSourceFor(spec: Pick<ComponentSpec, 'kind' | 'componentRecipe'>) {
  return spec.kind === 'button' ? componentSources[spec.componentRecipe] : foundationSources[spec.kind]
}

export const shaderSources: Record<ShaderKind, SourceRecord> = {
  edge: { name: 'Pulsing Border', exportName: 'PulsingBorder', source: 'https://shaders.paper.design/pulsing-border', license: 'Apache-2.0', acquisition: '@paper-design/shaders-react@0.0.80' },
  aurora: { name: 'Mesh Gradient', exportName: 'MeshGradient', source: 'https://shaders.paper.design/mesh-gradient', license: 'Apache-2.0', acquisition: '@paper-design/shaders-react@0.0.80' },
  liquid: { name: 'Metaballs', exportName: 'Metaballs', source: 'https://shaders.paper.design/metaballs', license: 'Apache-2.0', acquisition: '@paper-design/shaders-react@0.0.80' },
  plasma: { name: 'Neuro Noise', exportName: 'NeuroNoise', source: 'https://shaders.paper.design/neuro-noise', license: 'Apache-2.0', acquisition: '@paper-design/shaders-react@0.0.80' },
  metal: { name: 'Liquid Metal', exportName: 'LiquidMetal', source: 'https://shaders.paper.design/liquid-metal', license: 'Apache-2.0', acquisition: '@paper-design/shaders-react@0.0.80' },
  smoke: { name: 'Gem Smoke', exportName: 'GemSmoke', source: 'https://shaders.paper.design/gem-smoke', license: 'Apache-2.0', acquisition: '@paper-design/shaders-react@0.0.80' },
}

type DefaultCopy = Pick<ComponentSpec, 'label' | 'secondaryLabel' | 'eyebrow' | 'title' | 'description' | 'showcaseTitle' | 'showcaseDescription' | 'purpose'>
const defaultCopy: Record<ComponentKind, DefaultCopy> = {
  button: { label: 'Start creating', secondaryLabel: '', eyebrow: 'PRIMARY ACTION', title: 'Move the work forward', description: 'A decisive action with immediate visual feedback.', showcaseTitle: 'One action. Zero hesitation.', showcaseDescription: 'A tactile call to action with a focused material response.', purpose: 'Commits the user to the primary workflow.' },
  card: { label: 'Explore details', secondaryLabel: '', eyebrow: 'FEATURED STORY', title: 'Signal in motion', description: 'A focused story surface with clear hierarchy and a useful next step.', showcaseTitle: 'A story with depth.', showcaseDescription: 'Editorial hierarchy meets a restrained living material.', purpose: 'Presents a concise story and a clear follow-up action.' },
  toggle: { label: 'Live presence', secondaryLabel: '', eyebrow: 'PREFERENCE', title: 'Stay available', description: 'A direct setting with an unmistakable on state.', showcaseTitle: 'State you can feel.', showcaseDescription: 'Immediate feedback makes a small preference feel physical.', purpose: 'Changes a persistent binary preference.' },
  input: { label: 'Join the waitlist', secondaryLabel: '', eyebrow: 'EARLY ACCESS', title: 'Reserve your place', description: 'A focused email capture with a single, legible action.', showcaseTitle: 'A sharper first step.', showcaseDescription: 'Focused data entry without unnecessary ceremony.', purpose: 'Collects one piece of information and submits it.' },
  badge: { label: 'Now shipping', secondaryLabel: '', eyebrow: 'STATUS', title: 'Release ready', description: 'A compact, legible status signal.', showcaseTitle: 'Small signal. Clear meaning.', showcaseDescription: 'A compact status component with just enough energy.', purpose: 'Communicates a short non-interactive status.' },
  alert: { label: 'Review changes', secondaryLabel: 'Dismiss', eyebrow: 'ACTION NEEDED', title: 'Your draft is ready', description: 'Three edits need a final review before publishing.', showcaseTitle: 'Attention, without alarm.', showcaseDescription: 'A useful notification with a calm priority signal.', purpose: 'Explains an important state and offers a next action.' },
  tabs: { label: 'Overview', secondaryLabel: 'Activity', eyebrow: 'WORKSPACE VIEW', title: 'Project pulse', description: 'Switch between related views without losing context.', showcaseTitle: 'Navigation with momentum.', showcaseDescription: 'A compact view switcher with a visible selected state.', purpose: 'Switches between closely related content views.' },
  progress: { label: '72% complete', secondaryLabel: '', eyebrow: 'SYNC STATUS', title: 'Preparing your workspace', description: 'Assets are being optimized and indexed.', showcaseTitle: 'Progress that reassures.', showcaseDescription: 'A clear completion signal with restrained motion.', purpose: 'Communicates the status of a bounded task.' },
  profile: { label: 'View profile', secondaryLabel: 'Follow', eyebrow: 'CREATOR PROFILE', title: 'Maya Chen', description: 'Designing expressive tools for thoughtful teams.', showcaseTitle: 'Identity, distilled.', showcaseDescription: 'A compact profile surface with one obvious relationship action.', purpose: 'Summarizes a person and exposes a primary profile action.' },
  pricing: { label: 'Choose Pro', secondaryLabel: 'View details', eyebrow: 'MOST POPULAR', title: 'Pro — $24/mo', description: 'Unlimited projects, team spaces, and priority exports.', showcaseTitle: 'A plan worth choosing.', showcaseDescription: 'Pricing hierarchy with a confident, focused conversion action.', purpose: 'Explains one plan and lets the user select it.' },
  navbar: { label: 'Get started', secondaryLabel: 'Features', eyebrow: 'PRODUCT NAVIGATION', title: 'Northstar', description: 'Clear routes to product, pricing, and company information.', showcaseTitle: 'Navigation with a center of gravity.', showcaseDescription: 'A compact site header with one unmistakable action.', purpose: 'Orients visitors and exposes primary website destinations.' },
  hero: { label: 'Start building', secondaryLabel: 'See how it works', eyebrow: 'PRODUCT INTRODUCTION', title: 'Turn intent into interface.', description: 'Create a focused first impression with clear copy and one dominant next step.', showcaseTitle: 'A first frame that earns attention.', showcaseDescription: 'A responsive hero section with disciplined hierarchy.', purpose: 'Introduces the product and directs visitors to its primary action.' },
  dialog: { label: 'Confirm change', secondaryLabel: 'Cancel', eyebrow: 'CONFIRMATION', title: 'Publish these changes?', description: 'Your latest updates will become visible to everyone with access.', showcaseTitle: 'A decision with a clear exit.', showcaseDescription: 'Focused confirmation content with safe action hierarchy.', purpose: 'Requests confirmation before an important action.' },
  select: { label: 'Choose workspace', secondaryLabel: '', eyebrow: 'WORKSPACE', title: 'Active workspace', description: 'Select where new projects and collaborators should be added.', showcaseTitle: 'Selection without friction.', showcaseDescription: 'A labeled choice control with a stable selected value.', purpose: 'Chooses one option from a compact list.' },
  checkbox: { label: 'Email me product updates', secondaryLabel: '', eyebrow: 'NOTIFICATIONS', title: 'Product updates', description: 'Receive release notes and important service announcements.', showcaseTitle: 'Consent made unmistakable.', showcaseDescription: 'A compact choice with a clear checked state.', purpose: 'Captures one independent opt-in preference.' },
  stat: { label: '+24%', secondaryLabel: 'vs. last month', eyebrow: 'MONTHLY ACTIVE', title: '18,420', description: 'Teams completed 3,104 collaborative sessions this month.', showcaseTitle: 'A metric with context.', showcaseDescription: 'A compact data point that explains why the number matters.', purpose: 'Summarizes one important metric and its comparison.' },
}

const dimensions: Record<ComponentKind, [number, number]> = {
  button: [286, 64], card: [390, 330], toggle: [286, 68], input: [400, 104], badge: [168, 44],
  alert: [410, 150], tabs: [390, 88], progress: [390, 160], profile: [370, 220], pricing: [390, 350],
  navbar: [480, 76], hero: [480, 330], dialog: [420, 250], select: [360, 110], checkbox: [360, 92], stat: [310, 180],
}

function includesAny(value: string, words: string[]) { return words.some((word) => value.includes(word)) }

function inferKind(value: string): ComponentKind {
  if (includesAny(value, ['checkbox', 'check box', 'opt-in', 'consent'])) return 'checkbox'
  if (/\bselect\b/.test(value) || includesAny(value, ['dropdown', 'combobox', 'picker'])) return 'select'
  if (includesAny(value, ['dialog', 'modal', 'confirmation window'])) return 'dialog'
  if (includesAny(value, ['navbar', 'navigation bar', 'site header', 'top navigation'])) return 'navbar'
  if (includesAny(value, ['hero', 'masthead'])) return 'hero'
  if (/\bstat\b/.test(value) || includesAny(value, ['metric', 'kpi', 'analytics number'])) return 'stat'
  if (includesAny(value, ['pricing', 'price', 'plan', 'subscription'])) return 'pricing'
  if (includesAny(value, ['profile', 'creator', 'person', 'user card'])) return 'profile'
  if (includesAny(value, ['progress', 'loading bar', 'completion', 'upload'])) return 'progress'
  if (includesAny(value, ['tabs', 'tab list', 'segmented'])) return 'tabs'
  if (includesAny(value, ['toggle', 'switch'])) return 'toggle'
  if (includesAny(value, ['input', 'field', 'search bar'])) return 'input'
  if (includesAny(value, ['badge', 'pill', 'status', 'tag'])) return 'badge'
  if (includesAny(value, ['alert', 'notice', 'warning'])) return 'alert'
  if (includesAny(value, ['card', 'panel', 'tile'])) return 'card'
  if (includesAny(value, ['button', 'cta', 'call to action'])) return 'button'
  if (includesAny(value, ['notification'])) return 'alert'
  if (includesAny(value, ['email', 'waitlist', 'search'])) return 'input'
  return 'button'
}

function inferShader(value: string): ShaderKind {
  if (includesAny(value, ['liquid metal', 'metallic', 'chrome', 'molten metal', 'gold metal', 'silver metal'])) return 'metal'
  if (includesAny(value, ['gem smoke', 'jewel', 'smoky gem'])) return 'smoke'
  if (includesAny(value, ['edge', 'border', 'rim', 'outline'])) return 'edge'
  if (includesAny(value, ['liquid', 'goo', 'metaball', 'fluid'])) return 'liquid'
  if (includesAny(value, ['plasma', 'neon', 'electric', 'noise'])) return 'plasma'
  return 'aurora'
}

function inferPalette(value: string): PaletteKey {
  if (includesAny(value, ['gold', 'brass', 'champagne', 'bronze'])) return 'gold'
  if (includesAny(value, ['mint', 'green', 'teal'])) return 'mint'
  if (includesAny(value, ['warm', 'orange', 'sunset', 'pink', 'ember'])) return 'ember'
  if (includesAny(value, ['mono', 'white', 'silver', 'titanium'])) return 'titanium'
  if (includesAny(value, ['violet', 'purple', 'magenta'])) return 'ultraviolet'
  return 'cobalt'
}

function inferRecipe(value: string, kind: ComponentKind): ComponentRecipe {
  if (kind !== 'button') return 'foundation'
  if (includesAny(value, ['magnetic', 'liquid metal', 'metallic', 'chrome', 'molten', 'luxury'])) return 'magnetic'
  if (includesAny(value, ['shimmer', 'shining border', 'perimeter light'])) return 'shimmer'
  if (includesAny(value, ['interactive hover', 'hover reveal', 'swipe'])) return 'interactive'
  return 'foundation'
}

function inferIcon(value: string): IconName {
  if (includesAny(value, ['no icon', 'without icon'])) return 'none'
  if (includesAny(value, ['favorite', 'favourite', 'save', 'star'])) return 'star'
  if (includesAny(value, ['heart', 'like'])) return 'heart'
  if (includesAny(value, ['download', 'export'])) return 'download'
  if (includesAny(value, ['cart', 'checkout', 'purchase', 'buy'])) return 'cart'
  if (includesAny(value, ['add', 'create', 'new', 'plus'])) return 'plus'
  if (includesAny(value, ['icon', 'sparkle', 'magic'])) return 'sparkles'
  return 'arrow'
}

function extractQuotedLabel(prompt: string) { return prompt.match(/["“](.*?)["”]/)?.[1]?.trim() }

function createId(seed: number) { return `${seed.toString(36)}-${Math.random().toString(36).slice(2, 7)}` }

export function generateSpec(prompt: string, seed = Date.now()): ComponentSpec {
  const normalized = prompt.toLowerCase()
  const kind = inferKind(normalized)
  const shader = inferShader(normalized)
  const palette = inferPalette(normalized)
  const componentRecipe = inferRecipe(normalized, kind)
  const iconName = inferIcon(normalized)
  const finish: Finish = normalized.includes('outline') ? 'outline' : normalized.includes('solid') ? 'solid' : 'glass'
  const compact = includesAny(normalized, ['compact', 'small', 'tiny'])
  const wide = includesAny(normalized, ['wide', 'hero'])
  const defaults = defaultCopy[kind]
  const base = dimensions[kind]
  const recipeMinimum = componentRecipe === 'magnetic' ? [320, 68] : componentRecipe === 'shimmer' ? [260, 60] : componentRecipe === 'interactive' ? [244, 58] : [0, 0]
  return {
    id: createId(seed), prompt, kind, componentRecipe, iconName, shader, finish, state: 'default', palette,
    ...defaults,
    label: extractQuotedLabel(prompt) || defaults.label,
    density: compact ? 'compact' : wide ? 'spacious' : 'comfortable',
    tone: includesAny(normalized, ['playful', 'fun']) ? 'playful' : includesAny(normalized, ['editorial', 'magazine']) ? 'editorial' : 'confident',
    composition: wide ? 'split' : 'centered',
    colors: [...colorSets[palette]],
    radius: kind === 'badge' || kind === 'toggle' || kind === 'tabs' ? 999 : kind === 'card' || kind === 'pricing' || kind === 'hero' ? 28 : 18,
    width: Math.max(recipeMinimum[0], Math.min(480, base[0] + (wide ? 60 : compact ? -30 : 0))),
    height: Math.max(recipeMinimum[1], 40, base[1] + (wide ? 20 : compact ? -12 : 0)),
    intensity: shader === 'edge' ? 76 : 68, speed: 42, grain: shader === 'aurora' ? 18 : 8,
    generationMode: 'preset',
  }
}

export function specFromBrief(prompt: string, brief: BuildBrief, meta: { model: string; generationMs: number }): ComponentSpec {
  const safeBounds: Record<ComponentKind, { minW: number; maxW: number; minH: number; maxH: number }> = {
    button: { minW: 220, maxW: 420, minH: 56, maxH: 88 }, card: { minW: 320, maxW: 480, minH: 260, maxH: 380 },
    toggle: { minW: 240, maxW: 390, minH: 56, maxH: 86 }, input: { minW: 320, maxW: 480, minH: 96, maxH: 130 },
    badge: { minW: 120, maxW: 280, minH: 36, maxH: 58 }, alert: { minW: 340, maxW: 480, minH: 130, maxH: 190 },
    tabs: { minW: 300, maxW: 480, minH: 70, maxH: 110 }, progress: { minW: 330, maxW: 480, minH: 150, maxH: 210 },
    profile: { minW: 320, maxW: 460, minH: 200, maxH: 280 }, pricing: { minW: 330, maxW: 460, minH: 320, maxH: 380 },
    navbar: { minW: 380, maxW: 480, minH: 64, maxH: 94 }, hero: { minW: 380, maxW: 480, minH: 280, maxH: 380 },
    dialog: { minW: 340, maxW: 480, minH: 220, maxH: 320 }, select: { minW: 300, maxW: 460, minH: 96, maxH: 140 },
    checkbox: { minW: 300, maxW: 460, minH: 76, maxH: 130 }, stat: { minW: 260, maxW: 420, minH: 150, maxH: 240 },
  }
  const bounds = safeBounds[brief.componentType]
  const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))
  const normalized = prompt.toLowerCase()
  const requestedShader = inferShader(normalized)
  const explicitShader = includesAny(normalized, ['liquid metal', 'metallic', 'chrome', 'molten metal', 'gold metal', 'silver metal', 'gem smoke', 'jewel', 'smoky gem']) ? requestedShader : brief.materialFamily
  const requestedPalette = inferPalette(normalized)
  const hasExplicitPalette = includesAny(normalized, [
    '#0663f2', '0663f2', 'blue', 'cobalt', 'azure', 'gold', 'brass', 'champagne', 'bronze',
    'mint', 'green', 'teal', 'warm', 'orange', 'sunset', 'pink', 'ember',
    'mono', 'white', 'silver', 'titanium', 'violet', 'purple', 'magenta',
  ])
  const explicitPalette = hasExplicitPalette ? requestedPalette : 'cobalt'
  const componentRecipe = brief.componentType === 'button' ? inferRecipe(normalized, brief.componentType) === 'foundation' ? brief.componentRecipe : inferRecipe(normalized, brief.componentType) : 'foundation'
  const iconName = includesAny(normalized, ['icon', 'favorite', 'favourite', 'save', 'star', 'heart', 'like', 'download', 'export', 'cart', 'checkout', 'purchase', 'buy', 'add', 'create', 'new', 'plus']) ? inferIcon(normalized) : brief.iconName
  const recipeMinimums: Record<ComponentRecipe, { width: number; height: number }> = {
    foundation: { width: bounds.minW, height: bounds.minH },
    magnetic: { width: 320, height: 68 },
    shimmer: { width: 260, height: 60 },
    interactive: { width: 244, height: 58 },
  }
  const minimum = recipeMinimums[componentRecipe]
  return {
    id: createId(Date.now()), prompt,
    kind: brief.componentType, componentRecipe, iconName, shader: explicitShader, finish: brief.finish, state: brief.state, palette: explicitPalette,
    label: brief.primaryAction, secondaryLabel: brief.secondaryAction, eyebrow: brief.eyebrow,
    title: brief.title, description: brief.description, showcaseTitle: brief.showcaseTitle,
    showcaseDescription: brief.showcaseDescription, purpose: brief.purpose,
    density: brief.density, tone: brief.tone, composition: brief.composition,
    colors: [...colorSets[explicitPalette]],
    radius: brief.componentType === 'badge' || brief.componentType === 'toggle' ? 999 : brief.radius,
    width: clamp(brief.width, minimum.width, bounds.maxW), height: clamp(brief.height, minimum.height, bounds.maxH),
    intensity: brief.intensity, speed: brief.speed, grain: brief.grain,
    generationMode: 'ai', model: meta.model, generationMs: meta.generationMs,
  }
}

const shaderSnippet = (spec: ComponentSpec) => {
  const colors = JSON.stringify(spec.colors.slice(0, 3))
  const speed = 'shaderSpeed'
  const style = `style={{ opacity: ${(spec.intensity / 100).toFixed(2)} }} webGlContextAttributes={{ preserveDrawingBuffer: true }}`
  if (spec.shader === 'edge') return `<PulsingBorder className="shader" ${style} colors={${colors}} colorBack="#080A0F" scale={1} margin={0.025} aspectRatio="auto" roundness={${Math.min(spec.radius / 32, 1).toFixed(2)}} thickness={0.095} softness={0.18} intensity={${(0.28 + spec.intensity / 180).toFixed(2)}} bloom={0.42} spots={4} spotSize={0.38} pulse={0.12} smoke={0.08} smokeSize={0.2} speed={${speed}} />`
  if (spec.shader === 'liquid') return `<Metaballs className="shader" ${style} colors={${colors}} colorBack="${spec.colors[3]}" count={8} size={0.56} speed={${speed}} />`
  if (spec.shader === 'plasma') return `<NeuroNoise className="shader" ${style} colorFront="${spec.colors[0]}" colorMid="${spec.colors[1]}" colorBack="${spec.colors[3]}" brightness={0.62} contrast={0.72} speed={${speed}} />`
  if (spec.shader === 'metal') return `<LiquidMetal className="shader" ${style} colorBack="${spec.colors[3]}" colorTint="${spec.colors[0]}" shape="none" fit="cover" scale={1} repetition={2.4} softness={0.24} shiftRed={0.06} shiftBlue={-0.04} distortion={${(0.12 + spec.intensity / 500).toFixed(2)}} contour={0.32} angle={72} speed={${speed}} />`
  if (spec.shader === 'smoke') return `<GemSmoke className="shader" ${style} colors={${colors}} colorBack="${spec.colors[3]}" colorInner="${spec.colors[3]}" shape="none" fit="cover" scale={1} innerDistortion={0.54} outerDistortion={0.36} innerGlow={0.76} outerGlow={0.24} size={0.86} speed={${speed}} />`
  return `<MeshGradient className="shader" ${style} colors={${JSON.stringify(spec.colors)}} distortion={0.72} swirl={0.54} grainMixer={${(spec.grain / 100).toFixed(2)}} grainOverlay={${(spec.grain / 180).toFixed(2)}} speed={${speed}} />`
}

function jsxText(value: string) { return value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('{', '&#123;').replaceAll('}', '&#125;') }

function componentMarkup(spec: ComponentSpec) {
  const disabled = spec.state === 'disabled' ? ' disabled' : ''
  const loading = spec.state === 'loading'
  const cls = `generated generated-${spec.kind} finish-${spec.finish} material-${spec.shader} preview-${spec.state}`
  const label = jsxText(spec.label), secondary = jsxText(spec.secondaryLabel), eyebrow = jsxText(spec.eyebrow), title = jsxText(spec.title), description = jsxText(spec.description)
  if (spec.kind === 'card') return `<article className="${cls}" style={vars}>{shader}<span className="eyebrow">${eyebrow}</span><h3>${title}</h3><p>${description}</p><button className="text-action">${label} <ArrowRight size={15} /></button></article>`
  if (spec.kind === 'toggle') return `<button className="${cls}" style={vars} role="switch" aria-checked="true"${disabled}>{shader}<span>${label}</span><span className="toggle-track"><i /></span></button>`
  if (spec.kind === 'input') return `<form className="${cls}" style={vars} onSubmit={(event) => event.preventDefault()}>{shader}<label htmlFor="generated-email">${title}</label><div><input id="generated-email" type="email" placeholder="you@studio.com" /><button aria-label="${label}"><ArrowRight size={17} /></button></div></form>`
  if (spec.kind === 'badge') return `<div className="${cls}" style={vars} role="status">{shader}<span className="live-dot" />${label}</div>`
  if (spec.kind === 'alert') return `<section className="${cls}" style={vars} role="alert">{shader}<Bell size={19} /><div><span className="eyebrow">${eyebrow}</span><h3>${title}</h3><p>${description}</p></div><button>${label}</button></section>`
  if (spec.kind === 'tabs') return `<div className="${cls}" style={vars} role="tablist" aria-label="${title}">{shader}<button role="tab" aria-selected="true">${label}</button><button role="tab" aria-selected="false">${secondary || 'Activity'}</button><button role="tab" aria-selected="false">Settings</button></div>`
  if (spec.kind === 'progress') return `<section className="${cls}" style={vars}>{shader}<span className="eyebrow">${eyebrow}</span><div><h3>${title}</h3><strong>${label}</strong></div><p>${description}</p><div className="progress-track" role="progressbar" aria-label="${title}" aria-valuenow={72} aria-valuemin={0} aria-valuemax={100}><i /></div></section>`
  if (spec.kind === 'profile') return `<article className="${cls}" style={vars}>{shader}<div className="avatar" aria-hidden="true">MC</div><div><span className="eyebrow">${eyebrow}</span><h3>${title}</h3><p>${description}</p></div><button>${label}</button></article>`
  if (spec.kind === 'pricing') return `<article className="${cls}" style={vars}>{shader}<span className="eyebrow">${eyebrow}</span><h3>${title}</h3><p>${description}</p><ul><li><Check size={14} /> Unlimited projects</li><li><Check size={14} /> Priority exports</li></ul><button>${label}<ArrowRight size={16} /></button></article>`
  if (spec.kind === 'navbar') return `<nav className="${cls}" style={vars} aria-label="Primary">{shader}<a className="nav-brand" href="#"><Sparkles size={16} />${title}</a><div><a href="#features">Features</a><a href="#pricing">Pricing</a><a href="#about">About</a></div><button>${label}<ArrowRight size={14} /></button></nav>`
  if (spec.kind === 'hero') return `<section className="${cls}" style={vars}>{shader}<span className="eyebrow">${eyebrow}</span><h2>${title}</h2><p>${description}</p><div className="hero-actions"><button>${label}<ArrowRight size={16} /></button><button>${secondary || 'Learn more'}</button></div></section>`
  if (spec.kind === 'dialog') return `<section className="${cls}" style={vars} role="dialog" aria-modal="true" aria-labelledby="generated-dialog-title">{shader}<span className="eyebrow">${eyebrow}</span><h3 id="generated-dialog-title">${title}</h3><p>${description}</p><div className="dialog-actions"><button>${secondary || 'Cancel'}</button><button>${label}</button></div></section>`
  if (spec.kind === 'select') return `<label className="${cls}" style={vars}>{shader}<span>${title}</span><select aria-label="${title}"><option>${label}</option><option>Design team</option><option>Personal</option></select><small>${description}</small></label>`
  if (spec.kind === 'checkbox') return `<label className="${cls}" style={vars}>{shader}<input type="checkbox" defaultChecked${disabled} /><span className="checkbox-mark"><Check size={14} /></span><span><strong>${label}</strong><small>${description}</small></span></label>`
  if (spec.kind === 'stat') return `<article className="${cls}" style={vars}>{shader}<span className="eyebrow">${eyebrow}</span><div className="stat-value"><h3>${title}</h3><strong>${label}</strong></div><p>${description}</p><small>${secondary || 'vs. last month'}</small></article>`
  if (spec.kind === 'button') {
    const iconByName: Record<IconName, string> = { sparkles: '<Sparkles size={16} />', arrow: '<ArrowRight size={16} />', star: '<Star size={16} />', heart: '<Heart size={16} />', download: '<Download size={16} />', cart: '<ShoppingBag size={16} />', plus: '<Plus size={16} />', none: '' }
    const icon = loading ? '<LoaderCircle className="spinner" size={16} />' : iconByName[spec.iconName]
    const buttonClass = `${cls} recipe-${spec.componentRecipe}`
    const inner = spec.componentRecipe === 'interactive'
      ? `{shader}<span className="button-depth" aria-hidden="true" /><span className="hover-orb" aria-hidden="true" /><span className="interactive-default">${icon}<b>${loading ? 'Working…' : label}</b></span><span className="interactive-reveal"><b>${loading ? 'Working…' : label}</b><ArrowRight size={16} /></span>`
      : `{shader}<span className="button-depth" aria-hidden="true" />${spec.componentRecipe === 'shimmer' ? '<span className="source-shimmer" aria-hidden="true"><i /></span>' : ''}${icon ? `<span className="button-leading" aria-hidden="true">${icon}</span>` : ''}<span className="button-copy"><b>${loading ? 'Working…' : label}</b>${spec.componentRecipe === 'magnetic' ? `<em>${eyebrow}</em>` : ''}</span><span className="button-trailing" aria-hidden="true"><ArrowUpRight size={16} /></span>`
    const button = `<button type="button" className="${buttonClass}" style={vars}${disabled} aria-busy={${loading}}>${inner}</button>`
    return spec.componentRecipe === 'magnetic' ? `<Magnetic intensity={0.18} range={150}>${button}</Magnetic>` : button
  }
  return `<button type="button" className="${cls}" style={vars}${disabled} aria-busy={${loading}}>{shader}<span className="button-material" aria-hidden="true" /><span className="button-leading" aria-hidden="true">${loading ? '<LoaderCircle className="spinner" size={15} />' : '<Sparkles size={15} />'}</span><span className="button-copy">${loading ? 'Working…' : label}</span><span className="button-trailing" aria-hidden="true"><ArrowUpRight size={15} /></span></button>`
}

function componentMarkupV2(spec: ComponentSpec) {
  const base = `generated generated-${spec.kind} finish-${spec.finish} material-${spec.shader}`
  const root = `className={["${base}", "preview-" + state, className].filter(Boolean).join(" ")} style={vars}`
  if (spec.kind === 'card') return `<article ${root}>{shader}<span className="eyebrow">{eyebrow}</span><h3>{title}</h3><p>{description}</p><button type="button" className="text-action" disabled={isDisabled} onClick={onAction}>{isLoading ? 'Working...' : label} <ArrowRight size={15} /></button></article>`
  if (spec.kind === 'toggle') return `<button type="button" ${root} role="switch" aria-checked={checked} disabled={isDisabled} onClick={() => { const next = !checked; setChecked(next); onToggle?.(next) }}>{shader}<span>{label}</span><span className={["toggle-track", checked ? "is-on" : ""].filter(Boolean).join(" ")}><i /></span></button>`
  if (spec.kind === 'input') return `<form ${root} onSubmit={(event) => { event.preventDefault(); const value = String(new FormData(event.currentTarget).get('value') || ''); onSubmit?.(value) }}>{shader}<label htmlFor="generated-value">{title}</label><div><input id="generated-value" name="value" type="text" placeholder={inputPlaceholder} disabled={isDisabled} aria-describedby="generated-description" /><button type="submit" aria-label={label} disabled={isDisabled}>{isLoading ? <LoaderCircle className="spinner" size={17} /> : <ArrowRight size={17} />}</button></div><span id="generated-description" className="sr-only">{description}</span></form>`
  if (spec.kind === 'badge') return `<div ${root} role="status">{shader}<span className="live-dot" />{label}</div>`
  if (spec.kind === 'alert') return `<section ${root} role="alert">{shader}<Bell size={19} /><div><span className="eyebrow">{eyebrow}</span><h3>{title}</h3><p>{description}</p></div><button type="button" disabled={isDisabled} onClick={onAction}>{isLoading ? 'Working...' : label}</button></section>`
  if (spec.kind === 'tabs') return `<div ${root} role="tablist" aria-label={title}>{shader}{tabs.map((tab, index) => <button key={tab} type="button" role="tab" aria-selected={activeTab === index} disabled={isDisabled} onClick={() => { setActiveTab(index); onTabChange?.(index) }}>{tab}</button>)}</div>`
  if (spec.kind === 'progress') return `<section ${root}>{shader}<span className="eyebrow">{eyebrow}</span><div><h3>{title}</h3><strong>{safeProgress}%</strong></div><p>{description}</p><div className="progress-track" role="progressbar" aria-label={title} aria-valuenow={safeProgress} aria-valuemin={0} aria-valuemax={100}><i style={{ width: safeProgress + '%' }} /></div></section>`
  if (spec.kind === 'profile') return `<article ${root}>{shader}<div className="avatar" aria-hidden="true">MC</div><div><span className="eyebrow">{eyebrow}</span><h3>{title}</h3><p>{description}</p></div><button type="button" disabled={isDisabled} onClick={onAction}>{isLoading ? 'Working...' : label}</button></article>`
  if (spec.kind === 'pricing') return `<article ${root}>{shader}<span className="eyebrow">{eyebrow}</span><h3>{title}</h3><p>{description}</p><ul><li><Check size={14} /> Unlimited projects</li><li><Check size={14} /> Priority exports</li></ul><button type="button" disabled={isDisabled} onClick={onAction}>{isLoading ? 'Working...' : label}<ArrowRight size={16} /></button></article>`
  if (spec.kind === 'navbar') return `<nav ${root} aria-label="Primary">{shader}<a className="nav-brand" href="#"><Sparkles size={16} />{title}</a><div><a href="#features">Features</a><a href="#pricing">Pricing</a><a href="#about">About</a></div><button type="button" disabled={isDisabled} onClick={onAction}>{isLoading ? 'Working...' : label}<ArrowRight size={14} /></button></nav>`
  if (spec.kind === 'hero') return `<section ${root}>{shader}<span className="eyebrow">{eyebrow}</span><h2>{title}</h2><p>{description}</p><div className="hero-actions"><button type="button" disabled={isDisabled} onClick={onAction}>{isLoading ? 'Working...' : label}<ArrowRight size={16} /></button><button type="button" disabled={isDisabled}>{secondaryLabel || 'Learn more'}</button></div></section>`
  if (spec.kind === 'dialog') return `<section ${root} role="dialog" aria-modal="true" aria-labelledby="generated-dialog-title">{shader}<span className="eyebrow">{eyebrow}</span><h3 id="generated-dialog-title">{title}</h3><p>{description}</p><div className="dialog-actions"><button type="button" disabled={isDisabled}>{secondaryLabel || 'Cancel'}</button><button type="button" disabled={isDisabled} onClick={onAction}>{isLoading ? 'Working...' : label}</button></div></section>`
  if (spec.kind === 'select') return `<label ${root}>{shader}<span>{title}</span><select aria-label={title} disabled={isDisabled} onChange={(event) => onSubmit?.(event.currentTarget.value)}><option>{label}</option><option>Design team</option><option>Personal</option></select><small>{description}</small></label>`
  if (spec.kind === 'checkbox') return `<label ${root}><input type="checkbox" checked={checked} disabled={isDisabled} onChange={(event) => { setChecked(event.currentTarget.checked); onToggle?.(event.currentTarget.checked) }} /><span className="checkbox-mark"><Check size={14} /></span><span><strong>{label}</strong><small>{description}</small></span>{shader}</label>`
  if (spec.kind === 'stat') return `<article ${root}>{shader}<span className="eyebrow">{eyebrow}</span><div className="stat-value"><h3>{title}</h3><strong>{label}</strong></div><p>{description}</p><small>{secondaryLabel || 'vs. last month'}</small></article>`
  const buttonClass = `generated generated-button finish-${spec.finish} material-${spec.shader} recipe-${spec.componentRecipe}`
  const buttonRoot = `className={["${buttonClass}", "preview-" + state, (leadingIcon || isLoading) ? "has-leading" : "no-leading", showTrailing ? "has-trailing" : "no-trailing", className].filter(Boolean).join(" ")} style={vars}`
  const inner = spec.componentRecipe === 'interactive'
    ? `{shader}<span className="button-depth" aria-hidden="true" /><span className="hover-orb" aria-hidden="true" /><span className="interactive-default">{isLoading ? <LoaderCircle className="spinner" size={16} /> : leadingIcon}<b>{isLoading ? 'Working...' : label}</b></span><span className="interactive-reveal"><b>{isLoading ? 'Working...' : label}</b><ArrowRight size={16} /></span>`
    : `{shader}<span className="button-depth" aria-hidden="true" />${spec.componentRecipe === 'shimmer' ? '<span className="source-shimmer" aria-hidden="true"><i /></span>' : ''}{(isLoading || leadingIcon) && <span className="button-leading" aria-hidden="true">{isLoading ? <LoaderCircle className="spinner" size={16} /> : leadingIcon}</span>}<span className="button-copy"><b>{isLoading ? 'Working...' : label}</b>${spec.componentRecipe === 'magnetic' ? '<em>{eyebrow}</em>' : ''}</span>{showTrailing && <span className="button-trailing" aria-hidden="true"><ArrowUpRight size={16} /></span>}`
  const button = `<button type="button" ${buttonRoot} disabled={isDisabled} aria-busy={isLoading} onClick={onAction}>${inner}</button>`
  return spec.componentRecipe === 'magnetic' ? `<Magnetic intensity={0.18} range={150}>${button}</Magnetic>` : button
}

export type SourceBundle = { files: Record<string, string>; dependencies: Record<string, string> }

function sourceString(value: string) {
  return JSON.stringify(value).replaceAll('<', '\\u003c').replaceAll('>', '\\u003e').replaceAll('&', '\\u0026')
}

export function sourceBundle(spec: ComponentSpec): SourceBundle {
  const shaderExport = shaderSources[spec.shader].exportName!
  const usesMagnetic = spec.kind === 'button' && spec.componentRecipe === 'magnetic'
  const iconByName: Record<IconName, string> = { sparkles: '<Sparkles size={16} />', arrow: '<ArrowRight size={16} />', star: '<Star size={16} />', heart: '<Heart size={16} />', download: '<Download size={16} />', cart: '<ShoppingBag size={16} />', plus: '<Plus size={16} />', none: 'null' }
  const component = `import { useEffect, useState, type CSSProperties, type ReactNode } from 'react'
import { ArrowRight, ArrowUpRight, Bell, Check, Download, Heart, LoaderCircle, Plus, ShoppingBag, Sparkles, Star } from 'lucide-react'
import { ${shaderExport} } from '@paper-design/shaders-react'
${usesMagnetic ? "import { Magnetic } from './Magnetic'\n" : ''}import './generated-component.css'

export type GeneratedComponentState = 'default' | 'hover' | 'pressed' | 'loading' | 'disabled'

export type GeneratedComponentProps = {
  label?: string
  secondaryLabel?: string
  eyebrow?: string
  title?: string
  description?: string
  state?: GeneratedComponentState
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

export function GeneratedComponent({
  label = ${sourceString(spec.label)}, secondaryLabel = ${sourceString(spec.secondaryLabel)}, eyebrow = ${sourceString(spec.eyebrow)},
  title = ${sourceString(spec.title)}, description = ${sourceString(spec.description)}, state = ${sourceString(spec.state)},
  className = '', style, disabled = false, icon, defaultChecked = true, defaultTab = 0, progress = 72,
  inputPlaceholder = 'you@studio.com', onAction, onToggle, onTabChange, onSubmit,
}: GeneratedComponentProps) {
  const reducedMotion = useReducedMotionPreference()
  const [checked, setChecked] = useState(defaultChecked)
  const [activeTab, setActiveTab] = useState(Math.min(2, Math.max(0, defaultTab)))
  const tabs = [label, secondaryLabel || 'Activity', 'Settings']
  const safeProgress = Math.min(100, Math.max(0, progress))
  const isLoading = state === 'loading'
  const isDisabled = disabled || state === 'disabled' || isLoading
  const leadingIcon = icon ?? ${iconByName[spec.iconName]}
${spec.kind === 'button' ? `  const showTrailing = icon === undefined ? ${resolveButtonAffordance(spec).trailing} : true
` : ''}  const vars = {
    '--drop-a': '${spec.colors[0]}', '--drop-b': '${spec.colors[1]}', '--drop-base': '${spec.colors[3]}',
    '--drop-radius': '${spec.radius}px', '--drop-grain': '${spec.grain / 100}',
    width: '${spec.width}px', height: '${spec.height}px',
    ...style,
  } as CSSProperties
  const shaderSpeed = reducedMotion ? 0 : ${(spec.speed / 40).toFixed(2)}
  const shader = ${shaderSnippet(spec)}
  return (${componentMarkupV2(spec)})
}
`

  const magnetic = `import { useEffect, useRef, useState, type ReactNode } from 'react'
import { motion, useMotionValue, useReducedMotion, useSpring } from 'motion/react'

export function Magnetic({ children, intensity = 0.18, range = 150 }: { children: ReactNode; intensity?: number; range?: number }) {
  const [active, setActive] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const reduceMotion = useReducedMotion()
  const x = useMotionValue(0), y = useMotionValue(0)
  const springX = useSpring(x, { stiffness: 240, damping: 28, mass: 0.42 })
  const springY = useSpring(y, { stiffness: 240, damping: 28, mass: 0.42 })
  useEffect(() => {
    if (reduceMotion) return
    const move = (event: PointerEvent) => {
      const rect = ref.current?.getBoundingClientRect()
      if (!rect || !active) return
      const dx = event.clientX - (rect.left + rect.width / 2), dy = event.clientY - (rect.top + rect.height / 2)
      const falloff = Math.max(0, 1 - Math.hypot(dx, dy) / range)
      x.set(dx * intensity * falloff); y.set(dy * intensity * falloff)
    }
    window.addEventListener('pointermove', move, { passive: true })
    return () => window.removeEventListener('pointermove', move)
  }, [active, intensity, range, reduceMotion, x, y])
  return <motion.div ref={ref} onPointerEnter={() => setActive(true)} onPointerLeave={() => { setActive(false); x.set(0); y.set(0) }} style={{ x: springX, y: springY }}>{children}</motion.div>
}
`

  const css = `.generated { position:relative; isolation:isolate; overflow:hidden; border:1px solid rgba(255,255,255,.18); border-radius:var(--drop-radius); color:white; background:linear-gradient(145deg,color-mix(in srgb,var(--drop-a) 10%,#11141b),#07090e 58%,color-mix(in srgb,var(--drop-b) 7%,#07090e)); box-shadow:inset 0 1px rgba(255,255,255,.2),0 24px 70px rgba(0,0,0,.42); backdrop-filter:blur(18px) saturate(140%); font-family:system-ui; }
.shader { position:absolute!important; inset:0; z-index:0; width:100%!important; height:100%!important; pointer-events:none; }
.generated::after { content:''; position:absolute; inset:0; z-index:1; pointer-events:none; opacity:var(--drop-grain); background:repeating-radial-gradient(circle at 20% 30%,rgba(255,255,255,.2) 0 1px,transparent 1px 3px); mix-blend-mode:soft-light; }.generated>:not(.shader){position:relative;z-index:2}
.finish-solid{background:color-mix(in srgb,var(--drop-base) 74%,var(--drop-b))}.finish-outline{background:rgba(5,7,11,.48)}.preview-hover{filter:brightness(1.12)}.preview-pressed{transform:scale(.97);filter:brightness(.93)}.preview-disabled{opacity:.45}
.generated-button{display:grid;grid-template-columns:36px minmax(0,1fr) 36px;align-items:center;gap:9px;padding:6px;border-color:color-mix(in srgb,var(--drop-a) 40%,rgba(255,255,255,.18));background:linear-gradient(145deg,color-mix(in srgb,var(--drop-a) 18%,#0d1017),#05070b 58%,color-mix(in srgb,var(--drop-b) 12%,#07090e));text-align:left;font-weight:720;letter-spacing:-.018em;box-shadow:0 24px 70px rgba(0,0,0,.5),0 0 40px color-mix(in srgb,var(--drop-a) 16%,transparent),inset 0 1px rgba(255,255,255,.22);transition:transform .12s ease,filter .15s ease,box-shadow .18s ease}.button-material{position:absolute!important;inset:2px;z-index:1!important;border:1px solid rgba(255,255,255,.075);border-radius:max(4px,calc(var(--drop-radius) - 2px));background:linear-gradient(115deg,rgba(23,27,37,.91),rgba(8,10,15,.94) 54%,rgba(14,17,24,.9));box-shadow:inset 0 1px rgba(255,255,255,.075),inset 0 -1px rgba(0,0,0,.48);pointer-events:none}.button-leading,.button-trailing{width:36px;height:36px;display:grid;place-items:center;border:1px solid rgba(255,255,255,.095);border-radius:max(8px,calc(var(--drop-radius) - 7px));background:rgba(255,255,255,.055);box-shadow:inset 0 1px rgba(255,255,255,.07)}.button-leading{color:color-mix(in srgb,var(--drop-a) 58%,white)}.button-copy{min-width:0;overflow:hidden;padding:0 3px;text-overflow:ellipsis;white-space:nowrap}.button-trailing{transition:transform .2s ease,color .16s ease,background .16s ease}.generated-button:hover{filter:brightness(1.08);box-shadow:0 28px 84px rgba(0,0,0,.55),0 0 58px color-mix(in srgb,var(--drop-a) 23%,transparent)}.generated-button:hover .button-trailing{transform:translate(1px,-1px);color:#090b10;background:rgba(255,255,255,.92)}.generated-button:active{transform:scale(.985)}.generated-button:focus-visible{outline:3px solid color-mix(in srgb,var(--drop-a) 68%,white);outline-offset:5px}.generated-toggle{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:0 20px;font-weight:700}
.generated-button{position:relative;align-items:center;min-width:0;padding:6px;border-color:color-mix(in srgb,var(--drop-a) 46%,rgba(255,255,255,.2));background:#07090d;box-shadow:0 24px 70px rgba(0,0,0,.5),0 0 48px color-mix(in srgb,var(--drop-a) 18%,transparent),inset 0 1px rgba(255,255,255,.24)}.button-depth{position:absolute!important;inset:1px;z-index:1!important;border:1px solid rgba(255,255,255,.13);border-radius:max(4px,calc(var(--drop-radius) - 1px));background:linear-gradient(112deg,rgba(4,5,8,.5),rgba(7,8,11,.78) 52%,rgba(3,4,7,.44));box-shadow:inset 0 1px rgba(255,255,255,.1),inset 0 -12px 28px rgba(0,0,0,.25);pointer-events:none}.material-metal .button-depth{background:linear-gradient(110deg,rgba(16,10,2,.12),rgba(3,3,3,.34) 45%,rgba(17,10,2,.08));box-shadow:inset 0 1px rgba(255,247,215,.42),inset 0 -14px 28px rgba(44,22,0,.22)}.generated-button>:not(.shader):not(.button-depth):not(.source-shimmer):not(.hover-orb){position:relative;z-index:3}.button-leading,.button-trailing{width:38px;height:38px;border-color:rgba(255,255,255,.14);background:rgba(7,8,11,.36);box-shadow:inset 0 1px rgba(255,255,255,.13),0 8px 20px rgba(0,0,0,.16)}.button-copy{ text-shadow:0 1px 2px rgba(0,0,0,.82),0 2px 14px rgba(0,0,0,.6)}.button-copy b,.button-copy em{display:block;overflow:hidden;text-overflow:ellipsis}.button-copy em{margin-top:3px;color:rgba(255,255,255,.56);font-size:8px;font-style:normal;letter-spacing:.1em;text-transform:uppercase}.recipe-foundation{grid-template-columns:minmax(0,1fr) 38px;gap:9px;padding-left:19px}.recipe-foundation .button-leading{display:none}.recipe-magnetic{grid-template-columns:44px minmax(0,1fr) 40px;gap:10px;padding:7px}.recipe-magnetic.no-leading{grid-template-columns:minmax(0,1fr) 40px;padding-left:18px}.recipe-magnetic .button-leading{width:44px;height:44px;background:radial-gradient(circle at 35% 28%,rgba(255,255,255,.24),rgba(17,10,2,.3) 66%)}.recipe-magnetic .button-trailing{width:40px;height:40px;border-radius:50%;color:#1a1003;background:color-mix(in srgb,var(--drop-a) 78%,white)}.recipe-shimmer{grid-template-columns:38px minmax(0,1fr) 38px;gap:9px}.recipe-shimmer.no-leading{grid-template-columns:minmax(0,1fr) 38px;padding-left:19px}.no-trailing.recipe-magnetic{grid-template-columns:44px minmax(0,1fr);padding-right:18px}.no-trailing.recipe-magnetic.no-leading{grid-template-columns:minmax(0,1fr);padding-left:18px}.no-trailing.recipe-shimmer{grid-template-columns:38px minmax(0,1fr);padding-right:17px}.no-trailing.recipe-shimmer.no-leading{grid-template-columns:minmax(0,1fr);padding-left:17px}.no-trailing.recipe-foundation{grid-template-columns:minmax(0,1fr);padding-right:19px}.source-shimmer{position:absolute!important;inset:-30%;opacity:.5;z-index:0!important;pointer-events:none;animation:source-spin 5.4s linear infinite}.source-shimmer i{position:absolute;inset:0;background:conic-gradient(from 0deg,transparent 0 38%,color-mix(in srgb,var(--drop-a) 70%,transparent) 47%,color-mix(in srgb,#fff 55%,var(--drop-b)) 50%,color-mix(in srgb,var(--drop-b) 70%,transparent) 53%,transparent 62% 100%);filter:blur(9px)}.recipe-shimmer .button-depth{inset:2px;z-index:1!important;background:rgba(5,7,10,.82)}@keyframes source-spin{to{transform:rotate(360deg)}}.recipe-interactive{display:flex;justify-content:center;padding:0 22px}.hover-orb{position:absolute!important;left:19px;z-index:2!important;width:9px;height:9px;border-radius:50%;background:var(--drop-a);box-shadow:0 0 20px var(--drop-a);transition:transform .36s cubic-bezier(.2,.8,.2,1)}.interactive-default,.interactive-reveal{display:flex;align-items:center;justify-content:center;gap:9px;white-space:nowrap;text-shadow:0 1px 2px rgba(0,0,0,.82),0 2px 14px rgba(0,0,0,.6);transition:transform .32s cubic-bezier(.2,.8,.2,1),opacity .18s ease}.interactive-reveal{position:absolute!important;inset:0;transform:translateX(36px);opacity:0;color:#090b0d}.recipe-interactive:hover .hover-orb{transform:scale(45)}.recipe-interactive:hover .interactive-default{transform:translateX(28px);opacity:0}.recipe-interactive:hover .interactive-reveal{transform:translateX(0);opacity:1}
.generated-card,.generated-pricing{padding:28px}.eyebrow{font-size:9px;letter-spacing:.12em;opacity:.6}.generated h3{margin:10px 0 8px;letter-spacing:-.04em}.generated p{margin:0;color:rgba(255,255,255,.62);line-height:1.5}.text-action{margin-top:18px;border:0;color:white;background:transparent}
.generated-toggle{justify-content:space-between}.toggle-track{width:48px;height:28px;padding:3px;border-radius:999px;background:rgba(255,255,255,.16)}.toggle-track.is-on{background:var(--drop-a)}.toggle-track i{display:block;width:22px;height:22px;margin-left:0;border-radius:50%;background:white;transition:transform .24s cubic-bezier(.2,.8,.2,1)}.toggle-track.is-on i{transform:translateX(20px)}
.generated-input{padding:13px}.generated-input label{display:block;margin:0 3px 10px}.generated-input>div{display:flex;gap:8px}.generated-input input{min-width:0;flex:1;height:42px;padding:0 12px;border:1px solid rgba(255,255,255,.14);border-radius:10px;color:white;background:rgba(0,0,0,.28)}.generated-input button{width:42px;border:1px solid rgba(255,255,255,.14);border-radius:10px;color:white;background:rgba(255,255,255,.1)}
.generated-badge{display:flex;align-items:center;justify-content:center;gap:9px;font-weight:700}.live-dot{width:7px;height:7px;border-radius:50%;background:#b7ffd4;box-shadow:0 0 12px #68ff9f}
.generated-alert{display:grid;grid-template-columns:auto 1fr auto;align-items:center;gap:14px;padding:18px}.generated-alert button,.generated-profile button,.generated-pricing>button{border:1px solid rgba(255,255,255,.16);border-radius:10px;color:white;background:rgba(255,255,255,.1)}
.generated-tabs{display:flex;align-items:center;gap:5px;padding:7px}.generated-tabs button{flex:1;height:100%;border:0;border-radius:999px;color:rgba(255,255,255,.6);background:transparent}.generated-tabs button[aria-selected=true]{color:white;background:rgba(255,255,255,.13)}
.generated-progress{padding:20px}.generated-progress>div{display:flex;align-items:center;justify-content:space-between}.progress-track{height:8px!important;margin-top:14px;border-radius:999px;background:rgba(255,255,255,.12)}.progress-track i{display:block;width:72%;height:100%;border-radius:inherit;background:var(--drop-a);box-shadow:0 0 18px var(--drop-a)}
.generated-profile{display:grid;grid-template-columns:auto 1fr;gap:15px;padding:22px}.generated-profile .avatar{width:58px;height:58px;display:grid;place-items:center;border-radius:50%;background:rgba(255,255,255,.14)}.generated-profile button{grid-column:1/-1;height:38px}
.generated-pricing ul{display:grid;gap:8px;padding:0;list-style:none}.generated-pricing li{display:flex;align-items:center;gap:7px;font-size:12px}.generated-pricing>button{width:100%;height:44px;display:flex;align-items:center;justify-content:center;gap:8px}
.generated-navbar{display:grid;grid-template-columns:auto 1fr auto;align-items:center;gap:18px;padding:0 18px}.generated-navbar a{color:inherit;text-decoration:none}.generated-navbar>div{display:flex;justify-content:center;gap:18px;font-size:12px;color:rgba(255,255,255,.65)}.nav-brand{display:flex;align-items:center;gap:8px;font-weight:800}.generated-navbar>button{height:40px;display:flex;align-items:center;gap:7px;padding:0 13px;border:1px solid rgba(255,255,255,.16);border-radius:10px;color:white;background:rgba(255,255,255,.1)}
.generated-hero{display:flex;flex-direction:column;justify-content:flex-end;padding:34px}.generated-hero h2{max-width:11ch;margin:12px 0 10px;font-size:38px;line-height:.98;letter-spacing:-.04em}.generated-hero p{max-width:48ch}.hero-actions{display:flex;gap:9px;margin-top:24px}.hero-actions button,.dialog-actions button{min-height:44px;padding:0 16px;border:1px solid rgba(255,255,255,.16);border-radius:11px;color:white;background:rgba(255,255,255,.09)}.hero-actions button:first-child,.dialog-actions button:last-child{color:#06101f;background:color-mix(in srgb,var(--drop-a) 62%,white)}
.generated-dialog{display:flex;flex-direction:column;justify-content:center;padding:28px}.generated-dialog p{max-width:42ch}.dialog-actions{display:flex;justify-content:flex-end;gap:9px;margin-top:24px}
.generated-select{display:grid;align-content:center;gap:7px;padding:14px}.generated-select>span{font-size:12px;font-weight:750}.generated-select select{height:42px;padding:0 12px;border:1px solid rgba(255,255,255,.16);border-radius:10px;color:white;background:#0b0f17}.generated-select small,.generated-checkbox small,.generated-stat small{display:block;color:rgba(255,255,255,.56);font-size:11px;line-height:1.4}
.generated-checkbox{display:grid;grid-template-columns:24px 1fr;align-items:center;gap:10px;padding:15px}.generated-checkbox>input{position:absolute;opacity:0}.checkbox-mark{width:22px;height:22px;display:grid;place-items:center;border:1px solid rgba(255,255,255,.22);border-radius:7px;background:var(--drop-a)}.generated-checkbox strong{display:block;margin-bottom:3px;font-size:13px}
.generated-stat{display:flex;flex-direction:column;justify-content:center;padding:24px}.stat-value{display:flex;align-items:flex-end;justify-content:space-between;gap:14px}.generated-stat .stat-value h3{margin:10px 0 5px;font-size:34px}.stat-value strong{margin-bottom:9px;color:color-mix(in srgb,var(--drop-a) 45%,white)}.generated-stat>small{margin-top:14px}
.generated button:focus-visible,.generated input:focus-visible,.generated:focus-visible{outline:3px solid color-mix(in srgb,var(--drop-a) 68%,white);outline-offset:3px}.generated button:disabled,.generated input:disabled{cursor:not-allowed;opacity:.58}.sr-only{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}.spinner{animation:spin .8s linear infinite}@keyframes spin{to{transform:rotate(360deg)}}
@media(prefers-reduced-motion:reduce){.generated,.generated *{scroll-behavior:auto!important;transition-duration:.01ms!important;animation-duration:.01ms!important;animation-iteration-count:1!important}.spinner{animation:none}}@media(prefers-reduced-transparency:reduce){.generated{background:var(--drop-base);backdrop-filter:none}}@media(forced-colors:active){.shader{display:none}.generated{border:1px solid CanvasText;background:Canvas;color:CanvasText;box-shadow:none}}
`

  const componentSource = componentSourceFor(spec)
  const shaderSource = shaderSources[spec.shader]
  const readme = `# Generated ${spec.kind}\n\nPurpose: ${spec.purpose}\n\n## Install\n\n\`\`\`bash\nnpm install @paper-design/shaders-react@0.0.80 lucide-react@1.34.0${usesMagnetic ? ' motion@13.1.1' : ''}\n\`\`\`\n\n## Exact sources\n\n- Component: ${componentSource.name}\n- Component item: ${componentSource.source}\n- Component acquisition: ${componentSource.acquisition}\n- Component license: ${componentSource.license}\n- Shader: Paper / ${shaderSource.name}\n- Shader item: ${shaderSource.source}\n- Shader package: ${shaderSource.acquisition}\n- Shader license: ${shaderSource.license}\n- Generation mode: ${spec.generationMode === 'ai' ? `model-backed structured brief (${spec.model})` : 'curated preset'}\n- Preview, controls, and export resolve from the same validated spec\n\n## Agent integration\n\nImport \`GeneratedComponent\` and pass product copy, state, callbacks, and optional style or icon overrides through \`GeneratedComponentProps\`. Toggle, tabs, progress, form submission, disabled/loading behavior, and reduced motion are implemented in the exported module.\n`

  const files: Record<string, string> = { 'GeneratedComponent.tsx': component, 'generated-component.css': css, 'README.md': readme }
  if (usesMagnetic) files['Magnetic.tsx'] = magnetic
  const dependencies: Record<string, string> = { '@paper-design/shaders-react': '0.0.80', 'lucide-react': '1.34.0' }
  if (usesMagnetic) dependencies.motion = '13.1.1'
  return { files, dependencies }
}

export function componentCode(spec: ComponentSpec) { return sourceBundle(spec).files['GeneratedComponent.tsx'] }

function boardFolderName(spec: ComponentSpec, index: number) {
  const name = spec.kind === 'button' || spec.kind === 'badge' || spec.kind === 'toggle' ? spec.label : spec.title
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 42) || spec.kind
  return `${String(index + 1).padStart(2, '0')}-${spec.kind}-${slug}`
}

export function boardBundle(specs: ComponentSpec[]): SourceBundle {
  const files: Record<string, string> = {}
  const dependencies: Record<string, string> = {}
  const receipts = specs.map((spec, index) => {
    const folder = `components/${boardFolderName(spec, index)}`
    const bundle = sourceBundle(spec)
    for (const [name, contents] of Object.entries(bundle.files)) files[`${folder}/${name}`] = contents
    Object.assign(dependencies, bundle.dependencies)
    const componentSource = componentSourceFor(spec)
    const shaderSource = shaderSources[spec.shader]
    return {
      order: index + 1,
      folder,
      id: spec.id,
      kind: spec.kind,
      name: spec.kind === 'button' || spec.kind === 'badge' || spec.kind === 'toggle' ? spec.label : spec.title,
      purpose: spec.purpose,
      prompt: spec.prompt,
      component: { name: componentSource.name, url: componentSource.source, acquisition: componentSource.acquisition, license: componentSource.license },
      shader: { name: shaderSource.name, url: shaderSource.source, package: shaderSource.acquisition, license: shaderSource.license },
      spec,
    }
  })
  const install = Object.entries(dependencies).map(([name, version]) => `${name}@${version}`).join(' ')
  const list = receipts.map((item) => item.order + '. **' + item.name + '** — `' + item.kind + '` — `' + item.folder + '`').join('\n')
  files['README.md'] = `# Component Generator board\n\nThis bundle contains ${specs.length} editable React UI components from one #0663F2 board.\n\n## Install shared dependencies\n\n\`\`\`bash\nnpm install ${install}\n\`\`\`\n\n## Components\n\n${list}\n\nEach folder contains a production component module, its CSS, setup notes, source URLs, licenses, and any required local support file. The preview and export were produced from the same validated spec.\n\nFor coding-agent handoff, attach this ZIP and point the agent to \`AGENTS.md\` and \`component-generator-board.manifest.json\`.\n`
  files['AGENTS.md'] = `# Component Generator board handoff\n\nIntegrate the requested components from this bundle into the target React project.\n\n- Read \`component-generator-board.manifest.json\` before editing.\n- Components live under \`components/\`; each folder is self-contained.\n- Preserve semantic DOM, keyboard behavior, focus-visible states, reduced-motion handling, and the static shader fallback.\n- Keep \`@paper-design/shaders-react\` pinned to \`0.0.80\`.\n- Preserve the source and license receipt in each component README.\n- Rename \`GeneratedComponent\` to a product-specific name during integration and update imports consistently.\n- Keep the CSS import beside its component unless deliberately migrating the styles into the target design system.\n- Map copy and callbacks through the exported typed props; do not hard-code showcase chrome into the component.\n- Run the target project's typecheck, tests, build, and browser verification after integration.\n\nThe exact #0663F2 house palette may be mapped to equivalent semantic brand tokens only when the target project already defines them.\n`
  files['component-generator-board.manifest.json'] = JSON.stringify({ schemaVersion: 1, brandColor: '#0663F2', componentCount: specs.length, dependencies, components: receipts }, null, 2)
  return { files, dependencies }
}

/* ── Button affordance rule ────────────────────────────────────────────────
   Single source of truth for which icon slots a button may show.

   This exists because the rule was previously spread across JSX and CSS: the
   trailing arrow was rendered unconditionally in ShaderButton, while
   `recipe-foundation` hid the leading slot in a stylesheet. A button with an
   `arrow` icon therefore rendered a leading arrow AND a trailing arrow
   pointing a different direction, reading as two competing actions.

   Keeping the decision here — pure, exported and exhaustively tested — means
   the invariants below hold for every recipe/icon pair, including ones no
   preset happens to produce today.                                          */

export type ButtonAffordance = {
  /** Leading icon actually reaches the screen (some recipes hide the slot). */
  leadingVisible: boolean
  /** Trailing arrow should render. */
  trailing: boolean
}

/** Recipes whose stylesheet hides `.button-leading`, so an icon there is never seen. */
const recipesHidingLeading: ReadonlySet<ComponentRecipe> = new Set<ComponentRecipe>(['foundation'])

/** Icons that already communicate direction, making a trailing arrow redundant. */
const directionalIcons: ReadonlySet<IconName> = new Set<IconName>(['arrow'])

export function resolveButtonAffordance(
  spec: Pick<ComponentSpec, 'iconName' | 'componentRecipe'>,
): ButtonAffordance {
  const leadingVisible = spec.iconName !== 'none' && !recipesHidingLeading.has(spec.componentRecipe)
  // Exactly one directional affordance per button. A visible leading arrow
  // makes the trailing arrow redundant; otherwise the trailing arrow is the
  // button's only forward cue and must stay.
  const trailing = !(leadingVisible && directionalIcons.has(spec.iconName))
  return { leadingVisible, trailing }
}
