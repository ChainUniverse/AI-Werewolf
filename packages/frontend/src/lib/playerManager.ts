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

// 使用全局变量保持单例模式，避免每次请求重新初始化
const globalForPlayerManager = globalThis as unknown as {
  playerManager: PlayerManager | undefined;
  currentPlayerId: number | null;
};

// 确保PlayerManager只初始化一次
if (!globalForPlayerManager.playerManager) {
  globalForPlayerManager.playerManager = new PlayerManager();
  globalForPlayerManager.currentPlayerId = null;
  
  // 预设8个默认玩家 - 只在首次初始化时创建
  const baseConfig = {
    name: '智能分析师', // 从game.name移到根级别
    ai: {
      apiKey: process.env.OPENROUTER_API_KEY || '',
      model: 'deepseek/deepseek-r1-0528-qwen3-8b:free', // 真正匹配frontend的default.json
      maxTokens: 150,
      temperature: 0.8
    },
    game: {
      personality: 'cunning' as const, // PersonalityType枚举限制
      strategy: 'balanced' as const,
      speechStyle: 'casual' as const, // 从JSON中的speakingStyle映射
      aggressiveness: 5, // TypeScript类型需要的数字
      deceptionLevel: 3, // TypeScript类型需要的数字
      cooperationLevel: 7 // TypeScript类型需要的数字
    },
    logging: {
      enabled: true,
      level: 'info' as const
    }
  };

  const defaultConfigs: PlayerConfig[] = Array(8).fill(0).map((_, index) => ({
    ...baseConfig,
    name: `智能分析师${index + 1}`
  }));

  // 初始化默认玩家
  defaultConfigs.forEach((config, index) => {
    globalForPlayerManager.playerManager!.addPlayer(index + 1, config);
  });
  
  console.log('PlayerManager initialized once with 8 players');
}

const playerManager = globalForPlayerManager.playerManager;

// 设置当前玩家ID
export function setCurrentPlayerId(playerId: number): void {
  globalForPlayerManager.currentPlayerId = playerId;
}

// 获取当前玩家ID
export function getCurrentPlayerId(): number | null {
  return globalForPlayerManager.currentPlayerId;
}

// 获取当前玩家的PlayerServer
export function getCurrentPlayerServer(): PlayerServer | undefined {
  if (globalForPlayerManager.currentPlayerId === null) return undefined;
  return getPlayerServer(globalForPlayerManager.currentPlayerId);
}

export function getPlayerServer(id: number): PlayerServer | undefined {
  const player = playerManager.getPlayer(id);
  return player?.server;
}

export function getPlayerManager(): PlayerManager {
  return playerManager;
}

export { PlayerManager };
export type { ManagedPlayer };