#!/usr/bin/env node

/**
 * Notice MCP Server 功能测试脚本
 * 用于测试运行中的MCP服务器的所有功能
 * 通过直接与服务器通信来验证功能
 */

import { spawn } from 'child_process';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

class MCPTester {
  constructor() {
    this.serverProcess = null;
    this.testResults = [];
    this.requestId = 1;
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const prefix = {
      'info': '📋',
      'success': '✅',
      'error': '❌',
      'warning': '⚠️',
      'test': '🧪'
    }[type] || '📋';
    
    console.log(`${prefix} [${timestamp}] ${message}`);
  }

  async startServer() {
    this.log('启动MCP服务器...', 'info');
    
    return new Promise((resolve, reject) => {
      this.serverProcess = spawn('node', ['start.js'], {
        cwd: projectRoot,
        stdio: ['pipe', 'pipe', 'pipe']
      });

      let serverReady = false;
      
      const checkServerReady = (data) => {
        const output = data.toString();
        if (output.includes('Notice MCP Server 已启动')) {
          serverReady = true;
          this.log('MCP服务器启动成功', 'success');
          resolve();
        }
      };

      this.serverProcess.stdout.on('data', (data) => {
        const output = data.toString();
        console.log('服务器stdout:', output.trim());
        checkServerReady(data);
      });

      this.serverProcess.stderr.on('data', (data) => {
        const output = data.toString();
        console.log('服务器stderr:', output.trim());
        checkServerReady(data);
        
        // 只有真正的错误才记录为错误
        if (output.includes('Error') || output.includes('error') || output.includes('失败')) {
          this.log(`服务器错误: ${output}`, 'error');
        }
      });

      this.serverProcess.on('error', (error) => {
        this.log(`启动服务器失败: ${error.message}`, 'error');
        reject(error);
      });

      // 超时检查
      setTimeout(() => {
        if (!serverReady) {
          this.log('服务器启动超时', 'error');
          reject(new Error('Server startup timeout'));
        }
      }, 10000);
    });
  }

  async sendMCPRequest(method, params = {}) {
    return new Promise((resolve, reject) => {
      const request = {
        jsonrpc: '2.0',
        id: this.requestId++,
        method,
        params
      };

      const requestStr = JSON.stringify(request) + '\n';
      
      let responseData = '';
      
      const onData = (data) => {
        responseData += data.toString();
        
        // 尝试解析JSON响应
        try {
          const lines = responseData.split('\n').filter(line => line.trim());
          for (const line of lines) {
            const response = JSON.parse(line);
            if (response.id === request.id) {
              this.serverProcess.stdout.removeListener('data', onData);
              resolve(response);
              return;
            }
          }
        } catch (e) {
          // 继续等待更多数据
        }
      };

      this.serverProcess.stdout.on('data', onData);
      
      // 发送请求
      this.serverProcess.stdin.write(requestStr);
      
      // 超时处理
      setTimeout(() => {
        this.serverProcess.stdout.removeListener('data', onData);
        reject(new Error(`Request timeout for method: ${method}`));
      }, 5000);
    });
  }

  async testInitialize() {
    this.log('测试初始化...', 'test');
    
    try {
      const response = await this.sendMCPRequest('initialize', {
        protocolVersion: '2024-11-05',
        capabilities: {
          tools: {}
        },
        clientInfo: {
          name: 'test-client',
          version: '1.0.0'
        }
      });
      
      if (response.result && response.result.capabilities) {
        this.log('初始化成功', 'success');
        this.testResults.push({ test: 'initialize', status: 'pass' });
        return true;
      } else {
        this.log('初始化失败: 无效响应', 'error');
        this.testResults.push({ test: 'initialize', status: 'fail', error: 'Invalid response' });
        return false;
      }
    } catch (error) {
      this.log(`初始化失败: ${error.message}`, 'error');
      this.testResults.push({ test: 'initialize', status: 'fail', error: error.message });
      return false;
    }
  }

