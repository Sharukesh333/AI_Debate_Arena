export interface MemoryConstraints {
  usedArguments: string[];
  usedOpenings: string[];
  usedExamples: string[];
  usedRoasts: string[];
  usedQuestions: string[];
  discussedSubtopics: string[];
}

export class MemoryEngine {
  /**
   * Parses the debate history to extract concepts, opening phrases, roasts, questions,
   * and examples used so they can be injected as negative constraints in the prompt.
   */
  static extractMemoryConstraints(
    history: any[],
    currentSpeakerId: string,
    currentSpeakerName: string
  ): MemoryConstraints {
    const myMessages = history.filter(
      m => m.personaId === currentSpeakerId || m.personaName === currentSpeakerName
    );

    // 1. Used Openings (First 2-3 words, lowercase & stripped of punctuation)
    const usedOpenings = myMessages
      .map(m => {
        const words = m.argument.trim().split(/\s+/).slice(0, 3).join(' ');
        return words.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?"']/g, '').toLowerCase().trim();
      })
      .filter(Boolean);

    // 2. Used arguments
    const usedArguments = myMessages.map(m => m.argument.trim());

    // 3. Questions asked by me
    const usedQuestions = myMessages
      .map(m => {
        const sentences = m.argument.split(/(?<=[.!?])\s+/);
        return sentences.find((s: string) => s.includes('?'));
      })
      .filter((q): q is string => !!q)
      .map((q: string) => q.trim());

    // 4. Topics/Subtopics discussed
    const discussedSubtopics = history
      .map(m => m.subtopic)
      .filter((t): t is string => !!t);

    // 5. Gather examples/facts used (sentences containing statistics, examples, or years)
    const usedExamples: string[] = [];
    history.forEach(m => {
      const sentences = m.argument.split(/(?<=[.!?])\s+/);
      sentences.forEach((s: string) => {
        if (/for example|instance|specifically|such as|like|\b\d+%\b|\b(19|20)\d{2}\b/i.test(s)) {
          usedExamples.push(s.trim());
        }
      });
    });

    // 6. Gather roasts/comebacks used
    const usedRoasts: string[] = [];
    myMessages.forEach(m => {
      const sentences = m.argument.split(/(?<=[.!?])\s+/);
      sentences.forEach((s: string) => {
        if (/\byou\b|\byour\b|opponent|concept|logic|ideas/i.test(s) && (s.includes('!') || s.includes('?'))) {
          usedRoasts.push(s.trim());
        }
      });
    });

    return {
      usedArguments,
      usedOpenings: Array.from(new Set(usedOpenings)),
      usedExamples: Array.from(new Set(usedExamples)).slice(0, 5), // Keep tokens small
      usedRoasts: Array.from(new Set(usedRoasts)).slice(0, 5),
      usedQuestions: Array.from(new Set(usedQuestions)).slice(0, 5),
      discussedSubtopics: Array.from(new Set(discussedSubtopics))
    };
  }
}
