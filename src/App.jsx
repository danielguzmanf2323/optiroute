import { useEffect, useRef, useState } from 'react'

const examples = {
  short: '¿Qué es una API REST y para qué sirve?',
  code: 'Analiza este error: una API desarrollada con FastAPI devuelve un error 401 después de renovar el token. Explica posibles causas y cómo diagnosticarlo.',
  document: 'Necesito analizar documentación técnica extensa de una arquitectura de datos, identificar dependencias, riesgos, decisiones de diseño y producir una recomendación técnica estructurada.',
  escalation: 'Explícame de forma breve cómo debería manejar una aplicación la renovación segura de tokens cuando una sesión expira.',
}

const routes = {
  simple: {
    model: 'GPT 5.6 Luna',
    complexity: 'Baja',
    saving: '94%',
    estimatedCost: '$0.0002',
    baselineCost: '$0.0032',
    baselineModel: 'GPT 5.6 Sol',
    reason: 'La tarea requiere poco razonamiento y contexto. Un modelo ligero puede resolverla sin utilizar capacidad premium.',
  },
  intermediate: {
    model: 'Claude Haiku 4.5',
    complexity: 'Media',
    saving: '75%',
    estimatedCost: '$0.0030',
    baselineCost: '$0.0120',
    baselineModel: 'GPT 5.6 Sol',
    reason: 'La tarea necesita razonamiento técnico, pero no justifica todavía el costo de un modelo premium.',
  },
  complex: {
    model: 'Gemini 2.5 Pro',
    complexity: 'Alta',
    saving: '60%',
    estimatedCost: '$0.0120',
    baselineCost: '$0.0300',
    baselineModel: 'GPT 5.6 Sol',
    reason: 'La tarea requiere mayor contexto y capacidad de análisis. OptiRoute seleccionó un modelo más potente manteniendo un costo inferior a la referencia premium.',
  },
}

const escalatedRoute = {
  model: 'Claude Haiku 4.5',
  complexity: 'Media',
  estimatedCost: '$0.0032',
  baselineCost: '$0.0120',
  baselineModel: 'GPT 5.6 Sol',
  saving: '73.3%',
  reason: 'La primera respuesta no alcanzó el criterio de calidad definido. OptiRoute escaló automáticamente a un modelo con mayor capacidad.',
  initialModel: 'GPT 5.6 Luna',
  initialCost: '$0.0002',
  escalated: true,
  verification: 'Superada',
}

function parseCost(value) {
  return Number(value.replace('$', ''))
}

function formatCost(value) {
  return `$${value.toFixed(4)}`
}

function getHistoryLabel(prompt) {
  if (prompt === examples.short) return 'Pregunta corta'
  if (prompt === examples.code) return 'Analizar código'
  if (prompt === examples.document) return 'Documento largo'
  if (prompt === examples.escalation) return 'Escalamiento de calidad'
  return 'Solicitud personalizada'
}

export const agentPresets = {
  analyst: {
    shape: 'circle',
    color: 'orange',
    accessory: 'visor',
    mood: 'focused',
  },
  verifier: {
    shape: 'diamond',
    color: 'purple',
    accessory: 'halo',
    mood: 'neutral',
  },
  router: {
    shape: 'roundedSquare',
    color: 'blue',
    accessory: 'hat',
    mood: 'happy',
  },
  explorer: {
    shape: 'triangle',
    color: 'teal',
    accessory: 'antenna',
    mood: 'neutral',
  },
}

function AgentAvatar({
  shape = 'circle',
  color = 'blue',
  accessory = 'none',
  mood = 'neutral',
  size = 'sm',
  active = false,
  className = '',
}) {
  return (
    <span
      aria-hidden="true"
      className={`agent-avatar agent-avatar--${shape} agent-avatar--${color} agent-avatar--${mood} agent-avatar--${size} ${active ? 'agent-avatar--active' : ''} ${className}`}
    >
      <span className="agent-avatar__body">
        <span className="agent-avatar__highlight" />
        <span className="agent-avatar__face">
          <span className="agent-eye agent-eye--left" />
          <span className="agent-eye agent-eye--right" />
          <span className="agent-mouth" />
        </span>
        <span className="agent-avatar__signal" />
      </span>

      {accessory === 'hat' && (
        <span className="agent-hat"><span /></span>
      )}
      {accessory === 'visor' && <span className="agent-visor" />}
      {accessory === 'antenna' && <span className="agent-antenna" />}
      {accessory === 'halo' && <span className="agent-halo" />}
    </span>
  )
}

function OptiRouteMascot({ size = 'sm', active = false, mood = 'neutral', className = '' }) {
  return (
    <AgentAvatar
      shape="roundedSquare"
      color="blue"
      accessory="halo"
      mood={mood}
      size={size}
      active={active}
      className={`opti-mascot ${className}`}
    />
  )
}

