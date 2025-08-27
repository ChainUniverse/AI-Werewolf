import { NextApiRequest, NextApiResponse } from 'next';
import { getPlayerManager } from '../../../lib/playerManager';
import { PlayerConfig } from '../../../types';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const playerManager = getPlayerManager();
  const playerId = parseInt(req.query.id as string);
  
  if (isNaN(playerId)) {
    return res.status(400).json({ error: 'Invalid player ID' });
  }
  
  switch (req.method) {
    case 'GET':
      // 获取玩家详情
      const player = playerManager.getPlayer(playerId);
      if (!player) {
        return res.status(404).json({ error: 'Player not found' });
      }
      res.status(200).json({
        id: player.id,
        name: player.config.name,
        config: player.config,
        isRunning: player.isRunning,
        port: player.port
      });
      break;
      
    case 'PUT':
      // 更新玩家配置
      try {
        const config: PlayerConfig = req.body;
        const success = playerManager.updatePlayerConfig(playerId, config);
        if (!success) {
          return res.status(404).json({ error: 'Player not found' });
        }
        res.status(200).json({ success: true });
      } catch (error) {
        console.error('Error updating player:', error);
        res.status(500).json({ error: 'Failed to update player' });
      }
      break;
      
    case 'DELETE':
      // 删除玩家
      const success = playerManager.removePlayer(playerId);
      if (!success) {
        return res.status(404).json({ error: 'Player not found' });
      }
      res.status(200).json({ success: true });
      break;
      
    default:
      res.status(405).json({ error: 'Method not allowed' });
  }
}