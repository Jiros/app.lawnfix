'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { getDiagnosis, getDiagnosisDate, clearAll } from '@/lib/storage'

function formatDate(d: Date): string {
  return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short' })
}

export default function Home() {
  const [hasDiagnosis, setHasDiagnosis] = useState(false)
  const [diagnosisDate, setDiagnosisDate] = useState<Date | null>(null)

  useEffect(() => {
    document.title = 'LawnFix — Lawn diagnosis, simplified.'
    const d = getDiagnosis()
    setHasDiagnosis(!!d)
    setDiagnosisDate(getDiagnosisDate())
  }, [])

  function handleResetAll() {
    if (!window.confirm('Clear all saved data? This cannot be undone.')) return
    clearAll()
    setHasDiagnosis(false)
    setDiagnosisDate(null)
  }

  return (
    <main className="flex flex-col flex-1 px-4 pt-10 pb-8 gap-8">

      <header className="flex items-center justify-center gap-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/icons/lawnfix-logo.svg" alt="" width={52} height={52} />
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-lawn-700">LawnFix</h1>
          <p className="text-sm text-slate-500">Lawn diagnosis, simplified.</p>
        </div>
      </header>

      <ol className="flex flex-col gap-4">
        {/* Step 1 — Photograph Your Lawn */}
        <Step
          number={1}
          href="/scan"
          title="Photograph Your Lawn"
          description={
            hasDiagnosis
              ? `Last scanned${diagnosisDate ? ` ${formatDate(diagnosisDate)}` : ''} — tap to view or rescan`
              : 'Take a photo of the problem area — AI diagnoses what\'s wrong instantly.'
          }
          done={hasDiagnosis}
          badge={hasDiagnosis ? undefined : 'AI'}
        />

        {/* Step 2 — View Your Fix Plan */}
        <Step
          number={2}
          href="/fix"
          title="View Your Fix Plan"
          description={
            hasDiagnosis
              ? `Last scanned${diagnosisDate ? ` ${formatDate(diagnosisDate)}` : ''} — view your treatment steps`
              : 'Get step-by-step repair instructions tailored to your lawn.'
          }
          promoted={hasDiagnosis}
        />

        {/* Step 3 — Track Progress */}
        <Step
          number={3}
          href="/history"
          title="Track Progress"
          description="Photograph regularly to see your lawn recover over time."
          done={false}
        />
      </ol>

      <footer className="mt-auto flex flex-col items-center gap-2">
        {hasDiagnosis && (
          <button
            onClick={handleResetAll}
            className="text-xs text-slate-300 underline underline-offset-2"
          >
            Reset saved data
          </button>
        )}
        <div className="flex items-center gap-1.5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/icons/lawnfix-logo.svg" alt="" width={14} height={14} className="opacity-40" />
          <p className="text-xs text-slate-400">lawnfix.app</p>
        </div>
      </footer>

    </main>
  )
}

// ─── Step card ────────────────────────────────────────────────────────────────

function Step({
  number, href, title, description, done, badge, promoted,
}: {
  number: number
  href: string
  title: string
  description: string
  done?: boolean
  badge?: string
  promoted?: boolean
}) {
  return (
    <li>
      <Link
        href={href}
        className={`flex items-center gap-4 rounded-2xl px-4 min-h-tap shadow-sm active:scale-[0.98] transition-transform ${
          promoted
            ? 'bg-lawn-600 border border-lawn-600'
            : 'bg-white border border-slate-200'
        }`}
      >
        {/* Number / tick */}
        <div className={`shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${
          promoted ? 'bg-lawn-500 text-white'
          : done    ? 'bg-green-500 text-white'
          :           'bg-lawn-100 text-lawn-700'
        }`}>
          {done || promoted ? <TickIcon /> : number}
        </div>

        {/* Text */}
        <div className="flex-1 py-4">
          <div className="flex items-center gap-2">
            <span className={`font-semibold ${promoted ? 'text-white' : 'text-slate-900'}`}>{title}</span>
            {badge && (
              <span className="text-[10px] font-bold bg-lawn-100 text-lawn-700 px-1.5 py-0.5 rounded-full">
                {badge}
              </span>
            )}
          </div>
          <p className={`text-sm mt-0.5 ${
            promoted ? 'text-lawn-200'
            : done    ? 'text-green-600 font-medium'
            :           'text-slate-500'
          }`}>
            {description}
          </p>
        </div>

        <ChevronIcon muted={!promoted} />
      </Link>
    </li>
  )
}

// ─── Icons ────────────────────────────────────────────────────────────────────

function TickIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}

function ChevronIcon({ muted = true }: { muted?: boolean }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`shrink-0 ${muted ? 'text-slate-300' : 'text-lawn-300'}`}>
      <polyline points="9 18 15 12 9 6" />
    </svg>
  )
}
