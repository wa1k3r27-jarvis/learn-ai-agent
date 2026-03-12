import { createCliRenderer } from "@opentui/core"
import { createRoot } from "@opentui/react"
import { App } from "./App"
import { LogProvider } from "./components/LogProvider"

// Validate environment
if (!process.env.OPENAI_API_KEY) {
  console.error("Error: OPENAI_API_KEY environment variable is required")
  console.error("Create a .env file with: OPENAI_API_KEY=your_key_here")
  process.exit(1)
}

const renderer = await createCliRenderer({
  exitOnCtrlC: false, // We handle it in the app
  useMouse: true,
})

createRoot(renderer).render(
  <LogProvider>
    <App />
  </LogProvider>
)
