// Cloudflare Pages Function — POST /api/scan
// Proxies lawn photo to Claude Vision and returns a structured diagnosis.
// The ANTHROPIC_API_KEY env var is set in the Cloudflare Pages dashboard
// under Settings → Environment variables (never commit it).

// ── API constants ─────────────────────────────────────────────────────────────
// anthropic-version: there is no "latest" alias — this must be a specific
// protocol version. 2023-06-01 is the current stable version.
// Check https://docs.anthropic.com/en/api/versioning when upgrading.
const ANTHROPIC_API_VERSION = '2023-06-01'

// Model: pin a specific model ID for consistent, predictable output.
// Lawn diagnosis is nuanced — a model change can alter JSON format or accuracy.
// Update intentionally after testing. Current: claude-sonnet-4-6.
const CLAUDE_MODEL = 'claude-sonnet-4-6'

interface Env {
  ANTHROPIC_API_KEY: string
}

interface ScanRequest {
  image: string            // data URL of the lawn photo
  contextImage?: string    // optional wider-context photo (e.g. full lawn, surrounding trees)
  location?: string        // optional: country/region for climate-aware advice
  grassType?: string       // optional: user-identified grass type
}

export interface Issue {
  id: string
  label: string
  severity: 'low' | 'medium' | 'high'
  steps: string[]
}

export interface Diagnosis {
  issues: Issue[]
  summary: string
  grassType?: string
  season?: string
}

const ALLOWED_ORIGIN = 'https://lawnfix.app'
const MAX_BASE64_LEN = 5_500_000  // ~4MB image

