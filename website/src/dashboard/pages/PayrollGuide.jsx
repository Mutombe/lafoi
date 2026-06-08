import React from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowLeft, UsersThree, CalendarBlank, Sparkle, Calculator, Receipt,
  CheckCircle, Lock, ArrowsClockwise, Gavel, Coins, Warning, ArrowRight,
  Question, DownloadSimple,
} from '@phosphor-icons/react'

import PageHeader from '../components/PageHeader'

/* ============================================================================
   Payroll Guide — plain-language documentation of how the payroll engine
   works, what feeds it, and what affects what. Linked from the Payroll page.
   No data fetching; pure reference content.
   ========================================================================= */

function Section({ icon: Icon, num, title, children }) {
  return (
    <section className="rounded-2xl border border-lafoi-dark/10 bg-white overflow-hidden">
      <div className="flex items-center gap-3 px-5 sm:px-6 py-4 border-b border-lafoi-dark/[0.06] bg-lafoi-cream/40">
        <span className="inline-flex w-9 h-9 rounded-xl bg-lafoi-green/12 text-lafoi-green-dark items-center justify-center shrink-0">
          <Icon size={18} weight="regular" />
        </span>
        <div>
          <p className="font-sora text-[10px] tracking-[0.3em] uppercase text-lafoi-gray-medium">Step {num}</p>
          <h2 className="font-display text-xl text-lafoi-dark leading-tight">{title}</h2>
        </div>
      </div>
      <div className="px-5 sm:px-6 py-5 space-y-3 text-sm text-lafoi-gray font-body leading-[1.7]">
        {children}
      </div>
    </section>
  )
}

const Term = ({ children }) => <strong className="font-sora font-semibold text-lafoi-dark">{children}</strong>

function Formula({ children }) {
  return (
    <div className="my-2 px-4 py-3 rounded-xl bg-lafoi-dark text-white font-sora text-sm tracking-wide">
      {children}
    </div>
  )
}

