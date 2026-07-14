import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Bell, Settings, ChevronDown, ChevronUp } from 'lucide-react'
import { useOccasions } from '../hooks/useOccasions'
import { KIND_PREFIX, type OccasionState } from '../lib/occasion'
import { buildHomeSections, stateOf, isUnresolved } from '../lib/homeSections'
import { todayCivil } from '../lib/civilDate'
import { isMemoriesExpanded, setMemoriesExpanded } from '../lib/prefs'
import Cover from '../components/Cover'
import type { OccasionRow } from '../types/occasion'

function DaysCell({ row, state }: { row: OccasionRow; state: OccasionState }) {
  if (isUnresolved(state)) {
    return (
      <span className="shrink-0 text-sm font-medium" style={{ color: 'var(--accent)' }}>
        近年无对应
      </span>
    )
  }
  return (
    <span className="shrink-0 text-sm" style={{ color: 'var(--text-tertiary)' }}>
      {KIND_PREFIX[row.kind]}{' '}
      <span className="font-medium" style={{ color: 'var(--accent)' }}>
        {Math.abs(state.daysBetween)} 天
      </span>
    </span>
  )
}

function SectionCaption({ children }: { children: string }) {
  return (
    <p className="mb-2 text-xs uppercase" style={{ color: 'var(--text-tertiary)' }}>
      {children}
    </p>
  )
}

function OccasionRowLink({ row, state }: { row: OccasionRow; state: OccasionState }) {
  return (
    <Link
      to={`/occasion/${row.id}`}
      className="flex items-center justify-between rounded-xl px-4 py-3"
      style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}
    >
      <span className="flex min-w-0 items-center gap-3">
        <Cover occasion={row} variant="thumb" />
        <span data-testid="occasion-title" className="truncate text-sm" style={{ color: 'var(--text-primary)' }}>
          {row.title}
        </span>
      </span>
      <DaysCell row={row} state={state} />
    </Link>
  )
}

export default function Home() {
  const { occasions, loading } = useOccasions()
  const [memoriesOpen, setMemoriesOpen] = useState(isMemoriesExpanded)

  if (loading) return null

  if (occasions.length === 0) {
    return (
      <div className="relative min-h-screen">
        <Link
          to="/settings"
          aria-label="设置"
          className="absolute right-4 top-6"
          style={{ color: 'var(--text-secondary)' }}
        >
          <Settings size={19} />
        </Link>
        <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
          <p style={{ color: 'var(--text-secondary)' }}>记下第一个重要的日子</p>
          <Link
            to="/new"
            className="rounded-xl px-5 py-2.5 text-sm font-medium text-white"
            style={{ background: 'var(--accent)' }}
          >
            新建
          </Link>
        </div>
      </div>
    )
  }

  const today = todayCivil()
  const { hero, heroIsToday, upcoming, companions, memories } = buildHomeSections(occasions, today)
  const bothSections = upcoming.length > 0 && companions.length > 0

  const toggleMemories = () => {
    setMemoriesOpen((prev) => {
      setMemoriesExpanded(!prev)
      return !prev
    })
  }

  return (
    <div className="mx-auto max-w-md px-4 py-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-lg font-medium" style={{ color: 'var(--text-primary)' }}>
          纪念
        </h1>
        <div className="flex items-center gap-4">
          <Link to="/settings" aria-label="设置" style={{ color: 'var(--text-secondary)' }}>
            <Settings size={19} />
          </Link>
          <Link to="/notification-guide" aria-label="提醒设置" style={{ color: 'var(--text-secondary)' }}>
            <Bell size={19} />
          </Link>
          <Link to="/new" aria-label="新建" style={{ color: 'var(--accent)' }}>
            <Plus size={22} />
          </Link>
        </div>
      </div>

      {hero && (
        <Link
          to={`/occasion/${hero.id}`}
          className="relative mb-6 block min-h-[168px] overflow-hidden rounded-2xl p-5"
          style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}
        >
          {hero.cover_path && <Cover occasion={hero} variant="hero" />}
          <div className="relative flex h-full flex-col justify-end">
            <p
              data-testid="occasion-title"
              className="text-base font-medium"
              style={{ color: hero.cover_path ? '#FFFFFF' : 'var(--text-primary)' }}
            >
              {hero.title}
            </p>
            {(() => {
              const state = stateOf(hero, today)
              const numberColor = hero.cover_path ? '#FFFFFF' : 'var(--accent)'
              const unitColor = hero.cover_path ? 'rgba(255,255,255,0.85)' : 'var(--text-secondary)'
              if (heroIsToday) {
                return (
                  <p className="mt-1 text-3xl font-semibold" style={{ color: numberColor }}>
                    就是今天
                  </p>
                )
              }
              if (isUnresolved(state)) {
                return (
                  <p className="mt-1 text-xl font-semibold" style={{ color: numberColor }}>
                    近年无对应
                  </p>
                )
              }
              return (
                <p className="mt-1 text-3xl font-semibold" style={{ color: numberColor }}>
                  <span className="mr-1.5 text-sm font-normal" style={{ color: unitColor }}>
                    {KIND_PREFIX[hero.kind]}
                  </span>
                  {Math.abs(state.daysBetween)}
                  <span className="ml-1 text-sm font-normal" style={{ color: unitColor }}>
                    天
                  </span>
                </p>
              )
            })()}
          </div>
        </Link>
      )}

      {upcoming.length > 0 && (
        <div className="mt-6">
          {bothSections && <SectionCaption>将至</SectionCaption>}
          <div className="space-y-2">
            {upcoming.map((o) => (
              <OccasionRowLink key={o.id} row={o} state={stateOf(o, today)} />
            ))}
          </div>
        </div>
      )}

      {companions.length > 0 && (
        <div className="mt-8">
          {bothSections && <SectionCaption>陪伴</SectionCaption>}
          <div className="space-y-2">
            {companions.map((o) => (
              <OccasionRowLink key={o.id} row={o} state={stateOf(o, today)} />
            ))}
          </div>
        </div>
      )}

      {memories.length > 0 && (
        <div className="mt-8">
          <button
            type="button"
            onClick={toggleMemories}
            className="mb-2 flex items-center gap-1 text-xs uppercase"
            style={{ color: 'var(--text-tertiary)' }}
          >
            回忆 · {memories.length}
            {memoriesOpen ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          </button>
          {memoriesOpen && (
            <div className="space-y-2">
              {memories.map((o) => {
                const state = stateOf(o, today)
                return (
                  <Link
                    key={o.id}
                    to={`/occasion/${o.id}`}
                    className="flex items-center justify-between rounded-xl px-4 py-3 opacity-70"
                    style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}
                  >
                    <span className="flex min-w-0 items-center gap-3">
                      <Cover occasion={o} variant="thumb" />
                      <span data-testid="occasion-title" className="truncate text-sm" style={{ color: 'var(--text-primary)' }}>
                        {o.title}
                      </span>
                    </span>
                    <span className="shrink-0 text-sm" style={{ color: 'var(--text-tertiary)' }}>
                      已过 {Math.abs(state.daysBetween)} 天
                    </span>
                  </Link>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
