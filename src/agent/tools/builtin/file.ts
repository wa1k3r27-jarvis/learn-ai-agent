import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs'
import { join } from 'path'
import type { ToolExecutor } from '../registry'

export const readFileTool: ToolExecutor = {
  name: 'read_file',
  description: 'Read the contents of a file. Requires absolute file path.',
  parameters: {
    type: 'object',
    properties: {
      path: {
        type: 'string',
        description: 'Absolute path to the file to read'
      }
    },
    required: ['path']
  },
  execute: async (args) => {
    try {
      const path = args.path as string
      const content = readFileSync(path, 'utf-8')
      // Limit content size to avoid overwhelming the LLM
      const maxLength = 10000
      if (content.length > maxLength) {
        return content.substring(0, maxLength) + `\n\n... (truncated, total ${content.length} characters)`
      }
      return content
    } catch (error) {
      return `Error reading file: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  }
}

export const writeFileTool: ToolExecutor = {
  name: 'write_file',
  description: 'Write content to a file. Requires absolute file path. Creates file if it doesn\'t exist, overwrites if it does.',
  parameters: {
    type: 'object',
    properties: {
      path: {
        type: 'string',
        description: 'Absolute path to the file to write'
      },
      content: {
        type: 'string',
        description: 'Content to write to the file'
      }
    },
    required: ['path', 'content']
  },
  execute: async (args) => {
    try {
      const path = args.path as string
      const content = args.content as string
      writeFileSync(path, content, 'utf-8')
      return `Successfully wrote to ${path}`
    } catch (error) {
      return `Error writing file: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  }
}

export const listFilesTool: ToolExecutor = {
  name: 'list_files',
  description: 'List files and directories in a specified path. Requires absolute path.',
  parameters: {
    type: 'object',
    properties: {
      path: {
        type: 'string',
        description: 'Absolute path to the directory to list'
      }
    },
    required: ['path']
  },
  execute: async (args) => {
    try {
      const path = args.path as string
      const entries = readdirSync(path, { withFileTypes: true })

      const result = entries.map(entry => {
        const fullPath = join(path, entry.name)
        let stats: typeof statSync.prototype | null = null
        try {
          stats = statSync(fullPath)
        } catch (e) {
          // Skip if can't get stats
        }

        const type = entry.isDirectory() ? 'DIR' : entry.isSymbolicLink() ? 'SYMLINK' : 'FILE'
        const size = stats?.isFile() ? `${Math.round(stats.size / 1024)}KB` : '-'
        return `${type.padEnd(8)} ${size.padEnd(10)} ${entry.name}`
      })

      return `Contents of ${path}:\n${result.join('\n')}`
    } catch (error) {
      return `Error listing directory: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  }
}
