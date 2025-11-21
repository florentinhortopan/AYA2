'use client'

import { AnyUIComponent } from '@/types/ui'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import Link from 'next/link'

interface UIComponentsRendererProps {
  components: AnyUIComponent[]
  onAction?: (action: string, data?: Record<string, unknown>) => void
  actionLoading?: string | null
}

export function UIComponentsRenderer({ components, onAction, actionLoading }: UIComponentsRendererProps) {
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
          actionLoading={actionLoading}
        />
      ))}
    </div>
  )
}

function ComponentRenderer({ 
  component, 
  onAction,
  actionLoading
}: { 
  component: AnyUIComponent
  onAction?: (action: string, data?: Record<string, unknown>) => void
  actionLoading?: string | null
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
      const isActionLoading = actionLoading === buttonProps.action
      
      const ButtonContent = buttonProps.href ? (
        <Link href={buttonProps.href}>
          <Button
            variant={buttonProps.variant || 'default'}
            size={buttonProps.size || 'default'}
            onClick={() => onAction?.(buttonProps.action, buttonProps)}
            disabled={isActionLoading}
          >
            {isActionLoading ? 'Processing...' : buttonProps.label}
          </Button>
        </Link>
      ) : (
        <Button
          variant={buttonProps.variant || 'default'}
          size={buttonProps.size || 'default'}
          onClick={() => onAction?.(buttonProps.action, buttonProps)}
          disabled={isActionLoading}
        >
          {isActionLoading ? 'Processing...' : buttonProps.label}
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

    case 'table':
      const tableProps = component.props as any
      const rows = tableProps.rows || []
      return (
        <div className="border rounded-lg overflow-hidden">
          {tableProps.title && (
            <div className="bg-muted px-4 py-2 border-b">
              <h4 className="font-semibold">{tableProps.title}</h4>
              {tableProps.description && (
                <p className="text-sm text-muted-foreground">{tableProps.description}</p>
              )}
            </div>
          )}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 border-b">
                <tr>
                  {tableProps.headers?.map((header: string, idx: number) => (
                    <th key={idx} className="px-4 py-2 text-left font-semibold">
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row: any, rowIdx: number) => {
                  const rowData = Array.isArray(row) ? row : tableProps.headers.map((h: string) => row[h] || '')
                  return (
                    <tr key={rowIdx} className={tableProps.variant === 'striped' && rowIdx % 2 === 1 ? 'bg-muted/30' : ''}>
                      {rowData.map((cell: any, cellIdx: number) => (
                        <td key={cellIdx} className="px-4 py-2 border-b">
                          {cell}
                        </td>
                      ))}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )

    case 'timeline':
      const timelineProps = component.props as any
      return (
        <div className="space-y-4">
          {timelineProps.title && (
            <div>
              <h4 className="font-semibold text-lg">{timelineProps.title}</h4>
              {timelineProps.description && (
                <p className="text-sm text-muted-foreground">{timelineProps.description}</p>
              )}
            </div>
          )}
          <div className="relative pl-8 space-y-6">
            {timelineProps.milestones?.map((milestone: any, idx: number) => (
              <div key={idx} className="relative">
                {/* Timeline line */}
                {idx < timelineProps.milestones.length - 1 && (
                  <div className="absolute left-2 top-8 bottom-0 w-0.5 bg-border" />
                )}
                {/* Timeline dot */}
                <div className={`absolute left-0 top-1 w-4 h-4 rounded-full border-2 ${
                  milestone.status === 'completed' ? 'bg-primary border-primary' :
                  milestone.status === 'current' ? 'bg-primary border-primary animate-pulse' :
                  'bg-background border-border'
                }`} />
                {/* Milestone content */}
                <div className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h5 className="font-semibold">{milestone.title}</h5>
                        {milestone.badge && (
                          <Badge variant="outline" className="text-xs">{milestone.badge}</Badge>
                        )}
                      </div>
                      {milestone.date && (
                        <p className="text-xs text-muted-foreground mt-1">{milestone.date}</p>
                      )}
                      {milestone.description && (
                        <p className="text-sm text-muted-foreground mt-2">{milestone.description}</p>
                      )}
                      {milestone.links && milestone.links.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-3">
                          {milestone.links.map((link: any, linkIdx: number) => (
                            <a
                              key={linkIdx}
                              href={link.href}
                              className="text-xs text-primary hover:underline flex items-center gap-1"
                            >
                              <span>{link.label}</span>
                              <span>→</span>
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )

    case 'matrix':
      const matrixProps = component.props as any
      return (
        <div className="border rounded-lg overflow-hidden">
          {matrixProps.title && (
            <div className="bg-muted px-4 py-2 border-b">
              <h4 className="font-semibold">{matrixProps.title}</h4>
              {matrixProps.description && (
                <p className="text-sm text-muted-foreground">{matrixProps.description}</p>
              )}
            </div>
          )}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              {matrixProps.columns && (
                <thead className="bg-muted/50 border-b">
                  <tr>
                    <th className="px-4 py-2 text-left font-semibold"></th>
                    {matrixProps.columns.map((col: string, idx: number) => (
                      <th key={idx} className="px-4 py-2 text-left font-semibold">
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
              )}
              <tbody>
                {matrixProps.rows?.map((row: any, rowIdx: number) => (
                  <tr key={rowIdx} className={rowIdx % 2 === 1 ? 'bg-muted/30' : ''}>
                    <td className="px-4 py-2 font-semibold border-r">{row.label}</td>
                    {row.values.map((value: any, colIdx: number) => {
                      const cellValue = typeof value === 'object' ? value.value : value
                      const isHighlighted = typeof value === 'object' ? value.highlight : false
                      return (
                        <td
                          key={colIdx}
                          className={`px-4 py-2 ${isHighlighted ? 'bg-primary/10 font-semibold' : ''}`}
                        >
                          {cellValue}
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )

    case 'segue':
      const segueProps = component.props as any
      return (
        <Button
          variant={segueProps.variant || 'outline'}
          onClick={() => onAction?.(segueProps.action, { ...segueProps, type: 'segue' })}
          disabled={actionLoading === segueProps.action}
          className="w-full"
        >
          {actionLoading === segueProps.action ? 'Processing...' : segueProps.label}
        </Button>
      )

    default:
      return null
  }
}

