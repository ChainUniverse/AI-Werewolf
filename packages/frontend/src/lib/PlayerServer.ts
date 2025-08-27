import { 
  Role, 
  GamePhase, 
  type StartGameParams, 
  type PlayerContext, 
  type WitchContext, 
  type SeerContext,
  type PlayerId,
  PersonalityType,
  VotingResponseType,
  SpeechResponseType,
  VotingResponseSchema,
  NightActionResponseType,
  WerewolfNightActionSchema,
  SeerNightActionSchema,
  WitchNightActionSchema,
  SpeechResponseSchema
} from '../types';
import { generateObject } from 'ai';
import { createOpenAICompatible } from '@ai-sdk/openai-compatible';

// 角色到夜间行动 Schema 的映射
const ROLE_SCHEMA_MAP = {
  [Role.WEREWOLF]: WerewolfNightActionSchema,
  [Role.SEER]: SeerNightActionSchema,
  [Role.WITCH]: WitchNightActionSchema,
} as const;

export class PlayerServer {
  private gameId?: string;
  private playerId?: number;
  private role?: Role;
  private teammates?: PlayerId[];
  private config: any;

  constructor(config: any) {
    this.config = config;
  }

  async startGame(params: StartGameParams): Promise<void> {
    this.gameId = params.gameId;
    this.role = params.role as Role;
    this.teammates = params.teammates;
    this.playerId = params.playerId;
    
    console.log(`🎮 Player started game ${this.gameId} as ${this.role}`);
    console.log(`👤 Player ID: ${this.playerId}`);
    if (this.teammates && this.teammates.length > 0) {
      console.log(`🤝 Teammates: ${this.teammates.join(', ')}`);
    }
    console.log(`📊 Game ID (session): ${this.gameId}`);
  }

  async speak(context: PlayerContext): Promise<string> {
    if (!this.role || !this.config.ai.apiKey) {
      return "我需要仔细思考一下当前的情况。";
    }

    const speechResponse = await this.generateSpeech(context);
    return speechResponse.speech;
  }

  async vote(context: PlayerContext): Promise<VotingResponseType> {
    if (!this.role || !this.config.ai.apiKey) {
      return { target: 1, reason: "默认投票给玩家1" };
    }

    return await this.generateVote(context);
  }