  async testListTools() {
    this.log('测试工具列表...', 'test');
    
    try {
      const response = await this.sendMCPRequest('tools/list');
      
      if (response.result && response.result.tools) {
        const tools = response.result.tools;
        const expectedTools = ['send_notification', 'get_backends'];
        
        const foundTools = tools.map(tool => tool.name);
        const missingTools = expectedTools.filter(tool => !foundTools.includes(tool));
        
        if (missingTools.length === 0) {
          this.log(`工具列表测试成功，找到 ${tools.length} 个工具: ${foundTools.join(', ')}`, 'success');
          this.testResults.push({ test: 'list_tools', status: 'pass', tools: foundTools });
          return true;
        } else {
          this.log(`工具列表测试失败，缺少工具: ${missingTools.join(', ')}`, 'error');
          this.testResults.push({ test: 'list_tools', status: 'fail', missing: missingTools });
          return false;
        }
      } else {
        this.log('工具列表测试失败: 无效响应', 'error');
        this.testResults.push({ test: 'list_tools', status: 'fail', error: 'Invalid response' });
        return false;
      }
    } catch (error) {
      this.log(`工具列表测试失败: ${error.message}`, 'error');
      this.testResults.push({ test: 'list_tools', status: 'fail', error: error.message });
      return false;
    }
  }

  async testGetBackends() {
    this.log('测试获取后端列表...', 'test');
    
    try {
      const response = await this.sendMCPRequest('tools/call', {
        name: 'get_backends',
        arguments: {}
      });
      
      if (response.result && response.result.content) {
        const content = response.result.content[0];
        if (content.type === 'text') {
          const data = JSON.parse(content.text);
          if (data.backends && Array.isArray(data.backends)) {
            this.log(`后端列表测试成功，找到 ${data.backends.length} 个后端: ${data.backends.join(', ')}`, 'success');
            this.testResults.push({ test: 'get_backends', status: 'pass', backends: data.backends });
            return true;
          }
        }
      }
      
      this.log('后端列表测试失败: 无效响应', 'error');
      this.testResults.push({ test: 'get_backends', status: 'fail', error: 'Invalid response' });
      return false;
    } catch (error) {
      this.log(`后端列表测试失败: ${error.message}`, 'error');
      this.testResults.push({ test: 'get_backends', status: 'fail', error: error.message });
      return false;
    }
  }

  async testSendNotificationWithBackend() {
    this.log('测试指定后端发送通知...', 'test');
    
    try {
      const response = await this.sendMCPRequest('tools/call', {
        name: 'send_notification',
        arguments: {
          title: '测试通知 - 指定后端',
          message: '这是一条测试消息，使用macOS后端发送',
          backend: 'macos'
        }
      });
      
      if (response.result && response.result.content) {
        const content = response.result.content[0];
        if (content.type === 'text') {
          const data = JSON.parse(content.text);
          if (data.success) {
            this.log('指定后端通知发送成功', 'success');
            this.testResults.push({ test: 'send_notification_with_backend', status: 'pass' });
            return true;
          } else {
            this.log(`指定后端通知发送失败: ${data.error}`, 'error');
            this.testResults.push({ test: 'send_notification_with_backend', status: 'fail', error: data.error });
            return false;
          }
        }
      }
      
      this.log('指定后端通知发送失败: 无效响应', 'error');
      this.testResults.push({ test: 'send_notification_with_backend', status: 'fail', error: 'Invalid response' });
      return false;
    } catch (error) {
      this.log(`指定后端通知发送失败: ${error.message}`, 'error');
      this.testResults.push({ test: 'send_notification_with_backend', status: 'fail', error: error.message });
      return false;
    }
  }

  async testSendNotificationToAllBackends() {
    this.log('测试发送通知到所有后端...', 'test');
    
    try {
      const response = await this.sendMCPRequest('tools/call', {
        name: 'send_notification',
        arguments: {
          title: '测试通知 - 所有后端',
          message: '这是一条测试消息，应该发送到所有启用的后端'
          // 注意：不指定backend参数
        }
      });
      
      if (response.result && response.result.content) {
        const content = response.result.content[0];
        if (content.type === 'text') {
          const data = JSON.parse(content.text);
          if (data.success) {
            this.log(`所有后端通知发送成功，发送到 ${data.backends ? data.backends.length : '未知'} 个后端`, 'success');
            this.testResults.push({ test: 'send_notification_all_backends', status: 'pass', backends: data.backends });
            return true;
          } else {
            this.log(`所有后端通知发送失败: ${data.error}`, 'error');
            this.testResults.push({ test: 'send_notification_all_backends', status: 'fail', error: data.error });
            return false;
          }
        }
      }
      
      this.log('所有后端通知发送失败: 无效响应', 'error');
      this.testResults.push({ test: 'send_notification_all_backends', status: 'fail', error: 'Invalid response' });
      return false;
    } catch (error) {
      this.log(`所有后端通知发送失败: ${error.message}`, 'error');
      this.testResults.push({ test: 'send_notification_all_backends', status: 'fail', error: error.message });
      return false;
    }
  }

