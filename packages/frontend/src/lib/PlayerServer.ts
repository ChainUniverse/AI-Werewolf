import { Role, GamePhase, type StartGameParams, type PlayerContext, type WitchContext, type SeerContext } from '../types';

export class PlayerServer {
  private gameId?: string;
  private playerId?: number;
  private role?: Role;
  private teammates?: number[];
  private config: any;

  constructor(config: any) {
    this.config = config;
  }

  async startGame(params: StartGameParams): Promise<void> {
    this.gameId = params.gameId;
    this.playerId = params.playerId;
    this.role = params.role as Role;
    this.teammates = params.teammates;
    
    console.log(`Player ${this.playerId} started game as ${this.role}`);
  }

  async speak(context: PlayerContext): Promise<string> {
    if (!this.role || !this.config.ai.apiKey) {
      return "我需要仔细思考一下当前的情况。";
    }

    const gameContext = this.buildGameContextPrompt(context);
    
    // 暂时返回默认发言，后续可实现AI生成
    return `我是玩家${this.playerId}，当前情况需要仔细分析。`;
  }

  async vote(context: PlayerContext): Promise<{ target: number; reason: string }> {
    if (!this.role || !this.config.ai.apiKey) {
      return { target: 1, reason: "默认投票给玩家1" };
    }

    const gameContext = this.buildGameContextPrompt(context);
    
    // 暂时返回默认投票，后续可实现AI生成
    return { target: 1, reason: "基于当前情况的分析投票" };
  }

  async useAbility(context: PlayerContext | WitchContext | SeerContext): Promise<any> {
    if (!this.role || !this.config.ai.apiKey) {
      throw new Error("我没有特殊能力可以使用。");
    }

    const gameContext = this.buildGameContextPrompt(context);
    
    // 根据角色返回不同的能力使用结果
    switch (this.role) {
      case Role.SEER:
        return { action: 'investigate', target: 1, reason: '查验玩家1' };
      case Role.WITCH:
        return { healTarget: 0, poisonTarget: 0, healReason: '不使用解药', poisonReason: '不使用毒药' };
      case Role.WEREWOLF:
        return { action: 'kill', target: 1, reason: '杀死玩家1' };
      default:
        throw new Error("村民没有夜间能力");
    }
  }

  async lastWords(): Promise<string> {
    // 暂时返回默认遗言，后续可实现AI生成
    return "很遗憾要离开游戏了，希望好人阵营能够获胜！";
  }

  getStatus() {
    return {
      gameId: this.gameId,
      playerId: this.playerId,
      role: this.role,
      teammates: this.teammates,
      isAlive: true,
      config: {
        personality: this.config.game.personality
      }
    };
  }

  getPlayerId(): number | undefined {
    return this.playerId;
  }

  private buildGameContextPrompt(context: PlayerContext): string {
    return `
## 游戏情况
- 游戏ID: ${context.gameId}
- 当前阶段: ${context.phase}
- 游戏天数: ${context.day}
- 存活玩家: ${context.alivePlayers.join(', ')}
- 死亡玩家: ${context.deadPlayers.join(', ')}
- 昨夜死亡: ${context.lastNightDeaths.join(', ') || '无'}

## 讨论历史
${context.discussionHistory.map(h => `玩家${h.playerId}: ${h.message}`).join('\n')}

## 你的信息
- 玩家ID: ${this.playerId}
- 角色: ${this.role}
${this.teammates && this.teammates.length > 0 ? `- 队友: ${this.teammates.join(', ')}` : ''}`;
  }
}