import React from 'react'

const baseInput =
  'w-full px-3.5 py-2.5 rounded-xl bg-white border border-lafoi-dark/12 focus:border-lafoi-green focus:outline-none focus:ring-2 focus:ring-lafoi-green/15 font-body text-sm transition'

export function Field({ label, hint, error, required, className = '', children }) {
  return (
    <label className={`block ${className}`}>
      <span className="block font-sora text-[10px] tracking-[0.28em] uppercase text-lafoi-gray mb-1.5">
        {label}{required && <span className="text-red-500">*</span>}
      </span>
      {children}
      {hint && !error && <span className="block mt-1 text-[11px] text-lafoi-gray-medium">{hint}</span>}
      {error && <span className="block mt-1 text-[11px] text-red-600">{error}</span>}
    </label>
  )
}

export const Input = React.forwardRef(function Input(props, ref) {
  const { className = '', ...rest } = props
  return <input ref={ref} className={`${baseInput} ${className}`} {...rest} />
})

export const Textarea = (props) => {
  const { className = '', rows = 3, ...rest } = props
  return <textarea rows={rows} className={`${baseInput} ${className}`} {...rest} />
}

export const Select = (props) => {
  const { className = '', children, ...rest } = props
  return (
    <select className={`${baseInput} ${className}`} {...rest}>
      {children}
    </select>
  )
}

export const buttonBase =
  'inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-full font-sora text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed'

export const PrimaryButton = ({ className = '', ...rest }) => (
  <button className={`${buttonBase} bg-lafoi-dark text-white hover:bg-lafoi-green ${className}`} {...rest} />
)

export const SecondaryButton = ({ className = '', ...rest }) => (
  <button className={`${buttonBase} bg-white text-lafoi-dark border border-lafoi-dark/15 hover:border-lafoi-green hover:text-lafoi-green ${className}`} {...rest} />
)

export const DangerButton = ({ className = '', ...rest }) => (
  <button className={`${buttonBase} bg-white text-red-600 border border-red-200 hover:bg-red-50 ${className}`} {...rest} />
)
