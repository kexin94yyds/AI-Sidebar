#!/usr/bin/env node
/**
 * 简单的本地同步服务器
 * 接收浏览器扩展的数据并写入 sync/*.json 文件
 * 
 * 使用方法:
 * 1. 运行: node sync-server.js
 * 2. 服务器会在 http://localhost:3456 监听
 * 3. 扩展会自动将数据发送到此服务器
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3456;
const SYNC_DIR = path.join(__dirname, 'sync');

// 确保 sync 目录存在
if (!fs.existsSync(SYNC_DIR)) {
  fs.mkdirSync(SYNC_DIR, { recursive: true });
}

const server = http.createServer((req, res) => {
  // 设置 CORS 头，允许扩展访问
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // 处理 OPTIONS 预检请求
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  // GET /ping - 健康检查
  if (req.method === 'GET' && req.url === '/ping') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', message: 'Sync server is running' }));
    return;
  }

  // POST /sync/history - 同步历史记录
  if (req.method === 'POST' && req.url === '/sync/history') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const data = JSON.parse(body);
        const filePath = path.join(SYNC_DIR, 'history.json');
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
        console.log(`✅ History 已更新: ${data.length} 条记录`);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, count: data.length }));
      } catch (error) {
        console.error('❌ History 同步失败:', error);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: error.message }));
      }
    });
    return;
  }

  // POST /sync/favorites - 同步收藏
  if (req.method === 'POST' && req.url === '/sync/favorites') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const data = JSON.parse(body);
        const filePath = path.join(SYNC_DIR, 'favorites.json');
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
        console.log(`⭐ Favorites 已更新: ${data.length} 条记录`);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, count: data.length }));
      } catch (error) {
        console.error('❌ Favorites 同步失败:', error);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: error.message }));
      }
    });
    return;
  }

  // 404 - 未找到
  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Not found' }));
});

server.listen(PORT, 'localhost', () => {
  console.log(`🚀 同步服务器已启动: http://localhost:${PORT}`);
  console.log(`📁 同步目录: ${SYNC_DIR}`);
  console.log(`\n可用端点:`);
  console.log(`  - GET  /ping            - 健康检查`);
  console.log(`  - POST /sync/history    - 同步历史记录`);
  console.log(`  - POST /sync/favorites  - 同步收藏`);
  console.log(`\n按 Ctrl+C 停止服务器\n`);
});

// 优雅退出
process.on('SIGINT', () => {
  console.log('\n👋 正在关闭同步服务器...');
  server.close(() => {
    console.log('✅ 服务器已关闭');
    process.exit(0);
  });
});

