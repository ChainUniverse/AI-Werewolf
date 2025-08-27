import { NextApiRequest, NextApiResponse } from 'next';
import { getPlayerServer } from '../../../../lib/playerManager';
import { StartGameParams } from '../../../../types';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const playerId = parseInt(req.query.id as string);
  if (isNaN(playerId)) {
    return res.status(400).json({ error: 'Invalid player ID' });
  }

  try {
    const playerServer = getPlayerServer(playerId);
    if (!playerServer) {
      return res.status(404).json({ error: 'Player not found' });
    }

    const params: StartGameParams = req.body;
    await playerServer.startGame(params);
    
    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error starting game for player:', error);
    res.status(500).json({ error: 'Failed to start game' });
  }
}