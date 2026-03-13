import { createCliRenderer, ConsolePosition } from "@opentui/core"
import { createRoot } from "@opentui/react"
import { App } from "./App"

// Validate environment
if (!process.env.OPENAI_API_KEY) {
  console.error("Error: OPENAI_API_KEY environment variable is required")
  console.error("Create a .env file with: OPENAI_API_KEY=your_key_here")
  process.exit(1)
}

const renderer = await createCliRenderer({
  exitOnCtrlC: true, // We handle it in the app
  useMouse: true,
  consoleOptions: {
    position: ConsolePosition.RIGHT,
    sizePercent: 30,
    colorInfo: "#00ffff",
    colorWarn: "#ffff00",
    colorError: "#ff0000",
    colorDebug: "#888888",
    backgroundColor: "#0a0a14",
    title: "Logs",
    titleBarColor: "#1a1a2e",
    titleBarTextColor: "#00ffff",
    maxStoredLogs: 100,
  },
})
renderer.console.toggle()

createRoot(renderer).render(<App />)
