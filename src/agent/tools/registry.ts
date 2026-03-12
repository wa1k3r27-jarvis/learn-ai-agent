/**
 * Tool Registry System
 * Central registry for managing built-in tools with validation and execution
 */

export interface ToolExecutor {
  name: string
  description: string
  parameters: Record<string, unknown>
  execute: (args: Record<string, unknown>) => Promise<string>
}

export interface ToolDefinition {
  type: "function"
  function: {
    name: string
    description: string
    parameters: Record<string, unknown>
  }
}

export class ToolRegistry {
  private tools: Map<string, ToolExecutor>

  constructor() {
    this.tools = new Map()
  }

  /**
   * Register a tool in the registry
   */
  register(tool: ToolExecutor): void {
    if (this.tools.has(tool.name)) {
      throw new Error(`Tool "${tool.name}" is already registered`)
    }
    this.tools.set(tool.name, tool)
  }

  /**
   * Get a specific tool by name
   */
  getTool(name: string): ToolExecutor | undefined {
    return this.tools.get(name)
  }

  /**
   * Get all tools in OpenAI Function Calling format
   */
  getAllTools(): ToolDefinition[] {
    return Array.from(this.tools.values()).map(tool => ({
      type: "function" as const,
      function: {
        name: tool.name,
        description: tool.description,
        parameters: tool.parameters
      }
    }))
  }

  /**
   * Validate tool parameters against JSON Schema
   * Basic validation - checks required parameters and types
   */
  validateParameters(name: string, args: Record<string, unknown>): { valid: boolean; error?: string } {
    const tool = this.tools.get(name)
    if (!tool) {
      return { valid: false, error: `Tool "${name}" not found` }
    }

    const schema = tool.parameters as { properties?: Record<string, unknown>; required?: string[] }

    // Check required parameters
    if (schema.required) {
      for (const requiredParam of schema.required) {
        if (!(requiredParam in args)) {
          return {
            valid: false,
            error: `Missing required parameter: "${requiredParam}"`
          }
        }
      }
    }

    // Basic type validation could be extended here
    // For now, we'll let the tool execution handle type errors

    return { valid: true }
  }

  /**
   * Execute a tool with given parameters
   */
  async execute(name: string, args: Record<string, unknown>): Promise<string> {
    const tool = this.tools.get(name)
    if (!tool) {
      throw new Error(`Tool "${name}" not found in registry`)
    }

    try {
      return await tool.execute(args)
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Tool "${name}" execution failed: ${error.message}`)
      }
      throw new Error(`Tool "${name}" execution failed with unknown error`)
    }
  }

  /**
   * Check if a tool exists
   */
  hasTool(name: string): boolean {
    return this.tools.has(name)
  }

  /**
   * Get all registered tool names
   */
  getToolNames(): string[] {
    return Array.from(this.tools.keys())
  }

  /**
   * Get the count of registered tools
   */
  size(): number {
    return this.tools.size
  }
}
