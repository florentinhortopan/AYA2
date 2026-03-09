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

  const allSegues = components.every((component) => component.type === 'segue')

  return (
    <div className={allSegues ? 'flex flex-wrap gap-2 mt-3' : 'space-y-3 mt-3'}>
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

const readableButtonClass = (variant?: string) => {
  if (variant === 'outline' || variant === 'ghost') {
    return 'bg-[#fffaf0] text-[#1f1b15] border-[#c3b494] hover:bg-[#f2e8d5] hover:text-[#1f1b15]'
  }
  if (variant === 'secondary') {
    return 'bg-[#e7ddc7] text-[#1f1b15] hover:bg-[#ddd2ba]'
  }
  return 'bg-[#1f3a2c] text-[#f7f2e6] hover:bg-[#173022]'
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
            className={readableButtonClass(buttonProps.variant)}
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
          className={readableButtonClass(buttonProps.variant)}
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
        <Card className="border-[#cfc3a8] bg-[#fffaf0] text-[#1f1b15]">
          {cardProps.title && (
            <CardHeader>
              <CardTitle className="text-[#1f1b15]">{cardProps.title}</CardTitle>
              {cardProps.description && (
                <CardDescription className="text-[#4d4637]">{cardProps.description}</CardDescription>
              )}
            </CardHeader>
          )}
          {cardProps.content && (
            <CardContent>
              <p className="text-sm text-[#1f1b15]">{cardProps.content}</p>
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
                    <p className="text-sm text-[#4d4637]">{item.description}</p>
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
        <Alert variant={alertProps.variant || 'default'} className="border-[#cfc3a8] bg-[#fffaf0] text-[#1f1b15]">
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
              className="border border-[#cfc3a8] bg-[#fffaf0] rounded-lg p-3 text-[#1f1b15]"
              open={item.defaultOpen}
            >
              <summary className="font-medium cursor-pointer">{item.title}</summary>
              <p className="mt-2 text-sm text-[#4d4637]">{item.content}</p>
            </details>
          ))}
        </div>
      )

    case 'table':
      const tableProps = component.props as any
      const rows = tableProps.rows || []
      return (
        <div className="border border-[#cfc3a8] bg-[#fffaf0] text-[#1f1b15] rounded-lg overflow-hidden">
          {tableProps.title && (
            <div className="bg-[#f2e8d5] px-4 py-2 border-b border-[#cfc3a8]">
              <h4 className="font-semibold text-[#1f1b15]">{tableProps.title}</h4>
              {tableProps.description && (
                <p className="text-sm text-[#4d4637]">{tableProps.description}</p>
              )}
            </div>
          )}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-[#f6efdf] border-b border-[#cfc3a8]">
                <tr>
                  {tableProps.headers?.map((header: string, idx: number) => (
                    <th key={idx} className="px-4 py-2 text-left font-semibold text-[#1f1b15]">
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row: any, rowIdx: number) => {
                  const rowData = Array.isArray(row) ? row : tableProps.headers.map((h: string) => row[h] || '')
                  return (
                    <tr key={rowIdx} className={tableProps.variant === 'striped' && rowIdx % 2 === 1 ? 'bg-[#fbf6ea]' : ''}>
                      {rowData.map((cell: any, cellIdx: number) => (
                        <td key={cellIdx} className="px-4 py-2 border-b border-[#e0d6c1] text-[#1f1b15]">
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
            <div className="mb-4">
              <h4 className="font-semibold text-lg text-[#1f1b15]">{timelineProps.title}</h4>
              {timelineProps.description && (
                <p className="text-sm text-[#4d4637] mt-1">{timelineProps.description}</p>
              )}
            </div>
          )}
          <div className="relative">
            {/* Vertical timeline line */}
            <div className="absolute left-3 top-0 bottom-0 w-0.5 bg-[#cfc3a8]" />
            
            <div className="space-y-6">
              {timelineProps.milestones?.map((milestone: any, idx: number) => (
                <div key={idx} className="relative pl-10">
                  {/* Timeline dot */}
                  <div className={`absolute left-1 top-1.5 w-4 h-4 rounded-full border-2 z-10 ${
                    milestone.status === 'completed' ? 'bg-[#1f3a2c] border-[#1f3a2c]' :
                    milestone.status === 'current' ? 'bg-[#1f3a2c] border-[#1f3a2c] animate-pulse' :
                    'bg-[#fffaf0] border-[#cfc3a8]'
                  }`} />
                  
                  {/* Milestone content */}
                  <div className="pb-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h5 className="font-semibold text-base text-[#1f1b15]">{milestone.title}</h5>
                          {milestone.badge && (
                            <Badge variant="outline" className="text-xs">{milestone.badge}</Badge>
                          )}
                        </div>
                        {milestone.date && (
                          <p className="text-xs text-[#4d4637] mt-1">{milestone.date}</p>
                        )}
                        {milestone.description && (
                          <p className="text-sm text-[#4d4637] mt-2 leading-relaxed">{milestone.description}</p>
                        )}
                        {milestone.links && milestone.links.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-3">
                            {milestone.links.map((link: any, linkIdx: number) => (
                              <a
                                key={linkIdx}
                                href={link.href}
                                className="text-xs text-[#1f3a2c] hover:underline flex items-center gap-1 transition-colors"
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
        </div>
      )

    case 'matrix':
      const matrixProps = component.props as any
      return (
        <div className="border border-[#cfc3a8] bg-[#fffaf0] text-[#1f1b15] rounded-lg overflow-hidden">
          {matrixProps.title && (
            <div className="bg-[#f2e8d5] px-4 py-2 border-b border-[#cfc3a8]">
              <h4 className="font-semibold text-[#1f1b15]">{matrixProps.title}</h4>
              {matrixProps.description && (
                <p className="text-sm text-[#4d4637]">{matrixProps.description}</p>
              )}
            </div>
          )}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              {matrixProps.columns && (
                <thead className="bg-[#f6efdf] border-b border-[#cfc3a8]">
                  <tr>
                    <th className="px-4 py-2 text-left font-semibold"></th>
                    {matrixProps.columns.map((col: string, idx: number) => (
                      <th key={idx} className="px-4 py-2 text-left font-semibold text-[#1f1b15]">
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
              )}
              <tbody>
                {matrixProps.rows?.map((row: any, rowIdx: number) => (
                  <tr key={rowIdx} className={rowIdx % 2 === 1 ? 'bg-[#fbf6ea]' : ''}>
                    <td className="px-4 py-2 font-semibold border-r border-[#e0d6c1] text-[#1f1b15]">{row.label}</td>
                    {row.values.map((value: any, colIdx: number) => {
                      const cellValue = typeof value === 'object' ? value.value : value
                      const isHighlighted = typeof value === 'object' ? value.highlight : false
                      return (
                        <td
                          key={colIdx}
                          className={`px-4 py-2 text-[#1f1b15] ${isHighlighted ? 'bg-[#efe3c8] font-semibold' : ''}`}
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
      if (segueProps.special) {
        const isLoading = actionLoading === segueProps.action
        return (
          <button
            type="button"
            className="w-full text-left border border-[#9fb0a1] bg-[#eef5ef] rounded-xl p-3 hover:bg-[#e3eee4] transition-colors"
            onClick={() => onAction?.(segueProps.action, { ...segueProps, type: 'segue' })}
            disabled={isLoading}
          >
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-semibold text-[#1f3a2c]">
                {segueProps.specialTitle || segueProps.label}
              </p>
              {segueProps.specialBadge ? (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#1f3a2c] text-[#f7f2e6]">
                  {segueProps.specialBadge}
                </span>
              ) : null}
            </div>
            <p className="text-xs text-[#4d4637] mt-1">
              {segueProps.specialDescription || 'Personalized help from a local recruiter.'}
            </p>
            <p className="text-xs text-[#1f3a2c] mt-2 underline underline-offset-2">
              {isLoading ? 'Processing...' : segueProps.label}
            </p>
          </button>
        )
      }
      return (
        <Button
          variant={segueProps.variant || 'outline'}
          className={`inline-flex w-auto max-w-full rounded-full px-3 py-1.5 h-auto text-xs leading-tight whitespace-normal break-words border ${readableButtonClass(segueProps.variant)}`}
          onClick={() => onAction?.(segueProps.action, { ...segueProps, type: 'segue' })}
          disabled={actionLoading === segueProps.action}
        >
          {actionLoading === segueProps.action ? 'Processing...' : segueProps.label}
        </Button>
      )

    case 'custom':
      const customProps = component.props as any
      return (
        <Card className="border-dashed">
          <CardHeader>
            <CardTitle className="text-base">{customProps.title || customProps.componentName || 'Custom Component'}</CardTitle>
            {customProps.description && (
              <CardDescription>{customProps.description}</CardDescription>
            )}
          </CardHeader>
          <CardContent>
            {customProps.data ? (
              <pre className="text-xs whitespace-pre-wrap break-words bg-muted/40 rounded-md p-2">
                {JSON.stringify(customProps.data, null, 2)}
              </pre>
            ) : (
              <p className="text-sm text-muted-foreground">
                This is a custom-rendered component placeholder.
              </p>
            )}
          </CardContent>
        </Card>
      )

    default:
      return null
  }
}

