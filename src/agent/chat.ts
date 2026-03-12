import type { ChatMessage, AgentConfig, ChatCompletionRequest, ChatCompletionResponse, ChatCompletionStreamChunk, ExtendedChatMessage, ExtendedChatCompletionRequest, ExtendedChatCompletionStreamChunk, ToolCall } from "./types"
import { ToolRegistry } from "./tools/registry"
import * as builtinTools from "./tools/builtin"

export class ChatAgent {
  private config: AgentConfig
  private toolRegistry: ToolRegistry

  constructor(config: AgentConfig, enableTools: boolean = true) {
    this.config = {
      ...config,
      baseURL: config.baseURL || "https://api.openai.com/v1",
      model: config.model || "gpt-3.5-turbo"
    }

    this.toolRegistry = new ToolRegistry()

    if (enableTools) {
      // Register built-in tool
      this.toolRegistry.register(builtinTools.executeCodeTool)
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

  /**
   * Stream chat with tool calling support
   * Handles multi-turn conversations where the assistant may call tools
   */
  async *chatStreamWithTools(
    messages: ExtendedChatMessage[],
    maxIterations: number = 5
  ): AsyncGenerator<{
    type: 'content' | 'tool_call' | 'tool_result' | 'error' | 'done'
    content?: string
    toolCall?: ToolCall
    toolResult?: { tool_call_id: string; content: string }
    error?: string
  }, void, unknown> {
    let currentMessages: ExtendedChatMessage[] = [...messages]
    let iteration = 0

    while (iteration < maxIterations) {
      iteration++

      // Prepare request with tools
      const request: ExtendedChatCompletionRequest = {
        model: this.config.model!,
        messages: currentMessages as ChatMessage[],
        stream: true,
        tools: this.toolRegistry.getAllTools(),
        tool_choice: 'auto'
      }

      // Stream and accumulate tool calls
      const accumulatedToolCalls: Map<number, ToolCall> = new Map()
      let accumulatedContent = ''
      let hasToolCalls = false

      try {
        for await (const chunk of this.streamRaw(request)) {
          const delta = chunk.choices[0]?.delta

          // Handle content
          if (delta?.content) {
            accumulatedContent += delta.content
            yield { type: 'content', content: delta.content }
          }

          // Handle tool calls
          if (delta?.tool_calls) {
            hasToolCalls = true
            for (const toolCall of delta.tool_calls) {
              const index = toolCall.index
              if (!accumulatedToolCalls.has(index)) {
                accumulatedToolCalls.set(index, {
                  id: toolCall.id || this.generateToolCallId(),
                  type: (toolCall.type as "function") || 'function',
                  function: {
                    name: toolCall.function?.name || '',
                    arguments: toolCall.function?.arguments || ''
                  }
                })
              } else {
                const existing = accumulatedToolCalls.get(index)!
                if (toolCall.id) existing.id = toolCall.id
                if (toolCall.function?.name) existing.function.name = toolCall.function.name
                if (toolCall.function?.arguments) {
                  existing.function.arguments += toolCall.function.arguments
                }
              }
            }
          }
        }

        // If no tool calls, we're done
        if (!hasToolCalls || accumulatedToolCalls.size === 0) {
          yield { type: 'done' }
          return
        }

        // Execute tool calls
        const toolCallsArray = Array.from(accumulatedToolCalls.values())

        // Add assistant message with tool calls to history
        currentMessages.push({
          role: "assistant",
          content: accumulatedContent || null,
          tool_calls: toolCallsArray
        })

        for (const toolCall of toolCallsArray) {
          yield { type: 'tool_call', toolCall }

          try {
            // Parse arguments
            const args = JSON.parse(toolCall.function.arguments)

            // Validate parameters
            const validation = this.toolRegistry.validateParameters(
              toolCall.function.name,
              args
            )

            if (!validation.valid) {
              const errorContent = `Error: ${validation.error}`
              yield { type: 'tool_result', toolResult: { tool_call_id: toolCall.id, content: errorContent } }
              currentMessages.push({
                role: "tool",
                tool_call_id: toolCall.id,
                content: errorContent
              })
              continue
            }

            // Execute tool
            const result = await this.toolRegistry.execute(
              toolCall.function.name,
              args
            )

            yield { type: 'tool_result', toolResult: { tool_call_id: toolCall.id, content: result } }
            currentMessages.push({
              role: "tool",
              tool_call_id: toolCall.id,
              content: result
            })

          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error'
            const errorContent = `Error: ${errorMessage}`
            yield { type: 'error', error: errorMessage }
            currentMessages.push({
              role: "tool",
              tool_call_id: toolCall.id,
              content: errorContent
            })
          }
        }

        // Continue to next iteration to get final response

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        yield { type: 'error', error: errorMessage }
        return
      }
    }

    // Max iterations reached
    yield { type: 'done' }
  }

  /**
   * Raw streaming method that returns full chunks
   * Reuses SSE parsing logic from chatStream
   */
  private async *streamRaw(
    request: ExtendedChatCompletionRequest
  ): AsyncGenerator<ExtendedChatCompletionStreamChunk, void, unknown> {
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
              const chunk: ExtendedChatCompletionStreamChunk = JSON.parse(jsonStr)
              yield chunk
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

  /**
   * Generate a unique tool call ID
   */
  private generateToolCallId(): string {
    return `call_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
  }
}
