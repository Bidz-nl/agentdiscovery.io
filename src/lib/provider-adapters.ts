export interface ProviderAdapterRunRequest {
  apiKey: string
  model?: string
  prompt: string
  systemPrompt?: string
}

export interface ProviderAdapterRunResult {
  model: string
  outputText: string
  usage: {
    inputTokens: number | null
    outputTokens: number | null
  }
}

export interface ProviderCredentialValidationResult {
  ok: boolean
  message: string
  resolvedModel: string
}

export interface ProviderAdapter {
  provider: 'openai' | 'anthropic'
  supportsTools: boolean
  supportsStreaming: boolean
  validateCredential(input: { apiKey: string; model?: string }): Promise<ProviderCredentialValidationResult>
  run(input: ProviderAdapterRunRequest): Promise<ProviderAdapterRunResult>
}

const adapterOverrides: Partial<Record<'openai' | 'anthropic', ProviderAdapter>> = {}

function isTestStubMode() {
  return process.env.ADP_RUNTIME_TEST_STUB === '1'
}

function createStubAdapter(provider: 'openai' | 'anthropic'): ProviderAdapter {
  return {
    provider,
    supportsTools: false,
    supportsStreaming: false,
    async validateCredential({ apiKey, model }) {
      const resolvedModel = model?.trim() || (provider === 'openai' ? 'gpt-4o-mini' : 'claude-3-5-haiku-latest')

      if (apiKey.toLowerCase().includes('invalid')) {
        return {
          ok: false,
          message: `${provider} test credential rejected`,
          resolvedModel,
        }
      }

      return {
        ok: true,
        message: `${provider} test credential validated`,
        resolvedModel,
      }
    },
    async run({ apiKey, model, prompt }) {
      const resolvedModel = model?.trim() || (provider === 'openai' ? 'gpt-4o-mini' : 'claude-3-5-haiku-latest')

      if (apiKey.toLowerCase().includes('invalid') || prompt.toLowerCase().includes('force failure')) {
        throw new Error(`${provider} test run failed`)
      }

      return {
        model: resolvedModel,
        outputText: `${provider} sandbox stub response`,
        usage: {
          inputTokens: 120,
          outputTokens: 40,
        },
      }
    },
  }
}

function extractOpenAIText(content: unknown): string {
  if (typeof content === 'string') {
    return content
  }

  if (Array.isArray(content)) {
    return content
      .map((item) => {
        if (item && typeof item === 'object' && 'type' in item && item.type === 'text' && 'text' in item && typeof item.text === 'string') {
          return item.text
        }
        return ''
      })
      .filter(Boolean)
      .join('\n')
  }

  return ''
}

export const OpenAIAdapter: ProviderAdapter = {
  provider: 'openai',
  supportsTools: false,
  supportsStreaming: false,
  async validateCredential({ apiKey, model }) {
    const resolvedModel = model?.trim() || 'gpt-4o-mini'
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: resolvedModel,
        max_tokens: 1,
        temperature: 0,
        messages: [{ role: 'user', content: 'Respond with: ok' }],
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      return {
        ok: false,
        message: errorText || 'OpenAI credential validation failed',
        resolvedModel,
      }
    }

    return {
      ok: true,
      message: 'OpenAI credential validated',
      resolvedModel,
    }
  },
  async run({ apiKey, model, prompt, systemPrompt }) {
    const resolvedModel = model?.trim() || 'gpt-4o-mini'
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: resolvedModel,
        temperature: 0.2,
        messages: [
          ...(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []),
          { role: 'user', content: prompt },
        ],
      }),
    })

    if (!response.ok) {
      throw new Error((await response.text()) || 'OpenAI run failed')
    }

    const data = await response.json() as {
      choices?: Array<{ message?: { content?: unknown } }>
      usage?: { prompt_tokens?: number; completion_tokens?: number }
    }

    return {
      model: resolvedModel,
      outputText: extractOpenAIText(data.choices?.[0]?.message?.content) || 'No output returned',
      usage: {
        inputTokens: typeof data.usage?.prompt_tokens === 'number' ? data.usage.prompt_tokens : null,
        outputTokens: typeof data.usage?.completion_tokens === 'number' ? data.usage.completion_tokens : null,
      },
    }
  },
}

export const AnthropicAdapter: ProviderAdapter = {
  provider: 'anthropic',
  supportsTools: false,
  supportsStreaming: false,
  async validateCredential({ apiKey, model }) {
    const resolvedModel = model?.trim() || 'claude-3-5-haiku-latest'
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: resolvedModel,
        max_tokens: 1,
        messages: [{ role: 'user', content: 'Reply with ok' }],
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      return {
        ok: false,
        message: errorText || 'Anthropic credential validation failed',
        resolvedModel,
      }
    }

    return {
      ok: true,
      message: 'Anthropic credential validated',
      resolvedModel,
    }
  },
  async run({ apiKey, model, prompt, systemPrompt }) {
    const resolvedModel = model?.trim() || 'claude-3-5-haiku-latest'
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: resolvedModel,
        max_tokens: 512,
        ...(systemPrompt ? { system: systemPrompt } : {}),
        messages: [{ role: 'user', content: prompt }],
      }),
    })

    if (!response.ok) {
      throw new Error((await response.text()) || 'Anthropic run failed')
    }

    const data = await response.json() as {
      content?: Array<{ type?: string; text?: string }>
      usage?: { input_tokens?: number; output_tokens?: number }
    }

    return {
      model: resolvedModel,
      outputText: data.content?.filter((block) => block.type === 'text' && typeof block.text === 'string').map((block) => block.text).join('\n') || 'No output returned',
      usage: {
        inputTokens: typeof data.usage?.input_tokens === 'number' ? data.usage.input_tokens : null,
        outputTokens: typeof data.usage?.output_tokens === 'number' ? data.usage.output_tokens : null,
      },
    }
  },
}

export function getProviderAdapter(provider: 'openai' | 'anthropic') {
  if (isTestStubMode()) {
    return createStubAdapter(provider)
  }

  return adapterOverrides[provider] ?? (provider === 'openai' ? OpenAIAdapter : AnthropicAdapter)
}

export function setProviderAdapterForTests(provider: 'openai' | 'anthropic', adapter: ProviderAdapter | null) {
  if (adapter) {
    adapterOverrides[provider] = adapter
    return
  }

  delete adapterOverrides[provider]
}

export function resetProviderAdapterOverridesForTests() {
  delete adapterOverrides.openai
  delete adapterOverrides.anthropic
}