const CORS_HEADERS = {
  'Access-Control-Allow-Origin':  ALLOWED_ORIGIN,
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

export const onRequestOptions: PagesFunction = () =>
  new Response(null, { status: 204, headers: CORS_HEADERS })

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  // ── Auth check ─────────────────────────────────────────────────────────────
  if (!env.ANTHROPIC_API_KEY) {
    return json({ error: 'Service not configured' }, 503)
  }

  // ── Parse body ─────────────────────────────────────────────────────────────
  let body: ScanRequest
  try {
    body = await request.json() as ScanRequest
  } catch {
    return json({ error: 'Invalid JSON body' }, 400)
  }

  const { image, contextImage, location, grassType } = body

  if (typeof image !== 'string' || !image) {
    return json({ error: 'Missing image field' }, 400)
  }
  if (image.length > MAX_BASE64_LEN) {
    return json({ error: 'Image too large — maximum 4MB' }, 413)
  }
  if (contextImage && contextImage.length > MAX_BASE64_LEN) {
    return json({ error: 'Context image too large — maximum 4MB' }, 413)
  }

  // ── Validate data URLs ─────────────────────────────────────────────────────
  const mainMatch = image.match(/^data:(image\/(?:jpeg|png|webp|gif));base64,(.+)$/)
  if (!mainMatch) {
    return json({ error: 'Image must be a JPEG, PNG, WebP, or GIF data URL' }, 400)
  }
  const [, mainMediaType, mainData] = mainMatch

  let ctxMediaType = '', ctxData = ''
  if (contextImage) {
    const ctxMatch = contextImage.match(/^data:(image\/(?:jpeg|png|webp|gif));base64,(.+)$/)
    if (!ctxMatch) return json({ error: 'Context image must be a JPEG, PNG, WebP, or GIF data URL' }, 400)
    ;[, ctxMediaType, ctxData] = ctxMatch
  }

  // ── Build prompt ───────────────────────────────────────────────────────────
  const locationHint  = location  ? `\nUser location: ${location}` : ''
  const grassTypeHint = grassType ? `\nUser-identified grass type: ${grassType}` : ''

  const prompt = contextImage
    ? `You are a lawn care expert.${locationHint}${grassTypeHint}

Image 1 is a close-up of the problem area.
Image 2 is a wider context shot showing the full lawn and surroundings (trees, shade, fencing, etc.).

Use both images to diagnose what is wrong with this lawn and provide a repair plan.

Return ONLY this JSON object — no explanation, no markdown:

{
  "issues": [
    {
      "id": "<slug e.g. drought-stress>",
      "label": "<short human label e.g. Drought Stress>",
      "severity": "<low|medium|high>",
      "steps": ["<step 1>", "<step 2>", "<step 3>"]
    }
  ],
  "summary": "<1-2 sentence plain-English summary of the lawn's condition>",
  "grassType": "<identified or inferred grass type, or null>",
  "season": "<inferred season from appearance, or null>"
}`
    : `You are a lawn care expert.${locationHint}${grassTypeHint}

The image shows a lawn that needs diagnosis and repair advice.

Identify the most likely problems (e.g. drought stress, nitrogen deficiency, moss, fungal disease, compaction, shade damage, grub damage, bare patches, weed encroachment) and provide step-by-step repair instructions for each.

Return ONLY this JSON object — no explanation, no markdown:

{
  "issues": [
    {
      "id": "<slug e.g. drought-stress>",
      "label": "<short human label e.g. Drought Stress>",
      "severity": "<low|medium|high>",
      "steps": ["<step 1>", "<step 2>", "<step 3>"]
    }
  ],
  "summary": "<1-2 sentence plain-English summary of the lawn's condition>",
  "grassType": "<identified or inferred grass type, or null>",
  "season": "<inferred season from appearance, or null>"
}`

  // ── Build message content ──────────────────────────────────────────────────
  const imageContent = contextImage
    ? [
        { type: 'image', source: { type: 'base64', media_type: mainMediaType, data: mainData } },
        { type: 'image', source: { type: 'base64', media_type: ctxMediaType,  data: ctxData  } },
        { type: 'text',  text: prompt },
      ]
    : [
        { type: 'image', source: { type: 'base64', media_type: mainMediaType, data: mainData } },
        { type: 'text',  text: prompt },
      ]

  let claudeResponse: Response
  try {
    claudeResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type':      'application/json',
        'x-api-key':         env.ANTHROPIC_API_KEY,
        'anthropic-version': ANTHROPIC_API_VERSION,
      },
      body: JSON.stringify({
        model:      CLAUDE_MODEL,
        max_tokens: 1024,
        messages: [{ role: 'user', content: imageContent }],
      }),
    })
  } catch {
    return json({ error: 'Failed to reach analysis service' }, 502)
  }

  if (!claudeResponse.ok) {
    const errBody = await claudeResponse.text().catch(() => '')
    console.error('Claude API error:', claudeResponse.status, errBody)
    return json({ error: 'Analysis service error' }, 502)
  }

  // ── Parse Claude response ──────────────────────────────────────────────────
  const claude = await claudeResponse.json() as {
    content: Array<{ type: string; text?: string }>
  }

  const text = claude.content?.find(b => b.type === 'text')?.text ?? ''
  const jsonMatch = text.match(/\{[\s\S]*\}/)

  if (!jsonMatch) {
    console.error('No JSON in Claude response. Raw text:', text.slice(0, 500))
    return json({ error: 'Could not read the photo — try a clearer image in good light' }, 422)
  }

  let diagnosis: Diagnosis
  try {
    diagnosis = sanitizeDiagnosis(JSON.parse(jsonMatch[0]))
  } catch (err) {
    console.error('Failed to parse diagnosis. Extracted JSON:', jsonMatch[0].slice(0, 500), err)
    return json({ error: 'Could not parse diagnosis from image' }, 422)
  }

  return json({ diagnosis }, 200)
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function sanitizeDiagnosis(raw: unknown): Diagnosis {
  if (typeof raw !== 'object' || raw === null) {
    throw new Error('Diagnosis must be an object')
  }
  const obj = raw as Record<string, unknown>

  const issues = Array.isArray(obj.issues)
    ? obj.issues.filter(isValidIssue)
    : []

  return {
    issues,
    summary:   typeof obj.summary   === 'string' ? obj.summary   : '',
    grassType: typeof obj.grassType === 'string' ? obj.grassType : undefined,
    season:    typeof obj.season    === 'string' ? obj.season    : undefined,
  }
}

function isValidIssue(i: unknown): i is Issue {
  if (typeof i !== 'object' || i === null) return false
  const o = i as Record<string, unknown>
  return (
    typeof o.id       === 'string' &&
    typeof o.label    === 'string' &&
    (o.severity === 'low' || o.severity === 'medium' || o.severity === 'high') &&
    Array.isArray(o.steps) && o.steps.every(s => typeof s === 'string')
  )
}

function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  })
}
