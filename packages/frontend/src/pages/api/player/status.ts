import { NextApiRequest, NextApiResponse } from 'next';
import { getCurrentPlayerServer } from '../../../lib/playerManager';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // 设置CORS头
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // 处理预检请求
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method !== 'POST' && req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // 获取当前玩家的PlayerServer
    const playerServer = getCurrentPlayerServer();
    
    if (!playerServer) {
      return res.status(404).json({ error: 'Current player not found' });
    }
    
    // 调用PlayerServer的getStatus方法
    const status = playerServer.getStatus();
    
    res.json(status);
  } catch (error) {
    console.error('Status error:', error);
    res.status(500).json({ error: 'Failed to get status' });
  }
}