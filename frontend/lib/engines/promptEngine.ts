import { MemoryConstraints } from './memoryEngine';
import { TurnParams } from './conversationEngine';

export class PromptEngine {
  /**
   * Constructs the system prompt dynamically using character briefs, stances,
   * subtopics, conversation stage, active emotion, and memory constraints.
   */
  static buildSystemPrompt(
    anonymizedProfilePrompt: string,
    stanceLabel: string,
    stanceDetail: string,
    topic: string,
    subtopic: string,
    constraints: MemoryConstraints,
    params: TurnParams
  ): string {
    const forbiddenPhrases = [
      'As an AI',
      'I mean',
      "Let's start",
      'No arguments',
      'Can they keep up',
      "What's your strategy",
      "Let's see",
      'Lacking previous arguments'
    ];

    const forbiddenPhraseList = forbiddenPhrases.map(p => `"${p}"`).join(', ');

    // Compile Memory Constraints to enforce zero repetition
    let memoryBlock = '';
    if (constraints.usedArguments.length > 0) {
      memoryBlock += `\nCRITICAL: DO NOT repeat or rephrase your previous arguments:\n` +
        constraints.usedArguments.map(arg => `- "${arg}"`).slice(-3).join('\n');
    }
    if (constraints.usedOpenings.length > 0) {
      memoryBlock += `\nCRITICAL: DO NOT start your response with any of these word patterns (case-insensitive):\n` +
        constraints.usedOpenings.map(op => `- "${op}..."`).slice(-3).join('\n');
    }
    if (constraints.usedExamples.length > 0) {
      memoryBlock += `\nCRITICAL: DO NOT reuse these examples/facts:\n` +
        constraints.usedExamples.map(ex => `- "${ex}"`).join('\n');
    }
    if (constraints.usedRoasts.length > 0) {
      memoryBlock += `\nCRITICAL: DO NOT repeat these exact jabs/roasts:\n` +
        constraints.usedRoasts.map(r => `- "${r}"`).join('\n');
    }

    return `You are roleplaying as a panelist in a live TV-style debate. You are in the "${params.stage}" stage of the debate.
Current Turn Emotion: "${params.emotion}".

DEBATE CONTEXT:
- Main Topic: "${topic}"
- Stance Position: "${stanceLabel}" (${stanceDetail})
- Assigned Subtopic Focus: "${subtopic}" (Center your statement or rebuttal around this aspect of the topic)

${anonymizedProfilePrompt}

STRICT CONSTRAINTS (Disqualification will result if breached):
1. **Length**: Maximum 18 words. Exactly 1 or 2 sentences. Be ultra-concise!
2. **Grammar & Language**: Simple English, highly conversational. Speak like you are on Joe Rogan or Lex Fridman. Avoid formal Wikipedia tone or bulleted lists.
3. **Forbidden Phrases**: You must NEVER output any of these phrases: ${forbiddenPhraseList}.
4. **Debate Style**: Use the "${params.style}" format.
${memoryBlock}

Remember: Your goal is to be engaging and completely stay in character. Do NOT state any famous names or catchphrases directly.`;
  }

  /**
   * Constructs the user prompt with the direct rebuttals, style directives, and hooks.
   */
  static buildUserPrompt(
    opponentLastMessage: string | null,
    params: TurnParams,
    subtopic: string
  ): string {
    if (!opponentLastMessage) {
      return `Make the opening statement of the debate. Focus on "${subtopic}" using a "${params.style}" approach. Output only the argument text:`;
    }

    let styleDirection = '';
    switch (params.style) {
      case 'Roast':
        styleDirection = 'Reply with a witty, highly specific roast/critique of their point.';
        break;
      case 'Analogy':
        styleDirection = 'Deconstruct their point by introducing a unique, quick analogy matching your cognitive style.';
        break;
      case 'Question':
        styleDirection = 'Expose a loophole in their assertion by asking a sharp, direct question.';
        break;
      case 'Prediction':
        styleDirection = 'Rebut them by making a bold, future-oriented prediction about "${subtopic}".';
        break;
      case 'Statistic':
        styleDirection = 'Counter them by framing your argument around numbers, scale, metrics, or performance.';
        break;
      case 'Story':
        styleDirection = 'Rebut them with a brief, punchy, real-world micro-scenario or anecdote.';
        break;
      case 'Comparison':
        styleDirection = 'Contrast their logic with a better alternative to demonstrate why they fail.';
        break;
      case 'Humor':
        styleDirection = 'Dismiss their point using playful, self-confident humor.';
        break;
      case 'Challenge':
        styleDirection = 'Directly challenge their primary assumption, forcing them to defend it.';
        break;
      case 'Agreement then rebuttal':
        styleDirection = 'Briefly concede a minor point, then immediately run it into a devastating counter-punch.';
        break;
      default:
        styleDirection = 'Assert a strong, direct counter-point.';
    }

    return `Opponent's statement: "${opponentLastMessage}"

Instructions:
1. Rebut/Counter their point directly. Do NOT ignore it.
2. Add exactly one fresh idea regarding the subtopic "${subtopic}".
3. Style Directive: ${styleDirection}
${params.shouldAskFollowUp ? '4. Conclude with a natural, punchy follow-up question.' : ''}

Output ONLY your conversational response (max 18 words, 1-2 sentences):`;
  }
}
