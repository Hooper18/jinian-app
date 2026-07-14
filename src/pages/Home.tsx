import { Link } from 'react-router-dom'
import { Plus, Bell, Settings } from 'lucide-react'
import { useOccasions } from '../hooks/useOccasions'
import { computeOccasion, KIND_PREFIX, type OccasionState } from '../lib/occasion'
import { parseCivilDate, todayCivil } from '../lib/civilDate'
import Cover from '../components/Cover'
import type { OccasionRow } from '../types/occasion'

function stateFor(row: OccasionRow): OccasionState {
  const today = todayCivil()
  return computeOccasion(
    {
      kind: row.kind,
      date: parseCivilDate(row.date),
      lunar: row.lunar
        ? { lunarMonth: row.lunar_month!, lunarDay: row.lunar_day!, isLeap: row.lunar_is_leap }
        : null,
      leapFallback: row.leap_fallback,
    },
    today,
  )
}

/** 未来 25 年窗口内无对应发生日（如极罕见闰月纪念日）时，daysBetween 为 +Infinity、nextDate 为 null。 */
function isUnresolved(state: OccasionState): boolean {
  return state.nextDate === null && !Number.isFinite(state.daysBetween)
}

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

/** 排序键：无对应的日子非有限，统一归为「最大」以确保稳定地排在最后，避免 NaN 比较。 */
function sortKey(state: OccasionState): number {
  return Number.isFinite(state.daysBetween) ? state.daysBetween : Number.MAX_SAFE_INTEGER
}

export default function Home() {
  const { occasions, loading } = useOccasions()

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

  const active = occasions.filter((o) => {
    if (o.kind !== 'until') return true
    return stateFor(o).daysBetween >= 0
  })
  const archived = occasions.filter((o) => o.kind === 'until' && stateFor(o).daysBetween < 0)

  const sorted = [...active].sort((a, b) => sortKey(stateFor(a)) - sortKey(stateFor(b)))

  const [hero, ...rest] = sorted

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
              const state = stateFor(hero)
              const numberColor = hero.cover_path ? '#FFFFFF' : 'var(--accent)'
              const unitColor = hero.cover_path ? 'rgba(255,255,255,0.85)' : 'var(--text-secondary)'
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

      <div className="space-y-2">
        {rest.map((o) => (
          <Link
            key={o.id}
            to={`/occasion/${o.id}`}
            className="flex items-center justify-between rounded-xl px-4 py-3"
            style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}
          >
            <span className="flex min-w-0 items-center gap-3">
              <Cover occasion={o} variant="thumb" />
              <span data-testid="occasion-title" className="truncate text-sm" style={{ color: 'var(--text-primary)' }}>
                {o.title}
              </span>
            </span>
            <DaysCell row={o} state={stateFor(o)} />
          </Link>
        ))}
      </div>

      {archived.length > 0 && (
        <div className="mt-8">
          <p className="mb-2 text-xs uppercase" style={{ color: 'var(--text-tertiary)' }}>
            回忆
          </p>
          <div className="space-y-2">
            {archived.map((o) => (
              <Link
                key={o.id}
                to={`/occasion/${o.id}`}
                className="flex items-center justify-between rounded-xl px-4 py-3 opacity-70"
                style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}
              >
                <span className="flex min-w-0 items-center gap-3">
                  <Cover occasion={o} variant="thumb" />
                  <span data-testid="occasion-title" className="truncate" style={{ color: 'var(--text-primary)' }}>
                    {o.title}
                  </span>
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
