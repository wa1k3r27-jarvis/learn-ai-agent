import { useState, useEffect } from "react"
import { ChatDisplay } from "./ChatDisplay"
import { ChatInput } from "./ChatInput"
import { useLogger } from "./LogPanel"
import { ChatAgent } from "../agent/chat"
import type { ChatMessage, ExtendedChatMessage } from "../agent/types"

const SYSTEM_PROMPT: ExtendedChatMessage = {
  role: "system",
  content: "You are a helpful AI assistant with access to various tools. Use tools when appropriate to help users."
}

interface ChatAreaProps {
  apiKey: string
  baseURL?: string
  model?: string
}

export function ChatArea({ apiKey, baseURL, model }: ChatAreaProps) {
  const [messages, setMessages] = useState<ExtendedChatMessage[]>([SYSTEM_PROMPT])
  const [loading, setLoading] = useState(false)
  const logger = useLogger()

  const agent = new ChatAgent({ apiKey, baseURL, model })

  // Log when component mounts
  useEffect(() => {
    logger.addLog("info", "Chat area initialized with tool support")
  }, [])

  const handleSubmit = async (userMessage: string) => {
    // Log user message
    logger.addLog("info", `User: ${userMessage.substring(0, 50)}${userMessage.length > 50 ? "..." : ""}`)

    // Add user message
    const newMessages: ExtendedChatMessage[] = [
      ...messages,
      { role: "user", content: userMessage }
    ]
    setMessages(newMessages)
    setLoading(true)

    try {
      // Log API request details
      const requestUrl = `${baseURL || "https://api.openai.com/v1"}/chat/completions`
      const requestModel = model || "gpt-3.5-turbo"

      logger.addLog("debug", `API Request:`)
      logger.addLog("debug", `  URL: ${requestUrl}`)
      logger.addLog("debug", `  Model: ${requestModel}`)
      logger.addLog("debug", `  Stream: true (with tools)`)

      // Convert to ExtendedChatMessage and stream with tools
      let currentMessages: ExtendedChatMessage[] = [...newMessages]
      let currentContent = ""
      const toolMessages: ExtendedChatMessage[] = []

      // Initialize with empty assistant message
      setMessages([
        ...currentMessages,
        { role: "assistant", content: "" } as ExtendedChatMessage
      ])

      for await (const event of agent.chatStreamWithTools(currentMessages)) {
        switch (event.type) {
          case 'content':
            if (event.content) {
              currentContent += event.content
              setMessages([
                ...currentMessages,
                ...toolMessages,
                { role: "assistant", content: currentContent }
              ])
            }
            break

          case 'tool_call':
            if (event.toolCall) {
              logger.addLog("info", `Tool called: ${event.toolCall.function.name}`)
              toolMessages.push({
                role: "assistant",
                content: currentContent || null,
                tool_calls: [event.toolCall]
              })
              setMessages([
                ...currentMessages,
                ...toolMessages
              ])
            }
            break

          case 'tool_result':
            if (event.toolResult) {
              const preview = event.toolResult.content.substring(0, 50)
              logger.addLog("info", `Tool result: ${preview}${event.toolResult.content.length > 50 ? "..." : ""}`)
              toolMessages.push({
                role: "tool",
                tool_call_id: event.toolResult.tool_call_id,
                content: event.toolResult.content
              })
              setMessages([
                ...currentMessages,
                ...toolMessages
              ])
            }
            break

          case 'error':
            if (event.error) {
              logger.addLog("error", `Error: ${event.error}`)
            }
            break

          case 'done':
            // Stream completed, update current messages for next iteration
            if (toolMessages.length > 0) {
              // Include the final assistant response if there's current content
              // This handles the case where LLM responds after tool execution
              if (currentContent) {
                currentMessages = [
                  ...currentMessages,
                  ...toolMessages,
                  { role: "assistant", content: currentContent }
                ]
              } else {
                currentMessages = [
                  ...currentMessages,
                  ...toolMessages
                ]
              }
            } else {
              // No tool calls, just add the assistant response
              currentMessages = [
                ...currentMessages,
                { role: "assistant", content: currentContent }
              ]
            }

            // Reset tracking for next iteration
            currentContent = ""
            toolMessages.length = 0
            break
        }
      }

      // Log completion
      logger.addLog("info", `Final response: ${currentContent.substring(0, 50)}${currentContent.length > 50 ? "..." : ""}`)
      logger.addLog("debug", "Stream completed successfully")

      // Update final messages state
      setMessages(currentMessages)

    } catch (error) {
      // Log error
      const errorMessage = error instanceof Error ? error.message : "Unknown error"
      logger.addLog("error", `Error: ${errorMessage}`)

      setMessages([
        ...messages,
        { role: "user", content: userMessage },
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
