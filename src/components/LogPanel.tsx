import { useState, useEffect, createContext, useContext, useRef } from "react"
import { useTerminalDimensions } from "@opentui/react"
import type { ScrollBoxRenderable } from "@opentui/core"

export interface LogEntry {
  id: number
  timestamp: string
  level: "info" | "warn" | "error" | "debug"
  message: string
}

interface LogPanelProps {
  width?: number
  title?: string
  children?: React.ReactNode
}

// Create a context for the log function
const LogContext = createContext<{
  addLog: (level: LogEntry["level"], message: string) => void
} | null>(null)

// Custom hook to use the logger
export const useLogger = () => {
  const context = useContext(LogContext)
  if (!context) {
    throw new Error("useLogger must be used within a LogPanel provider")
  }
  return context
}

let logIdCounter = 0

export function LogPanel({ width = 40, title = "Logs", children }: LogPanelProps) {
  const [logs, setLogs] = useState<LogEntry[]>([
    {
      id: logIdCounter++,
      timestamp: new Date().toLocaleTimeString("en-US", {
        hour12: false,
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      }),
      level: "info" as const,
      message: "Log panel initialized"
    }
  ])
  const dims = useTerminalDimensions()
  const scrollBoxRef = useRef<ScrollBoxRenderable>(null)

  // Auto-scroll to bottom when new logs are added
  useEffect(() => {
    if (scrollBoxRef.current && logs.length > 1) {
      // Scroll to the bottom using scrollTo method
      scrollBoxRef.current.scrollTo(scrollBoxRef.current.scrollHeight)
    }
  }, [logs.length])

  // Add a log entry
  const addLog = (level: LogEntry["level"], message: string) => {
    const now = new Date()
    const timestamp = now.toLocaleTimeString("en-US", {
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    })

    const newLog: LogEntry = {
      id: logIdCounter++,
      timestamp,
      level,
      message
    }

    setLogs((prev) => {
      const newLogs = [...prev, newLog]
      // Keep only last 100 logs
      if (newLogs.length > 100) {
        return newLogs.slice(-100)
      }
      return newLogs
    })
  }

  // Add terminal dimension log when dimensions change
  useEffect(() => {
    addLog("debug", `Terminal: ${dims.width}x${dims.height}`)
  }, [dims.width, dims.height])

  const getLevelColor = (level: LogEntry["level"]): string => {
    switch (level) {
      case "info": return "#00ffff"
      case "warn": return "#ffff00"
      case "error": return "#ff0000"
      case "debug": return "#888888"
      default: return "#ffffff"
    }
  }

  const getLevelSymbol = (level: LogEntry["level"]): string => {
    switch (level) {
      case "info": return "ℹ"
      case "warn": return "⚠"
      case "error": return "✖"
      case "debug": return "•"
      default: return "?"
    }
  }

  return (
    <LogContext.Provider value={{ addLog }}>
      <box flexDirection="row" flexGrow={1}>
        {/* Log Panel - Left Sidebar */}
        <box
          width={width}
          flexDirection="column"
          backgroundColor="#0a0a14"
          borderStyle="single"
          border={["right"]}
        >
          {/* Header */}
          <box
            height={2}
            paddingX={1}
            backgroundColor="#1a1a2e"
            border={["bottom"]}
            borderStyle="single"
          >
            <text fg="#00ffff" attributes={1}>{title}</text>
          </box>

          {/* Log entries with scroll */}
          <scrollbox
            ref={scrollBoxRef}
            flexGrow={1}
            paddingX={1}
            backgroundColor="#0a0a14"
          >
            {logs.map((log) => (
              <box key={log.id} flexDirection="row" marginBottom={0}>
                <text fg="#666666" width={8}>{log.timestamp}</text>
                <text fg={getLevelColor(log.level)} width={2}>{getLevelSymbol(log.level)}</text>
                <text fg="#ffffff">{log.message}</text>
              </box>
            ))}
          </scrollbox>

          {/* Footer with log count */}
          <box
            height={1}
            paddingX={1}
            backgroundColor="#1a1a2e"
            border={["top"]}
            borderStyle="single"
          >
            <text fg="#888888">{logs.length} entries</text>
          </box>
        </box>

        {/* Children rendered in the main content area */}
        {children}
      </box>
    </LogContext.Provider>
  )
}
