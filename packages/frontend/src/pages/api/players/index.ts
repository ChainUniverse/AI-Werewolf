import { NextApiRequest, NextApiResponse } from 'next';
import { getPlayerManager } from '../../../lib/playerManager';
import { PlayerConfig } from '../../../types';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const playerManager = getPlayerManager();
  
  switch (req.method) {
    case 'GET':
      // 获取所有玩家列表
      const players = playerManager.getAllPlayers();
      const playerList = players.map(player => ({
        id: player.id,
        name: player.config.name,
        personality: player.config.game.personality,
        strategy: player.config.game.strategy,
        isRunning: player.isRunning,
        port: player.port
      }));
      res.status(200).json(playerList);
      break;
      
    case 'POST':
      // 创建新玩家
      try {
        const config: PlayerConfig = req.body;
        const players = playerManager.getAllPlayers();
        const nextId = Math.max(...players.map(p => p.id), 0) + 1;
        
        const newPlayer = playerManager.addPlayer(nextId, config);
        res.status(201).json({
          id: newPlayer.id,
          name: newPlayer.config.name,
          personality: newPlayer.config.game.personality,
          strategy: newPlayer.config.game.strategy,
          isRunning: newPlayer.isRunning
        });
      } catch (error) {
        console.error('Error creating player:', error);
        res.status(500).json({ error: 'Failed to create player' });
      }
      break;
      
    default:
      res.status(405).json({ error: 'Method not allowed' });
  }
}