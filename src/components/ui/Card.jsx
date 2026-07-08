import { clsx } from 'clsx'

export const Card = ({
  children,
  className,
  padding = 'md',
  shadow = 'sm',
  ...props
}) => {
  const paddings = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  }

  const shadows = {
    none: '',
    sm: 'shadow-sm',
    md: 'shadow-md',
    lg: 'shadow-lg',
  }

  return (
    <div
      className={clsx(
        'bg-white rounded-xl border border-gray-200',
        paddings[padding],
        shadows[shadow],
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

const CardHeader = ({ children, className }) => (
  <div className={clsx('mb-4', className)}>{children}</div>
)

const CardTitle = ({ children, className }) => (
  <h3 className={clsx('text-lg font-semibold text-gray-900', className)}>{children}</h3>
)

const CardDescription = ({ children, className }) => (
  <p className={clsx('text-sm text-gray-500 mt-1', className)}>{children}</p>
)

const CardContent = ({ children, className }) => (
  <div className={className}>{children}</div>
)

const CardFooter = ({ children, className }) => (
  <div className={clsx('mt-4 pt-4 border-t border-gray-100', className)}>{children}</div>
)

Card.Header = CardHeader
Card.Title = CardTitle
Card.Description = CardDescription
Card.Content = CardContent
Card.Footer = CardFooter
