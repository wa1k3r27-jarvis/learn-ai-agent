import { useState, useEffect, createContext, useContext } from "react"
import { useTerminalDimensions } from "@opentui/react"

export interface LogEntry {
  id: number
  timestamp: string
  level: "info" | "warn" | "error" | "debug"
  message: string
}

interface LogContextValue {
  logs: LogEntry[]
  addLog: (level: LogEntry["level"], message: string) => void
}

// Create a context for the log function
const LogContext = createContext<LogContextValue | null>(null)

interface LogProviderProps {
  children: React.ReactNode
}

let logIdCounter = 0

export function LogProvider({ children }: LogProviderProps) {
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

  return (
    <LogContext.Provider value={{ logs, addLog }}>
      {children}
    </LogContext.Provider>
  )
}

// Custom hook to use the logger
export const useLogger = () => {
  const context = useContext(LogContext)
  if (!context) {
    throw new Error("useLogger must be used within a LogProvider")
  }
  return context
}
