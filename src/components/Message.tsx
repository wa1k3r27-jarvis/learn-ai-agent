import type { ChatMessage, ToolCall, ExtendedChatMessage } from "../agent/types"

interface MessageProps {
  message: ChatMessage | ExtendedChatMessage
}

export function Message({ message }: MessageProps) {
  const isUser = message.role === "user"
  const isSystem = message.role === "system"
  const isTool = message.role === "tool"
  const isAssistant = message.role === "assistant"

  // Check if this is an assistant message with tool calls
  const hasToolCalls = isAssistant && 'tool_calls' in message && message.tool_calls && message.tool_calls.length > 0

  return (
    <box
      flexDirection="column"
      padding={1}
      marginBottom={1}
      backgroundColor={
        isUser ? "#1a3a1a" :
        isSystem ? "#3a1a1a" :
        isTool ? "#2a2a1a" :
        "#1a1a2e"
      }
      border
      borderStyle="rounded"
    >
      <text fg={
        isUser ? "#00ff00" :
        isSystem ? "#ff6600" :
        isTool ? "#ffcc00" :
        "#00ffff"
      } attributes={1}>
        {isTool ? "TOOL RESULT" : message.role.toUpperCase()}
      </text>

      {/* Display tool calls if present */}
      {hasToolCalls && (
        <box marginTop={1} flexDirection="column">
          <text fg="#ff9900" attributes={1}>Tool Calls:</text>
          {(message as ExtendedChatMessage & { role: "assistant"; tool_calls: ToolCall[] }).tool_calls!.map((call: ToolCall, i: number) => (
            <box key={i} marginLeft={2}>
              <text fg="#00cc00">→ {call.function.name}</text>
              <text marginLeft={1} attributes={2}>({call.id})</text>
            </box>
          ))}
        </box>
      )}

      {/* Display content */}
      {message.content && (
        <text marginTop={hasToolCalls ? 1 : 1}>
          {message.content}
        </text>
      )}

      {/* Display tool call ID for tool results */}
      {isTool && 'tool_call_id' in message && (
        <text marginLeft={2} marginTop={1} attributes={2}>
          Tool Call ID: {(message as { tool_call_id: string }).tool_call_id}
        </text>
      )}
    </box>
  )
}
