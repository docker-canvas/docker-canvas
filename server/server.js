const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const cors = require('cors');
const path = require('path');
const Docker = require('dockerode');
const app = express();

// Docker 클라이언트: unix socket 사용
const docker = new Docker({ socketPath: '/var/run/docker.sock'});

// CORS 설정
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));

app.use(express.json());

// Docker API 직접 호출
app.get('/docker/tasks', async (req, res) => {
  try {
    const tasks = await docker.listTasks();
    res.json(tasks);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch tasks from Docker API' });
  }
});

// ✅ React 정적 파일 서빙
app.use(express.static(path.join(__dirname, '../docker-canvas-front/build')));

// ✅ SPA를 위한 fallback (React Router용)
app.get('/{*any}', (req, res) => {
  res.sendFile(path.join(__dirname, '../docker-canvas-front/build/index.html'));
});

app.listen(3000, '0.0.0.0', () => {
  console.log('Proxy & frontend server running on port 3000');
});
