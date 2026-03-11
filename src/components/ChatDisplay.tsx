import { Message } from "./Message"
import type { ChatMessage } from "../agent/types"

interface ChatDisplayProps {
  messages: ChatMessage[]
}

export function ChatDisplay({ messages }: ChatDisplayProps) {
  return (
    <scrollbox
      flexGrow={1}
      padding={1}
      backgroundColor="#0f0f1a"
      border
      title="Chat History"
    >
      {messages.map((msg, i) => (
        <Message key={i} message={msg} />
      ))}
    </scrollbox>
  )
}
