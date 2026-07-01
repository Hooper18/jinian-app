import { useEffect, useState } from 'react'
import { getCoverSignedUrl } from '../lib/coverStorage'
import type { OccasionRow } from '../types/occasion'

type CoverOccasion = Pick<OccasionRow, 'id' | 'cover_path' | 'updated_at' | 'title'>

interface CoverProps {
  occasion: CoverOccasion
  variant: 'hero' | 'thumb' | 'frame'
  className?: string
}

const VARIANT_CLASS: Record<CoverProps['variant'], string> = {
  hero: 'absolute inset-0 h-full w-full rounded-2xl object-cover',
  thumb: 'h-[34px] w-[34px] shrink-0 rounded-full object-cover',
  frame: 'aspect-video w-full rounded-xl object-cover',
}

const PLACEHOLDER_VARIANT_CLASS: Record<CoverProps['variant'], string> = {
  hero: 'absolute inset-0 h-full w-full rounded-2xl',
  thumb: 'h-[34px] w-[34px] shrink-0 rounded-full',
  frame: 'aspect-video w-full rounded-xl',
}

const PLACEHOLDER_TEXT_SIZE: Record<CoverProps['variant'], string> = {
  hero: 'text-3xl',
  thumb: 'text-sm',
  frame: 'text-2xl',
}

function Placeholder({ occasion, variant, className }: CoverProps) {
  const firstChar = occasion.title.trim().charAt(0) || '?'
  return (
    <div
      aria-hidden="true"
      title={occasion.title}
      className={`flex items-center justify-center font-medium ${PLACEHOLDER_VARIANT_CLASS[variant]} ${PLACEHOLDER_TEXT_SIZE[variant]} ${className ?? ''}`}
      style={{ background: 'var(--bg-tertiary)', color: 'var(--text-tertiary)' }}
    >
      {firstChar}
    </div>
  )
}

export default function Cover({ occasion, variant, className }: CoverProps) {
  const [url, setUrl] = useState<string | null>(null)

  useEffect(() => {
    setUrl(null)
    if (!occasion.cover_path) return

    let cancelled = false
    getCoverSignedUrl(occasion.cover_path, occasion.updated_at)
      .then((signedUrl) => {
        if (!cancelled) setUrl(signedUrl)
      })
      .catch(() => {
        if (!cancelled) setUrl(null)
      })

    return () => {
      cancelled = true
    }
  }, [occasion.id, occasion.cover_path, occasion.updated_at])

  if (!occasion.cover_path || !url) {
    return <Placeholder occasion={occasion} variant={variant} className={className} />
  }

  if (variant === 'hero') {
    return (
      <div className={`absolute inset-0 h-full w-full overflow-hidden rounded-2xl ${className ?? ''}`}>
        <img src={url} alt={occasion.title} className="h-full w-full object-cover" />
        <div
          className="absolute inset-0"
          style={{ background: 'linear-gradient(to top, rgba(30,25,22,.55), transparent 60%)' }}
        />
      </div>
    )
  }

  return <img src={url} alt={occasion.title} className={`${VARIANT_CLASS[variant]} ${className ?? ''}`} />
}
