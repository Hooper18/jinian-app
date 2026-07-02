import { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'

type Props = {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  autoComplete?: string
  required?: boolean
  disabled?: boolean
  id?: string
}

export default function PasswordInput({
  value,
  onChange,
  placeholder,
  autoComplete,
  required,
  disabled,
  id,
}: Props) {
  const [show, setShow] = useState(false)

  return (
    <div className="relative">
      <input
        id={id}
        type={show ? 'text' : 'password'}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        required={required}
        disabled={disabled}
        className="w-full rounded-xl border px-4 py-2.5 pr-10 text-sm"
        style={{ borderColor: 'var(--border)', background: 'var(--bg-primary)' }}
      />
      <button
        type="button"
        tabIndex={-1}
        aria-label={show ? '隐藏密码' : '显示密码'}
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => setShow((s) => !s)}
        className="absolute inset-y-0 right-0 flex items-center px-3"
        style={{ color: 'var(--text-tertiary)' }}
      >
        {show ? <EyeOff size={16} /> : <Eye size={16} />}
      </button>
    </div>
  )
}
