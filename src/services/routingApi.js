const DEFAULT_TIMEOUT_MS = 12_000

const configuredSource = import.meta.env.VITE_ROUTING_SOURCE?.trim().toLowerCase()

export const routingSource = configuredSource === 'backend' ? 'backend' : 'demo'
export const routingApiBaseUrl = (
  import.meta.env.VITE_API_BASE_URL?.trim() || 'http://127.0.0.1:8000'
).replace(/\/$/, '')

export class RoutingApiError extends Error {
  constructor(message, { status = null, kind = 'http', detail = null } = {}) {
    super(message)
    this.name = 'RoutingApiError'
    this.status = status
    this.kind = kind
    this.detail = detail
  }
}

function getErrorDetail(payload, fallback) {
  if (typeof payload?.detail === 'string') return payload.detail
  if (Array.isArray(payload?.detail)) {
    return payload.detail
      .map((item) => item?.msg)
      .filter(Boolean)
      .join(' ') || fallback
  }
  return fallback
}

export async function requestRoutingDecision(payload, { signal, timeoutMs = DEFAULT_TIMEOUT_MS } = {}) {
  const requestController = new AbortController()
  let timedOut = false
  const forwardAbort = () => requestController.abort(signal?.reason)

  if (signal?.aborted) {
    forwardAbort()
  } else {
    signal?.addEventListener('abort', forwardAbort, { once: true })
  }

  const timeoutId = window.setTimeout(() => {
    timedOut = true
    requestController.abort()
  }, timeoutMs)

  try {
    const response = await fetch(`${routingApiBaseUrl}/route`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: requestController.signal,
    })

    let responseBody
    try {
      responseBody = await response.json()
    } catch {
      responseBody = null
    }

    if (!response.ok) {
      const fallback = response.status === 400
        ? 'La selección manual no es compatible con la solicitud.'
        : response.status === 422
          ? 'La solicitud no es válida o no existe un modelo compatible.'
          : `OptiRoute API devolvió un error HTTP ${response.status}.`
      const detail = getErrorDetail(responseBody, fallback)
      throw new RoutingApiError(detail, { status: response.status, detail })
    }

    return responseBody
  } catch (error) {
    if (error instanceof RoutingApiError) throw error
    if (error?.name === 'AbortError') {
      throw new RoutingApiError(
        timedOut ? 'OptiRoute API tardó demasiado en responder.' : 'La solicitud de routing fue cancelada.',
        { kind: timedOut ? 'timeout' : 'cancelled' },
      )
    }
    throw new RoutingApiError('No se pudo conectar con OptiRoute API.', { kind: 'connection' })
  } finally {
    window.clearTimeout(timeoutId)
    signal?.removeEventListener('abort', forwardAbort)
  }
}
