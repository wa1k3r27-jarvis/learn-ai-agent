import type { ToolExecutor } from '../registry'

export const getCurrentTimeTool: ToolExecutor = {
  name: 'get_current_time',
  description: 'Get the current date and time for a specified timezone',
  parameters: {
    type: 'object',
    properties: {
      timezone: {
        type: 'string',
        description: 'IANA timezone name (e.g., "America/New_York", "UTC", "Asia/Shanghai")',
        default: 'UTC'
      }
    }
  },
  execute: async (args) => {
    const timezone = args.timezone as string || 'UTC'
    try {
      const now = new Date()
      const formatted = now.toLocaleString('en-US', {
        timeZone: timezone,
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        timeZoneName: 'short'
      })
      return `Current time in ${timezone}: ${formatted}`
    } catch (error) {
      return `Error getting time for timezone "${timezone}": ${error instanceof Error ? error.message : 'Invalid timezone'}`
    }
  }
}
