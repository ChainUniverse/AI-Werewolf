import { NextApiRequest, NextApiResponse } from 'next';
import { getPlayerServer, setCurrentPlayerId } from '../../../lib/playerManager';
import type { StartGameParams } from '../../../types';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // 设置CORS头
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // 处理预检请求
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const params: StartGameParams = req.body;
    
    console.log('Start game request:', params);
    
    // 使用统一的PlayerManager获取PlayerServer
    const playerServer = getPlayerServer(params.playerId);
    console.log("start game:",playerServer);
    
    if (!playerServer) {
      return res.status(404).json({ error: `Player ${params.playerId} not found` });
    }
    
    // 设置当前玩家ID
    setCurrentPlayerId(params.playerId);
    console.log(`Set current player ID to: ${params.playerId}`);
    
    // 调用PlayerServer的startGame方法
    await playerServer.startGame(params);
    
    res.json({ 
      message: 'Game started successfully', 
      langfuseEnabled: true 
    });
  } catch (error) {
    console.error('Start game error:', error);
    res.status(500).json({ error: 'Failed to start game' });
  }
}