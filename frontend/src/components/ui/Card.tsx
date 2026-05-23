import React from 'react'
import { Card as AntCard } from 'antd'
import type { CardProps as AntCardProps } from 'antd'
import '../../styles/design-tokens.css'

export type CardProps = AntCardProps & { className?: string; header?: React.ReactNode; footer?: React.ReactNode }

export const Card: React.FC<CardProps> = ({ className = '', children, header, footer, bordered = false, ...rest }) => {
  const classes = ['dna-card']
  if (className) classes.push(className)
  return (
    <AntCard className={classes.join(' ')} bordered={bordered} {...rest}>
      {header && <div className="card-header">{header}</div>}
      {children}
      {footer && <div className="card-footer">{footer}</div>}
    </AntCard>
  )
}

export default Card
