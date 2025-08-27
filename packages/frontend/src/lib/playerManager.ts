import { PlayerServer } from './PlayerServer';
import { PlayerConfig } from '../types';

interface ManagedPlayer {
  id: number;
  server: PlayerServer;
  config: PlayerConfig;
  isRunning: boolean;
  port?: number;
}

class PlayerManager {
  private players: Map<number, ManagedPlayer> = new Map();

  addPlayer(id: number, config: PlayerConfig): ManagedPlayer {
    const server = new PlayerServer(config);
    const player: ManagedPlayer = {
      id,
      server,
      config,
      isRunning: false
    };
    
    this.players.set(id, player);
    return player;
  }

  removePlayer(id: number): boolean {
    return this.players.delete(id);
  }

  getPlayer(id: number): ManagedPlayer | undefined {
    return this.players.get(id);
  }

  getAllPlayers(): ManagedPlayer[] {
    return Array.from(this.players.values());
  }

  updatePlayerConfig(id: number, config: PlayerConfig): boolean {
    const player = this.players.get(id);
    if (!player) return false;
    
    player.config = config;
    player.server = new PlayerServer(config);
    return true;
  }

  startPlayer(id: number): boolean {
    const player = this.players.get(id);
    if (!player) return false;
    
    player.isRunning = true;
    return true;
  }

  stopPlayer(id: number): boolean {
    const player = this.players.get(id);
    if (!player) return false;
    
    player.isRunning = false;
    return true;
  }
}

const playerManager = new PlayerManager();

// 预设一些默认玩家
const defaultConfigs: PlayerConfig[] = [
  {
    name: 'Aggressive Player',
    ai: {
      apiKey: process.env.OPENROUTER_API_KEY || '',
      model: 'openai/gpt-4o-mini',
      maxTokens: 1000,
      temperature: 0.8
    },
    game: {
      personality: 'aggressive',
      strategy: 'aggressive',
      speechStyle: 'casual',
      aggressiveness: 8,
      deceptionLevel: 6,
      cooperationLevel: 4
    },
    logging: {
      enabled: true,
      level: 'info'
    }
  },
  {
    name: 'Conservative Player',
    ai: {
      apiKey: process.env.OPENROUTER_API_KEY || '',
      model: 'openai/gpt-4o-mini',
      maxTokens: 1000,
      temperature: 0.5
    },
    game: {
      personality: 'conservative',
      strategy: 'conservative',
      speechStyle: 'formal',
      aggressiveness: 3,
      deceptionLevel: 4,
      cooperationLevel: 8
    },
    logging: {
      enabled: true,
      level: 'info'
    }
  },
  {
    name: 'Witty Player',
    ai: {
      apiKey: process.env.OPENROUTER_API_KEY || '',
      model: 'openai/gpt-4o-mini',
      maxTokens: 1000,
      temperature: 0.9
    },
    game: {
      personality: 'witty',
      strategy: 'balanced',
      speechStyle: 'witty',
      aggressiveness: 6,
      deceptionLevel: 7,
      cooperationLevel: 6
    },
    logging: {
      enabled: true,
      level: 'info'
    }
  }
];

// 初始化默认玩家
defaultConfigs.forEach((config, index) => {
  playerManager.addPlayer(index + 1, config);
});

export function getPlayerServer(id: number): PlayerServer | undefined {
  const player = playerManager.getPlayer(id);
  return player?.server;
}

export function getPlayerManager(): PlayerManager {
  return playerManager;
}

export { PlayerManager };
export type { ManagedPlayer };