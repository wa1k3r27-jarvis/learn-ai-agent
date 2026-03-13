import { ChatArea } from "./components/ChatArea"

export function App() {
  // Get API key from environment
  const apiKey = process.env.OPENAI_API_KEY || ""
  const baseURL = process.env.OPENAI_BASE_URL
  const model = process.env.OPENAI_MODEL
  return (
    <box
      flexDirection="column"
      width="100%"
      height="100%"
      backgroundColor="#0a0a14"
    >
      {/* Header */}
      <box
        height={1}
        paddingX={2}
        backgroundColor="#1a1a2e"
        border={["bottom"]}
        borderStyle="single"
        alignItems="center"
      >
        <text fg="#00ffff" attributes={1}>
          AI Agent Chat - ESC to exit
        </text>
      </box>

      {/* Main content area */}
      <ChatArea apiKey={apiKey} baseURL={baseURL} model={model} />
    </box>
  )
}
