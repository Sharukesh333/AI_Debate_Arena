import { personas } from '../debateData';

export interface TopicAnalysis {
  subtopics: string[];
  assignments: Record<string, string[]>; // Map persona ID to subtopics they are assigned
}

// Server-side in-memory cache to store topic breakdowns
const topicCache = new Map<string, TopicAnalysis>();

export class TopicEngine {
  /**
   * Clears the cache (helpful for resets or new debates)
   */
  static clearCache(): void {
    topicCache.clear();
  }

  /**
   * Retrieves subtopics and assigns them based on topic & selected participants.
   * Leverages caching to avoid extra API calls.
   */
  static async getOrAnalyzeTopic(
    topic: string,
    selectedIds: string[],
    apiKey: string,
    modelName: string
  ): Promise<TopicAnalysis> {
    const cacheKey = `${topic}::${selectedIds.sort().join(',')}`;
    if (topicCache.has(cacheKey)) {
      return topicCache.get(cacheKey)!;
    }

    // Prepare list of participants & their expertise for the LLM
    const participantsList = selectedIds
      .map(id => {
        const p = personas.find(x => x.id === id);
        return p ? `- ID: "${p.id}", Name: "${p.name}", Expertise Fields: [${p.expertise.join(', ')}]` : '';
      })
      .filter(Boolean)
      .join('\n');

    const systemPrompt = `You are a Topic Analysis Engine for a multi-agent debate platform.
Your task is to analyze a debate topic, break it down into subtopics, and assign them to participants based on their expertise.

Topic: "${topic}"
Participants:
${participantsList}

Instructions:
1. Break the topic down into exactly 6 logical subtopics (e.g. "Technology", "Economy", "Ethics", "Culture", "Sports", "Future Impact").
2. Assign 2 or 3 subtopics to each participant based on their listed expertise fields. Ensure every participant has relevant, distinct angles.
3. Output ONLY a valid JSON object. No commentary, no wrapping markdown codeblocks. 

JSON Format:
{
  "subtopics": ["Technology", "Economy", "Ethics", "Culture", "Sports", "Future Impact"],
  "assignments": {
    "participant_id_1": ["Technology", "Future Impact"],
    "participant_id_2": ["Economy", "Ethics"]
  }
}`;

    try {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: modelName,
          messages: [{ role: 'user', content: systemPrompt }],
          temperature: 0.1, // Low temperature for deterministic JSON output
          response_format: { type: 'json_object' }
        })
      });

      if (!response.ok) {
        throw new Error(`Topic Engine API call failed: ${response.statusText}`);
      }

      const data = await response.json();
      const rawText = data.choices?.[0]?.message?.content?.trim() || '{}';
      const analysis: TopicAnalysis = JSON.parse(rawText);

      // Validate structure, fallback if needed
      if (!analysis.subtopics || !analysis.assignments) {
        throw new Error('Invalid JSON structure returned by Topic Engine');
      }

      topicCache.set(cacheKey, analysis);
      return analysis;
    } catch (error) {
      console.error('⚠️ Topic Engine analysis failed, using fallback assignments:', error);
      
      // Fallback topic analysis
      const fallbackSubtopics = ['Core Argument', 'Society & Culture', 'Technology & Progress', 'Practicality', 'Ethics & Morals', 'Future Vision'];
      const fallbackAssignments: Record<string, string[]> = {};
      selectedIds.forEach((id, index) => {
        fallbackAssignments[id] = [
          fallbackSubtopics[index % fallbackSubtopics.length],
          fallbackSubtopics[(index + 1) % fallbackSubtopics.length]
        ];
      });

      const fallbackAnalysis = {
        subtopics: fallbackSubtopics,
        assignments: fallbackAssignments
      };
      topicCache.set(cacheKey, fallbackAnalysis);
      return fallbackAnalysis;
    }
  }

  /**
   * Determine which subtopic is active for the current speaker turn.
   * Enforces the rule: if a subtopic is discussed 3 times in the history, it's exhausted and banned.
   */
  static getActiveSubtopic(
    analysis: TopicAnalysis,
    speakerId: string,
    history: any[]
  ): string {
    const speakerSubtopics = analysis.assignments[speakerId] || analysis.subtopics;
    
    // Count occurrences of subtopics in the history
    const counts: Record<string, number> = {};
    analysis.subtopics.forEach(s => (counts[s] = 0));
    
    history.forEach(msg => {
      if (msg.subtopic && counts[msg.subtopic] !== undefined) {
        counts[msg.subtopic]++;
      }
    });

    // Find non-exhausted assigned subtopics (discussed < 3 times)
    const validAssigned = speakerSubtopics.filter(s => counts[s] < 3);

    if (validAssigned.length > 0) {
      // Pick the one discussed the least
      return validAssigned.reduce((prev, curr) => (counts[prev] <= counts[curr] ? prev : curr));
    }

    // If all assigned subtopics are exhausted, pick any non-exhausted general subtopic
    const validGeneral = analysis.subtopics.filter(s => counts[s] < 3);
    if (validGeneral.length > 0) {
      return validGeneral.reduce((prev, curr) => (counts[prev] <= counts[curr] ? prev : curr));
    }

    // Absolute fallback: pick the speaker's first assigned subtopic if everything is exhausted
    return speakerSubtopics[0] || analysis.subtopics[0];
  }
}
