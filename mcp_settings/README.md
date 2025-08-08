# MCP Settings

这个文件夹包含了在不同AI助手中配置NoticeMCP的示例文件。

## 文件说明

### Claude Desktop 配置
- `claude_desktop_config.json` - Claude Desktop的MCP服务器配置
- `claude_config_example.json` - Claude配置示例文件

### Trae AI 配置
- `trae_config.json` - 当前Trae AI的配置文件
- `trae_config_example.json` - Trae AI配置示例文件

## 使用方法

### 在Claude Desktop中使用

1. 复制 `claude_desktop_config.json` 的内容
2. 将内容添加到你的Claude Desktop配置文件中（通常位于 `~/Library/Application Support/Claude/claude_desktop_config.json`）
3. 修改路径以匹配你的NoticeMCP安装位置
4. 重启Claude Desktop

### 在Trae AI中使用

1. 参考 `trae_config_example.json` 的配置格式
2. 在Trae AI的设置中添加MCP服务器配置
3. 确保路径指向正确的NoticeMCP安装位置
4. 配置环境变量指向你的config.toml文件

## 注意事项

- 所有路径都需要根据你的实际安装位置进行调整
- 确保Node.js和TypeScript已正确安装
- 配置文件中的服务器名称可以根据需要自定义
- 在修改配置后需要重启相应的AI助手应用

## 配置验证

配置完成后，你可以通过以下方式验证MCP服务器是否正常工作：

1. 在AI助手中尝试发送通知
2. 检查服务器日志是否有错误信息
3. 确认通知后端（如macOS、Slack等）是否正常接收消息