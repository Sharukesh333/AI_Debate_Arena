/**
 * Centralized Debate Store
 * Manages debate state and enforces personality selection rules
 */

export interface DebateStore {
  topic: string;
  selectedPersonalityIds: string[];
  isDebateRunning: boolean;
  debateRound: number;
  lastSpeakerId?: string;
}

class CentralizedDebateStore {
  private store: DebateStore = {
    topic: '',
    selectedPersonalityIds: [],
    isDebateRunning: false,
    debateRound: 0
  };

  /**
   * Initialize debate with topic and selected personalities
   */
  initializeDebate(topic: string, selectedPersonalityIds: string[]): void {
    if (!topic.trim()) {
      throw new Error('Debate topic cannot be empty');
    }
    if (selectedPersonalityIds.length < 2) {
      throw new Error('At least 2 personalities required for debate');
    }

    this.store = {
      topic,
      selectedPersonalityIds: [...selectedPersonalityIds], // Create new array
      isDebateRunning: true,
      debateRound: 1,
      lastSpeakerId: undefined
    };
  }

  /**
   * Validate that a personality is authorized to speak
   * Throws error if personality is not selected
   */
  validateSpeaker(personaId: string): void {
    if (!this.store.selectedPersonalityIds.includes(personaId)) {
      throw new Error(
        `SECURITY VIOLATION: Unselected personality "${personaId}" attempted to join debate. ` +
        `Selected personalities: [${this.store.selectedPersonalityIds.join(', ')}]`
      );
    }
  }

  /**
   * Validate speaker and record their turn
   */
  recordSpeaker(personaId: string): void {
    this.validateSpeaker(personaId);
    this.store.lastSpeakerId = personaId;
  }

  /**
   * Get current debate state
   */
  getState(): DebateStore {
    return { ...this.store };
  }

  /**
   * Get selected personalities (read-only)
   */
  getSelectedPersonalities(): readonly string[] {
    return Object.freeze([...this.store.selectedPersonalityIds]);
  }

  /**
   * Check if debate is running
   */
  isRunning(): boolean {
    return this.store.isDebateRunning;
  }

  /**
   * Get current topic
   */
  getTopic(): string {
    return this.store.topic;
  }

  /**
   * Get next speaker (round-robin from selected personalities)
   */
  getNextSpeaker(currentIndex: number): string {
    if (this.store.selectedPersonalityIds.length === 0) {
      throw new Error('No selected personalities available');
    }
    return this.store.selectedPersonalityIds[currentIndex % this.store.selectedPersonalityIds.length];
  }

  /**
   * Increment debate round
   */
  incrementRound(): void {
    this.store.debateRound++;
  }

  /**
   * End debate
   */
  endDebate(): void {
    this.store.isDebateRunning = false;
  }

  /**
   * Reset store for new debate
   */
  reset(): void {
    this.store = {
      topic: '',
      selectedPersonalityIds: [],
      isDebateRunning: false,
      debateRound: 0
    };
  }

  /**
   * Get all authorized speakers (immutable)
   */
  getAuthorizedSpeakers(): string[] {
    return [...this.store.selectedPersonalityIds];
  }

  /**
   * Verify personality list hasn't changed during debate
   */
  verifyPersonalityList(personalities: string[]): boolean {
    if (personalities.length !== this.store.selectedPersonalityIds.length) {
      return false;
    }
    return personalities.every(p => this.store.selectedPersonalityIds.includes(p));
  }
}

// Singleton instance
export const debateStore = new CentralizedDebateStore();
