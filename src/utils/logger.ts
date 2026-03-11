/**
 * Simple logger utility for the TUI application
 * Logs are displayed in the LogPanel sidebar
 */

export type LogLevel = "info" | "warn" | "error" | "debug"

interface Logger {
  info: (message: string) => void
  warn: (message: string) => void
  error: (message: string) => void
  debug: (message: string) => void
}

// Create a logger instance that works in both browser and Bun environments
const createLogger = (): Logger => {
  // @ts-ignore - Global log function added by LogPanel
  const globalLog = typeof window !== "undefined" ? (window as any).addLog : null

  return {
    info: (message: string) => {
      console.log(`[INFO] ${message}`)
      // @ts-ignore
      if (globalLog) globalLog("info", message)
    },
    warn: (message: string) => {
      console.warn(`[WARN] ${message}`)
      // @ts-ignore
      if (globalLog) globalLog("warn", message)
    },
    error: (message: string) => {
      console.error(`[ERROR] ${message}`)
      // @ts-ignore
      if (globalLog) globalLog("error", message)
    },
    debug: (message: string) => {
      console.debug(`[DEBUG] ${message}`)
      // @ts-ignore
      if (globalLog) globalLog("debug", message)
    },
  }
}

export const logger = createLogger()

// Example usage:
// import { logger } from './utils/logger'
// logger.info("User joined the chat")
// logger.error("Failed to connect to API")
// logger.debug("API response: {...}")
// logger.warn("Rate limit approaching")