  async testInvalidBackend() {
    this.log('测试无效后端处理...', 'test');
    
    try {
      const response = await this.sendMCPRequest('tools/call', {
        name: 'send_notification',
        arguments: {
          title: '测试通知 - 无效后端',
          message: '这是一条测试消息，使用无效后端',
          backend: 'invalid_backend'
        }
      });
      
      if (response.result && response.result.content) {
        const content = response.result.content[0];
        if (content.type === 'text') {
          const data = JSON.parse(content.text);
          if (!data.success && data.error) {
            this.log('无效后端处理测试成功（正确返回错误）', 'success');
            this.testResults.push({ test: 'invalid_backend', status: 'pass' });
            return true;
          } else {
            this.log('无效后端处理测试失败（应该返回错误）', 'error');
            this.testResults.push({ test: 'invalid_backend', status: 'fail', error: 'Should return error' });
            return false;
          }
        }
      }
      
      this.log('无效后端处理测试失败: 无效响应', 'error');
      this.testResults.push({ test: 'invalid_backend', status: 'fail', error: 'Invalid response' });
      return false;
    } catch (error) {
      this.log(`无效后端处理测试失败: ${error.message}`, 'error');
      this.testResults.push({ test: 'invalid_backend', status: 'fail', error: error.message });
      return false;
    }
  }

  async runAllTests() {
    this.log('开始运行所有MCP服务器测试...', 'info');
    
    try {
      // 启动服务器
      await this.startServer();
      
      // 等待服务器完全启动
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // 运行测试
      const tests = [
        () => this.testInitialize(),
        () => this.testListTools(),
        () => this.testGetBackends(),
        () => this.testSendNotificationWithBackend(),
        () => this.testSendNotificationToAllBackends(),
        () => this.testInvalidBackend()
      ];
      
      let passedTests = 0;
      let totalTests = tests.length;
      
      for (const test of tests) {
        const result = await test();
        if (result) passedTests++;
        
        // 测试之间的延迟
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
      // 输出测试结果
      this.log('', 'info');
      this.log('============================', 'info');
      this.log('测试结果汇总:', 'info');
      this.log('============================', 'info');
      
      this.testResults.forEach((result, index) => {
        const status = result.status === 'pass' ? '✅' : '❌';
        this.log(`${index + 1}. ${result.test}: ${status}`, 'info');
        if (result.error) {
          this.log(`   错误: ${result.error}`, 'error');
        }
      });
      
      this.log('', 'info');
      this.log(`总计: ${passedTests}/${totalTests} 测试通过`, passedTests === totalTests ? 'success' : 'warning');
      
      if (passedTests === totalTests) {
        this.log('🎉 所有测试通过！MCP服务器功能正常', 'success');
        return true;
      } else {
        this.log('⚠️ 部分测试失败，请检查上述错误信息', 'warning');
        return false;
      }
      
    } catch (error) {
      this.log(`测试运行失败: ${error.message}`, 'error');
      return false;
    } finally {
      // 清理
      if (this.serverProcess) {
        this.log('关闭MCP服务器...', 'info');
        this.serverProcess.kill();
      }
    }
  }
}

// 主函数
async function main() {
  console.log('🚀 Notice MCP Server 功能测试');
  console.log('============================');
  console.log('');
  
  const tester = new MCPTester();
  const success = await tester.runAllTests();
  
  process.exit(success ? 0 : 1);
}

// 运行测试
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error('❌ 测试运行出错:', error);
    process.exit(1);
  });
}

export { MCPTester };