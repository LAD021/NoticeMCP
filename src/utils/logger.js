import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { existsSync, mkdirSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 确保日志目录存在
const logDir = join(__dirname, '../../logs');
if (!existsSync(logDir)) {
  mkdirSync(logDir, { recursive: true });
}

// 自定义日志格式
const logFormat = winston.format.combine(
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss.SSS'
  }),
  winston.format.errors({ stack: true }),
  winston.format.printf(({ timestamp, level, message, stack, ...meta }) => {
    const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
    const stackStr = stack ? `\n${stack}` : '';
    return `${timestamp} [${level.toUpperCase()}] ${message}${metaStr}${stackStr}`;
  })
);

// 创建日志传输器
const transports = [
  // 控制台输出（开发环境）
  new winston.transports.Console({
    level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
    format: winston.format.combine(
      winston.format.colorize(),
      logFormat
    )
  }),
  
  // 所有日志文件（按日期轮转）
  new DailyRotateFile({
    filename: join(logDir, 'notice-mcp-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    zippedArchive: true,
    maxSize: '20m',
    maxFiles: '14d',
    level: 'debug',
    format: logFormat
  }),
  
  // 错误日志文件
  new DailyRotateFile({
    filename: join(logDir, 'error-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    zippedArchive: true,
    maxSize: '20m',
    maxFiles: '30d',
    level: 'error',
    format: logFormat
  }),
  
  // MCP通信日志文件
  new DailyRotateFile({
    filename: join(logDir, 'mcp-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    zippedArchive: true,
    maxSize: '20m',
    maxFiles: '7d',
    level: 'debug',
    format: logFormat
  })
];

// 创建logger实例
const logger = winston.createLogger({
  level: 'debug',
  transports,
  exitOnError: false
});

// 创建专门的MCP logger
const mcpLogger = winston.createLogger({
  level: 'debug',
  transports: [
    new winston.transports.Console({
      level: 'debug',
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.printf(({ timestamp, level, message, ...meta }) => {
          const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
          return `[MCP] ${message}${metaStr}`;
        })
      )
    }),
    new winston.transports.File({
      filename: join(logDir, 'mcp-current.log'),
      level: 'debug',
      format: logFormat,
      maxsize: 10 * 1024 * 1024, // 10MB
      maxFiles: 3
    })
  ],
  exitOnError: false
});

// 导出便捷方法
export const log = {
  debug: (message, meta = {}) => logger.debug(message, meta),
  info: (message, meta = {}) => logger.info(message, meta),
  warn: (message, meta = {}) => logger.warn(message, meta),
  error: (message, meta = {}) => logger.error(message, meta),
  
  // MCP专用日志方法
  mcp: {
    debug: (message, meta = {}) => mcpLogger.debug(message, meta),
    info: (message, meta = {}) => mcpLogger.info(message, meta),
    warn: (message, meta = {}) => mcpLogger.warn(message, meta),
    error: (message, meta = {}) => mcpLogger.error(message, meta),
    
    // 特殊的MCP事件日志
    request: (method, params) => mcpLogger.info('MCP Request', { method, params }),
    response: (result) => mcpLogger.info('MCP Response', { result }),
    notification: (backend, status, details) => mcpLogger.info('Notification', { backend, status, details })
  }
};

// 处理未捕获的异常
logger.exceptions.handle(
  new winston.transports.File({ filename: join(logDir, 'exceptions.log') })
);

// 处理未处理的Promise拒绝
logger.rejections.handle(
  new winston.transports.File({ filename: join(logDir, 'rejections.log') })
);

export default logger;
export { logger, mcpLogger };