import { Persona } from '../types';
import { personas } from '../debateData';

export class PersonalityEngine {
  /**
   * Retrieve a personality profile by ID
   */
  static getProfile(id: string): Persona | undefined {
    return personas.find(p => p.id === id);
  }

  /**
   * Generates a descriptive instruction prompt for the LLM based on the persona
   * WITHOUT revealing their famous name directly, satisfying the anonymity constraint.
   */
  static getAnonymizedProfilePrompt(profile: Persona): string {
    return `CHARACTER STYLE PROFILE:
- General Role: ${profile.shortDescription}
- Stance Tone: ${profile.tone}
- Communication Flow: ${profile.communicationStyle}
- Vocabulary Level: ${profile.vocabularyLevel}
- Humor Profile: ${profile.humorLevel}
- Confidence Demeanor: ${profile.confidenceLevel}
- Emotional Delivery: ${profile.emotionalStyle}
- Core Arguments Strategy: ${profile.debateStrategy}
- Dynamic Speech Flow Rate: ${profile.speakingSpeed}
- Length Preferences: ${profile.sentenceLength}
- Permitted Sarcasm Level: ${profile.allowedSarcasmLevel}
- Roast / Rebuttal Style: ${profile.roastingStyle}
- Natural Speaking Habits: ${profile.commonHabits.map(h => `"${h}"`).join(', ')}
- Analogies Preferred: ${profile.favouriteAnalogies.map(a => `"${a}"`).join(', ')}
- Typical Reactions to Opponent: ${profile.typicalReactions.map(r => `"${r}"`).join(', ')}

STRICT VOICE REQUIREMENTS:
1. Do NOT write famous quotes, catchphrases, or make cheesy name puns.
2. Imitate the underlying cognitive thinking style, confidence, vocabulary, and metaphorical phrasing of the profile instead.
3. Keep the voice unique, identifiable, and fully integrated.`;
  }
}
