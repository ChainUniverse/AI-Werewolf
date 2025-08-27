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
  gameId: string;
  playerId: number;
  phase: GamePhase;
  day: number;
  alivePlayers: number[];
  deadPlayers: number[];
  lastNightDeaths: number[];
  discussionHistory: Array<{
    playerId: number;
    message: string;
  }>;
  votes?: { [key: number]: number };
}

// Witch specific context
export interface WitchContext extends PlayerContext {
  hasUsedPoison: boolean;
  hasUsedAntidote: boolean;
  lastNightKill?: number;
}

// Seer specific context
export interface SeerContext extends PlayerContext {
  investigatedPlayers: { [key: number]: { target: number; isGood: boolean } };
}

// Game start parameters
export interface StartGameParams {
  gameId: string;
  playerId: number;
  role: string;
  teammates?: number[];
}

// Response schemas
export const SpeechResponseSchema = z.object({
  speech: z.string()
});

export const VotingResponseSchema = z.object({
  target: z.number(),
  reason: z.string()
});

export const WerewolfNightActionSchema = z.object({
  action: z.literal('kill'),
  target: z.number(),
  reason: z.string()
});

export const SeerNightActionSchema = z.object({
  action: z.literal('investigate'),
  target: z.number(),
  reason: z.string()
});

export const WitchNightActionSchema = z.object({
  action: z.union([
    z.literal('use_antidote'),
    z.literal('use_poison'),
    z.literal('skip')
  ]),
  target: z.number().optional(),
  reason: z.string()
});

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