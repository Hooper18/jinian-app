import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import OccasionForm from './OccasionForm'

const createOccasion = vi.fn(async (input) => ({ id: 'new-id', ...input }))

vi.mock('../hooks/useOccasions', () => ({
  useOccasions: () => ({ occasions: [], createOccasion, updateOccasion: vi.fn(), deleteOccasion: vi.fn() }),
}))

describe('OccasionForm 新建表单', () => {
  it('默认类型是"每年循环"，农历开关可用', () => {
    render(
      <MemoryRouter>
        <OccasionForm />
      </MemoryRouter>,
    )
    expect(screen.getByRole('button', { name: '每年循环' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByLabelText('农历')).not.toBeDisabled()
  })

  it('切到"累加计天"后显示里程碑区，农历开关禁用', async () => {
    render(
      <MemoryRouter>
        <OccasionForm />
      </MemoryRouter>,
    )
    await userEvent.click(screen.getByRole('button', { name: '累加计天' }))
    expect(screen.getByTestId('milestone-section')).toBeInTheDocument()
    expect(screen.getByLabelText('农历')).toBeDisabled()
  })

  it('切到"倒数到某天"后不显示里程碑区', async () => {
    render(
      <MemoryRouter>
        <OccasionForm />
      </MemoryRouter>,
    )
    await userEvent.click(screen.getByRole('button', { name: '倒数到某天' }))
    expect(screen.queryByTestId('milestone-section')).not.toBeInTheDocument()
  })

  it('提交表单调用 createOccasion，携带正确的 kind 与 title', async () => {
    render(
      <MemoryRouter>
        <OccasionForm />
      </MemoryRouter>,
    )
    await userEvent.type(screen.getByLabelText('名字'), '婚礼')
    await userEvent.click(screen.getByRole('button', { name: '倒数到某天' }))
    await userEvent.type(screen.getByLabelText('日期'), '2026-09-28')
    await userEvent.click(screen.getByRole('button', { name: '存' }))
    expect(createOccasion).toHaveBeenCalledWith(
      expect.objectContaining({ kind: 'until', title: '婚礼', date: '2026-09-28' }),
    )
  })
})
