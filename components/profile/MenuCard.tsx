import React from 'react'
import { M } from '@/lib/meridian'
import { card } from '@/lib/ui-helpers'

interface MenuCardProps {
  children: React.ReactNode
}

export function MenuCard({ children }: MenuCardProps) {
  const items = React.Children.toArray(children).filter(Boolean)

  return (
    <div style={{ ...card({ padding: 0, overflow: 'hidden' }), marginBottom: 16 }}>
      {items.map((child, i) => (
        <div key={i}>
          {i > 0 && (
            <div style={{ height: 1, background: '#E8DED6', margin: '0 16px' }} />
          )}
          {child}
        </div>
      ))}
    </div>
  )
}
