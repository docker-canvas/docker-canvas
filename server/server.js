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

// 1. 노드 정보 가져오기 (/docker/nodes)
app.get('/docker/nodes', async (req, res) => {
  try {
    const nodes = await docker.listNodes();
    res.json(nodes);
  } catch (error) {
    console.error('Error fetching nodes:', error);
    res.status(500).json({ error: error.message });
  }
});

// 2. 네트워크 정보 가져오기 (/docker/networks)
app.get('/docker/networks', async (req, res) => {
  try {
    const networks = await docker.listNetworks();
    res.json(networks);
  } catch (error) {
    console.error('Error fetching networks:', error);
    res.status(500).json({ error: error.message });
  }
});

// 네트워크 생성 (/docker/networks/create)
app.post('/docker/networks/create', async (req, res) => {
  try {
    const networkConfig = req.body;
    const network = await docker.createNetwork(networkConfig);
    res.status(201).json(network);
  } catch (error) {
    console.error('Error creating network:', error);
    res.status(500).json({ error: error.message });
  }
});

// 3. 태스크(컨테이너) 정보 가져오기 (/docker/tasks)
app.get('/docker/tasks', async (req, res) => {
  try {
    const tasks = await docker.listTasks();
    res.json(tasks);
  } catch (error) {
    console.error('Error fetching tasks:', error);
    res.status(500).json({ error: error.message });
  }
});

// 4. 서비스 정보 가져오기 (/docker/services)
app.get('/docker/services', async (req, res) => {
  try {
    const services = await docker.listServices();
    res.json(services);
  } catch (error) {
    console.error('Error fetching services:', error);
    res.status(500).json({ error: error.message });
  }
});

// 5. 서비스 생성 (/docker/services/create)
app.post('/docker/services/create', async (req, res) => {
  try {
    const serviceConfig = req.body;
    const service = await docker.createService(serviceConfig);
    res.status(201).json(service);
  } catch (error) {
    console.error('Error creating service:', error);
    res.status(500).json({ error: error.message });
  }
});

// 6. 특정 서비스 정보 가져오기 (/docker/services/:id)
app.get('/docker/services/:id', async (req, res) => {
  try {
    const serviceId = req.params.id;
    const service = docker.getService(serviceId);
    const serviceInfo = await service.inspect();
    res.json(serviceInfo);
  } catch (error) {
    console.error(`Error fetching service ${req.params.id}:`, error);
    res.status(500).json({ error: error.message });
  }
});

// 7. 서비스 업데이트 (/docker/services/:id/update)
app.post('/docker/services/:id/update', async (req, res) => {
  try {
    const serviceId = req.params.id;
    const updateConfig = req.body;
    const service = docker.getService(serviceId);
    
    // 현재 서비스 스펙 가져오기
    const currentService = await service.inspect();
    const version = currentService.Version.Index;
    
    // 서비스 업데이트
    const result = await service.update({ ...updateConfig, version });
    res.json(result);
  } catch (error) {
    console.error(`Error updating service ${req.params.id}:`, error);
    res.status(500).json({ error: error.message });
  }
});

// 8. 서비스 삭제 (/docker/services/:id)
app.delete('/docker/services/:id', async (req, res) => {
  try {
    const serviceId = req.params.id;
    const service = docker.getService(serviceId);
    await service.remove();
    res.status(204).send();
  } catch (error) {
    console.error(`Error deleting service ${req.params.id}:`, error);
    res.status(500).json({ error: error.message });
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
