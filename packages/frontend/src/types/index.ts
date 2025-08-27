import { z } from 'zod';

// Player roles
export enum Role {
  WEREWOLF = 'werewolf',
  VILLAGER = 'villager',
  SEER = 'seer',
  WITCH = 'witch',
}

// Game phases
export enum GamePhase {
  WAITING = 'waiting',
  DAY = 'day',
  NIGHT = 'night',
  ENDED = 'ended',
}

// Player ID type
export type PlayerId = number;

// Personality types
export type PersonalityType = 'aggressive' | 'conservative' | 'witty' | 'cunning';

// Player context for game state
export interface PlayerContext {
  round: number;
  currentPhase: GamePhase;
  alivePlayers: Array<{
    id: number;
    isAlive: boolean;
  }>;
  allSpeeches: Record<number, Array<{
    playerId: number;
    content: string;
    type?: 'player' | 'system';
  }>>;
  allVotes: Record<number, Array<{
    voterId: number;
    targetId: number;
  }>>;
}

// Witch specific context
export interface WitchContext extends PlayerContext {
  killedTonight?: number;
  potionUsed: { heal: boolean; poison: boolean };
}

// Seer specific context
export interface SeerContext extends PlayerContext {
  investigatedPlayers: Record<number, {
    target: number;
    isGood: boolean;
  }>;
}

// Game start parameters
export interface StartGameParams {
  gameId: string;
  playerId: number;
  role: string;
  teammates: number[];
}

// Speech Response Schema - 对应发言生成的返回格式
export const SpeechResponseSchema = z.object({
  speech: z.string().describe('生成的发言内容')
});

// Voting Response Schema - 对应投票决策的返回格式
export const VotingResponseSchema = z.object({
  target: z.number().describe('要投票的玩家ID'),
  reason: z.string().describe('投票的理由')
});

// 狼人夜间行动Schema - 匹配API的WerewolfAbilityResponse
export const WerewolfNightActionSchema = z.object({
  action: z.literal('kill').describe('行动类型，狼人固定为kill'),
  target: z.number().describe('要击杀的目标玩家ID'),
  reason: z.string().describe('选择该目标的详细理由，包括对其身份的推测'),
});

// 预言家夜间行动Schema - 匹配API的SeerAbilityResponse
export const SeerNightActionSchema = z.object({
  action: z.literal('investigate').describe('行动类型，预言家固定为investigate'),
  target: z.number().describe('要查验身份的目标玩家ID'),
  reason: z.string().describe('选择查验该玩家的理由，基于其发言和行为的分析'),
});

// 女巫夜间行动Schema - 匹配API的WitchAbilityResponse
export const WitchNightActionSchema = z.object({
  action: z.enum(['using', 'idle']).describe('行动类型：using表示使用药水，idle表示不使用'),
  healTarget: z.number().describe('救人的目标玩家ID，0表示不救人'),
  healReason: z.string().describe('救人或不救人的理由'),
  poisonTarget: z.number().describe('毒人的目标玩家ID，0表示不毒人'),
  poisonReason: z.string().describe('毒人或不毒人的理由'),
});


// 通用夜间行动Schema (向后兼容)
export const NightActionResponseSchema = z.union([
  WerewolfNightActionSchema,
  SeerNightActionSchema,
  WitchNightActionSchema
]);

export type SpeechResponseType = z.infer<typeof SpeechResponseSchema>;
export type VotingResponseType = z.infer<typeof VotingResponseSchema>;
export type NightActionResponseType = 
  | z.infer<typeof WerewolfNightActionSchema>
  | z.infer<typeof SeerNightActionSchema>
  | z.infer<typeof WitchNightActionSchema>;

// Player configuration types
export interface PlayerAIConfig {
  apiKey: string;
  model: string;
  maxTokens: number;
  temperature: number;
}

export interface PlayerGameConfig {
  personality: PersonalityType;
  strategy: 'aggressive' | 'conservative' | 'balanced';
  speechStyle: 'casual' | 'formal' | 'witty';
  aggressiveness: number;
  deceptionLevel: number;
  cooperationLevel: number;
}

export interface PlayerLoggingConfig {
  enabled: boolean;
  level: 'debug' | 'info' | 'warn' | 'error';
}

export interface PlayerConfig {
  name: string;
  ai: PlayerAIConfig;
  game: PlayerGameConfig;
  logging: PlayerLoggingConfig;
}