import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'
import { useOccasions } from '../hooks/useOccasions'
import { compressImageToJpeg } from '../lib/imageCompress'
import { uploadCover, removeCover } from '../lib/coverStorage'
import CoverCropper from '../components/CoverCropper'
import type { OccasionKind, MilestoneConfig } from '../lib/occasion'
import type { OccasionRow } from '../types/occasion'
import { showToast } from '../lib/toast'
import { todayCivil, formatCivilDate } from '../lib/civilDate'
import { lunarToSolarInYear, nextLunarOccurrence } from '../lib/lunar'

const KIND_OPTIONS: { value: OccasionKind; label: string }[] = [
  { value: 'anniversary', label: '每年循环' },
  { value: 'since', label: '累加计天' },
  { value: 'until', label: '倒数到某天' },
]

const REMIND_OPTIONS: { value: number; label: string }[] = [
  { value: 0, label: '当天' },
  { value: 1, label: '提前1天' },
  { value: 3, label: '提前3天' },
  { value: 7, label: '提前1周' },
]

export default function OccasionForm() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const { occasions, loading } = useOccasions()
  const existing = id ? occasions.find((o) => o.id === id) : undefined

  if (id && !existing) {
    if (loading) {
      return (
        <p className="mx-auto max-w-md px-4 py-6 text-center text-sm" style={{ color: 'var(--text-tertiary)' }}>
          加载中…
        </p>
      )
    }
    navigate('/', { replace: true })
    return null
  }

  return <OccasionFormBody key={existing?.id ?? 'new'} existing={existing} />
}

