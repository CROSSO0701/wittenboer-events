import type { ElementType, ReactNode } from 'react'

type Props = {
  text: string
  as?: ElementType
  className?: string
  delay?: number
  perWordDelay?: number
  children?: ReactNode
}

export default function SplitText({
  text,
  as: Tag = 'span',
  className,
  perWordDelay = 0.05,
}: Props) {
  const words = text.split(' ')
  return (
    <Tag className={className}>
      <span className="split-line">
        {words.map((w, i) => (
          <span
            key={`${w}-${i}`}
            className="split-word"
            style={{ transitionDelay: `${i * perWordDelay}s` }}
          >
            {w}
            {i < words.length - 1 ? ' ' : ''}
          </span>
        ))}
      </span>
    </Tag>
  )
}
