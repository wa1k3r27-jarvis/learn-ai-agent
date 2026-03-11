import type { ChatMessage } from "../agent/types"

interface MessageProps {
  message: ChatMessage
}

export function Message({ message }: MessageProps) {
  const isUser = message.role === "user"
  const isSystem = message.role === "system"

  return (
    <box
      flexDirection="column"
      padding={1}
      marginBottom={1}
      backgroundColor={isUser ? "#1a3a1a" : isSystem ? "#3a1a1a" : "#1a1a2e"}
      border
      borderStyle="rounded"
    >
      <text fg={isUser ? "#00ff00" : isSystem ? "#ff6600" : "#00ffff"} bold>
        {message.role.toUpperCase()}
      </text>
      <text marginTop={1}>
        {message.content}
      </text>
    </box>
  )
}