function OccasionFormBody({ existing }: { existing: OccasionRow | undefined }) {
  const navigate = useNavigate()
  const { createOccasion, updateOccasion } = useOccasions()

  const [kind, setKind] = useState<OccasionKind>(existing?.kind ?? 'anniversary')
  const [title, setTitle] = useState(existing?.title ?? '')
  const [date, setDate] = useState(existing?.date ?? '')
  const [lunar, setLunar] = useState(existing?.lunar ?? false)
  const [lunarMonth, setLunarMonth] = useState(existing?.lunar_month ?? 1)
  const [lunarDay, setLunarDay] = useState(existing?.lunar_day ?? 1)
  const [lunarIsLeap, setLunarIsLeap] = useState(existing?.lunar_is_leap ?? false)
  const [note, setNote] = useState(existing?.note ?? '')
  const [milestones, setMilestones] = useState<MilestoneConfig>(
    existing?.milestones ?? { hundreds: true, thousand: true },
  )
  const [remindDays, setRemindDays] = useState<number[]>(existing?.remind_days ?? [0, 1])
  const [coverFile, setCoverFile] = useState<File | null>(null)
  const [cropSource, setCropSource] = useState<File | null>(null)
  const [coverPreview, setCoverPreview] = useState<string | null>(null)
  const [removeCoverFlag, setRemoveCoverFlag] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!coverFile) return
    const url = URL.createObjectURL(coverFile)
    setCoverPreview(url)
    return () => URL.revokeObjectURL(url)
  }, [coverFile])

  const handleKindChange = (next: OccasionKind) => {
    setKind(next)
    if (next !== 'anniversary') setLunar(false)
  }

  const toggleRemindDay = (value: number) => {
    setRemindDays((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value].sort((a, b) => a - b),
    )
  }

  const lunarActive = kind === 'anniversary' && lunar

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      let coverPath = existing?.cover_path ?? null

      const baseFields = lunarActive
        ? {
            kind,
            title,
            date: (() => {
              const next = nextLunarOccurrence({ lunarMonth, lunarDay, isLeap: lunarIsLeap }, todayCivil())
              return next ? formatCivilDate(next) : formatCivilDate(todayCivil())
            })(),
            lunar: true,
            lunar_month: lunarMonth,
            lunar_day: lunarDay,
            lunar_is_leap: lunarIsLeap,
            note,
            milestones,
            remind_days: remindDays,
          }
        : {
            kind,
            title,
            date,
            lunar: false,
            lunar_month: null,
            lunar_day: null,
            lunar_is_leap: false,
            note,
            milestones,
            remind_days: remindDays,
          }

      const saved = existing
        ? await updateOccasion(existing.id, baseFields)
        : await createOccasion(baseFields)

      if (coverFile) {
        const compressed = await compressImageToJpeg(coverFile)
        coverPath = await uploadCover(saved.user_id, saved.id, compressed)
        await updateOccasion(saved.id, { cover_path: coverPath })
      } else if (removeCoverFlag && existing?.cover_path) {
        await removeCover(existing.cover_path)
        await updateOccasion(saved.id, { cover_path: null })
      }

      navigate(`/occasion/${saved.id}`)
    } catch (err) {
      showToast(err instanceof Error ? err.message : '保存失败，请重试', { durationMs: 6000 })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-md px-4 py-6">
      <div className="mb-6 flex items-center">
        <button
          type="button"
          onClick={() => navigate(-1)}
          aria-label="返回"
          style={{ color: 'var(--text-secondary)' }}
        >
          <ChevronLeft size={22} />
        </button>
        <h1 className="ml-1 text-lg font-medium" style={{ color: 'var(--text-primary)' }}>
          {existing ? '编辑' : '新建'}
        </h1>
      </div>

      <div className="mb-6">
        <div
          className={`overflow-hidden rounded-xl text-sm ${coverPreview ? 'aspect-video' : 'h-20 border-2 border-dashed'}`}
          style={{ borderColor: 'var(--border)', color: 'var(--text-tertiary)' }}
        >
          <label className="flex h-full w-full cursor-pointer items-center justify-center">
            {coverPreview ? (
              <img src={coverPreview} alt="封面预览" className="h-full w-full object-cover" />
            ) : (
              '＋ 添加封面照片'
            )}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0]
                if (f) setCropSource(f)
                // 清掉 value，取消裁切后重选同一张图也能再触发 change
                e.target.value = ''
              }}
            />
          </label>
        </div>
        {cropSource && (
          <CoverCropper
            file={cropSource}
            onConfirm={(blob) => {
              setCoverFile(new File([blob], 'cover.jpg', { type: 'image/jpeg' }))
              setRemoveCoverFlag(false)
              setCropSource(null)
            }}
            onCancel={() => setCropSource(null)}
          />
        )}
        {coverPreview && (
          <p className="mt-2 text-xs" style={{ color: 'var(--text-tertiary)' }}>
            点图片可更换
          </p>
        )}
        {existing?.cover_path && !removeCoverFlag && (
          <button
            type="button"
            onClick={() => setRemoveCoverFlag(true)}
            className="mt-2 text-xs"
            style={{ color: 'var(--text-secondary)' }}
          >
            移除封面
          </button>
        )}
      </div>

      <label htmlFor="title" className="mb-1 block text-xs uppercase" style={{ color: 'var(--text-tertiary)' }}>
        名字
      </label>
      <input
        id="title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        required
        className="mb-4 w-full rounded-xl border px-3 py-2 text-sm"
        style={{ borderColor: 'var(--border)' }}
      />

      <p className="mb-1 text-xs uppercase" style={{ color: 'var(--text-tertiary)' }}>
        类型
      </p>
      <div className="mb-4 flex gap-1 rounded-xl p-1" style={{ background: 'var(--bg-tertiary)' }}>
        {KIND_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            aria-pressed={kind === opt.value}
            onClick={() => handleKindChange(opt.value)}
            className="flex-1 rounded-lg px-2 py-1.5 text-xs"
            style={
              kind === opt.value
                ? { background: 'var(--bg-secondary)', color: 'var(--accent)', fontWeight: 600 }
                : { color: 'var(--text-secondary)' }
            }
          >
            {opt.label}
          </button>
        ))}
      </div>

      <div className="mb-4 flex items-center justify-between rounded-xl border px-3 py-2" style={{ borderColor: 'var(--border)' }}>
        {!lunarActive && (
          <>
            <label htmlFor="date" className="sr-only">
              日期
            </label>
            <input
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
              className="text-sm"
            />
          </>
        )}
        <label className="flex items-center gap-2 text-xs" style={{ color: 'var(--text-secondary)' }}>
          农历
          <input
            type="checkbox"
            aria-label="农历"
            checked={lunar}
            disabled={kind !== 'anniversary'}
            onChange={(e) => setLunar(e.target.checked)}
          />
        </label>
      </div>

      {lunarActive && (
        <div className="mb-4 rounded-xl border px-3 py-2" style={{ borderColor: 'var(--border)' }}>
          <div className="mb-2 flex items-center gap-2">
            <label htmlFor="lunar-month" className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
              农历月
            </label>
            <input
              id="lunar-month"
              type="number"
              aria-label="农历月"
              min={1}
              max={12}
              value={lunarMonth}
              onChange={(e) => setLunarMonth(Number(e.target.value))}
              required
              className="w-16 rounded-lg border px-2 py-1 text-sm"
              style={{ borderColor: 'var(--border)' }}
            />
            <label htmlFor="lunar-day" className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
              农历日
            </label>
            <input
              id="lunar-day"
              type="number"
              aria-label="农历日"
              min={1}
              max={30}
              value={lunarDay}
              onChange={(e) => setLunarDay(Number(e.target.value))}
              required
              className="w-16 rounded-lg border px-2 py-1 text-sm"
              style={{ borderColor: 'var(--border)' }}
            />
            <label className="flex items-center gap-1 text-xs" style={{ color: 'var(--text-secondary)' }}>
              闰月
              <input
                type="checkbox"
                aria-label="闰月"
                checked={lunarIsLeap}
                onChange={(e) => setLunarIsLeap(e.target.checked)}
              />
            </label>
          </div>
          <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
            {(() => {
              const hits = lunarToSolarInYear({ lunarMonth, lunarDay, isLeap: lunarIsLeap }, todayCivil().y)
              const hit = hits[0]
              return hit
                ? `农历${lunarMonth}月${lunarDay}日 · 今年对应公历 ${formatCivilDate(hit)}`
                : `农历${lunarMonth}月${lunarDay}日 · 近年无对应`
            })()}
          </p>
        </div>
      )}

      {kind === 'since' && (
        <div
          data-testid="milestone-section"
          className="mb-4 rounded-xl border p-3"
          style={{ borderColor: 'var(--accent)', background: 'var(--accent-tint)' }}
        >
          <p className="mb-2 text-xs font-medium" style={{ color: 'var(--accent)' }}>
            里程碑纪念
          </p>
          <div className="flex flex-wrap gap-2">
            {(['hundreds', 'thousand', 'monthly', 'romantic'] as const).map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => setMilestones((m) => ({ ...m, [key]: !m[key] }))}
                className="rounded-full border px-3 py-1 text-xs"
                style={
                  milestones[key]
                    ? { background: 'var(--accent)', color: 'white', borderColor: 'var(--accent)' }
                    : { borderColor: 'var(--border)', color: 'var(--text-secondary)' }
                }
              >
                {key === 'hundreds' ? '每 100 天' : key === 'thousand' ? '千日' : key === 'monthly' ? '每满一个月' : '520/1314'}
              </button>
            ))}
          </div>
        </div>
      )}

      <p className="mb-2 text-xs font-medium" style={{ color: 'var(--text-tertiary)' }}>
        提醒
      </p>
      <div className="mb-4 flex flex-wrap gap-2">
        {REMIND_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            aria-pressed={remindDays.includes(opt.value)}
            onClick={() => toggleRemindDay(opt.value)}
            className="rounded-full border px-3 py-1 text-xs"
            style={
              remindDays.includes(opt.value)
                ? { background: 'var(--accent)', color: 'white', borderColor: 'var(--accent)' }
                : { borderColor: 'var(--border)', color: 'var(--text-secondary)' }
            }
          >
            {opt.label}
          </button>
        ))}
      </div>

      <label htmlFor="note" className="mb-1 block text-xs uppercase" style={{ color: 'var(--text-tertiary)' }}>
        写点什么
      </label>
      <textarea
        id="note"
        value={note}
        onChange={(e) => setNote(e.target.value)}
        rows={3}
        className="mb-6 w-full rounded-xl border px-3 py-2 text-sm"
        style={{ borderColor: 'var(--border)' }}
      />

      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-xl px-4 py-2.5 text-sm font-medium text-white disabled:opacity-60"
        style={{ background: 'var(--accent)' }}
      >
        存
      </button>
    </form>
  )
}
