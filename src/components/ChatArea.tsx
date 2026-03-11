import { useState, useEffect } from "react"
import { ChatDisplay } from "./ChatDisplay"
import { ChatInput } from "./ChatInput"
import { useLogger } from "./LogPanel"
import { ChatAgent } from "../agent/chat"
import type { ChatMessage } from "../agent/types"

const SYSTEM_PROMPT: ChatMessage = {
  role: "system",
  content: "You are a helpful AI assistant."
}

interface ChatAreaProps {
  apiKey: string
  baseURL?: string
  model?: string
}

export function ChatArea({ apiKey, baseURL, model }: ChatAreaProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([SYSTEM_PROMPT])
  const [loading, setLoading] = useState(false)
  const logger = useLogger()

  const agent = new ChatAgent({ apiKey, baseURL, model })

  // Log when component mounts
  useEffect(() => {
    logger.addLog("info", "Chat area initialized")
  }, [])

  const handleSubmit = async (userMessage: string) => {
    // Log user message
    logger.addLog("info", `User: ${userMessage.substring(0, 50)}${userMessage.length > 50 ? "..." : ""}`)

    // Add user message
    const newMessages: ChatMessage[] = [
      ...messages,
      { role: "user", content: userMessage }
    ]
    setMessages(newMessages)
    setLoading(true)

    // Initialize assistant message with empty content
    const assistantMessage: ChatMessage = { role: "assistant", content: "" }
    setMessages([...newMessages, assistantMessage])

    try {
      // Log API request details
      const requestUrl = `${baseURL || "https://api.openai.com/v1"}/chat/completions`
      const requestModel = model || "gpt-3.5-turbo"

      logger.addLog("debug", `API Request:`)
      logger.addLog("debug", `  URL: ${requestUrl}`)
      logger.addLog("debug", `  Model: ${requestModel}`)
      logger.addLog("debug", `  Stream: true`)

      // Stream response
      let fullResponse = ""
      for await (const chunk of agent.chatStream(newMessages)) {
        fullResponse += chunk
        setMessages([
          ...newMessages,
          { role: "assistant", content: fullResponse }
        ])
      }

      // Log assistant response
      logger.addLog("info", `Assistant: ${fullResponse.substring(0, 50)}${fullResponse.length > 50 ? "..." : ""}`)
      logger.addLog("debug", "Stream completed successfully")
    } catch (error) {
      // Log error
      const errorMessage = error instanceof Error ? error.message : "Unknown error"
      logger.addLog("error", `Error: ${errorMessage}`)

      setMessages([
        ...newMessages,
        { role: "system", content: `Error: ${errorMessage}` }
      ])
    } finally {
      setLoading(false)
    }
  }

  return (
    <box flexDirection="column" flexGrow={1}>
      {/* Chat Display */}
      <ChatDisplay messages={messages} />

      {/* Input */}
      <ChatInput onSubmit={handleSubmit} disabled={loading} />
    </box>
  )
}
