import type { ChatMessage, AgentConfig, ChatCompletionRequest, ChatCompletionResponse, ChatCompletionStreamChunk } from "./types"

export class ChatAgent {
  private config: AgentConfig

  constructor(config: AgentConfig) {
    this.config = {
      ...config,
      baseURL: config.baseURL || "https://api.openai.com/v1",
      model: config.model || "gpt-3.5-turbo"
    }
  }

  async chat(messages: ChatMessage[]): Promise<string> {
    const request: ChatCompletionRequest = {
      model: this.config.model!,
      messages,
      stream: false
    }

    const response = await fetch(`${this.config.baseURL}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${this.config.apiKey}`
      },
      body: JSON.stringify(request)
    })

    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`)
    }

    const data: ChatCompletionResponse = await response.json()
    return data.choices[0].message.content
  }

  async *chatStream(messages: ChatMessage[]): AsyncGenerator<string, void, unknown> {
    const request: ChatCompletionRequest = {
      model: this.config.model!,
      messages,
      stream: true
    }

    const response = await fetch(`${this.config.baseURL}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${this.config.apiKey}`
      },
      body: JSON.stringify(request)
    })

    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`)
    }

    const reader = response.body?.getReader()
    if (!reader) {
      throw new Error("Response body is not readable")
    }

    const decoder = new TextDecoder()
    let buffer = ""

    try {
      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split("\n")
        buffer = lines.pop() || ""

        for (const line of lines) {
          const trimmed = line.trim()
          if (!trimmed || trimmed === "data: [DONE]") continue

          if (trimmed.startsWith("data: ")) {
            try {
              const jsonStr = trimmed.slice(6)
              const chunk: ChatCompletionStreamChunk = JSON.parse(jsonStr)
              const content = chunk.choices[0]?.delta?.content
              if (content) {
                yield content
              }
            } catch (e) {
              // Skip invalid JSON
              console.error("Failed to parse stream chunk:", e)
            }
          }
        }
      }
    } finally {
      reader.releaseLock()
    }
  }
}
