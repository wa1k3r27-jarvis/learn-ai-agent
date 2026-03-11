# Learn AI Agent

A TUI-based AI Agent Chat application built with [OpenTUI](https://github.com/opentui/opentui), featuring real-time streaming chat capabilities with OpenAI-compatible APIs.

## Features

- **Terminal User Interface**: Modern TUI built with OpenTUI and React
- **Streaming Support**: Real-time streaming responses from LLM APIs
- **Log Panel**: Built-in logging system for debugging and monitoring
- **Multiple Provider Support**: Works with OpenAI, local LLMs, and other OpenAI-compatible APIs

## Getting Started

### Prerequisites

- [Bun](https://bun.sh/) - Fast JavaScript runtime and package manager

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd learn-ai-agent
```

2. Install dependencies:
```bash
bun install
```

3. Configure environment variables:
```bash
cp .env.example .env
```

Edit `.env` and add your API credentials:
```env
OPENAI_API_KEY=your_api_key_here
OPENAI_BASE_URL=https://api.openai.com/v1
OPENAI_MODEL=gpt-3.5-turbo
```

4. Run the application:
```bash
bun run dev
```

Press `ESC` or `Ctrl+C` to exit the application.

## API Reference

This project uses the OpenAI Chat Completions API format. For detailed API documentation, see:
- [OpenAI API Reference - Chat Completions](https://developers.openai.com/api/reference/resources/chat/subresources/completions/methods/create)

## Learning Resources

- [Learn Claude Agents](https://learn-claude-agents.vercel.app/) - Comprehensive guide to building AI agents

## License

MIT
