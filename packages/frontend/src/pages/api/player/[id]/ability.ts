import { NextApiRequest, NextApiResponse } from 'next';
import { getPlayerServer } from '../../../../lib/playerManager';
import { PlayerContext, WitchContext, SeerContext } from '../../../../types';

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

    const context: PlayerContext | WitchContext | SeerContext = req.body;
    const ability = await playerServer.useAbility(context);
    console.log("use ability:",ability);
    
    res.status(200).json(ability);
  } catch (error) {
    console.error('Error using ability for player:', error);
    res.status(500).json({ error: 'Failed to use ability' });
  }
}