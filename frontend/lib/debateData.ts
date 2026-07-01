import {
  DebateContext,
  DebateMessage,
  generateTopicFocusedResponse,
  personalityTraits,
  PersonalityTraits
} from './debateContext';

export type DebateTopic = {
  id: string;
  title: string;
  description: string;
};

export const defaultTopics: DebateTopic[] = [
  {
    id: 'ai-ethics',
    title: 'AI Ethics in Society',
    description: 'Should artificial intelligence be regulated more strictly than other technologies?'
  },
  {
    id: 'remote-work',
    title: 'Remote Work vs Office Work',
    description: 'Is remote work better for productivity and work-life balance than traditional office work?'
  },
  {
    id: 'education-ai',
    title: 'AI in Education',
    description: 'Can AI-powered learning platforms replace traditional classroom teaching?'
  }
];

export type Persona = {
  id: string;
  name: string;
  tone: string;
  color?: string;
};

export const personas: Persona[] = [
  { id: 'victor_analyst', name: 'Victor the Analyst', tone: 'Detailed Analyzer', color: '#FF6B6B' },
  { id: 'sarah_critic', name: 'Sarah the Critic', tone: 'Sharp Critic', color: '#F59E0B' },
  { id: 'clark_commander', name: 'Clark the Commander', tone: 'Bold Battler', color: '#10B981' },
  { id: 'jack_humorist', name: 'Jack the Humorist', tone: 'Comedy Commenter', color: '#60A5FA' },
  { id: 'winston_wit', name: 'Winston the Wit', tone: 'Witty Warrior', color: '#A78BFA' },
  { id: 'isabella_inquirer', name: 'Isabella the Inquirer', tone: 'Curious Questioner', color: '#F472B6' },
  { id: 'sophia_sage', name: 'Sophia the Sage', tone: 'Wise Elder', color: '#F97316' },
  { id: 'sam_realist', name: 'Sam the Realist', tone: 'Street Smart', color: '#34D399' },
  { id: 'oliver_orator', name: 'Oliver the Orator', tone: 'Passionate Orator', color: '#60A5FA' },
  { id: 'daniel_diplomat', name: 'Daniel the Diplomat', tone: 'Respectful Reasoner', color: '#FBBF24' }
];

/**
 * Generate a topic-focused argument for a debate
 * Ensures the AI stays on topic and responds coherently
 */
export function generateArgument(
  topic: DebateTopic,
  persona: Persona,
  debateContext?: DebateContext,
  assignedStance?: 'for' | 'against' | 'neutral'
): string {
  // Get personality traits
  const traits = personalityTraits[persona.id];
  if (!traits) {
    return `Interested in "${topic.title}" - need more context to respond!`;
  }

  // Build debate context if not provided
  const context: DebateContext = debateContext || {
    topic: topic.title,
    messages: [],
    currentSpeakerId: persona.id,
    round: 1
  };

  // Generate topic-focused response
  const { argument } = generateTopicFocusedResponse(
    topic.title,
    context,
    traits,
    assignedStance
  );

  return argument;
}

/**
 * Create a debate message with structured response
 */
export function createDebateMessage(
  personaId: string,
  topic: DebateTopic,
  debateMessages: Array<{ id: string; personaId: string; argument: string; stance: 'for' | 'against' | 'neutral' }>,
  personaName: string,
  assignedStance?: 'for' | 'against' | 'neutral'
): DebateMessage {
  const persona = personas.find(p => p.id === personaId);
  const traits = personalityTraits[personaId];

  if (!persona || !traits) {
    throw new Error(`Persona ${personaId} not found`);
  }

  // Build context with recent messages
  const context: DebateContext = {
    topic: topic.title,
    messages: debateMessages.map((msg, idx) => ({
      id: msg.id,
      personaId: msg.personaId,
      personaName: personas.find(p => p.id === msg.personaId)?.name || msg.personaId,
      stance: msg.stance,
      argument: msg.argument,
      refersToMessageId: idx > 0 ? debateMessages[idx - 1].id : undefined,
      timestamp: Date.now() - (debateMessages.length - idx) * 5000 // Simulate timing
    })),
    currentSpeakerId: personaId,
    previousSpeakerId: debateMessages.length > 0 ? debateMessages[0].personaId : undefined,
    round: Math.floor(debateMessages.length / (personas.length || 1)) + 1
  };

  // Generate the response
  const { argument, stance } = generateTopicFocusedResponse(
    topic.title,
    context,
    traits,
    assignedStance
  );

  return {
    id: `${personaId}-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    personaId,
    personaName: persona.name,
    stance,
    argument,
    refersToMessageId: debateMessages.length > 0 ? debateMessages[0].id : undefined,
    timestamp: Date.now()
  };
}
