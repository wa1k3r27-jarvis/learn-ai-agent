import { execSync } from 'child_process'
import type { ToolExecutor } from '../registry'

export const executeCodeTool: ToolExecutor = {
  name: 'execute_code',
  description: 'Execute shell code or commands. Use with caution as this can execute arbitrary code. Commands run with a timeout.',
  parameters: {
    type: 'object',
    properties: {
      code: {
        type: 'string',
        description: 'Shell code or command to execute'
      },
      timeout: {
        type: 'number',
        description: 'Timeout in milliseconds (default: 5000)',
        default: 5000
      }
    },
    required: ['code']
  },
  execute: async (args) => {
    try {
      const code = args.code as string
      const timeout = (args.timeout as number) || 5000

      const result = execSync(code, {
        encoding: 'utf-8',
        timeout: timeout,
        stdio: 'pipe',
        maxBuffer: 1024 * 1024 // 1MB max buffer
      })

      // Trim trailing newlines for cleaner output
      const trimmed = result.trimEnd()
      return trimmed || 'Command executed successfully (no output)'
    } catch (error) {
      if (error instanceof Error) {
        // Provide detailed error information
        const errorMsg = error.message
        if (errorMsg.includes('timed out')) {
          return `Command execution timed out after ${args.timeout || 5000}ms`
        }
        return `Execution error: ${errorMsg}`
      }
      return `Execution error: Unknown error occurred`
    }
  }
}
