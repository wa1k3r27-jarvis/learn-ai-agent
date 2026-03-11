import { useState } from "react"

interface ChatInputProps {
  onSubmit: (message: string) => void
  disabled?: boolean
}

export function ChatInput({ onSubmit, disabled }: ChatInputProps) {
  const [value, setValue] = useState("")

  const handleSubmit = () => {
    if (value.trim() && !disabled) {
      onSubmit(value.trim())
      setValue("")
    }
  }

  return (
    <box
      height={7}
      flexDirection="column"
      paddingX={2}
      paddingY={1}
      border
      borderTop
      backgroundColor="#1a1a2e"
    >
      <text fg="#888888" marginBottom={1} height={1}>
        {disabled ? "Thinking..." : "Type your message (Press Enter to send)"}
      </text>
      <input
        value={value}
        onChange={setValue}
        onSubmit={handleSubmit}
        placeholder="Enter message..."
        disabled={disabled}
        focused={!disabled}
      />
      <box flexGrow={1} />
    </box>
  )
}
