export type DebateStyle =
  | 'Counter'
  | 'Question'
  | 'Analogy'
  | 'Roast'
  | 'Prediction'
  | 'Statistic'
  | 'Story'
  | 'Comparison'
  | 'Humor'
  | 'Challenge'
  | 'Agreement then rebuttal';

export interface TurnParams {
  style: DebateStyle;
  stage: 'Opening' | 'Middle' | 'Climax' | 'Closing';
  opponentLastMessage: string | null;
  shouldAskFollowUp: boolean;
  emotion: string;
}

export class ConversationEngine {
  private static styles: DebateStyle[] = [
    'Counter',
    'Question',
    'Analogy',
    'Roast',
    'Prediction',
    'Statistic',
    'Story',
    'Comparison',
    'Humor',
    'Challenge',
    'Agreement then rebuttal'
  ];

  /**
   * Evaluates the current state and returns parameters for the active speaker's turn.
   */
  static determineTurnParams(history: any[], currentSpeakerId: string): TurnParams {
    const turnCount = history.length;

    // 1. Determine Conversation Stage
    let stage: 'Opening' | 'Middle' | 'Climax' | 'Closing' = 'Middle';
    if (turnCount < 2) {
      stage = 'Opening';
    } else if (turnCount >= 25) {
      stage = 'Closing';
    } else if (turnCount >= 16) {
      stage = 'Climax';
    }

    // 2. Select Debate Style
    let style: DebateStyle;
    if (stage === 'Opening') {
      style = turnCount === 0 ? 'Prediction' : 'Counter';
    } else {
      const randomIndex = Math.floor(Math.random() * this.styles.length);
      style = this.styles[randomIndex];
    }

    // 3. Extract Opponent Last Message
    const lastOppMsg = history.find(m => m.personaId !== currentSpeakerId);
    const opponentLastMessage = lastOppMsg ? lastOppMsg.argument : null;

    // 4. Decide if a follow-up question is asked (25% chance unless forced by Question/Challenge style)
    const shouldAskFollowUp =
      style === 'Question' ||
      style === 'Challenge' ||
      (Math.random() < 0.25 && stage !== 'Closing');

    // 5. Select Emotion
    let emotion = 'Confident';
    switch (style) {
      case 'Roast':
        emotion = 'Sarcastic & Wry';
        break;
      case 'Counter':
      case 'Challenge':
        emotion = 'Assertive & Intense';
        break;
      case 'Humor':
        emotion = 'Amused & Mocking';
        break;
      case 'Question':
        emotion = 'Sharp & Skeptical';
        break;
      case 'Analogy':
      case 'Comparison':
        emotion = 'Clever & Quick-witted';
        break;
      case 'Prediction':
        emotion = 'Visionary & Bold';
        break;
      case 'Agreement then rebuttal':
        emotion = 'Mockingly Polite then Devastating';
        break;
      default:
        emotion = 'Calculated & Decisive';
    }

    return {
      style,
      stage,
      opponentLastMessage,
      shouldAskFollowUp,
      emotion
    };
  }
}
