import { useEffect, useRef, useState } from 'react'

const examples = {
  short: '¿Qué es una API REST y para qué sirve?',
  code: 'Analiza este error: una API desarrollada con FastAPI devuelve un error 401 después de renovar el token. Explica posibles causas y cómo diagnosticarlo.',
  document: 'Necesito analizar documentación técnica extensa de una arquitectura de datos, identificar dependencias, riesgos, decisiones de diseño y producir una recomendación técnica estructurada.',
  escalation: 'Explícame de forma breve cómo debería manejar una aplicación la renovación segura de tokens cuando una sesión expira.',
}

const DEMO_DEBUG = true

const quickPrompts = [
  { label: 'Analiza este código', prompt: examples.code },
  { label: 'Resume un documento', prompt: 'Resume este documento técnico e identifica sus decisiones principales, dependencias y riesgos.' },
  { label: 'Ayúdame con un error', prompt: 'Ayúdame a diagnosticar un error 401 en una API y propón pasos concretos para resolverlo.' },
  { label: 'Diseña una arquitectura', prompt: 'Diseña una arquitectura de software escalable, identifica sus componentes, dependencias y riesgos.' },
]

const providerCatalog = {
  openai: {
    name: 'OpenAI',
    premiumReference: {
      name: 'GPT 5.6 Sol',
      costs: { low: 0.0032, medium: 0.012, high: 0.03 },
    },
    models: [
      { id: 'gpt-5-6-luna', provider: 'openai', name: 'GPT 5.6 Luna', tier: 'efficient', complexity: 'low', estimatedCost: 0.0002 },
      { id: 'gpt-5-6-sol', provider: 'openai', name: 'GPT 5.6 Sol', tier: 'balanced', complexity: 'medium', estimatedCost: 0.006 },
      { id: 'gpt-5-6-sol-max-demo', provider: 'openai', name: 'GPT 5.6 Sol Max (Demo)', tier: 'premium', complexity: 'high', estimatedCost: 0.016 },
    ],
  },
  google: {
    name: 'Google',
    premiumReference: {
      name: 'Google Premium Reference (Demo)',
      costs: { low: 0.004, medium: 0.014, high: 0.032 },
    },
    models: [
      { id: 'gemini-flash-lite-demo', provider: 'google', name: 'Gemini Flash Lite (Demo)', tier: 'efficient', complexity: 'low', estimatedCost: 0.0004 },
      { id: 'gemini-2-5-flash-demo', provider: 'google', name: 'Gemini 2.5 Flash (Demo)', tier: 'balanced', complexity: 'medium', estimatedCost: 0.004 },
      { id: 'gemini-2-5-pro', provider: 'google', name: 'Gemini 2.5 Pro', tier: 'premium', complexity: 'high', estimatedCost: 0.012 },
    ],
  },
  anthropic: {
    name: 'Anthropic',
    premiumReference: {
      name: 'Anthropic Premium Reference (Demo)',
      costs: { low: 0.0042, medium: 0.012, high: 0.031 },
    },
    models: [
      { id: 'claude-haiku-eco-demo', provider: 'anthropic', name: 'Claude Haiku Eco (Demo)', tier: 'efficient', complexity: 'low', estimatedCost: 0.0006 },
      { id: 'claude-haiku-4-5', provider: 'anthropic', name: 'Claude Haiku 4.5', tier: 'balanced', complexity: 'medium', estimatedCost: 0.003 },
      { id: 'claude-sonnet-route-demo', provider: 'anthropic', name: 'Claude Sonnet Route (Demo)', tier: 'premium', complexity: 'high', estimatedCost: 0.014 },
    ],
  },
  meta: {
    name: 'Meta',
    premiumReference: {
      name: 'Meta Premium Reference (Demo)',
      costs: { low: 0.0018, medium: 0.006, high: 0.018 },
    },
    models: [
      { id: 'meta-route-lite-demo', provider: 'meta', name: 'Meta Route Lite (Demo)', tier: 'efficient', complexity: 'low', estimatedCost: 0.0001 },
      { id: 'meta-route-core-demo', provider: 'meta', name: 'Meta Route Core (Demo)', tier: 'balanced', complexity: 'medium', estimatedCost: 0.0018 },
      { id: 'meta-route-pro-demo', provider: 'meta', name: 'Meta Route Pro (Demo)', tier: 'premium', complexity: 'high', estimatedCost: 0.0065 },
    ],
  },
  deepseek: {
    name: 'DeepSeek',
    premiumReference: {
      name: 'DeepSeek Premium Reference (Demo)',
      costs: { low: 0.0015, medium: 0.005, high: 0.016 },
    },
    models: [
      { id: 'deepseek-route-lite-demo', provider: 'deepseek', name: 'DeepSeek Route Lite (Demo)', tier: 'efficient', complexity: 'low', estimatedCost: 0.0001 },
      { id: 'deepseek-route-core-demo', provider: 'deepseek', name: 'DeepSeek Route Core (Demo)', tier: 'balanced', complexity: 'medium', estimatedCost: 0.0015 },
      { id: 'deepseek-route-pro-demo', provider: 'deepseek', name: 'DeepSeek Route Pro (Demo)', tier: 'premium', complexity: 'high', estimatedCost: 0.0055 },
    ],
  },
  kimi: {
    name: 'Kimi',
    premiumReference: {
      name: 'Kimi Premium Reference (Demo)',
      costs: { low: 0.002, medium: 0.007, high: 0.02 },
    },
    models: [
      { id: 'kimi-route-lite-demo', provider: 'kimi', name: 'Kimi Route Lite (Demo)', tier: 'efficient', complexity: 'low', estimatedCost: 0.0002 },
      { id: 'kimi-route-core-demo', provider: 'kimi', name: 'Kimi Route Core (Demo)', tier: 'balanced', complexity: 'medium', estimatedCost: 0.0022 },
      { id: 'kimi-route-pro-demo', provider: 'kimi', name: 'Kimi Route Pro (Demo)', tier: 'premium', complexity: 'high', estimatedCost: 0.0075 },
    ],
  },
}

const globalRoutePreferences = {
  low: 'gpt-5-6-luna',
  medium: 'claude-haiku-4-5',
  high: 'gemini-2-5-pro',
}

const globalPremiumReference = {
  name: 'GPT 5.6 Sol',
  costs: { low: 0.0032, medium: 0.012, high: 0.03 },
}

const complexityOrder = ['low', 'medium', 'high']
const complexityLabels = { low: 'Baja', medium: 'Media', high: 'Alta' }

function parseCost(value) {
  return Number(value.replace('$', ''))
}

function formatCost(value) {
  return `$${value.toFixed(4)}`
}

function getAvailableModels(activeAgent) {
  if (activeAgent === 'global') {
    return Object.values(providerCatalog).flatMap((provider) => provider.models)
  }

  return providerCatalog[activeAgent]?.models || []
}

function getModelById(modelId) {
  return Object.values(providerCatalog)
    .flatMap((provider) => provider.models)
    .find((model) => model.id === modelId)
}

function getPremiumReference(activeAgent, complexity) {
  const reference = activeAgent === 'global'
    ? globalPremiumReference
    : providerCatalog[activeAgent].premiumReference

  return {
    model: reference.name,
    cost: reference.costs[complexity],
  }
}

