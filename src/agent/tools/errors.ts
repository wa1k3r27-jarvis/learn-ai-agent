/**
 * Custom error classes for tool execution
 * Provides specific error types for better error handling and debugging
 */

/**
 * Error thrown when tool execution fails
 */
export class ToolExecutionError extends Error {
  constructor(
    public toolName: string,
    public originalError: Error
  ) {
    super(`Tool '${toolName}' execution failed: ${originalError.message}`)
    this.name = 'ToolExecutionError'
    Object.setPrototypeOf(this, ToolExecutionError.prototype)
  }
}

/**
 * Error thrown when tool parameter validation fails
 */
export class ToolValidationError extends Error {
  constructor(
    public toolName: string,
    public validationErrors: string[]
  ) {
    super(`Tool '${toolName}' validation failed: ${validationErrors.join(', ')}`)
    this.name = 'ToolValidationError'
    Object.setPrototypeOf(this, ToolValidationError.prototype)
  }
}

/**
 * Error thrown when a requested tool is not found in the registry
 */
export class ToolNotFoundError extends Error {
  constructor(public toolName: string) {
    super(`Tool '${toolName}' not found in registry`)
    this.name = 'ToolNotFoundError'
    Object.setPrototypeOf(this, ToolNotFoundError.prototype)
  }
}
