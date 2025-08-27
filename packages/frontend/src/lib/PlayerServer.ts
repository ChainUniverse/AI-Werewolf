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
  SpeechResponseSchema,
  PlayerConfig
} from '../types';
import { generateObject } from 'ai';
import { createOpenAICompatible } from '@ai-sdk/openai-compatible';
import { getPersonalityPrompt } from './prompts';

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
  private config: PlayerConfig;

  constructor(config: PlayerConfig) {
    this.config = config;
  }

  async startGame(params: StartGameParams): Promise<void> {
    this.gameId = params.gameId;
    this.role = params.role as Role;
    this.teammates = params.teammates;
    this.playerId = params.playerId;
    
    if (this.config.logging.enabled) {
      console.log(`🎮 Player started game ${this.gameId} as ${this.role}`);
      console.log(`👤 Player ID: ${this.playerId}`);
      if (this.teammates && this.teammates.length > 0) {
        console.log(`🤝 Teammates: ${this.teammates.join(', ')}`);
      }
      console.log(`📊 Game ID (session): ${this.gameId}`);
    }
  }

  async speak(context: PlayerContext): Promise<string> {
    if (!this.role) {
      return "我还没有确定自己的角色。";
    }

    const apiKey = this.config.ai.apiKey || process.env.OPENROUTER_API_KEY;
    if (!apiKey || apiKey.trim() === '') {
      return "我需要仔细思考一下当前的情况。";
    }

    const speechResponse = await this.generateSpeech(context);
    return speechResponse.speech;
  }

  async vote(context: PlayerContext): Promise<VotingResponseType> {
    if (!this.role) {
      return { target: 1, reason: "角色未设置，默认投票" };
    }

    const apiKey = this.config.ai.apiKey || process.env.OPENROUTER_API_KEY;
    if (!apiKey || apiKey.trim() === '') {
      return { target: 1, reason: "API密钥未配置，默认投票" };
    }

    return await this.generateVote(context);
  }

  async useAbility(context: PlayerContext | WitchContext | SeerContext): Promise<any> {
    if (!this.role) {
      throw new Error("角色未设置，无法使用能力。");
    }

    const apiKey = this.config.ai.apiKey || process.env.OPENROUTER_API_KEY;
    if (!apiKey || apiKey.trim() === '') {
      throw new Error("API密钥未配置，无法使用AI能力。");
    }

    return await this.generateAbilityUse(context);
  }

  async lastWords(): Promise<string> {
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

  private async generateWithAI<T>(
    params: {
      schema: any;
      prompt: string;
      maxOutputTokens?: number;
      temperature?: number;
    }
  ): Promise<T> {
    const { schema, prompt, maxOutputTokens, temperature } = params;
    
    console.log(`📝 AI prompt:`, prompt);
    console.log(`📋 AI schema:`, JSON.stringify(schema.shape, null, 2));
    
    try {
      const result = await generateObject({
        model: this.getModel(),
        schema: schema,
        prompt: prompt,
        maxOutputTokens: maxOutputTokens || this.config.ai.maxTokens,
        temperature: temperature ?? this.config.ai.temperature,
      });

      console.log(`🎯 AI result:`, JSON.stringify(result.object, null, 2));
      
      return result.object as T;
    } catch (error) {
      console.error(`AI generation failed:`, error);
      throw new Error(`Failed to generate AI response: ${error}`);
    }
  }

  private async generateSpeech(context: PlayerContext): Promise<SpeechResponseType> {
    const prompt = this.buildSpeechPrompt(context);
    
    return this.generateWithAI<SpeechResponseType>({
      schema: SpeechResponseSchema,
      prompt: prompt,
    });
  }

  private async generateVote(context: PlayerContext): Promise<VotingResponseType> {
    const prompt = this.buildVotePrompt(context);
    
    return this.generateWithAI<VotingResponseType>({
      schema: VotingResponseSchema,
      prompt: prompt,
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
      schema: schema,
      prompt: prompt,
    });
  }

  private buildSpeechPrompt(context: PlayerContext): string {
    const personalityPrompt = this.buildPersonalityPrompt();
    const gameContext = this.buildGameContextPrompt(context);
    
    return `${personalityPrompt}

${gameContext}

## 发言要求
作为${this.role}，你需要在白天讨论阶段发言。请根据你的角色和性格特点，结合当前游戏情况，给出合适的发言。

注意：发言内容控制在30-80字，语言自然，像真人玩家。`;
  }

  private buildVotePrompt(context: PlayerContext): string {
    const personalityPrompt = this.buildPersonalityPrompt();
    const gameContext = this.buildGameContextPrompt(context);

    return `${personalityPrompt}

${gameContext}

## 投票要求
作为${this.role}，你需要选择一个玩家投票淘汰。请根据你的角色目标和当前游戏情况，选择最合适的投票目标并说明理由。

可投票的玩家：${context.alivePlayers.filter(id => id !== this.playerId).join(', ')}`;
  }

  private buildAbilityPrompt(context: PlayerContext | WitchContext | SeerContext): string {
    const personalityPrompt = this.buildPersonalityPrompt();
    const gameContext = this.buildGameContextPrompt(context);
    
    let roleSpecificPrompt = '';
    
    if (this.role === Role.WEREWOLF) {
      roleSpecificPrompt = `
## 夜间行动 - 狼人击杀
作为狼人，你需要选择一个目标击杀。请选择对狼人阵营威胁最大的玩家。
可击杀的玩家：${context.alivePlayers.filter(id => id !== this.playerId && !this.teammates?.includes(id)).join(', ')}`;
    } else if (this.role === Role.SEER) {
      roleSpecificPrompt = `
## 夜间行动 - 预言家查验
作为预言家，你需要选择一个玩家查验身份。请选择最可疑或最需要确认身份的玩家。
可查验的玩家：${context.alivePlayers.filter(id => id !== this.playerId).join(', ')}`;
    } else if (this.role === Role.WITCH) {
      const witchContext = context as WitchContext;
      roleSpecificPrompt = `
## 夜间行动 - 女巫使用药剂
作为女巫，你有解药和毒药各一瓶。
- 解药已使用：${witchContext.hasUsedAntidote ? '是' : '否'}
- 毒药已使用：${witchContext.hasUsedPoison ? '是' : '否'}
- 昨夜死亡玩家：${witchContext.lastNightKill || '无'}

你可以选择：
1. 使用解药救人（如果还有解药且有人被杀）
2. 使用毒药杀人（如果还有毒药）
3. 什么都不做

可作用的玩家：${context.alivePlayers.join(', ')}`;
    }

    return `${personalityPrompt}

${gameContext}

${roleSpecificPrompt}

## 响应格式
请以JSON格式返回你的决策。`;
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
    if (!this.config.game.personality) {
      return '';
    }

    const personalityType = this.config.game.strategy === 'balanced' ? 'cunning' : this.config.game.strategy as PersonalityType;
    
    return getPersonalityPrompt(personalityType) + '\n\n';
  }
}