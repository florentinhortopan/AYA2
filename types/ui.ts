// UI Component Types for Rich Agent Responses

export type UIComponentType = 
  | 'text'
  | 'button'
  | 'card'
  | 'list'
  | 'accordion'
  | 'badge'
  | 'alert'
  | 'form'
  | 'table'
  | 'timeline'
  | 'matrix'
  | 'segue'

export interface UIComponent {
  type: UIComponentType
  id?: string
  props?: Record<string, unknown>
}

export interface TextComponent extends UIComponent {
  type: 'text'
  props: {
    content: string
    variant?: 'default' | 'muted' | 'primary' | 'destructive'
    size?: 'sm' | 'md' | 'lg' | 'xl'
  }
}

export interface ButtonComponent extends UIComponent {
  type: 'button'
  props: {
    label: string
    action: string // Action identifier (e.g., 'explore_career_path', 'save_preference')
    variant?: 'default' | 'outline' | 'secondary' | 'ghost' | 'destructive'
    size?: 'default' | 'sm' | 'lg' | 'icon'
    href?: string // Optional link
    onClick?: string // Optional action handler
  }
}

export interface CardComponent extends UIComponent {
  type: 'card'
  props: {
    title: string
    description?: string
    content?: string
    footer?: UIComponent[]
    variant?: 'default' | 'outline' | 'elevated'
  }
}

export interface ListComponent extends UIComponent {
  type: 'list'
  props: {
    items: Array<{
      title: string
      description?: string
      icon?: string
      action?: string
    }>
    variant?: 'default' | 'numbered' | 'bulleted'
  }
}

export interface BadgeComponent extends UIComponent {
  type: 'badge'
  props: {
    label: string
    variant?: 'default' | 'secondary' | 'destructive' | 'outline'
  }
}

export interface AlertComponent extends UIComponent {
  type: 'alert'
  props: {
    title?: string
    message: string
    variant?: 'default' | 'destructive' | 'warning' | 'info'
  }
}

export interface AccordionComponent extends UIComponent {
  type: 'accordion'
  props: {
    items: Array<{
      title: string
      content: string
      defaultOpen?: boolean
    }>
  }
}

export interface TableComponent extends UIComponent {
  type: 'table'
  props: {
    title?: string
    description?: string
    headers: string[]
    rows: Array<string[] | { [key: string]: string | number }>
    variant?: 'default' | 'striped' | 'bordered'
  }
}

export interface TimelineComponent extends UIComponent {
  type: 'timeline'
  props: {
    title?: string
    description?: string
    milestones: Array<{
      title: string
      description?: string
      date?: string
      status?: 'completed' | 'current' | 'upcoming'
      links?: Array<{
        label: string
        href: string
        type?: 'resource' | 'application' | 'info'
      }>
      badge?: string
    }>
    orientation?: 'vertical' | 'horizontal'
  }
}

export interface MatrixComponent extends UIComponent {
  type: 'matrix'
  props: {
    title?: string
    description?: string
    rows: Array<{
      label: string
      values: Array<string | number | { value: string | number; highlight?: boolean }>
    }>
    columns?: string[]
    highlightPattern?: 'row' | 'column' | 'cell'
  }
}

export interface SegueComponent extends UIComponent {
  type: 'segue'
  props: {
    label: string
    action: string
    sentiment?: 'positive' | 'neutral' | 'exploratory' | 'informative'
    context?: string // What prompted this segue
    variant?: 'default' | 'outline' | 'ghost'
  }
}

export type AnyUIComponent = 
  | TextComponent
  | ButtonComponent
  | CardComponent
  | ListComponent
  | BadgeComponent
  | AlertComponent
  | AccordionComponent
  | TableComponent
  | TimelineComponent
  | MatrixComponent
  | SegueComponent

export interface RichAgentResponse {
  text: string // Main text response
  components?: AnyUIComponent[] // UI components to render
  segues?: SegueComponent[] // Context-aware segue buttons based on sentiment/previous inputs
  metadata?: {
    type?: string
    suggestedActions?: string[]
    sentiment?: 'positive' | 'neutral' | 'exploratory' | 'informative' | 'curious'
    context?: Record<string, unknown>
    data?: Record<string, unknown>
  }
}

