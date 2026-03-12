export interface ChatMessage {
  role: "system" | "user" | "assistant"
  content: string
}

export interface ChatCompletionRequest {
  model: string
  messages: ChatMessage[]
  stream?: boolean
  temperature?: number
  max_tokens?: number
}

export interface ChatCompletionResponse {
  id: string
  object: string
  created: number
  model: string
  choices: Array<{
    index: number
    message: ChatMessage
    finish_reason: string
  }>
  usage: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
}

export interface ChatCompletionStreamChunk {
  id: string
  object: string
  created: number
  model: string
  choices: Array<{
    index: number
    delta: {
      role?: string
      content?: string
    }
    finish_reason: string | null
  }>
}

export interface AgentConfig {
  apiKey: string
  baseURL?: string
  model?: string
}

// Tool definition for OpenAI Function Calling
export interface ToolDefinition {
  type: "function"
  function: {
    name: string
    description: string
    parameters: Record<string, unknown>
  }
}

// Tool call in assistant message
export interface ToolCall {
  id: string
  type: "function"
  function: {
    name: string
    arguments: string
  }
}

// Tool result message
export interface ToolMessage {
  role: "tool"
  tool_call_id: string
  content: string
}

// Extended message types supporting tool calls and tool messages
export type ExtendedChatMessage = ChatMessage | {
  role: "assistant"
  content: string | null
  tool_calls: ToolCall[]
} | ToolMessage

// Extended API request with tools support
export interface ExtendedChatCompletionRequest extends ChatCompletionRequest {
  tools?: ToolDefinition[]
  tool_choice?: "auto" | "required" | { type: "function", name: string }
}

// Extended stream chunk with tool_calls delta
export interface ExtendedChatCompletionStreamChunk extends ChatCompletionStreamChunk {
  choices: Array<{
    index: number
    delta: {
      role?: string
      content?: string
      tool_calls?: Array<{
        index: number
        id?: string
        type?: string
        function?: {
          name?: string
          arguments?: string
        }
      }>
    }
    finish_reason: string | null
  }>
}
