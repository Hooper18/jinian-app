import { useParams, useNavigate, Link } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'
import { useOccasions } from '../hooks/useOccasions'
import { computeOccasion, expandMilestones } from '../lib/occasion'
import { parseCivilDate, todayCivil, formatCivilDate } from '../lib/civilDate'
import Cover from '../components/Cover'

const KIND_LABEL = { anniversary: '每年循环', since: '累加计天', until: '倒数到某天' } as const

export default function OccasionDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { occasions, deleteOccasion } = useOccasions()
  const row = occasions.find((o) => o.id === id)

  if (!row) return null

  const handleDelete = async () => {
    if (!window.confirm('删除这个日子？')) return
    await deleteOccasion(row.id)
    navigate('/')
  }

  const today = todayCivil()
  const anchor = parseCivilDate(row.date)
  const state = computeOccasion(
    {
      kind: row.kind,
      date: anchor,
      lunar: row.lunar
        ? { lunarMonth: row.lunar_month!, lunarDay: row.lunar_day!, isLeap: row.lunar_is_leap }
        : null,
      leapFallback: row.leap_fallback,
    },
    today,
  )

  const milestones = row.kind === 'since' ? expandMilestones(anchor, row.milestones, today) : []
  const nextMilestone = milestones.find((m) => m.isNext)

  return (
    <div className="mx-auto max-w-md px-4 py-6">
      <div className="mb-4 flex items-center justify-between">
        <Link to="/" aria-label="返回" style={{ color: 'var(--text-secondary)' }}>
          <ChevronLeft size={20} />
        </Link>
        <div className="flex items-center gap-4 text-sm">
          <Link to={`/occasion/${row.id}/edit`} style={{ color: 'var(--text-secondary)' }}>
            编辑
          </Link>
          <button
            type="button"
            onClick={handleDelete}
            style={{ color: 'var(--text-secondary)' }}
          >
            删除
          </button>
        </div>
      </div>

      <Cover occasion={row} variant="frame" className="mb-4" />

      <div className="text-center">
        <h1 className="text-lg font-medium" style={{ color: 'var(--text-primary)' }}>
          {row.title}
        </h1>
        <p className="mt-1 text-xs" style={{ color: 'var(--text-tertiary)' }}>
          {formatCivilDate(anchor)}
        </p>
      </div>

      <p className="mt-4 text-center text-sm" style={{ color: 'var(--text-secondary)' }}>
        {state.nextDate === null && !Number.isFinite(state.daysBetween) && row.kind !== 'since' ? (
          <span className="text-2xl font-semibold" style={{ color: 'var(--accent)' }}>
            近年无对应
          </span>
        ) : (
          <>
            {row.kind === 'since' ? '已经' : row.kind === 'until' ? '还有' : '距下次'}{' '}
            <span className="text-2xl font-semibold" style={{ color: 'var(--accent)' }}>
              {Math.abs(state.daysBetween)}
            </span>{' '}
            天
          </>
        )}
      </p>

      {row.kind === 'since' && (
        <div
          data-testid="milestone-section"
          className="mt-4 rounded-xl p-4"
          style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}
        >
          {nextMilestone && (
            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
              下一个里程碑：{nextMilestone.label}
            </p>
          )}
        </div>
      )}

      {row.note && (
        <p
          className="mt-4 border-t pt-4 text-sm leading-7"
          style={{ borderColor: 'var(--border)', color: 'var(--text-primary)' }}
        >
          {row.note}
        </p>
      )}

      <div className="mt-4 space-y-1 text-xs" style={{ color: 'var(--text-secondary)' }}>
        <p>类型：{KIND_LABEL[row.kind]}</p>
        <p>日历：{row.lunar ? `农历 ${row.lunar_month}月${row.lunar_day}日` : '公历'}</p>
        <p>提醒：{row.remind_days.includes(0) ? '当天' : ''}{row.remind_days.filter((d) => d > 0).map((d) => ` 提前${d}天`).join('')}</p>
      </div>
    </div>
  )
}
