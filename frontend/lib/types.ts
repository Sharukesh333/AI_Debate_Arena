/**
 * Debate Application Types
 */

export interface Persona {
  id: string;
  name: string;
  tone: string;
  color: string;
  emoji: string;
  promptRules: string;
  typingPhrase: string;
  defaultStance?: 'for' | 'against' | 'neutral';
  // Rich Personality Engine Attributes
  shortDescription: string;
  communicationStyle: string;
  vocabularyLevel: string;
  humorLevel: string;
  confidenceLevel: string;
  emotionalStyle: string;
  debateStrategy: string;
  expertise: string[];
  weaknesses: string[];
  speakingSpeed: string;
  sentenceLength: string;
  commonHabits: string[];
  forbiddenRepetitions: string[];
  allowedSarcasmLevel: string;
  roastingStyle: string;
  conversationStyle: string;
  typicalReactions: string[];
  favouriteAnalogies: string[];
}

export interface DebateTopic {
  id: string;
  title: string;
  description: string;
}

export interface DebateMessage {
  id: string;
  personaId: string;
  personaName: string;
  stance: 'for' | 'against' | 'neutral';
  argument: string;
  time: number;
  refersToMessageId?: string;
  isRealtime?: boolean;
  subtopic?: string;
  style?: string;
}

export interface StanceConfig {
  title: string;
  description: string;
}

export interface DebateContext {
  topic: string;
  messages: DebateMessage[];
  currentSpeakerId: string;
  previousSpeakerId?: string;
  round: number;
}
