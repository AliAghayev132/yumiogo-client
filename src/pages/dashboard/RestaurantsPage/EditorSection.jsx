import { Card } from '@components'

/** Editor card: title (+ description) over a full-width divider, then the fields (16px gaps). */
export const EditorSection = ({ title, description, actions, children, className }) => (
  <Card padding="chart" className={className}>
    <Card.Header divider actions={actions} className="-mx-[18px] px-[18px]">
      <Card.Title>{title}</Card.Title>
      {description && <p className="mt-0.5 font-chart text-xs text-ink-muted">{description}</p>}
    </Card.Header>
    <div className="flex flex-col gap-4">{children}</div>
  </Card>
)
