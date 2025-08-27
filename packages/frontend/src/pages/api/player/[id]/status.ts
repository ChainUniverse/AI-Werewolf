import { NextApiRequest, NextApiResponse } from 'next';
import { getPlayerServer } from '../../../../lib/playerManager';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
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

    const status = playerServer.getStatus();
    res.status(200).json(status);
  } catch (error) {
    console.error('Error getting player status:', error);
    res.status(500).json({ error: 'Failed to get player status' });
  }
}