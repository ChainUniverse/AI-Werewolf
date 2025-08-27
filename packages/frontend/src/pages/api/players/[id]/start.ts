import { NextApiRequest, NextApiResponse } from 'next';
import { getPlayerManager } from '../../../../lib/playerManager';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  const playerManager = getPlayerManager();
  const playerId = parseInt(req.query.id as string);
  
  if (isNaN(playerId)) {
    return res.status(400).json({ error: 'Invalid player ID' });
  }
  
  try {
    const success = playerManager.startPlayer(playerId);
    if (!success) {
      return res.status(404).json({ error: 'Player not found' });
    }
    
    res.status(200).json({ success: true, message: `Player ${playerId} started` });
  } catch (error) {
    console.error('Error starting player:', error);
    res.status(500).json({ error: 'Failed to start player' });
  }
}