  async useAbility(context: PlayerContext | WitchContext | SeerContext): Promise<any> {
    if (!this.role || !this.config.ai.apiKey) {
      throw new Error("我没有特殊能力可以使用。");
    }

    return await this.generateAbilityUse(context);
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

  // Getter methods for prompt factories
  getRole(): Role | undefined {
    return this.role;
  }

  getPlayerId(): number | undefined {
    return this.playerId;
  }

  getTeammates(): PlayerId[] | undefined {
    return this.teammates;
  }

  getPersonalityPrompt(): string {
    return this.buildPersonalityPrompt();
  }

  getGameId(): string | undefined {
    return this.gameId;
  }

  // 通用AI生成方法
  private async generateWithAI<T>(
    params: {
      functionId: string;
      schema: any;
      prompt: string;
      maxOutputTokens?: number;
      temperature?: number;
      context?: PlayerContext;
    }
  ): Promise<T> {
    const { functionId, context, schema, prompt, maxOutputTokens, temperature } = params;
    
    console.log(`📝 ${functionId} prompt:`, prompt);
    console.log(`📋 ${functionId} schema:`, JSON.stringify(schema.shape, null, 2));
    
    try {
      const result = await generateObject({
        model: this.getModel(),
        schema: schema,
        prompt: prompt,
        maxOutputTokens: maxOutputTokens || this.config.ai.maxTokens,
        temperature: temperature ?? this.config.ai.temperature,
      });

      console.log(`🎯 ${functionId} result:`, JSON.stringify(result.object, null, 2));
      
      return result.object as T;
    } catch (error) {
      console.error(`AI ${functionId} failed:`, error);
      throw new Error(`Failed to generate ${functionId}: ${error}`);
    }
  }

  // AI生成方法
  private async generateSpeech(context: PlayerContext): Promise<SpeechResponseType> {
    const prompt = this.buildSpeechPrompt(context);
    
    return this.generateWithAI<SpeechResponseType>({
      functionId: 'speech-generation',
      schema: SpeechResponseSchema,
      prompt: prompt,
      context: context,
    });
  }

  private async generateVote(context: PlayerContext): Promise<VotingResponseType> {
    const prompt = this.buildVotePrompt(context);
    
    return this.generateWithAI<VotingResponseType>({
      functionId: 'vote-generation',
      schema: VotingResponseSchema,
      prompt: prompt,
      context: context,
    });
  }

  private async generateAbilityUse(context: PlayerContext | WitchContext | SeerContext): Promise<NightActionResponseType> {
    if (this.role === Role.VILLAGER) {
      throw new Error('Village has no night action, should be skipped');
    }
    
    const schema = ROLE_SCHEMA_MAP[this.role!];
    if (!schema) {
      throw new Error(`Unknown role: ${this.role}`);
    }

    const prompt = this.buildAbilityPrompt(context);
    
    return this.generateWithAI<NightActionResponseType>({
      functionId: 'ability-generation',
      schema: schema,
      prompt: prompt,
      context: context,
    });
  }

  // Prompt构建方法
  private buildSpeechPrompt(context: PlayerContext): string {
    const gameContext = this.buildGameContextPrompt(context);
    const personalityPrompt = this.buildPersonalityPrompt();
    
    return personalityPrompt + gameContext + '\n\n注意：发言内容控制在30-80字，语言自然，像真人玩家。\n\n请分析当前情况并给出你的发言：';
  }

  private buildVotePrompt(context: PlayerContext): string {
    const gameContext = this.buildGameContextPrompt(context);
    const personalityPrompt = this.buildPersonalityPrompt();
    
    let additionalInfo = '';
    
    // 为预言家添加查验结果
    if (this.role === Role.SEER && 'investigatedPlayers' in context) {
      const seerContext = context as SeerContext;
      const checkResults: {[key: string]: 'good' | 'werewolf'} = {};
      
      for (const [round, investigation] of Object.entries(seerContext.investigatedPlayers)) {
        checkResults[investigation.target.toString()] = investigation.isGood ? 'good' : 'werewolf';
      }
      
      if (Object.keys(checkResults).length > 0) {
        additionalInfo += '\n\n## 你的查验结果\n';
        for (const [playerId, result] of Object.entries(checkResults)) {
          additionalInfo += `- 玩家${playerId}: ${result === 'good' ? '好人' : '狼人'}\n`;
        }
      }
    }

    return personalityPrompt + gameContext + additionalInfo + '\n\n请分析当前情况，决定你的投票目标和理由：';
  }

  private buildAbilityPrompt(context: PlayerContext | WitchContext | SeerContext): string {
    const gameContext = this.buildGameContextPrompt(context);
    const personalityPrompt = this.buildPersonalityPrompt();
    
    let roleSpecificInfo = '';
    
    switch (this.role) {
      case Role.WITCH:
        const witchContext = context as WitchContext;
        roleSpecificInfo = `\n\n## 女巫能力状态\n- 解药已使用: ${witchContext.potionUsed.heal}\n- 毒药已使用: ${witchContext.potionUsed.poison}`;
        if (witchContext.killedTonight) {
          roleSpecificInfo += `\n- 今晚被杀玩家: ${witchContext.killedTonight}`;
        }
        break;
      case Role.SEER:
        const seerContext = context as SeerContext;
        if (Object.keys(seerContext.investigatedPlayers).length > 0) {
          roleSpecificInfo = '\n\n## 已查验玩家\n';
          for (const [round, investigation] of Object.entries(seerContext.investigatedPlayers)) {
            roleSpecificInfo += `- 第${round}轮查验玩家${investigation.target}: ${investigation.isGood ? '好人' : '狼人'}\n`;
          }
        }
        break;
      case Role.WEREWOLF:
        if (this.teammates && this.teammates.length > 0) {
          roleSpecificInfo = `\n\n## 狼人队友\n- 队友: ${this.teammates.join(', ')}`;
        }
        break;
    }
    
    return personalityPrompt + gameContext + roleSpecificInfo + `\n\n请根据当前情况决定你的${this.role}能力使用：`;
  }

  // 辅助方法
  private getModel() {
    const openrouter = createOpenAICompatible({
      name: 'openrouter',
      baseURL: 'https://openrouter.ai/api/v1',
      apiKey: this.config.ai.apiKey || process.env.OPENROUTER_API_KEY,
      headers: {
        'HTTP-Referer': 'https://mojo.monad.xyz',
        'X-Title': 'AI Werewolf Game',
      },
    });
    
    return openrouter.chatModel(this.config.ai.model);
  }

  private buildPersonalityPrompt(): string {
    if (!this.config.game.strategy) {
      return '';
    }

    const personalityType = this.config.game.strategy === 'balanced' ? 'cunning' : this.config.game.strategy as PersonalityType;
    
    // 简化的性格提示，如果需要可以从WerewolfPrompts导入
    const personalityPrompts = {
      aggressive: '你是一个激进的玩家，善于主导讨论和推进投票。',
      conservative: '你是一个保守谨慎的玩家，更倾向于观察和分析。',
      cunning: '你是一个狡猾机智的玩家，善于隐藏真实意图。',
      witty: '你是一个机智幽默的玩家，善于用巧妙的方式表达观点。'
    };
    
    return `## 你的性格特征\n${personalityPrompts[personalityType] || personalityPrompts.cunning}\n\n`;
  }

  private buildGameContextPrompt(context: PlayerContext): string {
    const alivePlayers = context.alivePlayers.filter(p => p.isAlive).map(p => p.id);
    const deadPlayers = context.alivePlayers.filter(p => !p.isAlive).map(p => p.id);
    
    // 获取最新轮次的发言
    const latestRoundSpeeches = context.allSpeeches[context.round] || [];
    
    return `
## 游戏情况
- 当前轮次: ${context.round}
- 当前阶段: ${context.currentPhase}
- 存活玩家: ${alivePlayers?alivePlayers.join(', '):"无"}
- 死亡玩家: ${deadPlayers?deadPlayers.join(', '):"无"}

## 本轮讨论历史
${latestRoundSpeeches.map(s => `玩家${s.playerId}: ${s.content}`).join('\n')}

## 你的信息
- 玩家ID: ${this.playerId}
- 角色: ${this.role}
${this.teammates && this.teammates.length > 0 ? `- 队友: ${this.teammates.join(', ')}` : ''}`;
  }
}