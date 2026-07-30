> [中文版](./README.md)

# NoticeMCP

An MCP notification server that delivers AI agent task results to macOS Notification Center and Feishu chats.

NoticeMCP is designed for long-running coding, research, and automation tasks. An agent can call `send_notification` when work finishes or needs attention. The project has tagged releases, with **v0.3.1** as the current version, and its main entry point runs directly with Node.js.

## Why NoticeMCP

- **Built for agents:** exposes a notification tool through the Model Context Protocol.
- **Two notification backends:** macOS native notifications and Feishu custom-bot webhooks.
- **One call, multiple destinations:** sends to every enabled backend concurrently.
- **Local configuration:** manages backends in TOML; `config.toml` is ignored by Git by default.
- **Existing client guides:** includes setup instructions for Trae AI and Claude Desktop.

## Current Capabilities

| Capability | Status | Details |
|---|---|---|
| `send_notification` | Available | Accepts `title` and `message` |
| macOS notifications | Available | Supports sound, subtitle, timeout, and related options |
| Feishu notifications | Available | Supports a custom-bot webhook, signing, and mentions |
| Multi-backend delivery | Available | A failure in one backend does not stop the others |

## Quick Start

Requirements: Node.js and npm. The macOS backend only runs on macOS. The Feishu backend requires your own custom-bot webhook.

```bash
git clone https://github.com/LAD021/NoticeMCP.git
cd NoticeMCP
npm install
cp config.example.toml config.toml
```

Edit `config.toml` and enable only the backends you need:

```toml
[backends.macos]
enabled = true

[backends.feishu]
enabled = false
webhook_url = "https://open.feishu.cn/open-apis/bot/v2/hook/YOUR_WEBHOOK_TOKEN"
```

Never commit a real webhook. Start the server after configuration:

```bash
node start.js
```

## Connect an MCP Client

The following is the generic stdio configuration shape. Replace the path with the absolute path to your local checkout:

```json
{
  "mcpServers": {
    "notice-mcp": {
      "command": "node",
      "args": ["/absolute/path/to/NoticeMCP/start.js"]
    }
  }
}
```

- [Trae AI setup guide](./docs/TRAE_SETUP.md)
- [Claude Desktop setup guide](./docs/CLAUDE_DESKTOP_SETUP.md)
- [TOML configuration guide](./docs/TOML_CONFIG_GUIDE.md)

## MCP Tool

### `send_notification`

```json
{
  "title": "Task complete",
  "message": "The build and checks have finished."
}
```

The server delivers the message to all backends enabled in `config.toml` and returns the result for each backend.

## Project Status

- Current version: `v0.3.1`
- Release form: Git tags (the repository currently has no separate GitHub Releases page)
- License: MIT
- Main implementation: JavaScript / TypeScript

The repository retains early tests and experimental scripts. Some historical tests still depend on old build artifacts or a local notification environment, so validate a deployment with a real MCP client and an actual delivery through each target backend.

## Security

- Keep `config.toml` local; it is ignored by `.gitignore`.
- Do not expose Feishu webhooks or signing secrets in issues, logs, or screenshots.
- Enable keyword checks, an IP allowlist, or signature verification on the Feishu bot when appropriate.

## License and Feedback

Released under the [MIT License](./LICENSE). Report problems or propose improvements through [GitHub Issues](https://github.com/LAD021/NoticeMCP/issues).
