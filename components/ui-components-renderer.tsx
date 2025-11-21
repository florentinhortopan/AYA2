'use client'

import { AnyUIComponent } from '@/types/ui'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/badge'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import Link from 'next/link'

interface UIComponentsRendererProps {
  components: AnyUIComponent[]
  onAction?: (action: string, data?: Record<string, unknown>) => void
}

export function UIComponentsRenderer({ components, onAction }: UIComponentsRendererProps) {
  if (!components || components.length === 0) {
    return null
  }

  return (
    <div className="space-y-3 mt-3">
      {components.map((component, index) => (
        <ComponentRenderer
          key={component.id || index}
          component={component}
          onAction={onAction}
        />
      ))}
    </div>
  )
}

function ComponentRenderer({ 
  component, 
  onAction 
}: { 
  component: AnyUIComponent
  onAction?: (action: string, data?: Record<string, unknown>) => void 
}) {
  switch (component.type) {
    case 'text':
      const textProps = component.props as any
      return (
        <p 
          className={`text-${textProps.size || 'sm'} ${
            textProps.variant === 'muted' ? 'text-muted-foreground' :
            textProps.variant === 'primary' ? 'text-primary' :
            textProps.variant === 'destructive' ? 'text-destructive' :
            'text-foreground'
          }`}
        >
          {textProps.content}
        </p>
      )

    case 'button':
      const buttonProps = component.props as any
      const ButtonContent = buttonProps.href ? (
        <Link href={buttonProps.href}>
          <Button
            variant={buttonProps.variant || 'default'}
            size={buttonProps.size || 'default'}
            onClick={() => onAction?.(buttonProps.action, buttonProps)}
          >
            {buttonProps.label}
          </Button>
        </Link>
      ) : (
        <Button
          variant={buttonProps.variant || 'default'}
          size={buttonProps.size || 'default'}
          onClick={() => onAction?.(buttonProps.action, buttonProps)}
        >
          {buttonProps.label}
        </Button>
      )
      return <div>{ButtonContent}</div>

    case 'card':
      const cardProps = component.props as any
      return (
        <Card>
          {cardProps.title && (
            <CardHeader>
              <CardTitle>{cardProps.title}</CardTitle>
              {cardProps.description && (
                <CardDescription>{cardProps.description}</CardDescription>
              )}
            </CardHeader>
          )}
          {cardProps.content && (
            <CardContent>
              <p className="text-sm">{cardProps.content}</p>
              {cardProps.footer && Array.isArray(cardProps.footer) && (
                <div className="mt-4 flex gap-2">
                  {cardProps.footer.map((footerComponent: any, idx: number) => (
                    <ComponentRenderer
                      key={idx}
                      component={footerComponent}
                      onAction={onAction}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          )}
        </Card>
      )

    case 'list':
      const listProps = component.props as any
      const ListTag = listProps.variant === 'numbered' ? 'ol' : 'ul'
      return (
        <ListTag className={listProps.variant === 'numbered' ? 'list-decimal ml-5' : 'list-disc ml-5'}>
          {listProps.items?.map((item: any, idx: number) => (
            <li key={idx} className="mb-2">
              <div className="flex items-start gap-2">
                {item.icon && <span className="text-lg">{item.icon}</span>}
                <div>
                  <strong>{item.title}</strong>
                  {item.description && (
                    <p className="text-sm text-muted-foreground">{item.description}</p>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ListTag>
      )

    case 'badge':
      const badgeProps = component.props as any
      return (
        <Badge variant={badgeProps.variant || 'default'}>
          {badgeProps.label}
        </Badge>
      )

    case 'alert':
      const alertProps = component.props as any
      return (
        <Alert variant={alertProps.variant || 'default'}>
          {alertProps.title && <AlertTitle>{alertProps.title}</AlertTitle>}
          <AlertDescription>{alertProps.message}</AlertDescription>
        </Alert>
      )

    case 'accordion':
      const accordionProps = component.props as any
      return (
        <div className="space-y-2">
          {accordionProps.items?.map((item: any, idx: number) => (
            <details
              key={idx}
              className="border rounded-lg p-3"
              open={item.defaultOpen}
            >
              <summary className="font-medium cursor-pointer">{item.title}</summary>
              <p className="mt-2 text-sm text-muted-foreground">{item.content}</p>
            </details>
          ))}
        </div>
      )

    default:
      return null
  }
}