function formatSaving(estimatedCost, baselineCost, escalated = false) {
  const percentage = Math.max(0, (1 - estimatedCost / baselineCost) * 100)
  return escalated ? `${percentage.toFixed(1)}%` : `${Math.round(percentage)}%`
}

function estimateTokensForDemo(prompt, complexity, tier) {
  const promptTokens = Math.max(80, Math.ceil(prompt.length / 4))
  const complexityMultiplier = { low: 4, medium: 9, high: 18 }[complexity] || 4
  const tierRatio = { efficient: 0.58, balanced: 0.72, premium: 0.86 }[tier] || 0.72
  const premium = Math.max(500, Math.round((promptTokens * complexityMultiplier + 700) / 100) * 100)
  const optiRoute = Math.max(300, Math.round((premium * tierRatio) / 100) * 100)
  const avoided = Math.max(0, Math.round((1 - optiRoute / premium) * 100))

  return { premium, optiRoute, avoided }
}

function formatTokenEstimate(value) {
  return value >= 1000 ? `${(value / 1000).toFixed(1)}k` : String(value)
}

function createRoute(model, classification, activeAgent, options = {}) {
  const provider = providerCatalog[model.provider]
  const estimatedCost = options.estimatedCost ?? model.estimatedCost
  const referenceComplexity = complexityOrder[
    Math.max(
      complexityOrder.indexOf(classification.complexity),
      complexityOrder.indexOf(model.complexity),
    )
  ]
  const reference = getPremiumReference(activeAgent, referenceComplexity)
  const restricted = activeAgent !== 'global'
  const escalated = options.escalated === true
  const mode = options.mode || 'auto'

  let reason

  if (mode === 'manual') {
    reason = `El usuario seleccionó manualmente ${provider.name} · ${model.name}. OptiRoute mantuvo esta elección durante la verificación.`
  } else if (escalated) {
    reason = restricted
      ? `La verificación inicial no fue superada. OptiRoute escaló dentro de ${provider.name} sin salir del proveedor permitido.`
      : `La verificación inicial no fue superada. OptiRoute escaló de ${options.initialProviderName} a ${provider.name} para aumentar la capacidad de la ruta.`
  } else {
    reason = restricted
      ? `El contexto está restringido a ${provider.name}. OptiRoute seleccionó la opción más eficiente disponible para esta complejidad.`
      : `OptiRoute seleccionó ${provider.name} y ${model.name} por ofrecer capacidad suficiente para la tarea con un costo inferior a la referencia premium.`
  }

  return {
    provider: model.provider,
    providerName: provider.name,
    contextAgent: activeAgent,
    mode,
    model: model.name,
    modelId: model.id,
    tier: model.tier,
    complexity: complexityLabels[classification.complexity],
    complexityId: classification.complexity,
    taskType: classification.type,
    intent: classification.intent,
    estimatedCost: formatCost(estimatedCost),
    baselineCost: formatCost(reference.cost),
    baselineModel: reference.model,
    saving: formatSaving(estimatedCost, reference.cost, escalated),
    reason,
    escalated,
    verification: options.verification,
    initialModel: options.initialModel,
    initialProvider: options.initialProvider,
    initialProviderName: options.initialProviderName,
    initialCost: options.initialCost,
  }
}

function selectManualRoute(classification, activeAgent, modelId) {
  const allowedModel = getAvailableModels(activeAgent).find((model) => model.id === modelId)
  return allowedModel
    ? createRoute(allowedModel, classification, activeAgent, { mode: 'manual' })
    : selectRoute(classification, activeAgent)
}

function selectRoute(classification, activeAgent) {
  const availableModels = getAvailableModels(activeAgent)
  const preferredModel = activeAgent === 'global'
    ? getModelById(globalRoutePreferences[classification.complexity])
    : availableModels
      .filter((model) => model.complexity === classification.complexity)
      .sort((first, second) => first.estimatedCost - second.estimatedCost)[0]

  return createRoute(preferredModel, classification, activeAgent)
}

function escalateRoute(classification, activeAgent, initialRoute) {
  const nextComplexityIndex = Math.min(
    complexityOrder.indexOf(classification.complexity) + 1,
    complexityOrder.length - 1,
  )
  const nextComplexity = complexityOrder[nextComplexityIndex]
  const availableModels = getAvailableModels(activeAgent)
  const escalatedModel = activeAgent === 'global'
    ? getModelById(globalRoutePreferences[nextComplexity])
    : availableModels
      .filter((model) => model.complexity === nextComplexity)
      .sort((first, second) => first.estimatedCost - second.estimatedCost)[0]
  const combinedCost = parseCost(initialRoute.estimatedCost) + escalatedModel.estimatedCost

  return createRoute(
    escalatedModel,
    { ...classification, complexity: nextComplexity },
    activeAgent,
    {
      escalated: true,
      verification: 'Superada',
      estimatedCost: combinedCost,
      initialModel: initialRoute.model,
      initialProvider: initialRoute.provider,
      initialProviderName: initialRoute.providerName,
      initialCost: initialRoute.estimatedCost,
    },
  )
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

const agents = [
  {
    id: 'global',
    name: 'OptiRoute Global',
    type: 'global',
    description: 'Todos los proveedores',
    avatar: { shape: 'roundedSquare', color: 'blue', accessory: 'hat', mood: 'focused' },
  },
  {
    id: 'openai',
    name: 'OpenAI',
    type: 'provider',
    description: 'Proveedor',
    avatar: { shape: 'circle', color: 'teal', accessory: 'visor', mood: 'focused' },
  },
  {
    id: 'google',
    name: 'Google',
    type: 'provider',
    description: 'Proveedor',
    avatar: { shape: 'roundedSquare', color: 'blue', accessory: 'antenna', mood: 'happy' },
  },
  {
    id: 'anthropic',
    name: 'Anthropic',
    type: 'provider',
    description: 'Proveedor',
    avatar: { shape: 'diamond', color: 'purple', accessory: 'halo', mood: 'neutral' },
  },
  {
    id: 'meta',
    name: 'Meta',
    type: 'provider',
    description: 'Proveedor',
    avatar: { shape: 'triangle', color: 'blue', accessory: 'visor', mood: 'focused' },
  },
  {
    id: 'deepseek',
    name: 'DeepSeek',
    type: 'provider',
    description: 'Proveedor',
    avatar: { shape: 'circle', color: 'orange', accessory: 'hat', mood: 'neutral' },
  },
  {
    id: 'kimi',
    name: 'Kimi',
    type: 'provider',
    description: 'Proveedor',
    avatar: { shape: 'roundedSquare', color: 'amber', accessory: 'halo', mood: 'happy' },
  },
]

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
        <span className="agent-hat">
          <span className="agent-hat__crown" />
          <span className="agent-hat__band" />
          <span className="agent-hat__brim" />
        </span>
      )}
      {accessory === 'visor' && <span className="agent-visor" />}
      {accessory === 'antenna' && <span className="agent-antenna" />}
      {accessory === 'halo' && <span className="agent-halo" />}
    </span>
  )
}

