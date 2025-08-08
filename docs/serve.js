#!/usr/bin/env node

/**
 * NoticeMCP 文档服务器
 * 基于 Docsify 的轻量级文档服务
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

// 配置
const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || 'localhost';
const DOCS_DIR = __dirname;

// MIME 类型映射
const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.md': 'text/markdown; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon'
};

/**
 * 获取文件的 MIME 类型
 */
function getMimeType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  return MIME_TYPES[ext] || 'application/octet-stream';
}

/**
 * 检查文件是否存在
 */
function fileExists(filePath) {
  try {
    return fs.statSync(filePath).isFile();
  } catch (err) {
    return false;
  }
}

/**
 * 处理静态文件请求
 */
function serveStaticFile(res, filePath) {
  try {
    const content = fs.readFileSync(filePath);
    const mimeType = getMimeType(filePath);
    
    res.writeHead(200, {
      'Content-Type': mimeType,
      'Cache-Control': 'public, max-age=3600',
      'Access-Control-Allow-Origin': '*'
    });
    
    res.end(content);
  } catch (err) {
    console.error(`Error serving file ${filePath}:`, err.message);
    res.writeHead(500, { 'Content-Type': 'text/plain' });
    res.end('Internal Server Error');
  }
}

/**
 * 处理 404 错误
 */
function serve404(res) {
  const notFoundHtml = `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <title>404 - 页面未找到 | NoticeMCP</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      text-align: center;
      padding: 50px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      margin: 0;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      justify-content: center;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
    }
    h1 {
      font-size: 4em;
      margin: 0;
      opacity: 0.8;
    }
    h2 {
      font-size: 1.5em;
      margin: 20px 0;
    }
    p {
      font-size: 1.1em;
      line-height: 1.6;
      opacity: 0.9;
    }
    a {
      color: #fff;
      text-decoration: none;
      background: rgba(255,255,255,0.2);
      padding: 10px 20px;
      border-radius: 5px;
      display: inline-block;
      margin: 10px;
      transition: background 0.3s;
    }
    a:hover {
      background: rgba(255,255,255,0.3);
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>404</h1>
    <h2>🔍 页面未找到</h2>
    <p>抱歉，你访问的页面不存在。</p>
    <div>
      <a href="/">🏠 返回首页</a>
      <a href="/USAGE_GUIDE.md">📖 使用指南</a>
      <a href="/API_REFERENCE.md">🔌 API 参考</a>
    </div>
  </div>
</body>
</html>
  `;
  
  res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(notFoundHtml);
}

/**
 * 创建 HTTP 服务器
 */
const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);
  let pathname = parsedUrl.pathname;
  
  // 移除查询参数和锚点
  pathname = pathname.split('?')[0].split('#')[0];
  
  // 安全检查：防止路径遍历攻击
  if (pathname.includes('..') || pathname.includes('~')) {
    serve404(res);
    return;
  }
  
  // 根路径重定向到 index.html
  if (pathname === '/') {
    pathname = '/index.html';
  }
  
  // 构建文件路径
  const filePath = path.join(DOCS_DIR, pathname);
  
  // 记录请求
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.url} -> ${pathname}`);
  
  // 检查文件是否存在
  if (fileExists(filePath)) {
    serveStaticFile(res, filePath);
  } else {
    // 如果是 .md 文件请求，尝试直接返回 markdown 内容
    if (pathname.endsWith('.md')) {
      const mdPath = path.join(DOCS_DIR, pathname);
      if (fileExists(mdPath)) {
        serveStaticFile(res, mdPath);
        return;
      }
    }
    
    // 文件不存在，返回 404
    console.log(`[${timestamp}] 404 - File not found: ${filePath}`);
    serve404(res);
  }
});

/**
 * 启动服务器
 */
server.listen(PORT, HOST, () => {
  console.log('\n🚀 NoticeMCP 文档服务器已启动!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`📍 服务地址: http://${HOST}:${PORT}`);
  console.log(`📁 文档目录: ${DOCS_DIR}`);
  console.log(`🕒 启动时间: ${new Date().toLocaleString()}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('\n📚 可用页面:');
  console.log(`   🏠 首页: http://${HOST}:${PORT}/`);
  console.log(`   📖 使用指南: http://${HOST}:${PORT}/USAGE_GUIDE.md`);
  console.log(`   🔌 API 参考: http://${HOST}:${PORT}/API_REFERENCE.md`);
  console.log(`   🏗️ 架构文档: http://${HOST}:${PORT}/ARCHITECTURE.md`);
  console.log(`   ⚙️ 配置指南: http://${HOST}:${PORT}/TOML_CONFIG_GUIDE.md`);
  console.log('\n💡 提示: 按 Ctrl+C 停止服务器\n');
});

/**
 * 优雅关闭
 */
process.on('SIGINT', () => {
  console.log('\n\n🛑 正在关闭文档服务器...');
  server.close(() => {
    console.log('✅ 文档服务器已关闭');
    process.exit(0);
  });
});

process.on('SIGTERM', () => {
  console.log('\n\n🛑 收到终止信号，正在关闭服务器...');
  server.close(() => {
    console.log('✅ 文档服务器已关闭');
    process.exit(0);
  });
});

/**
 * 错误处理
 */
server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`❌ 端口 ${PORT} 已被占用，请尝试其他端口:`);
    console.error(`   PORT=3001 node serve.js`);
    console.error(`   PORT=8080 node serve.js`);
  } else {
    console.error('❌ 服务器错误:', err.message);
  }
  process.exit(1);
});

// 导出服务器实例（用于测试）
module.exports = server;