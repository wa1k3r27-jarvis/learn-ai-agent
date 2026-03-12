import { useEffect, useRef } from "react"
import type { ScrollBoxRenderable } from "@opentui/core"
import { useLogger, type LogEntry } from "./LogProvider"

interface LogPanelProps {
  width?: number
  title?: string
  children?: React.ReactNode
}

export function LogPanel({ width = 40, title = "Logs", children }: LogPanelProps) {
  const { logs } = useLogger()
  const scrollBoxRef = useRef<ScrollBoxRenderable>(null)

  // Auto-scroll to bottom when new logs are added
  useEffect(() => {
    if (scrollBoxRef.current && logs.length > 1) {
      // Scroll to the bottom using scrollTo method
      scrollBoxRef.current.scrollTo(scrollBoxRef.current.scrollHeight)
    }
  }, [logs.length])

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
  )
}
