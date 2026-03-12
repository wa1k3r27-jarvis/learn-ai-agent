# Tool Use 功能测试指南

## 实现概述

成功实现了 OpenAI Function Calling (tool_use) 功能，包括：

### 核心功能
1. **类型系统** - 扩展了消息类型以支持 tool calls 和 tool results
2. **工具注册系统** - 管理内置工具的注册、验证和执行
3. **内置工具集**:
   - `get_current_time` - 获取当前时间（支持时区）
   - `get_system_info` - 获取系统信息
   - `read_file` - 读取文件内容
   - `write_file` - 写入文件内容
   - `list_files` - 列出目录文件
   - `execute_code` - 执行 shell 命令

4. **流式工具调用** - 支持多轮对话中的工具调用
5. **UI 显示** - 在 TUI 中显示工具调用和结果

### 文件变更

**修改的文件:**
- `src/agent/types.ts` - 添加 tool 相关类型定义
- `src/agent/chat.ts` - 添加工具注册和 `chatStreamWithTools()` 方法
- `src/components/ChatArea.tsx` - 更新为使用工具流式传输
- `src/components/Message.tsx` - 显示工具调用和结果

**新增的文件:**
- `src/agent/tools/registry.ts` - 工具注册系统
- `src/agent/tools/errors.ts` - 自定义错误类
- `src/agent/tools/builtin/index.ts` - 导出所有内置工具
- `src/agent/tools/builtin/currentTime.ts` - 时间工具
- `src/agent/tools/builtin/systemInfo.ts` - 系统信息工具
- `src/agent/tools/builtin/file.ts` - 文件操作工具
- `src/agent/tools/builtin/codeExecution.ts` - 代码执行工具

## 测试方法

### 1. 启动应用

```bash
cd /Users/zhengzhou/Codes/projects.jarvis/learn-ai-agent
bun run dev
```

### 2. 测试用例

#### 测试 1: 基本工具调用 - 获取时间
**输入:**
```
What time is it now?
```
**预期结果:**
- Agent 调用 `get_current_time` 工具
- 显示工具调用 ID 和函数名
- 显示工具执行结果（当前时间）
- Agent 基于工具结果给出回答

#### 测试 2: 文件读取
**输入:**
```
Can you read the package.json file and tell me the version?
```
**预期结果:**
- Agent 调用 `read_file` 工具，路径为 `/Users/zhengzhou/Codes/projects.jarvis/learn-ai-agent/package.json`
- 显示文件内容
- Agent 提取版本号并回答

#### 测试 3: 系统信息
**输入:**
```
What's my system information?
```
**预期结果:**
- Agent 调用 `get_system_info` 工具
- 显示系统信息（OS、内存、CPU 等）
- Agent 总结系统信息

#### 测试 4: 目录列表
**输入:**
```
List the files in the current directory
```
**预期结果:**
- Agent 调用 `list_files` 工具
- 显示目录内容

#### 测试 5: 普通对话（无需工具）
**输入:**
```
Hello, how are you?
```
**预期结果:**
- Agent 直接回答，不调用任何工具

#### 测试 6: 错误处理
**输入:**
```
Read the file /nonexistent/path/to/file.txt
```
**预期结果:**
- Agent 调用 `read_file` 工具
- 工具返回错误信息
- Agent 报告文件不存在

#### 测试 7: 多轮对话
**输入:**
```
What's in the package.json file?
```
（等待回答后）
```
What's the description field?
```
**预期结果:**
- 第一轮：读取文件并显示内容
- 第二轮：基于已读取的内容回答

### 3. 观察要点

在日志面板中查看：
- `Tool called: <tool_name>` - 工具被调用
- `Tool result: <preview>` - 工具执行结果预览
- `Stream completed successfully` - 流式传输完成

在聊天区域查看：
- 黄色 "TOOL RESULT" 标签 - 工具结果消息
- 橙色 "Tool Calls:" - 助手消息中的工具调用
- 绿色 `→ <tool_name>` - 被调用的工具名称

## API 兼容性说明

当前配置使用 BigModel.cn 的 GLM-4 模型：
- `OPENAI_BASE_URL=https://open.bigmodel.cn/api/paas/v4`
- `OPENAI_MODEL=glm-4.7`

**重要**: GLM-4.7 需要支持 OpenAI Function Calling 格式才能正常使用 tool_use 功能。

如果 GLM-4.7 不支持 Function Calling，可以切换到：
1. **OpenAI GPT-3.5/GPT-4**:
   ```env
   OPENAI_BASE_URL=https://api.openai.com/v1
   OPENAI_MODEL=gpt-3.5-turbo
   ```

2. **其他兼容模型**:
   - Groq (Llama 3 with function calling)
   - Anthropic Claude (需要使用 Messages API，当前实现可能需要调整)
   - 其他支持 OpenAI Function Calling 的模型

## 调试技巧

### 查看日志
- 应用右侧有实时日志面板
- 工具调用会显示在日志中
- 错误信息会以红色显示

### 常见问题

1. **工具没有被调用**
   - 检查模型是否支持 Function Calling
   - 查看 API 返回的错误信息

2. **工具执行失败**
   - 查看日志中的错误详情
   - 检查文件路径是否正确
   - 检查权限问题

3. **类型错误**
   - 已通过 TypeScript 编译验证
   - 如有问题，运行 `bun build src/index.tsx --target=bun` 查看错误

## 下一步改进

- [ ] 添加更多内置工具（网络请求、数据库操作等）
- [ ] 支持 MCP (Model Context Protocol) 工具
- [ ] 添加工具执行的权限控制
- [ ] 改进错误处理和重试机制
- [ ] 添加工具执行的进度显示

## 技术细节

- **流式处理**: 使用 AsyncGenerator 实现，避免阻塞 UI
- **多轮支持**: 最多 5 轮工具调用，防止无限循环
- **错误恢复**: 工具执行错误作为工具结果返回，LLM 可以自我纠正
- **类型安全**: 完整的 TypeScript 类型定义
