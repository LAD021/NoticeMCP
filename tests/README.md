# 测试文件目录结构

本目录包含了 Notice MCP Server 的所有测试文件，按功能分类组织。

## 目录结构

```
tests/
├── README.md                           # 本文件，测试目录说明
├── integration.test.js                  # 原有的集成测试
├── unit/                               # 单元测试
│   └── server.test.js                  # 服务器基本功能测试
├── integration/                        # 集成测试
│   └── trae-integration.test.js        # Trae AI MCP 集成测试
├── backends/                           # 后端测试
│   ├── macos.test.js                   # MacOS 通知后端测试
│   └── node-notifier.test.js           # node-notifier 后端测试
├── config/                             # 配置测试
│   └── config.test.js                  # TOML 配置管理测试
└── mcp/                                # MCP 协议测试
    └── mcp-macos.test.js               # MCP 服务器 MacOS 通知测试
```

## 测试文件说明

### 单元测试 (unit/)

- **server.test.js**: 测试 MCP 服务器的基本功能，包括模拟的通知管理器和各种后端的基本操作

### 集成测试 (integration/)

- **integration.test.js**: 原有的完整集成测试，测试整个系统的端到端功能
- **trae-integration.test.js**: 专门测试 Trae AI 的 MCP 配置和集成

### 后端测试 (backends/)

- **macos.test.js**: 测试 MacOS 系统通知功能，包括基本通知、带副标题和声音的通知
- **node-notifier.test.js**: 测试 node-notifier 库的 MacOS 通知功能

### 配置测试 (config/)

- **config.test.js**: 测试 TOML 配置文件的加载、解析和使用

### MCP 协议测试 (mcp/)

- **mcp-macos.test.js**: 测试通过 MCP 服务器发送 MacOS 通知的完整流程

## 运行测试

### 运行所有测试
```bash
# 使用测试脚本
./run-tests.sh

# 或者手动运行
node tests/integration.test.js
```

### 运行特定类型的测试

```bash
# 单元测试
node tests/unit/server.test.js

# 后端测试
node tests/backends/macos.test.js
node tests/backends/node-notifier.test.js

# 配置测试
node tests/config/config.test.js

# MCP 测试
node tests/mcp/mcp-macos.test.js

# 集成测试
node tests/integration/trae-integration.test.js
```

## 测试环境要求

- Node.js 18+
- macOS (对于 MacOS 通知测试)
- 已安装项目依赖 (`npm install`)
- 配置文件 `config.toml` 存在

## 添加新测试

当添加新的测试文件时，请按照以下规则：

1. **命名规范**: 使用 `*.test.js` 后缀
2. **目录分类**: 根据测试类型放入相应目录
3. **文件头部**: 添加清晰的注释说明测试目的
4. **导出函数**: 导出主要的测试函数以便其他测试调用

### 目录选择指南

- **unit/**: 测试单个模块或函数的功能
- **integration/**: 测试多个模块协同工作的功能
- **backends/**: 测试特定通知后端的功能
- **config/**: 测试配置相关的功能
- **mcp/**: 测试 MCP 协议相关的功能

## 注意事项

- MacOS 通知测试需要在 macOS 系统上运行
- 某些测试可能需要网络连接（如 webhook 测试）
- 集成测试会启动实际的 MCP 服务器，确保端口未被占用
- 测试过程中可能会显示实际的系统通知