import * as os from 'node:os'
import type { ToolExecutor } from '../registry'

export const getSystemInfoTool: ToolExecutor = {
  name: 'get_system_info',
  description: 'Get system information including OS type, memory, and CPU details',
  parameters: {
    type: 'object',
    properties: {}
  },
  execute: async () => {
    try {
      const cpus = os.cpus()
      const systemInfo = {
        platform: os.platform(),
        osType: os.type(),
        osRelease: os.release(),
        architecture: os.arch(),
        hostname: os.hostname(),
        totalMemory: `${Math.round(os.totalmem() / 1024 / 1024 / 1024)}GB`,
        freeMemory: `${Math.round(os.freemem() / 1024 / 1024 / 1024)}GB`,
        cpuCores: cpus.length,
        cpuModel: cpus[0]?.model || 'Unknown',
        uptime: `${Math.round(os.uptime() / 3600)} hours`
      }
      return JSON.stringify(systemInfo, null, 2)
    } catch (error) {
      return `Error getting system info: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  }
}
