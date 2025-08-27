import { NextApiRequest, NextApiResponse } from 'next';
import { PlayerServer } from '../../../lib/PlayerServer';
import type { PlayerContext, WitchContext, SeerContext } from '../../../types';

// 创建全局PlayerServer实例
let playerServer: PlayerServer;

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
    // 初始化PlayerServer（如果还没有）
    if (!playerServer) {
      const config = {
        name: '智能分析师',
        ai: {
          apiKey: process.env.OPENROUTER_API_KEY || '',
          model: 'openai/gpt-4',
          maxTokens: 200,
          temperature: 0.8
        },
        game: {
          personality: 'cunning' as const,
          strategy: 'balanced' as const,
          speechStyle: 'casual' as const,
          aggressiveness: 5,
          deceptionLevel: 3,
          cooperationLevel: 7
        },
        logging: {
          enabled: true,
          level: 'info' as const
        }
      };
      playerServer = new PlayerServer(config);
    }

    const context: PlayerContext | WitchContext | SeerContext = req.body;
    
    console.log('Use ability request:', context);
    
    // 调用PlayerServer的useAbility方法
    const result = await playerServer.useAbility(context);
    
    res.json(result);
  } catch (error) {
    console.error('Use ability error:', error);
    res.status(500).json({ error: 'Failed to use ability' });
  }
}