function OptiRouteMascot({ size = 'sm', active = false, mood = 'neutral', accessory = 'halo', className = '' }) {
  return (
    <AgentAvatar
      shape="roundedSquare"
      color="blue"
      accessory={accessory}
      mood={mood}
      size={size}
      active={active}
      className={`opti-mascot ${className}`}
    />
  )
}

function AgentHub({ activeAgent, onSelectAgent, onNewSession, selectionDisabled }) {
  const globalAgent = agents[0]
  const providerAgents = agents.slice(1)

  const renderAgentButton = (agent, index) => {
    const isActive = activeAgent === agent.id

    return (
      <button
        key={agent.id}
        type="button"
        aria-label={`Seleccionar agente ${agent.name}`}
        aria-pressed={isActive}
        disabled={selectionDisabled && !isActive}
        onClick={() => onSelectAgent(agent.id)}
        className={`agent-hub__button group ${isActive ? 'agent-hub__button--active' : ''}`}
        style={{ '--agent-delay': `${index * 35}ms` }}
      >
        <span className="agent-hub__active-mark" />
        {agent.type === 'global' ? (
          <OptiRouteMascot
            size="md"
            active={isActive}
            mood={agent.avatar.mood}
            accessory={agent.avatar.accessory}
            className="agent-hub__avatar agent-hub__avatar--global"
          />
        ) : (
          <AgentAvatar
            {...agent.avatar}
            size="md"
            active={isActive}
            className="agent-hub__avatar"
          />
        )}
        <span role="tooltip" className="agent-hub__tooltip">
          <span>{agent.name}</span>
          <span>{agent.description}</span>
        </span>
      </button>
    )
  }

  return (
    <aside className="agent-hub" aria-label="Agent Hub">
      <nav className="flex flex-col items-center" aria-label="Agentes disponibles">
        <span className="agent-hub__label">Agentes</span>
        {renderAgentButton(globalAgent, 0)}
        <span className="agent-hub__divider" />
        <div className="flex flex-col items-center gap-3">
          {providerAgents.map((agent, index) => renderAgentButton(agent, index + 1))}
        </div>
      </nav>

      <button
        type="button"
        onClick={onNewSession}
        disabled={selectionDisabled}
        aria-label="Nueva sesión"
        className="agent-hub__new-session group"
      >
        <span aria-hidden="true">+</span>
        <span role="tooltip" className="agent-hub__tooltip agent-hub__tooltip--bottom">
          <span>Nueva sesión</span>
          <span>En el agente activo</span>
        </span>
      </button>
    </aside>
  )
}

