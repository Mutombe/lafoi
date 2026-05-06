import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Calculator, CaretDown, CaretRight, CircleNotch } from '@phosphor-icons/react'

import { Field, Input, Select } from '../FormField'
import { fmtMoney } from '../DataTable'
import { usePreviewPayeMutation } from '../../store/api'

const CURRENCIES = ['USD', 'ZWG', 'ZWL', 'ZAR']

/**
 * Live PAYE / statutory preview. Recomputes on a 300ms debounce as the user
 * types. We avoid an explicit "Compute" button for that desktop-software feel.
 */
export default function CalculatorPreview({ defaultCurrency = 'USD' }) {
  const today = new Date().toISOString().slice(0, 10)
  const [gross, setGross] = useState('2500')
  const [currency, setCurrency] = useState(defaultCurrency)
  const [date, setDate] = useState(today)
  const [showSnapshot, setShowSnapshot] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')

  const [preview, { isLoading }] = usePreviewPayeMutation()
  const timer = useRef(null)
  const lastInflightId = useRef(0)

  // Keep currency in sync when the parent's "default" changes (e.g. user opens
  // a different bracket set from the list).
  useEffect(() => {
    setCurrency(defaultCurrency)
  }, [defaultCurrency])

  // Debounced compute
  useEffect(() => {
    const grossNum = Number(gross)
    if (!gross || isNaN(grossNum) || grossNum <= 0) {
      setResult(null)
      setError('')
      return
    }
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(async () => {
      const myId = ++lastInflightId.current
      try {
        const res = await preview({ gross: grossNum, currency, on_date: date }).unwrap()
        // Drop stale responses (the user kept typing after we fired)
        if (myId !== lastInflightId.current) return
        setResult(res)
        setError('')
      } catch (e) {
        if (myId !== lastInflightId.current) return
        const msg = e?.data?.detail || e?.data ? (typeof e.data === 'string' ? e.data : Object.values(e?.data || {}).flat().join(' ')) : 'Preview failed.'
        setError(msg || 'Preview failed.')
        setResult(null)
      }
    }, 300)
    return () => { if (timer.current) clearTimeout(timer.current) }
  }, [gross, currency, date, preview])

  const net = useMemo(() => {
    if (!result) return 0
    return Number(result.gross || 0) - Number(result.statutory_total || 0)
  }, [result])

  return (
    <div className="lg:sticky lg:top-20">
      <div className="rounded-2xl border border-lafoi-dark/10 bg-white shadow-[0_1px_2px_rgba(17,17,17,0.04)] overflow-hidden">
        <div className="px-5 py-4 border-b border-lafoi-dark/[0.06] bg-lafoi-cream/40 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-lafoi-green/15 border border-lafoi-green/30 flex items-center justify-center text-lafoi-green-dark">
            <Calculator size={15} weight="bold" />
          </div>
          <div className="flex-1">
            <p className="font-sora text-[10px] tracking-[0.3em] uppercase text-lafoi-gray-medium">Live preview</p>
            <p className="font-display text-lg tracking-tight">Calculator</p>
          </div>
          {isLoading && <CircleNotch size={16} className="animate-spin text-lafoi-green" />}
        </div>

        <div className="px-5 py-4 grid grid-cols-2 gap-3 border-b border-lafoi-dark/[0.06]">
          <Field label="Gross amount" className="col-span-2">
            <Input
              type="number"
              step="0.01"
              value={gross}
              onChange={(e) => setGross(e.target.value)}
              placeholder="0.00"
              className="text-right tabular-nums"
            />
          </Field>
          <Field label="Currency">
            <Select value={currency} onChange={(e) => setCurrency(e.target.value)}>
              {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </Select>
          </Field>
          <Field label="On date">
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </Field>
        </div>

        <div className="px-5 py-4">
          {error && (
            <div className="px-3 py-2 rounded-lg bg-red-50 text-red-700 text-xs">{error}</div>
          )}
          {!error && !result && (
            <p className="text-sm text-lafoi-gray-medium font-light py-4 text-center">
              Enter a gross amount to see the breakdown.
            </p>
          )}
          {result && (
            <div className="space-y-1">
              <Row label="Gross" value={fmtMoney(result.gross, currency)} />
              <Row label="PAYE" value={`− ${fmtMoney(result.paye, currency)}`} accent="muted" />
              <Row label="AIDS Levy" value={`− ${fmtMoney(result.aids_levy, currency)}`} accent="muted" />
              <Row label="NSSA (employee)" value={`− ${fmtMoney(result.nssa_employee, currency)}`} accent="muted" />
              <div className="h-px bg-lafoi-dark/8 my-2" />
              <Row label="Statutory total" value={fmtMoney(result.statutory_total, currency)} accent="dim" />
              <div className="mt-2 px-3 py-3 rounded-xl bg-lafoi-green/[0.06] border border-lafoi-green/20 flex items-baseline justify-between">
                <p className="font-sora text-[10px] tracking-[0.3em] uppercase text-lafoi-green-dark">Net to employee</p>
                <p className="font-display text-2xl tabular-nums tracking-tight text-lafoi-green-dark">
                  {fmtMoney(net, currency)}
                </p>
              </div>
              <p className="text-[10px] text-lafoi-gray-medium mt-2">
                Employer NSSA contribution: <span className="tabular-nums">{fmtMoney(result.nssa_employer, currency)}</span>
              </p>
            </div>
          )}
        </div>

        {result?.snapshot && (
          <div className="border-t border-lafoi-dark/[0.06]">
            <button
              type="button"
              onClick={() => setShowSnapshot((s) => !s)}
              className="w-full px-5 py-2.5 flex items-center gap-2 text-[11px] font-sora tracking-[0.2em] uppercase text-lafoi-gray-medium hover:text-lafoi-dark hover:bg-lafoi-cream/60 transition-colors"
            >
              {showSnapshot ? <CaretDown size={11} /> : <CaretRight size={11} />}
              View full snapshot
            </button>
            {showSnapshot && (
              <pre className="text-[11px] leading-relaxed text-lafoi-dark/80 font-mono px-5 pb-4 pt-1 max-h-72 overflow-auto bg-lafoi-cream/30">
                {JSON.stringify(result.snapshot, null, 2)}
              </pre>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function Row({ label, value, accent }) {
  const valueColor = accent === 'muted'
    ? 'text-red-600'
    : accent === 'dim'
      ? 'text-lafoi-gray font-medium'
      : 'text-lafoi-dark font-semibold'
  return (
    <div className="flex items-baseline justify-between py-1.5 border-b border-lafoi-dark/[0.04] last:border-b-0">
      <span className="font-sora text-[11px] tracking-[0.18em] uppercase text-lafoi-gray-medium">{label}</span>
      <span className={`tabular-nums text-sm font-sora ${valueColor}`}>{value}</span>
    </div>
  )
}
