// Thin localStorage wrapper. All keys are namespaced under 'lf:'.
// Returns null server-side (SSR safety) and on missing/corrupt data.

const KEY_DIAGNOSIS      = 'lf:diagnosis'
const KEY_DIAGNOSIS_DATE = 'lf:diagnosis_date'
const KEY_HISTORY        = 'lf:history'

export interface Diagnosis {
  issues: Issue[]
  summary: string
  grassType?: string
  season?: string
}

export interface Issue {
  id: string
  label: string
  severity: 'low' | 'medium' | 'high'
  steps: string[]
}

export interface HistoryEntry {
  date: string        // ISO string
  diagnosis: Diagnosis
  imageThumb?: string // small base64 thumbnail for timeline display
}

function read(key: string): string | null {
  if (typeof window === 'undefined') return null
  try { return localStorage.getItem(key) } catch { return null }
}

function write(key: string, value: string): void {
  if (typeof window === 'undefined') return
  try { localStorage.setItem(key, value) } catch { /* storage full or blocked */ }
}

// Most recent diagnosis
export function getDiagnosis(): Diagnosis | null {
  const raw = read(KEY_DIAGNOSIS)
  if (!raw) return null
  try { return JSON.parse(raw) as Diagnosis } catch { return null }
}

export function saveDiagnosis(diagnosis: Diagnosis): void {
  write(KEY_DIAGNOSIS, JSON.stringify(diagnosis))
  write(KEY_DIAGNOSIS_DATE, new Date().toISOString())
}

// Date of last diagnosis
export function getDiagnosisDate(): Date | null {
  const raw = read(KEY_DIAGNOSIS_DATE)
  if (!raw) return null
  const d = new Date(raw)
  return isNaN(d.getTime()) ? null : d
}

// Progress history (array of past diagnoses for timeline)
export function getHistory(): HistoryEntry[] {
  const raw = read(KEY_HISTORY)
  if (!raw) return []
  try { return JSON.parse(raw) as HistoryEntry[] } catch { return [] }
}

export function appendHistory(entry: HistoryEntry): void {
  const history = getHistory()
  history.push(entry)
  write(KEY_HISTORY, JSON.stringify(history))
}

// Reset helpers
export function clearAll(): void {
  if (typeof window === 'undefined') return
  try {
    ;[KEY_DIAGNOSIS, KEY_DIAGNOSIS_DATE, KEY_HISTORY].forEach(k =>
      localStorage.removeItem(k)
    )
  } catch { /* */ }
}