function classifyTask(userMessage) {
  if (userMessage === examples.escalation) {
    return { type: 'quality-escalation', complexity: 'low', intent: 'technical-guidance' }
  }

  if (userMessage === examples.short) {
    return { type: 'short-question', complexity: 'low', intent: 'explanation' }
  }

  if (userMessage === examples.code) {
    return { type: 'technical-analysis', complexity: 'medium', intent: 'diagnosis' }
  }

  if (userMessage === examples.document) {
    return { type: 'long-document', complexity: 'high', intent: 'analysis' }
  }

  const normalizedMessage = userMessage
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()

  const isGreeting = /^(hola\b|buenos dias\b|buenas tardes\b|buenas noches\b)/.test(normalizedMessage)

  if (isGreeting) {
    return { type: 'greeting', complexity: 'low', intent: 'conversation' }
  }

  if (
    /documento largo|documentacion extensa|documentacion tecnica extensa|analisis profundo|informe completo|analiza este documento|analizar este documento|resumir documento|resumen de este documento|dependencias y riesgos|analizar documentacion|analisis documental|disena una arquitectura|arquitectura de software/.test(normalizedMessage)
  ) {
    return { type: 'long-document', complexity: 'high', intent: 'analysis' }
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

    return hasStrongCodeSignal
      ? { type: 'technical-analysis', complexity: 'medium', intent: 'diagnosis' }
      : { type: 'long-document', complexity: 'high', intent: 'analysis' }
  }

  if (
    /\b(codigo|error|fastapi|python|javascript|react|sql|debug|debugging|token|401|backend|frontend|endpoint|funcion|function|classname|const|usestate)\b/.test(normalizedMessage)
  ) {
    return { type: 'technical-analysis', complexity: 'medium', intent: 'diagnosis' }
  }

  return { type: 'general-request', complexity: 'low', intent: 'assistance' }
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

const initialSessionStats = {
  requests: 0,
  optiRouteCost: 0,
  premiumCost: 0,
  savings: 0,
}

let sessionSequence = 0

function createSessionId(agentId) {
  sessionSequence += 1
  return `${agentId}-${Date.now().toString(36)}-${sessionSequence.toString(36)}`
}

function createEmptySession(agentId, sessionId = createSessionId(agentId)) {
  const now = Date.now()

  return {
    id: sessionId,
    title: 'Nueva conversación',
    createdAt: now,
    updatedAt: now,
    draft: '',
    modelPreference: 'auto',
    messages: [],
    route: null,
    processing: false,
    routeStage: 'idle',
    sessionStats: { ...initialSessionStats },
    history: [],
    budget: 0.1,
    budgetEditing: false,
    budgetDraft: '0.1000',
  }
}

function createAgentWorkspace(agentId) {
  const session = createEmptySession(agentId)

  return {
    activeSessionId: session.id,
    sessions: {
      [session.id]: session,
    },
  }
}

function createAgentWorkspaces() {
  return Object.fromEntries(agents.map((agent) => [agent.id, createAgentWorkspace(agent.id)]))
}

function generateSessionTitle(prompt) {
  const original = prompt.replace(/\s+/g, ' ').trim()
  let title = original
  const leadingPhrases = /^(?:por favor\s+|necesito\s+|quiero\s+|puedes\s+|podr[ií]as\s+|ay[uú]dame\s+(?:a|con)\s+|analiza(?:r)?\s+|dise[ñn]a(?:r)?\s+|resume(?:n|ir)?\s+|explica(?:r)?\s+|este\s+|esta\s+|un\s+|una\s+)/i

  while (leadingPhrases.test(title)) {
    title = title.replace(leadingPhrases, '').trim()
  }

  title = (title || original).replace(/[.!?…,:;\s]+$/g, '')

  if (title.length > 42) {
    const shortened = title.slice(0, 42)
    const lastSpace = shortened.lastIndexOf(' ')
    title = `${shortened.slice(0, lastSpace > 26 ? lastSpace : 42).trim()}…`
  }

  return title.charAt(0).toUpperCase() + title.slice(1)
}

function formatSessionTimestamp(timestamp) {
  const date = new Date(timestamp)
  const today = new Date()
  const sameDay = date.toDateString() === today.toDateString()

  return new Intl.DateTimeFormat('es', sameDay
    ? { hour: '2-digit', minute: '2-digit', hour12: false }
    : { day: '2-digit', month: 'short' }).format(date)
}

function AgentIdentity({ agentId, size = 'sm', active = false, mood }) {
  const agent = agents.find((item) => item.id === agentId) || agents[0]

  if (agent.id === 'global') {
    return (
      <OptiRouteMascot
        size={size}
        active={active}
        mood={mood || agent.avatar.mood}
        accessory={agent.avatar.accessory}
      />
    )
  }

  return (
    <AgentAvatar
      {...agent.avatar}
      size={size}
      active={active}
      mood={mood || agent.avatar.mood}
    />
  )
}

function getAgentChatLabel(agentId) {
  const agent = agents.find((item) => item.id === agentId) || agents[0]
  return agent.id === 'global' ? 'OptiRoute' : `${agent.name} Agent`
}

function SessionSwitcher({
  agent,
  sessions,
  activeSessionId,
  open,
  disabled,
  onToggle,
  onSelect,
  onCreate,
  onDelete,
}) {
  const orderedSessions = [...sessions].sort((first, second) => second.updatedAt - first.updatedAt)

  return (
    <div className={`session-switcher active-agent-context--${agent.avatar.color} hidden md:block`}>
      {open && (
        <button
          type="button"
          aria-label="Cerrar selector de sesiones"
          className="fixed inset-0 z-[-1] cursor-default"
          onClick={onToggle}
        />
      )}

      <button
        type="button"
        disabled={disabled}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={`Agente activo: ${agent.name}. Ver sesiones`}
        onClick={onToggle}
        className="active-agent-context"
      >
        <AgentAvatar
          {...agent.avatar}
          size="xs"
          active
          className="active-agent-context__avatar"
        />
        <span className="min-w-0 text-left">
          <span className="active-agent-context__label block">Agente activo</span>
          <span className="active-agent-context__name-row">
            <span className="active-agent-context__accent" />
            <span className="active-agent-context__name">{agent.name}</span>
            <svg aria-hidden="true" viewBox="0 0 12 12" className={`session-switcher__chevron ${open ? 'rotate-180' : ''}`}>
              <path d="m3 4.5 3 3 3-3" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
        </span>
      </button>

      {open && (
        <div role="dialog" aria-label={`Sesiones de ${agent.name}`} className="session-switcher__popover">
          <div className="session-switcher__header">
            <div>
              <p className="session-switcher__eyebrow">Sesiones</p>
              <p className="session-switcher__agent">{agent.name}</p>
            </div>
            <span className="session-switcher__count">{sessions.length}</span>
          </div>

          <div className="session-switcher__list">
            {orderedSessions.map((session) => {
              const isActive = session.id === activeSessionId

              return (
                <div key={session.id} className={`session-switcher__item ${isActive ? 'session-switcher__item--active' : ''}`}>
                  <button
                    type="button"
                    disabled={disabled}
                    onClick={() => onSelect(session.id)}
                    className="session-switcher__select"
                  >
                    <span className="session-switcher__status" />
                    <span className="min-w-0 flex-1">
                      <span className="session-switcher__title">{session.title}</span>
                      <span className="session-switcher__time">{formatSessionTimestamp(session.updatedAt)}</span>
                    </span>
                  </button>
                  <button
                    type="button"
                    disabled={disabled}
                    aria-label={`Eliminar sesión ${session.title}`}
                    onClick={() => onDelete(session.id)}
                    className="session-switcher__delete"
                  >
                    ×
                  </button>
                </div>
              )
            })}
          </div>

          <button
            type="button"
            disabled={disabled}
            onClick={onCreate}
            className="session-switcher__create"
          >
            <span aria-hidden="true">+</span>
            Nueva conversación
          </button>
        </div>
      )}
    </div>
  )
}

function ModelPicker({ activeAgent, value, open, onToggle, onChange, disabled }) {
  const selectedModel = value === 'auto' ? null : getModelById(value)
  const providers = activeAgent === 'global'
    ? Object.entries(providerCatalog)
    : [[activeAgent, providerCatalog[activeAgent]]]

  return (
    <div className="model-picker relative z-40">
      {open && (
        <button
          type="button"
          aria-label="Cerrar selector de modelo"
          className="fixed inset-0 z-[-1] cursor-default"
          onClick={onToggle}
        />
      )}

      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        disabled={disabled}
        onClick={onToggle}
        className="flex max-w-[260px] items-center gap-2 rounded-lg border border-white/[0.08] bg-white/[0.025] px-3 py-2 text-left text-[11px] text-[#B8BBC0] transition-[border-color,background-color,color] duration-150 hover:border-white/[0.14] hover:bg-white/[0.045] hover:text-[#ECEDEB] disabled:cursor-not-allowed disabled:opacity-50"
      >
        <span className="text-[#D6A24A]">✦</span>
        <span className="truncate">{selectedModel ? selectedModel.name : 'OptiRoute Auto'}</span>
        <svg aria-hidden="true" viewBox="0 0 12 12" className={`ml-auto h-3 w-3 shrink-0 transition-transform duration-150 ${open ? 'rotate-180' : ''}`}>
          <path d="m3 4.5 3 3 3-3" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <div role="listbox" aria-label="Preferencia de modelo" className="model-picker__popover absolute bottom-[calc(100%+10px)] left-0 z-50 max-h-[360px] w-[min(380px,calc(100vw-48px))] overflow-y-auto rounded-xl border border-white/[0.1] bg-[#0D1014]/[0.98] p-2 shadow-[0_18px_60px_rgba(0,0,0,0.48)] backdrop-blur-xl">
          <button
            type="button"
            role="option"
            aria-selected={value === 'auto'}
            onClick={() => onChange('auto')}
            className={`w-full rounded-lg border px-3 py-3 text-left transition-colors duration-150 ${
              value === 'auto'
                ? 'border-[#D6A24A]/20 bg-[#D6A24A]/[0.06]'
                : 'border-transparent hover:bg-white/[0.035]'
            }`}
          >
            <span className="flex items-center justify-between gap-3">
              <span className="text-xs font-medium text-[#F0F0ED]">✦ OptiRoute Auto</span>
              <span className="rounded border border-[#D6A24A]/20 bg-[#D6A24A]/[0.06] px-1.5 py-0.5 text-[8px] uppercase tracking-[0.12em] text-[#D6A24A]/80">Recomendado</span>
            </span>
            <span className="mt-1 block text-[10px] leading-4 text-white/35">Selecciona automáticamente la ruta más eficiente</span>
          </button>

          {providers.map(([providerId, provider]) => (
            <div key={providerId} className="mt-3 border-t border-white/[0.06] pt-3">
              <p className="px-3 text-[8px] uppercase tracking-[0.18em] text-white/25">{provider.name}</p>
              <div className="mt-1 space-y-0.5">
                {provider.models.map((model) => (
                  <button
                    key={model.id}
                    type="button"
                    role="option"
                    aria-selected={value === model.id}
                    onClick={() => onChange(model.id)}
                    className={`flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-left transition-colors duration-150 ${
                      value === model.id ? 'bg-white/[0.06] text-[#F3F2EE]' : 'text-[#A1A6AE] hover:bg-white/[0.035] hover:text-[#E5E6E3]'
                    }`}
                  >
                    <span className="truncate text-[11px]">{model.name}</span>
                    <span className="shrink-0 text-[8px] uppercase tracking-[0.12em] text-white/25">{complexityLabels[model.complexity]}</span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function ImpactPanel({ route, routeStage, sessionStats, budget }) {
  const hasResult = route && routeStage === 'verified'

  if (!hasResult) {
    return (
      <aside className="impact-panel glass-card rounded-2xl border p-5">
        <p className="text-[11px] uppercase tracking-[0.2em] text-[#A1A6AE]">Impacto OptiRoute</p>
        <p className="mt-1 text-[8px] uppercase tracking-[0.16em] text-white/25">Estimaciones de demostración</p>
        <p className="mt-5 text-xs leading-5 text-[#6F757D]">Envía una tarea para comparar costo y eficiencia.</p>
      </aside>
    )
  }

  const premiumCost = parseCost(route.baselineCost)
  const optiCost = parseCost(route.estimatedCost)
  const costRatio = premiumCost > 0 ? Math.min((optiCost / premiumCost) * 100, 100) : 0
  const projectionCount = 1000
  const premiumProjected = premiumCost * projectionCount
  const optiProjected = optiCost * projectionCount
  const savingsProjected = premiumProjected - optiProjected
  const tokens = route.demoTokens || estimateTokensForDemo('', route.complexityId, route.tier)

  return (
    <aside className="impact-panel glass-card rounded-2xl border p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] uppercase tracking-[0.2em] text-[#A1A6AE]">Impacto OptiRoute</p>
          <p className="mt-1 text-[8px] uppercase tracking-[0.16em] text-white/25">Estimaciones de demostración</p>
        </div>
        <span className="text-lg font-medium text-[#D6A24A]/85">{route.saving}</span>
      </div>

      <section className="mt-5 border-t border-white/[0.06] pt-4">
        <div className="flex items-center justify-between text-[10px]"><span className="text-white/35">Referencia premium</span><span className="text-white/70">{route.baselineCost}</span></div>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/[0.045]"><div className="h-full w-full rounded-full bg-white/20" /></div>
        <div className="mt-4 flex items-center justify-between text-[10px]"><span className="text-white/35">OptiRoute</span><span className="text-white/80">{route.estimatedCost}</span></div>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/[0.045]"><div className="impact-bar h-full rounded-full bg-[rgba(210,158,67,0.78)]" style={{ width: `${costRatio}%` }} /></div>
      </section>

      <section className="mt-5 grid grid-cols-3 gap-3 border-t border-white/[0.06] pt-4">
        <div><p className="text-[8px] uppercase tracking-[0.12em] text-white/25">Referencia</p><p className="mt-1 text-xs text-white/65">{formatTokenEstimate(tokens.premium)}</p></div>
        <div><p className="text-[8px] uppercase tracking-[0.12em] text-white/25">OptiRoute</p><p className="mt-1 text-xs text-white/75">{formatTokenEstimate(tokens.optiRoute)}</p></div>
        <div><p className="text-[8px] uppercase tracking-[0.12em] text-white/25">Evitados</p><p className="mt-1 text-xs text-[#D6A24A]/80">{tokens.avoided}%</p></div>
        <p className="col-span-3 text-[8px] uppercase tracking-[0.14em] text-white/20">Tokens estimados · demo</p>
      </section>

      <section className="mt-5 border-t border-white/[0.06] pt-4">
        <p className="text-[8px] uppercase tracking-[0.16em] text-white/25">Proyección · 1.000 solicitudes similares</p>
        <div className="mt-3 grid grid-cols-3 gap-3">
          <div><p className="text-[8px] text-white/25">Referencia</p><p className="mt-1 text-[11px] text-white/65">${premiumProjected.toFixed(2)}</p></div>
          <div><p className="text-[8px] text-white/25">OptiRoute</p><p className="mt-1 text-[11px] text-white/75">${optiProjected.toFixed(2)}</p></div>
          <div><p className="text-[8px] text-white/25">Ahorro</p><p className="mt-1 text-[11px] text-[#D6A24A]/80">${savingsProjected.toFixed(2)}</p></div>
        </div>
      </section>

      <section className="mt-5 border-t border-white/[0.06] pt-4">
        <p className="text-[8px] uppercase tracking-[0.16em] text-white/25">Presupuesto</p>
        <div className="mt-2 flex items-center justify-between text-[10px]"><span className="text-white/35">Disponible</span><span className="text-white/70">{formatCost(budget)}</span></div>
        <div className="mt-1.5 flex items-center justify-between text-[10px]"><span className="text-white/35">Consumo actual</span><span className="text-white/70">{formatCost(sessionStats.optiRouteCost)}</span></div>
        <div className="mt-1.5 flex items-center justify-between text-[10px]"><span className="text-white/35">Preservado</span><span className="text-[#D6A24A]/75">{formatCost(sessionStats.savings)}</span></div>
      </section>
    </aside>
  )
}

function App() {
  const [activeAgent, setActiveAgent] = useState('global')
  const [agentWorkspaces, setAgentWorkspaces] = useState(createAgentWorkspaces)
  const [historyOpen, setHistoryOpen] = useState(false)
  const [modelMenuOpen, setModelMenuOpen] = useState(false)
  const [sessionMenuOpen, setSessionMenuOpen] = useState(false)
  const sessionGenerations = useRef({})
  const messagesContainerRef = useRef(null)
  const activeAgentWorkspace = agentWorkspaces[activeAgent]
  const activeSessionId = activeAgentWorkspace.activeSessionId
  const activeSession = activeAgentWorkspace.sessions[activeSessionId]
  const agentSessions = Object.values(activeAgentWorkspace.sessions)
  const {
    draft: message,
    modelPreference,
    messages,
    route,
    processing,
    routeStage,
    sessionStats,
    history,
    budget,
    budgetEditing,
    budgetDraft,
  } = activeSession

  const updateSession = (agentId, sessionId, updater) => {
    setAgentWorkspaces((currentWorkspaces) => ({
      ...currentWorkspaces,
      [agentId]: {
        ...currentWorkspaces[agentId],
        sessions: {
          ...currentWorkspaces[agentId].sessions,
          [sessionId]: updater(currentWorkspaces[agentId].sessions[sessionId]),
        },
      },
    }))
  }

  const setSessionField = (agentId, sessionId, field, value) => {
    updateSession(agentId, sessionId, (session) => ({
      ...session,
      [field]: typeof value === 'function' ? value(session[field]) : value,
    }))
  }

  const setActiveSessionField = (field, value) => {
    setSessionField(activeAgent, activeSessionId, field, value)
  }

  const setMessage = (value) => setActiveSessionField('draft', value)
  const setModelPreference = (value) => setActiveSessionField('modelPreference', value)
  const setMessages = (value) => setActiveSessionField('messages', value)
  const setRoute = (value) => setActiveSessionField('route', value)
  const setProcessing = (value) => setActiveSessionField('processing', value)
  const setRouteStage = (value) => setActiveSessionField('routeStage', value)
  const setSessionStats = (value) => setActiveSessionField('sessionStats', value)
  const setHistory = (value) => setActiveSessionField('history', value)
  const setBudget = (value) => setActiveSessionField('budget', value)
  const setBudgetEditing = (value) => setActiveSessionField('budgetEditing', value)
  const setBudgetDraft = (value) => setActiveSessionField('budgetDraft', value)
  const selectedAgent = agents.find((agent) => agent.id === activeAgent) || agents[0]
  const escalationPreview = route && routeStage === 'escalating'
    ? escalateRoute(
      { type: route.taskType, complexity: route.complexityId, intent: route.intent },
      route.contextAgent,
      route,
    )
    : null

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
  }, [activeAgent, activeSessionId, messages, processing, routeStage])

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

  const handleCreateSession = () => {
    if (processing) return

    const newSession = createEmptySession(activeAgent)
    sessionGenerations.current[newSession.id] = 0
    setAgentWorkspaces((currentWorkspaces) => ({
      ...currentWorkspaces,
      [activeAgent]: {
        activeSessionId: newSession.id,
        sessions: {
          ...currentWorkspaces[activeAgent].sessions,
          [newSession.id]: newSession,
        },
      },
    }))
    setHistoryOpen(false)
    setModelMenuOpen(false)
    setSessionMenuOpen(false)
  }

  const handleSelectSession = (sessionId) => {
    if (processing || sessionId === activeSessionId) {
      setSessionMenuOpen(false)
      return
    }

    setAgentWorkspaces((currentWorkspaces) => ({
      ...currentWorkspaces,
      [activeAgent]: {
        ...currentWorkspaces[activeAgent],
        activeSessionId: sessionId,
      },
    }))
    setHistoryOpen(false)
    setModelMenuOpen(false)
    setSessionMenuOpen(false)
  }

  const handleDeleteSession = (sessionId) => {
    if (processing) return

    const sessionToDelete = activeAgentWorkspace.sessions[sessionId]
    const confirmed = window.confirm(
      `¿Quieres eliminar la sesión “${sessionToDelete.title}”? Esta acción no se puede deshacer.`,
    )

    if (!confirmed) return

    sessionGenerations.current[sessionId] = (sessionGenerations.current[sessionId] || 0) + 1
    setAgentWorkspaces((currentWorkspaces) => {
      const workspace = currentWorkspaces[activeAgent]
      const remainingSessions = Object.fromEntries(
        Object.entries(workspace.sessions).filter(([id]) => id !== sessionId),
      )
      const remainingIds = Object.keys(remainingSessions)

      if (remainingIds.length === 0) {
        const replacement = createEmptySession(activeAgent)
        sessionGenerations.current[replacement.id] = 0

        return {
          ...currentWorkspaces,
          [activeAgent]: {
            activeSessionId: replacement.id,
            sessions: { [replacement.id]: replacement },
          },
        }
      }

      return {
        ...currentWorkspaces,
        [activeAgent]: {
          activeSessionId: workspace.activeSessionId === sessionId
            ? remainingIds[0]
            : workspace.activeSessionId,
          sessions: remainingSessions,
        },
      }
    })
    setHistoryOpen(false)
    setModelMenuOpen(false)
  }

  const sendMessage = async () => {
    if (!message.trim() || processing) return

    const userMessage = message.trim()
    const requestAgent = activeAgent
    const requestSessionId = activeSessionId
    const requestModelPreference = modelPreference
    const isAutoMode = requestModelPreference === 'auto'
    const activeGeneration = sessionGenerations.current[requestSessionId] || 0
    const isEscalation = userMessage === examples.escalation
    const isFirstMessage = messages.length === 0

    setMessages((currentMessages) => [
      ...currentMessages,
      {
        role: 'user',
        content: userMessage,
      },
    ])
    setMessage('')
    if (isFirstMessage) setActiveSessionField('title', generateSessionTitle(userMessage))
    setActiveSessionField('updatedAt', Date.now())
    setProcessing(true)
    setRouteStage('analyzing')
    setModelMenuOpen(false)

    await new Promise((resolve) => setTimeout(resolve, 400))

    if (activeGeneration !== (sessionGenerations.current[requestSessionId] || 0)) return

    const classification = classifyTask(userMessage)
    const initialRoute = isAutoMode
      ? selectRoute(classification, requestAgent)
      : selectManualRoute(classification, requestAgent, requestModelPreference)
    setRoute(initialRoute)
    setRouteStage('selected')

    let selectedRoute

    if (isEscalation && isAutoMode) {
      await new Promise((resolve) => setTimeout(resolve, 400))
      if (activeGeneration !== (sessionGenerations.current[requestSessionId] || 0)) return

      const initialResponse = 'Cuando una sesión expira, la aplicación puede solicitar un nuevo token y continuar.'
      const initialVerificationPassed = false

      setRouteStage('verifying')
      await new Promise((resolve) => setTimeout(resolve, 500))
      if (activeGeneration !== (sessionGenerations.current[requestSessionId] || 0)) return

      if (initialResponse && !initialVerificationPassed) {
        setRouteStage('escalating')
        await new Promise((resolve) => setTimeout(resolve, 500))
        if (activeGeneration !== (sessionGenerations.current[requestSessionId] || 0)) return
      }

      selectedRoute = escalateRoute(classification, requestAgent, initialRoute)
      setRoute(selectedRoute)
      setRouteStage('verifying')

      await new Promise((resolve) => setTimeout(resolve, 500))
      if (activeGeneration !== (sessionGenerations.current[requestSessionId] || 0)) return
    } else {
      await new Promise((resolve) => setTimeout(resolve, 100))
      if (activeGeneration !== (sessionGenerations.current[requestSessionId] || 0)) return

      setRouteStage('verifying')
      await new Promise((resolve) => setTimeout(resolve, 100))
      if (activeGeneration !== (sessionGenerations.current[requestSessionId] || 0)) return

      selectedRoute = {
        ...initialRoute,
        escalated: false,
        verification: isEscalation ? 'No superada' : 'Superada',
      }
    }

    selectedRoute = {
      ...selectedRoute,
      demoTokens: estimateTokensForDemo(
        userMessage,
        selectedRoute.complexityId,
        selectedRoute.tier,
      ),
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
        agentId: requestAgent,
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
        provider: selectedRoute.provider,
        providerName: selectedRoute.providerName,
        mode: selectedRoute.mode,
        modelPreference: requestModelPreference,
        complexity: selectedRoute.complexity,
        estimatedCost,
        baselineCost,
        saving: selectedRoute.saving,
        savingAmount: baselineCost - estimatedCost,
        escalated: selectedRoute.escalated,
        initialModel: selectedRoute.escalated ? selectedRoute.initialModel : null,
        initialProvider: selectedRoute.escalated ? selectedRoute.initialProvider : null,
        initialProviderName: selectedRoute.escalated ? selectedRoute.initialProviderName : null,
        finalModel: selectedRoute.model,
        verification: selectedRoute.verification,
        createdAt,
      },
    ])
    setActiveSessionField('updatedAt', Date.now())
    setProcessing(false)
  }

  useEffect(() => {
    if (!historyOpen && !sessionMenuOpen) return undefined

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setHistoryOpen(false)
        setSessionMenuOpen(false)
      }
    }

    document.addEventListener('keydown', handleKeyDown)

    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [historyOpen, sessionMenuOpen])

  const resetSession = () => {
    if (processing) return

    const confirmed = window.confirm(
      '¿Quieres reiniciar la sesión? Se eliminará el historial y las métricas actuales.',
    )

    if (!confirmed) return

    sessionGenerations.current[activeSessionId] = (sessionGenerations.current[activeSessionId] || 0) + 1
    updateSession(activeAgent, activeSessionId, (currentSession) => ({
      ...createEmptySession(activeAgent, activeSessionId),
      createdAt: currentSession.createdAt,
    }))
    setHistoryOpen(false)
    setModelMenuOpen(false)
  }

  return (
    <div className="app-shell min-h-screen overflow-x-hidden text-[#F3F2EE]">
      <header className="h-16 border-b border-white/[0.08] bg-[#0D0F12]/85 backdrop-blur-xl">
        <div className="flex h-full w-full items-center justify-between px-7 sm:px-8 lg:px-9">
          <div className="flex items-center gap-2.5 text-sm">
            <span className="font-medium">IneBrain</span>
            <span className="text-[#626467]">/</span>
            <OptiRouteMascot
              size="xs"
              accessory={agents[0].avatar.accessory}
              mood={agents[0].avatar.mood}
              className="header-opti-mascot"
            />
            <span className="text-[#A0A1A3]">OptiRoute</span>
            <span className="rounded border border-white/[0.08] bg-white/[0.03] px-1.5 py-0.5 text-[10px] uppercase tracking-[0.08em] text-[#626467]">
              DEMO
            </span>
          </div>

          <button
            onClick={() => setHistoryOpen(true)}
            aria-expanded={historyOpen}
            className="history-trigger group relative flex items-center gap-[7px] px-1 py-2 text-[14px] font-medium text-white/65 transition-colors duration-[160ms] hover:text-white/95"
          >
            <span>Historial</span>
            {history.length > 0 && (
              <span className="history-counter inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full border border-[#D6A24A]/20 bg-[#D6A24A]/[0.07] px-1 text-[9px] leading-none text-[#D6A24A]/80 transition-[border-color,background-color,color] duration-[160ms] group-hover:border-[#D6A24A]/30 group-hover:bg-[#D6A24A]/[0.1] group-hover:text-[#D6A24A]">
                {history.length}
              </span>
            )}
          </button>
        </div>
      </header>

      <div className="workspace-layout">
        <AgentHub
          activeAgent={activeAgent}
          onSelectAgent={(agentId) => {
            if (processing) return
            setModelMenuOpen(false)
            setSessionMenuOpen(false)
            setHistoryOpen(false)
            setActiveAgent(agentId)
          }}
          onNewSession={handleCreateSession}
          selectionDisabled={processing}
        />

      <main key={`${activeAgent}-${activeSessionId}`} className="workspace-main workspace-switch">
        <section className="relative flex h-[calc(100vh-8rem)] min-h-[600px] min-w-0 flex-col md:h-full md:min-h-0 md:overflow-hidden">
          <div className="absolute -left-5 top-1 hidden h-28 flex-col items-center justify-between md:flex">
            <span className="absolute top-1 bottom-1 w-px bg-white/[0.06]" />
            <span className="relative h-2 w-2 rounded-full border border-[#D9A441]/60 bg-[#D9A441]" />
            <span className="relative h-2 w-2 rounded-full border border-white/10 bg-[#17181A]" />
            <span className="relative h-2 w-2 rounded-full border border-white/10 bg-[#17181A]" />
            <span className="relative h-2 w-2 rounded-full border border-white/10 bg-[#17181A]" />
          </div>

          <div className="chat-heading-glow relative isolate shrink-0">
            <div className="mb-3 flex items-end justify-between gap-4">
              <p className="text-[11px] uppercase tracking-[0.18em] text-[#626467]">
                Nueva conversación
              </p>
              <SessionSwitcher
                key={activeAgent}
                agent={selectedAgent}
                sessions={agentSessions}
                activeSessionId={activeSessionId}
                open={sessionMenuOpen}
                disabled={processing}
                onToggle={() => setSessionMenuOpen((current) => !current)}
                onSelect={handleSelectSession}
                onCreate={handleCreateSession}
                onDelete={handleDeleteSession}
              />
            </div>

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
                  {activeAgent === 'global'
                    ? 'Escribe una tarea y OptiRoute seleccionará la ruta de IA más eficiente.'
                    : `Escribe una tarea y OptiRoute seleccionará la ruta más eficiente dentro de ${selectedAgent.name}.`}
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
                      <AgentIdentity agentId={item.agentId || activeAgent} size="sm" />
                      <span className="mt-2 w-px flex-1 bg-[#D6A24A]/25" />
                    </div>
                    <div className="min-w-0 pb-1">
                      <p className="mb-2 text-[10px] font-medium uppercase tracking-[0.16em] text-[#D6A24A]/75">
                        {getAgentChatLabel(item.agentId || activeAgent)}
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
                    <AgentIdentity agentId={activeAgent} size="sm" active mood="focused" />
                    <span className="mt-2 w-px flex-1 bg-[#D6A24A]/25" />
                  </div>
                  <div className="min-w-0 pb-1">
                    <p className="mb-2 text-[10px] font-medium uppercase tracking-[0.16em] text-[#D6A24A]/75">
                      {getAgentChatLabel(activeAgent)}
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

            <div className="flex items-end justify-between gap-3">
              <ModelPicker
                activeAgent={activeAgent}
                value={modelPreference}
                open={modelMenuOpen}
                disabled={processing}
                onToggle={() => setModelMenuOpen((current) => !current)}
                onChange={(value) => {
                  setModelPreference(value)
                  setModelMenuOpen(false)
                }}
              />

              <button
                type="button"
                onClick={sendMessage}
                disabled={processing}
                aria-label="Enviar mensaje"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/15 bg-[#F1F1ED] text-[#0B0D10] shadow-[0_0_20px_rgba(123,198,255,0.08)] transition-[background-color,border-color,box-shadow,transform] duration-150 hover:-translate-y-px hover:border-white/25 hover:bg-white hover:shadow-[0_0_26px_rgba(123,198,255,0.14)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7BC6FF]/15 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-50 md:h-[42px] md:w-[42px]"
              >
                {processing ? (
                  <span className="flex items-center gap-0.5" aria-hidden="true">
                    <span className="processing-dot h-1 w-1 rounded-full bg-[#0B0D10]" />
                    <span className="processing-dot h-1 w-1 rounded-full bg-[#0B0D10]" />
                    <span className="processing-dot h-1 w-1 rounded-full bg-[#0B0D10]" />
                  </span>
                ) : (
                  <svg aria-hidden="true" viewBox="0 0 20 20" className="h-4.5 w-4.5">
                    <path d="M10 15V5m0 0L6.5 8.5M10 5l3.5 3.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          <div className="quick-prompts mt-4 flex shrink-0 flex-wrap items-center gap-x-3 gap-y-2 text-[11px] text-[#626467]">
            <span>Sugerencias:</span>
            {quickPrompts.map((quickPrompt) => (
              <button
                key={quickPrompt.label}
                type="button"
                onClick={() => setMessage(quickPrompt.prompt)}
                className="quick-prompt cursor-pointer rounded-full border border-white/[0.07] bg-white/[0.025] px-2.5 py-1 text-[#797E85] transition-[color,border-color,background-color] duration-200 hover:border-[#D6A24A]/[0.22] hover:bg-white/[0.055] hover:text-[#E7E7E4]"
              >
                {quickPrompt.label}
              </button>
            ))}

            {DEMO_DEBUG && (
              <button
                type="button"
                onClick={() => setMessage(examples.escalation)}
                className="ml-auto cursor-pointer px-1 py-1 text-[9px] uppercase tracking-[0.12em] text-white/20 transition-colors duration-150 hover:text-[#D6A24A]/60"
              >
                Demo: escalamiento
              </button>
            )}
          </div>
        </section>

        <div className="right-column w-full min-w-0 md:h-full md:min-h-0 md:pr-1">
          <aside className={`route-panel glass-card h-fit rounded-2xl border p-6 ${routeStage !== 'idle' ? 'route-panel-enter' : ''}`}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[11px] uppercase tracking-[0.2em] text-[#A1A6AE]">
                  Routing Engine
                </p>
                <p className="mt-1 text-[9px] uppercase tracking-[0.14em] text-[#6F757D]">
                  OptiRoute Decision Layer
                </p>
                <div className="mt-3 flex items-center gap-2 text-[9px] uppercase tracking-[0.14em]">
                  <span className="text-white/25">Contexto</span>
                  <span className="h-px w-3 bg-white/[0.08]" />
                  <span className="normal-case tracking-normal text-white/45">
                    {selectedAgent.id === 'global' ? 'Global' : selectedAgent.name}
                  </span>
                </div>
                <div className="mt-1.5 flex items-center gap-2 text-[9px] uppercase tracking-[0.14em]">
                  <span className="text-white/25">Modo</span>
                  <span className="h-px w-3 bg-white/[0.08]" />
                  <span className="normal-case tracking-normal text-white/45">
                    {(route?.mode || (modelPreference === 'auto' ? 'auto' : 'manual')) === 'auto'
                      ? 'OptiRoute Auto'
                      : 'Selección manual'}
                  </span>
                </div>
              </div>

              <OptiRouteMascot
                size="lg"
                accessory={agents[0].avatar.accessory}
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
                      ? 'Buscando mejor ruta...'
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
                  <span className="text-[#A1A6AE]">{route?.providerName} · {route?.model}</span>
                  <span className="route-escalation-line h-px flex-1 bg-[#D6A24A]/60" />
                  <span className="font-medium text-[#F3F2EE]">{escalationPreview?.providerName} · {escalationPreview?.model}</span>
                </div>
              </div>
            )}

            {route && routeStage !== 'analyzing' && routeStage !== 'selected' && (
              <div key={`${route.model}-${route.estimatedCost}`} className="mt-6">
                <section className="route-item-reveal rounded-xl border border-white/[0.07] bg-white/[0.018] p-4">
                  <p className="text-[9px] uppercase tracking-[0.15em] text-[#6F757D]">
                    Proveedor seleccionado
                  </p>
                  <p className="mt-1 text-xs font-medium text-[#D6A24A]/80">{route.providerName}</p>
                  <p className="mt-3 text-[9px] uppercase tracking-[0.15em] text-[#6F757D]">
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
                            <div><p className="text-sm font-medium">{route.initialProviderName} · {route.initialModel}</p><p className="mt-1 text-[10px] text-[#6F757D]">Proveedor y modelo inicial</p></div>
                          </div>
                          <div className="relative flex gap-3 pb-5">
                            <span className="relative z-10 mt-1 h-2.5 w-2.5 rounded-full border border-[#D6A24A]/50 bg-[#0D0F12]" />
                            <span className={`absolute bottom-0 left-[5px] top-3 w-px ${routeStage === 'escalating' ? 'route-escalation-line bg-[#D6A24A]/60' : 'bg-white/10'}`} />
                            <div><p className="text-[10px] uppercase tracking-[0.12em] text-[#6F757D]">Verificación inicial</p><p className="mt-1 text-sm text-[#D6A24A]">No superada</p></div>
                          </div>
                          <div className="relative flex gap-3 pb-5">
                            <span className={`relative z-10 mt-1 h-2.5 w-2.5 rounded-full border border-[#D6A24A]/60 bg-[#D6A24A] ${routeStage === 'escalating' ? 'route-node-pulse' : ''}`} />
                            <span className="absolute bottom-0 left-[5px] top-3 w-px bg-white/10" />
                            <div><p className="text-sm font-medium">{route.providerName} · {route.model}</p><p className="mt-1 text-[10px] text-[#6F757D]">Proveedor y modelo final</p></div>
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
                        <p className="mt-2 flex items-center gap-2 text-sm font-medium"><span className={`h-1.5 w-1.5 rounded-full ${route.verification === 'No superada' ? 'bg-[#D6A24A]' : 'bg-[#D6A24A]/80'}`} />{route.verification}</p>
                        {route.mode === 'manual' && route.verification === 'No superada' && (
                          <p className="mt-3 rounded-lg border border-[#D6A24A]/[0.12] bg-[#D6A24A]/[0.035] px-3 py-2 text-xs leading-5 text-[#D6A24A]/75">
                            OptiRoute Auto podría escalar esta solicitud.
                          </p>
                        )}
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

          <div className="impact-column">
            <ImpactPanel
              route={route}
              routeStage={routeStage}
              sessionStats={sessionStats}
              budget={budget}
            />

            <p className="right-column__note w-full shrink-0 text-[9px] leading-3.5 text-white/20">
              Estimaciones de demostración basadas en el escenario del prototipo.
            </p>
          </div>
        </div>
      </main>
      </div>

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
                  <AgentIdentity agentId={activeAgent} size="sm" />
                  <div>
                    <h2 className="text-lg font-medium uppercase tracking-[0.04em] text-[#F3F2EE]">
                      Historial de sesión
                    </h2>
                    <p className="mt-1 text-[10px] uppercase tracking-[0.2em] text-white/30">
                      Session Intelligence
                    </p>
                    <p className="mt-2 text-[9px] uppercase tracking-[0.16em] text-white/35">
                      Agente · <span className="normal-case tracking-normal text-white/55">{selectedAgent.name}</span>
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
                    <AgentIdentity agentId={activeAgent} size="md" />
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
                                <p className="text-xs text-[#D3D5D8]">{entry.initialProviderName} · {entry.initialModel}</p>
                              </div>
                              <div className="relative flex items-start gap-3">
                                <span className="z-10 mt-1 h-2 w-2 rounded-full border border-[#D6A24A]/50 bg-[#0D0F12]" />
                                <div><p className="text-[9px] uppercase tracking-[0.12em] text-white/30">Verificación inicial</p><p className="mt-1 text-xs text-[#D6A24A]/75">No superada</p></div>
                              </div>
                              <div className="relative flex items-center gap-3">
                                <span className="z-10 h-2 w-2 rounded-full bg-[#D6A24A]/80" />
                                <p className="text-xs font-medium text-[#F3F2EE]">{entry.providerName} · {entry.finalModel}</p>
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
                              <span className="truncate">{entry.providerName} · {entry.model}</span>
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
                    disabled={processing}
                    className="mt-4 text-sm text-[#A1A6AE] transition-colors duration-150 hover:text-[#D6A24A] disabled:cursor-not-allowed disabled:opacity-40"
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
