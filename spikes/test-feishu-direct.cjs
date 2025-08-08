const https = require('https');

const webhookUrl = 'https://open.feishu.cn/open-apis/bot/v2/hook/fb198b0a-6794-48f5-a5d6-d1a746c8f0a4';

const message = {
  msg_type: 'text',
  content: {
    text: 'NoticeMCP - 直接测试飞书Webhook\n清理多实例后的直接测试'
  }
};

const postData = JSON.stringify(message);

const url = new URL(webhookUrl);
const options = {
  hostname: url.hostname,
  port: 443,
  path: url.pathname,
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData)
  }
};

console.log('发送飞书通知...');
console.log('URL:', webhookUrl);
console.log('消息:', message);

const req = https.request(options, (res) => {
  console.log('状态码:', res.statusCode);
  console.log('响应头:', res.headers);
  
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('响应内容:', data);
    try {
      const response = JSON.parse(data);
      console.log('解析后的响应:', response);
    } catch (e) {
      console.log('无法解析JSON响应');
    }
  });
});

req.on('error', (e) => {
  console.error('请求错误:', e);
});

req.write(postData);
req.end();