import { useEffect, useRef, useState } from 'react'
import { Tooltip } from '@/components/ui/tooltip'

interface TruncatedTextProps {
  text: string;
  className?: string;
}

/**
 * Texto de una linea que se corta con puntos suspensivos.
 * El tooltip con el texto completo aparece solo cuando el texto esta cortado.
 */
export function TruncatedText({ text, className }: TruncatedTextProps) {
  const textRef = useRef<HTMLSpanElement>(null)
  const [isTruncated, setIsTruncated] = useState(false)

  useEffect(() => {
    const element = textRef.current
    if (!element) return

    const updateTruncation = () => {
      setIsTruncated(element.scrollWidth > element.clientWidth)
    }

    updateTruncation()

    const observer = new ResizeObserver(updateTruncation)
    observer.observe(element)

    return () => observer.disconnect()
  }, [text])

  return (
    <Tooltip
      className={className}
      content={isTruncated ? <div className="break-words text-xs">{text}</div> : null}
    >
      <span ref={textRef} className="truncate">{text}</span>
    </Tooltip>
  )
}