function classifyTask(userMessage) {
  if (userMessage === examples.escalation) {
    return routes.simple
  }

  if (userMessage === examples.short) {
    return routes.simple
  }

  if (userMessage === examples.code) {
    return routes.intermediate
  }

  if (userMessage === examples.document) {
    return routes.complex
  }

  const normalizedMessage = userMessage
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()

  const isGreeting = /^(hola\b|buenos dias\b|buenas tardes\b|buenas noches\b)/.test(normalizedMessage)

  if (isGreeting) {
    return routes.simple
  }

  if (
    /documento largo|documentacion extensa|documentacion tecnica extensa|analisis profundo|informe completo|analiza este documento|analizar este documento|resumir documento|resumen de este documento|dependencias y riesgos|analizar documentacion|analisis documental/.test(normalizedMessage)
  ) {
    return routes.complex
  }

  if (userMessage.length > 1200) {
    const braceCount = (userMessage.match(/[{}]/g) || []).length
    const codeStructureCount = (
      userMessage.match(/(?:=>|===|!==|;\s*$|^\s*(?:if|for|while|try|catch)\s*\()/gm) || []
    ).length
    const hasStrongCodeSignal =
      /\b(function|const|let|var|class|classname|usestate|import|export|def|return|select|from|traceback|exception|stack trace|syntaxerror|typeerror)\b|console\.log/.test(normalizedMessage) ||
      userMessage.includes('```') ||
      braceCount >= 6 ||
      codeStructureCount >= 3

    return hasStrongCodeSignal ? routes.intermediate : routes.complex
  }

  if (
    /\b(codigo|error|fastapi|python|javascript|react|sql|debug|debugging|token|401|backend|frontend|endpoint|funcion|function|classname|const|usestate)\b/.test(normalizedMessage)
  ) {
    return routes.intermediate
  }

  return routes.simple
}

function getAssistantResponse(userMessage) {
  const normalizedMessage = userMessage
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()

  if (/^(hola\b|buenos dias\b|buenas tardes\b|buenas noches\b)/.test(normalizedMessage)) {
    return normalizedMessage === 'hola'
      ? '¡Hola! ¿En qué puedo ayudarte hoy?'
      : '¡Hola! Muy bien. ¿En qué puedo ayudarte hoy?'
  }

  if (userMessage === examples.short) {
    return 'Una API REST permite que distintas aplicaciones se comuniquen mediante solicitudes HTTP siguiendo una estructura predecible. Se utiliza, por ejemplo, para que un frontend consulte o modifique información gestionada por un backend.'
  }

  if (userMessage === examples.code) {
    return 'Un error 401 después de renovar un token suele estar relacionado con expiración, firma, audiencia, permisos o con el uso de un token anterior. Revisaría primero el token enviado, sus claims, la configuración de validación en FastAPI y los logs del servicio de autenticación.'
  }

  if (userMessage === examples.document) {
    return 'Para este tipo de análisis conviene separar la revisión en arquitectura, dependencias, riesgos y decisiones técnicas. OptiRoute ha seleccionado una ruta con mayor capacidad de contexto para conservar coherencia durante el análisis.'
  }

  if (userMessage === examples.escalation) {
    return 'Cuando una sesión expira, la aplicación debería usar un refresh token almacenado de forma segura para solicitar un nuevo access token, validar expiración, audiencia y permisos, rotar el refresh token cuando corresponda y cerrar la sesión si la renovación falla. El access token anterior no debería reutilizarse después de expirar.'
  }

  return 'OptiRoute ha analizado tu solicitud y seleccionado una ruta de IA de acuerdo con su complejidad.'
}

function App() {
  const [message, setMessage] = useState('')
  const [messages, setMessages] = useState([])
  const [route, setRoute] = useState(null)
  const [processing, setProcessing] = useState(false)
  const [routeStage, setRouteStage] = useState('idle')
  const [sessionStats, setSessionStats] = useState({
    requests: 0,
    optiRouteCost: 0,
    premiumCost: 0,
    savings: 0,
  })
  const [history, setHistory] = useState([])
  const [historyOpen, setHistoryOpen] = useState(false)
  const [budget, setBudget] = useState(0.1)
  const [budgetEditing, setBudgetEditing] = useState(false)
  const [budgetDraft, setBudgetDraft] = useState('0.1000')
  const sessionGeneration = useRef(0)
  const messagesContainerRef = useRef(null)

  const spent = sessionStats.optiRouteCost
  const remaining = Math.max(budget - spent, 0)
  const usagePercentage = budget > 0 ? (spent / budget) * 100 : 0
  const safeUsagePercentage = Math.min(usagePercentage, 100)
  const isNearBudget = usagePercentage >= 80 && usagePercentage < 100
  const isOverBudget = usagePercentage >= 100

  useEffect(() => {
    const container = messagesContainerRef.current

    if (container) {
      container.scrollTop = container.scrollHeight
    }
  }, [messages, processing, routeStage])

  const saveBudget = () => {
    const newBudget = Number(budgetDraft)

    if (!Number.isFinite(newBudget) || newBudget <= 0) return

    setBudget(newBudget)
    setBudgetDraft(newBudget.toFixed(4))
    setBudgetEditing(false)
  }

  const cancelBudgetEditing = () => {
    setBudgetDraft(budget.toFixed(4))
    setBudgetEditing(false)
  }

  const sendMessage = async () => {
    if (!message.trim() || processing) return

    const userMessage = message.trim()
    const activeGeneration = sessionGeneration.current
    const isEscalation = userMessage === examples.escalation

    setMessages((currentMessages) => [
      ...currentMessages,
      {
        role: 'user',
        content: userMessage,
      },
    ])
    setMessage('')
    setProcessing(true)
    setRouteStage('analyzing')

    await new Promise((resolve) => setTimeout(resolve, 400))

    if (activeGeneration !== sessionGeneration.current) return

    const initialRoute = classifyTask(userMessage)
    setRoute(initialRoute)
    setRouteStage('selected')

    let selectedRoute

    if (isEscalation) {
      await new Promise((resolve) => setTimeout(resolve, 400))
      if (activeGeneration !== sessionGeneration.current) return

      const initialResponse = 'Cuando una sesión expira, la aplicación puede solicitar un nuevo token y continuar.'
      const initialVerificationPassed = false

      setRouteStage('verifying')
      await new Promise((resolve) => setTimeout(resolve, 500))
      if (activeGeneration !== sessionGeneration.current) return

      if (initialResponse && !initialVerificationPassed) {
        setRouteStage('escalating')
        await new Promise((resolve) => setTimeout(resolve, 500))
        if (activeGeneration !== sessionGeneration.current) return
      }

      selectedRoute = escalatedRoute
      setRoute(selectedRoute)
      setRouteStage('verifying')

      await new Promise((resolve) => setTimeout(resolve, 500))
      if (activeGeneration !== sessionGeneration.current) return
    } else {
      await new Promise((resolve) => setTimeout(resolve, 100))
      if (activeGeneration !== sessionGeneration.current) return

      setRouteStage('verifying')
      await new Promise((resolve) => setTimeout(resolve, 100))
      if (activeGeneration !== sessionGeneration.current) return

      selectedRoute = {
        ...initialRoute,
        escalated: false,
        verification: 'Superada',
      }
    }

    const estimatedCost = parseCost(selectedRoute.estimatedCost)
    const baselineCost = parseCost(selectedRoute.baselineCost)
    const assistantResponse = getAssistantResponse(userMessage)
    const now = new Date()
    const createdAt = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`

    setMessages((currentMessages) => [
      ...currentMessages,
      {
        role: 'assistant',
        content: assistantResponse,
      },
    ])
    setRoute(selectedRoute)
    setRouteStage('verified')
    setSessionStats((currentStats) => ({
      requests: currentStats.requests + 1,
      optiRouteCost: currentStats.optiRouteCost + estimatedCost,
      premiumCost: currentStats.premiumCost + baselineCost,
      savings: currentStats.savings + baselineCost - estimatedCost,
    }))
    setHistory((currentHistory) => [
      ...currentHistory,
      {
        id: Date.now(),
        prompt: userMessage,
        response: assistantResponse,
        model: selectedRoute.model,
        complexity: selectedRoute.complexity,
        estimatedCost,
        baselineCost,
        saving: selectedRoute.saving,
        savingAmount: baselineCost - estimatedCost,
        escalated: selectedRoute.escalated,
        initialModel: selectedRoute.escalated ? selectedRoute.initialModel : null,
        finalModel: selectedRoute.model,
        verification: selectedRoute.verification,
        createdAt,
      },
    ])
    setProcessing(false)
  }

  useEffect(() => {
    if (!historyOpen) return undefined

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setHistoryOpen(false)
      }
    }

    document.addEventListener('keydown', handleKeyDown)

    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [historyOpen])

  const resetSession = () => {
    const confirmed = window.confirm(
      '¿Quieres reiniciar la sesión? Se eliminará el historial y las métricas actuales.',
    )

    if (!confirmed) return

    sessionGeneration.current += 1
    setMessages([])
    setRoute(null)
    setSessionStats({
      requests: 0,
      optiRouteCost: 0,
      premiumCost: 0,
      savings: 0,
    })
    setHistory([])
    setMessage('')
    setProcessing(false)
    setRouteStage('idle')
    setBudgetDraft(budget.toFixed(4))
    setBudgetEditing(false)
    setHistoryOpen(false)
  }

  return (
    <div className="app-shell min-h-screen overflow-x-hidden text-[#F3F2EE]">
      <header className="h-16 border-b border-white/[0.08] bg-[#0D0F12]/85 backdrop-blur-xl">
        <div className="mx-auto flex h-full max-w-[1400px] items-center justify-between px-5 sm:px-8">
          <div className="flex items-center gap-3 text-sm">
            <span className="font-medium">IneBrain</span>
            <span className="text-[#626467]">/</span>
            <OptiRouteMascot size="xs" />
            <span className="text-[#A0A1A3]">OptiRoute</span>
            <span className="rounded border border-white/[0.08] bg-white/[0.03] px-1.5 py-0.5 text-[10px] uppercase tracking-[0.08em] text-[#626467]">
              DEMO
            </span>
          </div>

          <button
            onClick={() => setHistoryOpen(true)}
            aria-expanded={historyOpen}
            className="history-trigger group relative flex items-center gap-2 px-1 py-2 text-sm text-[#A1A6AE] transition-colors duration-[160ms] hover:text-[#F3F2EE]"
          >
            <span>Historial</span>
            {history.length > 0 && (
              <span className="history-counter rounded-md border border-[#D6A24A]/20 bg-[#D6A24A]/[0.07] px-1.5 py-0.5 text-[9px] leading-none text-[#D6A24A]/80 transition-opacity duration-[160ms] group-hover:opacity-100">
                {history.length}
              </span>
            )}
          </button>
        </div>
      </header>

      <main className="mx-auto grid w-full max-w-[1400px] grid-cols-1 gap-8 px-6 py-8 md:h-[calc(100vh-64px)] md:min-h-0 md:grid-cols-[minmax(0,1fr)_340px] md:gap-10 md:overflow-hidden md:px-8 md:py-10">
        <section className="relative flex h-[calc(100vh-8rem)] min-h-[600px] min-w-0 flex-col md:h-full md:min-h-0 md:overflow-hidden">
          <div className="absolute -left-5 top-1 hidden h-28 flex-col items-center justify-between md:flex">
            <span className="absolute top-1 bottom-1 w-px bg-white/[0.06]" />
            <span className="relative h-2 w-2 rounded-full border border-[#D9A441]/60 bg-[#D9A441]" />
            <span className="relative h-2 w-2 rounded-full border border-white/10 bg-[#17181A]" />
            <span className="relative h-2 w-2 rounded-full border border-white/10 bg-[#17181A]" />
            <span className="relative h-2 w-2 rounded-full border border-white/10 bg-[#17181A]" />
          </div>

          <div className="chat-heading-glow relative isolate shrink-0">
            <p className="mb-3 text-[11px] uppercase tracking-[0.18em] text-[#626467]">
              Nueva conversación
            </p>

            <h1 className="text-3xl font-medium tracking-[-0.03em] text-[#F4F4F2]">
              Hola, ¿qué quieres resolver?
            </h1>

            <div className="mt-4 hidden items-center gap-2 text-[10px] uppercase tracking-[0.12em] text-[#626467] md:flex">
              <span className="h-1.5 w-1.5 rounded-full bg-[#D9A441]" />
              <span>Sistema activo</span>
              <span className="h-px w-12 bg-white/[0.08]" />
            </div>

            {messages.length === 0 && (
              <div className="mt-7">
                <p className="text-[10px] uppercase tracking-[0.18em] text-[#6F757D]">
                  Routing workspace
                </p>
                <p className="mt-2 text-[11px] text-[#6F757D]">
                  Escribe una tarea y OptiRoute seleccionará la ruta de IA más eficiente.
                </p>
              </div>
            )}
          </div>

          <div
            ref={messagesContainerRef}
            className="mt-10 min-h-0 flex-1 overflow-y-auto pr-2"
          >
            <div className="max-w-3xl space-y-7 pb-8">
              {messages.map((item, index) => (
                item.role === 'user' ? (
                  <div key={index} className="message-enter pl-1">
                    <p className="mb-2 flex items-center gap-2 text-[10px] font-medium uppercase tracking-[0.16em] text-[#6F757D]">
                      <span className="h-1.5 w-1.5 rounded-full bg-[#6F757D]" />
                      Tú
                    </p>
                    <p className="max-w-2xl whitespace-pre-wrap break-words text-[15px] leading-7 text-[#E4E5E7] [overflow-wrap:anywhere]">
                      {item.content}
                    </p>
                  </div>
                ) : (
                  <div key={index} className="message-enter flex items-stretch gap-3">
                    <div className="flex flex-col items-center">
                      <OptiRouteMascot size="sm" />
                      <span className="mt-2 w-px flex-1 bg-[#D6A24A]/25" />
                    </div>
                    <div className="min-w-0 pb-1">
                      <p className="mb-2 text-[10px] font-medium uppercase tracking-[0.16em] text-[#D6A24A]/75">
                        OptiRoute
                      </p>
                      <p className="max-w-2xl whitespace-pre-wrap break-words text-[15px] leading-7 text-[#E4E5E7] [overflow-wrap:anywhere]">
                        {item.content}
                      </p>
                    </div>
                  </div>
                )
              ))}

              {processing && (
                <div className="message-enter flex items-stretch gap-3">
                  <div className="flex flex-col items-center">
                    <OptiRouteMascot size="sm" active mood="focused" />
                    <span className="mt-2 w-px flex-1 bg-[#D6A24A]/25" />
                  </div>
                  <div className="min-w-0 pb-1">
                    <p className="mb-2 text-[10px] font-medium uppercase tracking-[0.16em] text-[#D6A24A]/75">
                      OptiRoute
                    </p>
                    <div className="flex items-center gap-3 text-[15px] leading-7 text-[#A1A6AE]">
                      <span>
                        {routeStage === 'escalating'
                          ? 'Verificación insuficiente. Escalando modelo...'
                          : routeStage === 'verifying'
                            ? 'Verificando respuesta...'
                            : 'Analizando tarea...'}
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="processing-dot h-1 w-1 rounded-full bg-[#D6A24A]" />
                        <span className="processing-dot h-1 w-1 rounded-full bg-[#D6A24A]" />
                        <span className="processing-dot h-1 w-1 rounded-full bg-[#D6A24A]" />
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="composer-shell mt-4 shrink-0 rounded-[18px] border border-white/[0.08] bg-[#111418]/[0.92] p-3 transition-[border-color,box-shadow] duration-200 focus-within:border-[#7BC6FF]/[0.22]">
            <textarea
              rows="3"
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && !event.shiftKey) {
                  event.preventDefault()
                  sendMessage()
                }
              }}
              placeholder="Escribe una tarea para OptiRoute..."
              className="h-[112px] w-full resize-none overflow-x-hidden bg-transparent p-3 text-[15px] text-[#F4F4F2] outline-none placeholder:text-[#626467]"
            />

            <div className="flex justify-end">
              <button
                onClick={sendMessage}
                disabled={processing}
                className="rounded-[10px] border border-white/15 bg-[#F1F1EE] px-4 py-2 text-sm font-medium text-[#111214] shadow-[0_0_20px_rgba(123,198,255,0.08)] transition-[background-color,border-color,box-shadow,transform] duration-150 hover:-translate-y-px hover:border-white/25 hover:bg-white hover:shadow-[0_0_26px_rgba(123,198,255,0.14)] active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {processing ? 'Analizando...' : 'Enviar ↑'}
              </button>
            </div>
          </div>

          <div className="mt-4 flex shrink-0 flex-wrap items-center gap-x-3 gap-y-2 text-[11px] text-[#626467]">
            <span>Prueba con:</span>

            <button
              onClick={() => setMessage(examples.short)}
              className="cursor-pointer rounded-full border border-white/[0.07] bg-white/[0.025] px-2.5 py-1 text-[#797E85] transition-[color,border-color,background-color] duration-200 hover:border-[#D6A24A]/[0.22] hover:bg-white/[0.055] hover:text-[#E7E7E4]"
            >
              Pregunta corta
            </button>

            <span>·</span>

            <button
              onClick={() => setMessage(examples.code)}
              className="cursor-pointer rounded-full border border-white/[0.07] bg-white/[0.025] px-2.5 py-1 text-[#797E85] transition-[color,border-color,background-color] duration-200 hover:border-[#D6A24A]/[0.22] hover:bg-white/[0.055] hover:text-[#E7E7E4]"
            >
              Analizar código
            </button>

            <span>·</span>

            <button
              onClick={() => setMessage(examples.document)}
              className="cursor-pointer rounded-full border border-white/[0.07] bg-white/[0.025] px-2.5 py-1 text-[#797E85] transition-[color,border-color,background-color] duration-200 hover:border-[#D6A24A]/[0.22] hover:bg-white/[0.055] hover:text-[#E7E7E4]"
            >
              Documento largo
            </button>

            <span>·</span>

            <button
              onClick={() => setMessage(examples.escalation)}
              className="cursor-pointer rounded-full border border-[#D6A24A]/[0.18] bg-[#D6A24A]/[0.035] px-2.5 py-1 text-[#797E85] transition-[color,border-color,background-color] duration-200 hover:border-[#D6A24A]/30 hover:bg-[#D6A24A]/[0.07] hover:text-[#E7E7E4]"
            >
              Probar escalamiento
            </button>
          </div>
        </section>

        <div className="w-full min-w-0 md:flex md:h-full md:min-h-0 md:flex-col">
          <aside className={`route-panel h-fit rounded-2xl border border-white/[0.08] bg-[#0D0F12] p-6 transition-[border-color,max-height,opacity] duration-[380ms] md:h-auto md:min-h-0 ${
            routeStage !== 'idle'
              ? 'route-panel-enter md:max-h-full md:flex-1 md:overflow-y-auto'
              : 'md:max-h-[250px] md:flex-none md:overflow-hidden'
          }`}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[11px] uppercase tracking-[0.2em] text-[#A1A6AE]">
                  Routing Engine
                </p>
                <p className="mt-1 text-[9px] uppercase tracking-[0.14em] text-[#6F757D]">
                  OptiRoute Decision Layer
                </p>
              </div>

              <OptiRouteMascot
                size="lg"
                active={routeStage !== 'idle' && routeStage !== 'verified'}
                mood={routeStage === 'analyzing' || routeStage === 'verifying' || routeStage === 'escalating' ? 'focused' : 'neutral'}
                className={
                  routeStage === 'analyzing'
                    ? 'router-core-analyzing'
                    : routeStage === 'selected'
                      ? 'router-core-selected'
                      : routeStage === 'verifying'
                        ? 'router-core-verifying'
                        : routeStage === 'escalating'
                          ? 'router-core-escalating'
                          : ''
                }
              />
            </div>

            <div className="relative mt-6">
              <span className="absolute left-[16.66%] top-[5px] h-px w-[33.33%] bg-white/[0.08]" />
              <span className="absolute left-1/2 top-[5px] h-px w-[33.33%] bg-white/[0.08]" />
              <span className={`route-progress-fill absolute left-[16.66%] top-[5px] h-px w-[33.33%] origin-left bg-[#D6A24A]/65 ${
                routeStage === 'selected' || routeStage === 'verifying' || routeStage === 'escalating' || routeStage === 'verified'
                  ? 'scale-x-100'
                  : 'scale-x-0'
              }`} />
              <span className={`route-progress-fill absolute left-1/2 top-[5px] h-px w-[33.33%] origin-left bg-[#D6A24A]/65 ${
                routeStage === 'verifying' || routeStage === 'verified' ? 'scale-x-100' : 'scale-x-0'
              }`} />

              <div className="relative grid grid-cols-3 text-center text-[10px] tracking-wide">
                <div className="flex flex-col items-center gap-2">
                  <span className={`route-node h-[11px] w-[11px] rounded-full border ${
                    routeStage === 'analyzing'
                      ? 'route-node-active border-[#D6A24A] bg-[#D6A24A]'
                      : routeStage === 'idle'
                        ? 'border-white/10 bg-[#0D0F12]'
                        : 'border-white/35 bg-[#A1A6AE]'
                  }`} />
                  <span className={routeStage === 'analyzing' ? 'text-[#D6A24A]' : routeStage === 'idle' ? 'text-[#6F757D]' : 'text-white/60'}>Analizar</span>
                </div>

                <div className="flex flex-col items-center gap-2">
                  <span className={`route-node h-[11px] w-[11px] rounded-full border ${
                    routeStage === 'selected' || routeStage === 'escalating'
                      ? 'route-node-active border-[#D6A24A] bg-[#D6A24A]'
                      : routeStage === 'verifying' || routeStage === 'verified'
                        ? 'border-white/35 bg-[#A1A6AE]'
                        : 'border-white/10 bg-[#0D0F12]'
                  }`} />
                  <span className={routeStage === 'selected' || routeStage === 'escalating' ? 'text-[#D6A24A]' : routeStage === 'verifying' || routeStage === 'verified' ? 'text-white/60' : 'text-[#6F757D]'}>Seleccionar</span>
                </div>

                <div className="flex flex-col items-center gap-2">
                  <span className={`route-node h-[11px] w-[11px] rounded-full border ${
                    routeStage === 'verifying'
                      ? 'route-node-active border-[#D6A24A] bg-[#D6A24A]'
                      : routeStage === 'verified'
                        ? 'border-white/35 bg-[#A1A6AE]'
                        : 'border-white/10 bg-[#0D0F12]'
                  }`} />
                  <span className={routeStage === 'verifying' ? 'text-[#D6A24A]' : routeStage === 'verified' ? 'text-white/60' : 'text-[#6F757D]'}>Verificar</span>
                </div>
              </div>
            </div>

            <div className="mt-5 border-t border-white/[0.06] pt-4">
              <p className="text-[9px] uppercase tracking-[0.16em] text-[#6F757D]">Estado</p>
              <p className="mt-1 flex items-center gap-2 text-xs text-[#D8D8D5]">
                <span className={`h-1.5 w-1.5 rounded-full ${routeStage === 'idle' ? 'bg-white/20' : routeStage === 'verified' ? 'bg-white/55' : 'route-node-pulse bg-[#D6A24A]'}`} />
                {routeStage === 'idle'
                  ? 'Esperando una tarea'
                  : routeStage === 'analyzing'
                    ? 'Analizando solicitud'
                    : routeStage === 'selected'
                      ? 'Modelo seleccionado'
                      : routeStage === 'verifying'
                        ? 'Verificando calidad'
                        : routeStage === 'escalating'
                          ? 'Escalando modelo'
                          : 'Ruta verificada'}
              </p>
              {routeStage === 'idle' && (
                <p className="mt-2 text-xs leading-5 text-[#6F757D]">
                  Envía una solicitud para iniciar el routing.
                </p>
              )}
            </div>

            {routeStage === 'analyzing' && (
              <div className="route-item-reveal mt-4 grid grid-cols-3 gap-2 text-[9px] text-[#6F757D]">
                {['Complejidad', 'Contexto', 'Costo'].map((item) => (
                  <span key={item} className="flex items-center gap-1.5">
                    <span className="route-node-pulse h-1 w-1 rounded-full bg-[#7BC6FF]/70" />
                    {item}
                  </span>
                ))}
              </div>
            )}

            {routeStage === 'escalating' && (
              <div className="route-item-reveal mt-4 rounded-lg border border-[#D6A24A]/15 bg-[#D6A24A]/[0.025] px-3 py-2.5">
                <p className="text-[9px] uppercase tracking-[0.14em] text-[#6F757D]">Escalamiento activo</p>
                <div className="mt-2 flex items-center gap-2 text-xs">
                  <span className="text-[#A1A6AE]">GPT 5.6 Luna</span>
                  <span className="route-escalation-line h-px flex-1 bg-[#D6A24A]/60" />
                  <span className="font-medium text-[#F3F2EE]">Claude Haiku 4.5</span>
                </div>
              </div>
            )}

            {route && routeStage !== 'analyzing' && (
              <div key={`${route.model}-${route.estimatedCost}`} className="mt-6">
                <section className="route-item-reveal rounded-xl border border-white/[0.07] bg-white/[0.018] p-4">
                  <p className="text-[9px] uppercase tracking-[0.15em] text-[#6F757D]">
                    {route.escalated ? 'Modelo final' : 'Modelo seleccionado'}
                  </p>
                  <p className="mt-1 text-lg font-medium tracking-[-0.02em] text-[#F3F2EE]">{route.model}</p>
                  <p className="mt-2 flex items-center gap-2 text-xs text-[#A1A6AE]">
                    <span className="h-px w-4 bg-[#D6A24A]/60" />
                    Complejidad {route.complexity.toLowerCase()}
                  </p>
                </section>

                <section className="route-item-reveal mt-4 grid grid-cols-2 gap-4 border-y border-white/[0.07] py-4">
                  <div>
                    <p className="text-[9px] uppercase tracking-[0.14em] text-[#6F757D]">Costo OptiRoute</p>
                    <p className="mt-1 text-lg font-medium">{route.estimatedCost}</p>
                  </div>
                  <div>
                    <p className="text-[9px] uppercase tracking-[0.14em] text-[#6F757D]">Ahorro</p>
                    <p className="mt-1 text-2xl font-medium tracking-[-0.03em]">{route.saving}</p>
                    <p className="mt-1 text-[10px] text-[#6F757D]">
                      {formatCost(parseCost(route.baselineCost) - parseCost(route.estimatedCost))} en esta solicitud
                    </p>
                  </div>
                </section>

                <section className="route-item-reveal mt-4">
                  <p className="text-[9px] uppercase tracking-[0.14em] text-[#6F757D]">Referencia premium</p>
                  <p className="mt-1 text-sm text-[#A1A6AE]">{route.baselineModel} · {route.baselineCost}</p>
                </section>

                <section className="route-item-reveal mt-5 border-l border-[#D6A24A]/20 pl-4">
                  <p className="text-[9px] uppercase tracking-[0.14em] text-[#6F757D]">Motivo</p>
                  <p className="mt-2 text-sm leading-6 text-[#A1A6AE]">{route.reason}</p>
                </section>

                {routeStage === 'verified' && (
                  <section className="route-item-reveal mt-5 border-t border-white/[0.07] pt-5">
                    {route.escalated ? (
                      <div>
                        <p className="text-[9px] uppercase tracking-[0.16em] text-[#6F757D]">Escalamiento</p>
                        <div className="mt-4 space-y-0">
                          <div className="relative flex gap-3 pb-5">
                            <span className="relative z-10 mt-1 h-2.5 w-2.5 rounded-full border border-white/30 bg-[#A1A6AE]" />
                            <span className="absolute bottom-0 left-[5px] top-3 w-px bg-white/10" />
                            <div><p className="text-sm font-medium">{route.initialModel}</p><p className="mt-1 text-[10px] text-[#6F757D]">Modelo inicial</p></div>
                          </div>
                          <div className="relative flex gap-3 pb-5">
                            <span className="relative z-10 mt-1 h-2.5 w-2.5 rounded-full border border-[#D6A24A]/50 bg-[#0D0F12]" />
                            <span className={`absolute bottom-0 left-[5px] top-3 w-px ${routeStage === 'escalating' ? 'route-escalation-line bg-[#D6A24A]/60' : 'bg-white/10'}`} />
                            <div><p className="text-[10px] uppercase tracking-[0.12em] text-[#6F757D]">Verificación inicial</p><p className="mt-1 text-sm text-[#D6A24A]">No superada</p></div>
                          </div>
                          <div className="relative flex gap-3 pb-5">
                            <span className={`relative z-10 mt-1 h-2.5 w-2.5 rounded-full border border-[#D6A24A]/60 bg-[#D6A24A] ${routeStage === 'escalating' ? 'route-node-pulse' : ''}`} />
                            <span className="absolute bottom-0 left-[5px] top-3 w-px bg-white/10" />
                            <div><p className="text-sm font-medium">{route.model}</p><p className="mt-1 text-[10px] text-[#6F757D]">Modelo final</p></div>
                          </div>
                          <div className="flex gap-3">
                            <span className="relative z-10 mt-1 h-2.5 w-2.5 rounded-full border border-white/35 bg-[#A1A6AE]" />
                            <div><p className="text-[10px] uppercase tracking-[0.12em] text-[#6F757D]">Verificación final</p><p className="mt-1 text-sm font-medium">{route.verification}</p></div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <p className="text-[9px] uppercase tracking-[0.14em] text-[#6F757D]">Verificación</p>
                        <p className="mt-2 flex items-center gap-2 text-sm font-medium"><span className="h-1.5 w-1.5 rounded-full bg-[#D6A24A]/80" />{route.verification}</p>
                      </div>
                    )}
                  </section>
                )}

                {sessionStats.requests > 0 && (
                  <section className="route-item-reveal mt-5 border-t border-white/[0.07] pt-5">
                    <p className="text-[9px] uppercase tracking-[0.16em] text-[#6F757D]">Sesión</p>
                    <dl className="mt-3 space-y-2 text-xs">
                      <div className="flex items-center justify-between gap-4"><dt className="text-[#6F757D]">Solicitudes</dt><dd className="font-medium">{sessionStats.requests}</dd></div>
                      <div className="flex items-center justify-between gap-4"><dt className="text-[#6F757D]">OptiRoute</dt><dd className="font-medium">{formatCost(sessionStats.optiRouteCost)}</dd></div>
                      <div className="flex items-center justify-between gap-4"><dt className="text-[#6F757D]">Referencia</dt><dd className="font-medium">{formatCost(sessionStats.premiumCost)}</dd></div>
                      <div className="flex items-center justify-between gap-4"><dt className="text-[#6F757D]">Ahorro</dt><dd className="font-medium">{formatCost(sessionStats.savings)}</dd></div>
                      <div className="flex items-center justify-between gap-4 border-t border-white/[0.06] pt-2"><dt className="text-[#6F757D]">Restante</dt><dd className="font-medium">{formatCost(remaining)}</dd></div>
                    </dl>
                  </section>
                )}
              </div>
            )}
          </aside>

          <p className="mt-2 w-full shrink-0 text-[9px] leading-3.5 text-white/20">
            Estimaciones de demostración basadas en el escenario del prototipo.
          </p>
        </div>
      </main>

      <div
        className={`fixed inset-0 z-50 ${historyOpen ? 'history-is-open pointer-events-auto' : 'pointer-events-none'}`}
      >
          <button
            type="button"
            aria-label="Cerrar historial"
            aria-hidden={!historyOpen}
            disabled={!historyOpen}
            onClick={() => {
              if (historyOpen) setHistoryOpen(false)
            }}
            className={`history-backdrop absolute inset-0 bg-black/[0.62] backdrop-blur-[2px] transition-opacity ease-[cubic-bezier(0.22,1,0.36,1)] ${
              historyOpen
                ? 'pointer-events-auto opacity-100 duration-[320ms]'
                : 'pointer-events-none opacity-0 duration-[320ms]'
            }`}
          />

          <aside
            role="dialog"
            aria-modal="true"
            aria-label="Historial de sesión"
            aria-hidden={!historyOpen}
            inert={!historyOpen}
            onClick={(event) => event.stopPropagation()}
            className={`history-drawer history-scrollbar fixed right-0 top-0 z-10 h-screen w-full max-w-[520px] origin-right transform-gpu overflow-y-auto border-l bg-[#0D0F12] text-[#F4F4F2] transition-[transform,opacity,border-color,box-shadow] duration-[420ms] ease-[cubic-bezier(0.22,1,0.36,1)] will-change-transform ${
              historyOpen
                ? 'pointer-events-auto translate-x-0 scale-100 border-l-[#D6A24A]/[0.12] opacity-100 shadow-[-24px_0_70px_rgba(0,0,0,0.30),-2px_0_20px_rgba(214,162,74,0.025)]'
                : 'pointer-events-none translate-x-[104%] scale-[0.995] border-l-transparent opacity-[0.92] shadow-none'
            }`}
          >
            <div className="p-6 sm:p-8">
              <div className="history-content-block history-delay-header flex items-start justify-between gap-5 border-b border-white/[0.08] pb-7">
                <div className="flex min-w-0 items-start gap-3">
                  <OptiRouteMascot size="sm" />
                  <div>
                    <h2 className="text-lg font-medium uppercase tracking-[0.04em] text-[#F3F2EE]">
                      Historial de sesión
                    </h2>
                    <p className="mt-1 text-[10px] uppercase tracking-[0.2em] text-white/30">
                      Session Intelligence
                    </p>
                    <p className="mt-3 flex items-center gap-2 text-[9px] uppercase tracking-[0.18em] text-white/30">
                      <span className="h-1.5 w-1.5 rounded-full bg-[#D6A24A]/80" />
                      Session log active
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setHistoryOpen(false)}
                  className="shrink-0 text-sm text-[#6F757D] transition-colors duration-150 hover:text-[#F3F2EE]"
                >
                  Cerrar
                </button>
              </div>

              <section className="history-content-block history-delay-summary pt-8">
                <p className="text-[10px] uppercase tracking-[0.18em] text-white/35">
                  Resumen
                </p>

                <div className="mt-6 grid grid-cols-2 gap-x-8 gap-y-7">
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.1em] text-white/30">Solicitudes</p>
                    <p className="mt-1.5 text-lg font-medium text-[#F3F2EE]">
                      {sessionStats.requests}
                    </p>
                  </div>

                  <div>
                    <p className="text-[10px] uppercase tracking-[0.1em] text-white/30">Costo OptiRoute</p>
                    <p className="mt-1.5 text-lg font-medium text-[#F3F2EE]">
                      {formatCost(sessionStats.optiRouteCost)}
                    </p>
                  </div>

                  <div>
                    <p className="text-[10px] uppercase tracking-[0.1em] text-white/30">Referencia premium</p>
                    <p className="mt-1.5 text-lg font-medium text-[#F3F2EE]">
                      {formatCost(sessionStats.premiumCost)}
                    </p>
                  </div>

                  <div>
                    <p className="text-[10px] uppercase tracking-[0.1em] text-white/30">Ahorro acumulado</p>
                    <p className="mt-1.5 text-lg font-medium text-[#D6A24A]/90">
                      {formatCost(sessionStats.savings)}
                    </p>
                  </div>
                </div>

                <div className="history-content-block history-delay-savings mt-8 border-t border-white/[0.08] pt-6">
                  <p className="text-[10px] uppercase tracking-[0.16em] text-white/35">
                    Ahorro real
                  </p>
                  <p className="mt-2 text-3xl font-medium tracking-[-0.04em] text-[#F3F2EE]">
                    {sessionStats.premiumCost === 0
                      ? '0.0%'
                      : `${((sessionStats.savings / sessionStats.premiumCost) * 100).toFixed(1)}%`}
                  </p>
                  <div className="mt-4 h-[3px] overflow-hidden rounded-full bg-white/[0.06]">
                    <div
                      className="h-full rounded-full bg-[#D6A24A]/70 transition-[width] duration-300"
                      style={{
                        width: `${Math.min(
                          sessionStats.premiumCost === 0
                            ? 0
                            : (sessionStats.savings / sessionStats.premiumCost) * 100,
                          100,
                        )}%`,
                      }}
                    />
                  </div>
                  <p className="mt-2 text-[10px] text-white/25">
                    vs. uso permanente del modelo premium
                  </p>
                </div>
              </section>

              <section className="history-content-block history-delay-budget mt-10 border-t border-white/[0.08] pt-8">
                <div className="flex items-center justify-between gap-6">
                  <p className="text-[10px] uppercase tracking-[0.18em] text-white/35">
                    Presupuesto
                  </p>

                  {!budgetEditing && (
                    <button
                      type="button"
                      onClick={() => {
                        setBudgetDraft(budget.toFixed(4))
                        setBudgetEditing(true)
                      }}
                      className="text-xs text-[#A1A6AE] transition-colors duration-150 hover:text-[#F3F2EE]"
                    >
                      Editar
                    </button>
                  )}
                </div>

                {budgetEditing ? (
                  <div className="mt-6 rounded-xl border border-white/[0.07] bg-white/[0.025] p-4">
                    <label htmlFor="session-budget" className="text-[10px] uppercase tracking-[0.12em] text-white/35">
                      Presupuesto de sesión
                    </label>

                    <div className="mt-3 flex items-center gap-3 rounded-lg border border-white/10 bg-[#0D0F12] px-3 py-2.5 transition-colors focus-within:border-[#D6A24A]/30">
                      <span className="text-xs text-white/30">USD</span>
                      <input
                        id="session-budget"
                        type="number"
                        step="0.0001"
                        min="0.0001"
                        value={budgetDraft}
                        onChange={(event) => setBudgetDraft(event.target.value)}
                        className="min-w-0 flex-1 bg-transparent text-sm text-[#F4F4F2] outline-none"
                      />
                    </div>

                    <div className="mt-4 flex items-center gap-3">
                      <button
                        type="button"
                        onClick={saveBudget}
                        className="rounded-lg border border-white/10 bg-[#F1F1EE] px-3 py-1.5 text-xs font-medium text-[#111214] transition-colors duration-150 hover:bg-white"
                      >
                        Guardar
                      </button>
                      <button
                        type="button"
                        onClick={cancelBudgetEditing}
                        className="px-2 py-1.5 text-xs text-[#A1A6AE] transition-colors duration-150 hover:text-[#F3F2EE]"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="mt-6">
                    <div className="grid grid-cols-2 gap-x-6 gap-y-6 sm:grid-cols-4">
                      <div>
                        <p className="text-[9px] uppercase tracking-[0.1em] text-white/25">Presupuesto</p>
                        <p className="mt-1.5 text-sm font-medium">
                          {formatCost(budget)}
                        </p>
                      </div>

                      <div>
                        <p className="text-[9px] uppercase tracking-[0.1em] text-white/25">Consumido</p>
                        <p className="mt-1.5 text-sm font-medium">
                          {formatCost(spent)}
                        </p>
                      </div>

                      <div>
                        <p className="text-[9px] uppercase tracking-[0.1em] text-white/25">Restante</p>
                        <p className="mt-1.5 text-sm font-medium">
                          {formatCost(remaining)}
                        </p>
                      </div>

                      <div>
                        <p className="text-[9px] uppercase tracking-[0.1em] text-white/25">Utilizado</p>
                        <p className="mt-1.5 text-sm font-medium">
                          {usagePercentage.toFixed(1)}%
                        </p>
                      </div>
                    </div>

                    <div className="mt-6 h-[3px] overflow-hidden rounded-full bg-white/[0.06]">
                      <div
                        className={`h-full rounded-full transition-[width,background-color] duration-300 ${
                          isOverBudget
                            ? 'bg-[#D6A24A]'
                            : isNearBudget
                              ? 'bg-[#D6A24A]/80'
                              : 'bg-[#7BC6FF]/55'
                        }`}
                        style={{ width: `${safeUsagePercentage}%` }}
                      />
                    </div>

                    {(isNearBudget || isOverBudget) && (
                      <div className={`mt-4 rounded-lg border border-[#D6A24A]/[0.12] bg-[#D6A24A]/[0.04] px-3 py-3 ${isOverBudget ? 'text-[#D6A24A]' : 'text-[#D6A24A]/80'}`}>
                        <p className="flex items-center gap-2 text-[10px] font-medium uppercase tracking-[0.12em]">
                          <span className="h-1.5 w-1.5 rounded-full bg-current" />
                          {isOverBudget ? 'Presupuesto alcanzado' : 'Consumo próximo al límite'}
                        </p>
                        <p className="mt-1.5 text-xs leading-5">
                          {isOverBudget
                            ? 'El presupuesto de la sesión ha sido alcanzado.'
                            : 'El consumo de la sesión se acerca al presupuesto definido.'}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </section>

              <section className="history-content-block history-delay-activity mt-10 border-t border-white/[0.08] pt-8">
                <p className="text-[10px] uppercase tracking-[0.18em] text-white/35">
                  Actividad de routing
                </p>
                <p className="mt-1 text-[9px] uppercase tracking-[0.14em] text-white/20">Solicitudes</p>

                {history.length === 0 ? (
                  <div className="py-12 text-center">
                    <OptiRouteMascot size="md" />
                    <p className="mt-5 text-[10px] font-medium uppercase tracking-[0.18em] text-white/55">
                      Sin actividad todavía
                    </p>
                    <p className="mx-auto mt-3 max-w-[280px] text-xs leading-5 text-white/35">
                      Las decisiones de routing aparecerán aquí a medida que uses OptiRoute.
                    </p>
                    <p className="mt-5 text-[9px] uppercase tracking-[0.18em] text-white/20">
                      Session log ready
                    </p>
                  </div>
                ) : (
                  <div className="mt-6 border-b border-white/[0.07]">
                    {[...history].reverse().map((entry, index) => (
                      <article key={entry.id} className="history-entry group border-t border-white/[0.07] px-3 py-[22px] transition-colors duration-150 sm:px-4">
                        <div className="flex items-center justify-between text-[9px] uppercase tracking-[0.18em] text-white/25">
                          <span>{String(history.length - index).padStart(2, '0')}</span>
                          <span>{entry.createdAt}</span>
                        </div>

                        <p className="mt-4 text-[10px] font-medium uppercase tracking-[0.16em] text-white/45">
                          {getHistoryLabel(entry.prompt)}
                        </p>

                        <p className="history-entry-prompt mt-2 break-words text-[13px] leading-5 text-[#D3D5D8] transition-colors duration-150 [overflow-wrap:anywhere]">
                          {entry.prompt.length > 160
                            ? `${entry.prompt.slice(0, 160)}…`
                            : entry.prompt}
                        </p>

                        {entry.escalated ? (
                          <div className="mt-5 border-l border-white/10 pl-4">
                            <p className="text-[9px] uppercase tracking-[0.18em] text-[#D6A24A]/60">
                              Escalamiento automático
                            </p>
                            <div className="relative mt-4 space-y-4">
                              <span className="absolute bottom-2 left-[4px] top-2 w-px bg-white/10" />
                              <div className="relative flex items-center gap-3">
                                <span className="z-10 h-2 w-2 rounded-full border border-white/25 bg-[#0D0F12]" />
                                <p className="text-xs text-[#D3D5D8]">{entry.initialModel}</p>
                              </div>
                              <div className="relative flex items-start gap-3">
                                <span className="z-10 mt-1 h-2 w-2 rounded-full border border-[#D6A24A]/50 bg-[#0D0F12]" />
                                <div><p className="text-[9px] uppercase tracking-[0.12em] text-white/30">Verificación inicial</p><p className="mt-1 text-xs text-[#D6A24A]/75">No superada</p></div>
                              </div>
                              <div className="relative flex items-center gap-3">
                                <span className="z-10 h-2 w-2 rounded-full bg-[#D6A24A]/80" />
                                <p className="text-xs font-medium text-[#F3F2EE]">{entry.finalModel}</p>
                              </div>
                              <div className="relative flex items-start gap-3">
                                <span className="z-10 mt-1 h-2 w-2 rounded-full border border-white/30 bg-[#A1A6AE]" />
                                <div><p className="text-[9px] uppercase tracking-[0.12em] text-white/30">Verificación final</p><p className="mt-1 text-xs text-white/70">{entry.verification}</p></div>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="mt-5 flex items-center justify-between gap-4">
                            <p className="flex min-w-0 items-center gap-2 text-sm font-medium text-[#F3F2EE]">
                              <span className={`history-model-dot h-1.5 w-1.5 shrink-0 rounded-full ${
                                entry.complexity === 'Baja'
                                  ? 'bg-[#7BC6FF]/70'
                                  : entry.complexity === 'Media'
                                    ? 'bg-[#D6A24A]/80'
                                    : 'bg-[#F3F2EE]/70'
                              }`} />
                              <span className="truncate">{entry.model}</span>
                            </p>
                            <span className="shrink-0 text-xs text-white/35">
                              {entry.complexity}
                            </span>
                          </div>
                        )}

                        <div className="mt-5 grid grid-cols-3 gap-3 border-t border-white/[0.06] pt-4">
                          <div>
                            <p className="text-[9px] uppercase tracking-[0.12em] text-white/25">Costo</p>
                            <p className="mt-1.5 text-xs font-medium text-white/75">
                              {formatCost(entry.estimatedCost)}
                            </p>
                          </div>

                          <div>
                            <p className="text-[9px] uppercase tracking-[0.12em] text-white/25">Referencia</p>
                            <p className="mt-1.5 text-xs font-medium text-white/75">
                              {formatCost(entry.baselineCost)}
                            </p>
                          </div>

                          <div>
                            <p className="text-[9px] uppercase tracking-[0.12em] text-white/25">Ahorro</p>
                            <p className="mt-1.5 text-xs font-medium text-[#D6A24A]/80">
                              {formatCost(entry.savingAmount)}
                            </p>
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </section>

              {history.length > 0 && (
                <div className="history-content-block history-delay-footer mt-10 border-t border-white/[0.08] pt-7">
                  <p className="text-[10px] uppercase tracking-[0.18em] text-white/30">
                    Reiniciar sesión
                  </p>
                  <p className="mt-2 text-xs leading-5 text-white/25">
                    Limpia conversación, métricas y actividad actual.
                  </p>
                  <button
                    type="button"
                    onClick={resetSession}
                    className="mt-4 text-sm text-[#A1A6AE] transition-colors duration-150 hover:text-[#D6A24A]"
                  >
                    ↻ Reiniciar sesión
                  </button>
                </div>
              )}
            </div>
          </aside>
      </div>
    </div>
  )
}

export default App