export default function PayrollGuide() {
  return (
    <div className="max-w-4xl">
      <Link to="/dashboard/payroll" className="inline-flex items-center gap-2 text-xs font-sora tracking-widest text-lafoi-gray-medium hover:text-lafoi-dark mb-4">
        <ArrowLeft size={12} /> Back to Payroll
      </Link>

      <PageHeader
        eyebrow="Payroll · Guide"
        title="How payroll works."
        description="A plain-language walkthrough of the whole pay run — what feeds it, how each number is worked out, and what affects what."
      />

      {/* The flow at a glance */}
      <div className="mb-8 rounded-2xl border border-lafoi-green/25 bg-lafoi-green/[0.05] p-5 sm:p-6">
        <p className="font-sora text-[10px] tracking-[0.3em] uppercase text-lafoi-green-dark mb-4">The flow at a glance</p>
        <div className="flex flex-wrap items-center gap-x-2 gap-y-3 text-xs font-sora">
          {[
            'Employees',
            'Create a pay period',
            'Generate entries',
            'Review each payslip',
            'Approve → Pay → Close',
            'Download payslips',
          ].map((step, i, arr) => (
            <React.Fragment key={step}>
              <span className="inline-flex items-center px-3 py-2 rounded-full bg-white border border-lafoi-dark/10 text-lafoi-dark">
                {step}
              </span>
              {i < arr.length - 1 && <ArrowRight size={13} className="text-lafoi-green shrink-0" />}
            </React.Fragment>
          ))}
        </div>
      </div>

      <div className="space-y-5">
        {/* 1 — Employees */}
        <Section icon={UsersThree} num="1" title="It starts with the Employees">
          <p>
            Payroll never invents numbers — it reads them from each employee's record on the{' '}
            <Term>Employees</Term> page. Before running payroll, make sure every employee's record is correct, because these are the figures that flow into their payslip:
          </p>
          <ul className="list-disc pl-5 space-y-1.5">
            <li><Term>Base salary</Term> — the core monthly (or weekly) pay.</li>
            <li><Term>Transport allowance</Term> &amp; <Term>Total</Term> — kept on the record for reference.</li>
            <li><Term>Default allowances</Term> — recurring extras (e.g. Housing, Airtime). Copied onto every payslip automatically.</li>
            <li><Term>Default deductions</Term> — recurring deductions (e.g. Pension, Union). Also copied automatically.</li>
            <li><Term>Currency</Term> — decides which tax tables apply (USD vs ZWG have different brackets).</li>
            <li><Term>Status</Term> — only <Term>Active</Term> employees are pulled into a pay run.</li>
          </ul>
          <p className="text-xs text-lafoi-gray-medium">
            Tip: fix an employee's salary or allowances on the Employees page <em>before</em> generating entries. If you change them afterwards, regenerate or edit the payslip to pick up the change.
          </p>
        </Section>

        {/* 2 — Pay period */}
        <Section icon={CalendarBlank} num="2" title="Create a pay period">
          <p>
            A <Term>pay period</Term> is one pay run — for example "May 2026". On the Payroll page click{' '}
            <Term>New period</Term> and give it a name, a start date, an end date, and a pay date. Nothing is calculated yet; you've just created an empty container for this month's payslips.
          </p>
        </Section>

        {/* 3 — Generate */}
        <Section icon={Sparkle} num="3" title="Generate entries from active employees">
          <p>
            Open the period and click <Term>Generate from active employees</Term>. This creates one draft{' '}
            <Term>payslip (entry)</Term> per active employee, pre-filled from their record: base salary, default allowances, default deductions and currency split. Employees already in the period are skipped, so it's safe to click again after adding a new hire.
          </p>
        </Section>

        {/* 4 — How a payslip is calculated */}
        <Section icon={Calculator} num="4" title="How each payslip is calculated">
          <p>Every payslip is built in three layers. You can edit the top layer; the system fills in the rest.</p>

          <p className="font-sora font-semibold text-lafoi-dark pt-1">a) Gross pay — what they earn</p>
          <Formula>Gross = Base salary + Overtime (hours × rate) + All allowances</Formula>

          <p className="font-sora font-semibold text-lafoi-dark pt-1">b) Statutory deductions — worked out automatically</p>
          <p>From the gross, the system applies Zimbabwe statutory deductions using the tax tables (see step 6):</p>
          <ul className="list-disc pl-5 space-y-1.5">
            <li><Term>PAYE</Term> — income tax. The gross is matched to a tax bracket; tax = gross × rate − the bracket's fixed deduction.</li>
            <li><Term>AIDS levy</Term> — a percentage (usually 3%) <em>of the PAYE</em>, not of gross.</li>
            <li><Term>NSSA (employee)</Term> — a percentage of insurable earnings, capped at the NSSA ceiling. This comes off the employee's pay.</li>
            <li><Term>NSSA (employer)</Term> — the company's matching contribution. Shown for records but <em>not</em> deducted from the employee's net.</li>
          </ul>

          <p className="font-sora font-semibold text-lafoi-dark pt-1">c) Net pay — what lands in their account</p>
          <Formula>Net = Gross − (PAYE + AIDS levy + NSSA employee + your custom deductions)</Formula>
          <p className="text-xs text-lafoi-gray-medium">
            Net can never go below zero. If deductions would exceed gross, it's floored at 0.
          </p>
        </Section>

        {/* 5 — Loans */}
        <Section icon={Coins} num="5" title="Loans repay themselves">
          <p>
            If an employee has an <Term>active loan or advance</Term> (set up on the Loans page), its instalment is added to that payslip's deductions automatically when entries are generated or saved — capped at the remaining balance. You don't add loan repayments by hand. Each repayment reduces the loan's outstanding balance.
          </p>
        </Section>

        {/* 6 — Tax tables */}
        <Section icon={Gavel} num="6" title="Where the tax numbers come from">
          <p>
            The statutory figures aren't hard-coded — they're read from <Term>Settings → Tax &amp; Compliance</Term>. That's where the PAYE brackets, AIDS levy rate, and NSSA rates + ceiling live, each tagged by <Term>currency</Term> and an <Term>effective date</Term>.
          </p>
          <div className="px-4 py-3 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-2.5">
            <Warning size={16} weight="bold" className="text-amber-700 shrink-0 mt-0.5" />
            <p className="text-[13px] text-amber-900">
              <strong>If a payslip shows PAYE / NSSA as 0</strong>, it almost always means the tax tables for that currency (or that date) haven't been entered yet. Add them under Tax &amp; Compliance, then regenerate or re-save the entry.
            </p>
          </div>
          <p className="text-xs text-lafoi-gray-medium">
            Each payslip also stores a snapshot of the exact rates used, so a payslip from last year still shows last year's tax even if rates change later.
          </p>
        </Section>

        {/* 7 — Review + edit */}
        <Section icon={Receipt} num="7" title="Review &amp; adjust each payslip">
          <p>
            Inside the period, each employee row can be opened and edited while the period is still open. You can add a one-off allowance or deduction, enter overtime hours and rate, or tweak the base for that run. Every edit instantly re-runs the gross → statutory → net calculation above.
          </p>
        </Section>

        {/* 8 — Workflow */}
        <Section icon={CheckCircle} num="8" title="The approval workflow (and locking)">
          <p>A period moves through five stages. Each stage records who signed it off and when:</p>
          <div className="flex flex-wrap items-center gap-x-2 gap-y-2 py-1">
            {['Draft', 'Reviewed', 'Approved', 'Paid', 'Closed'].map((s, i, arr) => (
              <React.Fragment key={s}>
                <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-lafoi-cream border border-lafoi-dark/10 text-xs font-sora text-lafoi-dark">{s}</span>
                {i < arr.length - 1 && <ArrowRight size={12} className="text-lafoi-gray-medium" />}
              </React.Fragment>
            ))}
          </div>
          <ul className="list-disc pl-5 space-y-1.5">
            <li><Term>Draft</Term> — being prepared; freely editable.</li>
            <li><Term>Reviewed → Approved</Term> — sign-off stages before money moves.</li>
            <li><Term>Paid</Term> — wages have gone out.</li>
            <li><Term>Closed</Term> — the period is <Term>locked</Term>; entries can no longer be edited.</li>
          </ul>
          <p className="flex items-start gap-2">
            <ArrowsClockwise size={15} className="text-lafoi-green shrink-0 mt-0.5" />
            <span>A closed period can be <Term>reopened</Term> by an admin if a correction is needed — this requires a reason and is recorded in the audit log. <Lock size={12} className="inline" /> If your edits won't save, the period is probably closed.</span>
          </p>
        </Section>

        {/* 9 — Outputs */}
        <Section icon={DownloadSimple} num="9" title="Payslips &amp; the bank file">
          <p>
            Once you're happy, every employee row has a <Term>download icon</Term> for their branded payslip PDF. At the top of the period there's also a <Term>Download bank file</Term> button that exports the whole batch as a CSV you can hand to the bank.
          </p>
        </Section>

        {/* What affects what */}
        <section className="rounded-2xl border border-lafoi-dark/10 bg-white overflow-hidden">
          <div className="flex items-center gap-3 px-5 sm:px-6 py-4 border-b border-lafoi-dark/[0.06] bg-lafoi-green/[0.06]">
            <span className="inline-flex w-9 h-9 rounded-xl bg-lafoi-green/15 text-lafoi-green-dark items-center justify-center shrink-0">
              <ArrowsClockwise size={18} />
            </span>
            <h2 className="font-display text-xl text-lafoi-dark">What affects what</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-lafoi-cream/50 border-b border-lafoi-dark/[0.06]">
                  <th className="text-left px-5 py-2.5 font-sora text-[10px] tracking-[0.2em] uppercase text-lafoi-gray-medium">If you change…</th>
                  <th className="text-left px-5 py-2.5 font-sora text-[10px] tracking-[0.2em] uppercase text-lafoi-gray-medium">It changes…</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-lafoi-dark/[0.06]">
                {[
                  ['Base salary, allowances or overtime', 'Gross → which raises PAYE, AIDS levy, NSSA and the net.'],
                  ['Employee currency', 'Which tax tables apply (USD and ZWG have different brackets).'],
                  ['Tax tables (Tax & Compliance)', 'PAYE, AIDS levy and NSSA on every new/re-saved payslip.'],
                  ['A custom deduction', 'Total deductions → lowers net. Does not affect statutory.'],
                  ['An active loan', 'Adds an automatic repayment deduction → lowers net, reduces the loan balance.'],
                  ['Employee status to inactive', 'They are no longer pulled into new pay runs.'],
                  ['Closing the period', 'Locks all entries from further edits until reopened.'],
                ].map(([a, b]) => (
                  <tr key={a}>
                    <td className="px-5 py-3 font-sora text-lafoi-dark align-top w-2/5">{a}</td>
                    <td className="px-5 py-3 text-lafoi-gray align-top">{b}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* FAQ */}
        <section className="rounded-2xl border border-lafoi-dark/10 bg-white overflow-hidden">
          <div className="flex items-center gap-3 px-5 sm:px-6 py-4 border-b border-lafoi-dark/[0.06] bg-lafoi-cream/40">
            <span className="inline-flex w-9 h-9 rounded-xl bg-lafoi-green/12 text-lafoi-green-dark items-center justify-center shrink-0">
              <Question size={18} />
            </span>
            <h2 className="font-display text-xl text-lafoi-dark">Common questions</h2>
          </div>
          <div className="px-5 sm:px-6 py-5 space-y-4 text-sm text-lafoi-gray font-body leading-[1.7]">
            {[
              ['A payslip shows PAYE or NSSA as 0 — why?',
               'The tax tables for that employee’s currency (or that pay date) haven’t been set up. Add them under Settings → Tax & Compliance, then regenerate or re-save the entry.'],
              ['I changed an employee’s salary but the payslip didn’t update.',
               'Entries are a snapshot taken when generated. Open that employee’s entry and re-save it, or regenerate, to pull in the new figure.'],
              ['My edits won’t save.',
               'The period is most likely Closed (locked). An admin can reopen it (with a reason) to make corrections.'],
              ['Why is the employer NSSA shown if it’s not deducted?',
               'It’s the company’s matching contribution — recorded for compliance and reporting, but it never comes off the employee’s net pay.'],
              ['Do I add loan repayments manually?',
               'No. Active loans add their instalment to the payslip automatically and reduce the loan balance as they’re paid.'],
            ].map(([q, a]) => (
              <div key={q}>
                <p className="font-sora font-semibold text-lafoi-dark">{q}</p>
                <p className="mt-1">{a}</p>
              </div>
            ))}
          </div>
        </section>
      </div>

      <div className="mt-8 flex items-center justify-between gap-3 flex-wrap">
        <p className="text-xs text-lafoi-gray-medium font-body">
          Still stuck? Ask an administrator, or check the audit log under Settings.
        </p>
        <Link
          to="/dashboard/payroll"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-lafoi-dark text-white font-sora text-sm hover:bg-lafoi-green transition-colors"
        >
          Go to Payroll <ArrowRight size={14} weight="bold" />
        </Link>
      </div>
    </div>
  )
}
