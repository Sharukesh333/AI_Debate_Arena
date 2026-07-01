import { NextRequest, NextResponse } from 'next/server';
import { PersonalityEngine } from '../../../lib/engines/personalityEngine';
import { TopicEngine } from '../../../lib/engines/topicEngine';
import { MemoryEngine } from '../../../lib/engines/memoryEngine';
import { ConversationEngine } from '../../../lib/engines/conversationEngine';
import { PromptEngine } from '../../../lib/engines/promptEngine';

function sanitizeResponse(text: string): string {
  let cleaned = text.trim().replace(/^["']|["']$/g, '').trim();

  // Define case-insensitive list of forbidden opening patterns/cliches
  const forbiddenPatterns = [
    /^(no\s+arguments?\s+yet|no\s+previous\s+arguments?\s+by\s+opponent\.?)/i,
    /^(let's\s+start|let's\s+kick\s+off|let's\s+see|let's\s+see\s+if)/i,
    /^(can\s+they\s+keep\s+up\??|what's\s+their\s+strategy\??)/i,
    /^(i\s+mean|in\s+conclusion|silence\s+is\s+golden|as\s+an?\s+ai)/i,
    /^(lacking\s+previous\s+arguments?)/i
  ];

  let stripped = true;
  while (stripped) {
    stripped = false;
    for (const regex of forbiddenPatterns) {
      if (regex.test(cleaned)) {
        cleaned = cleaned.replace(regex, '').trim();
        // Remove leading punctuation and spaces
        cleaned = cleaned.replace(/^[:,\-\s\.]+/g, '').trim();
        stripped = true;
      }
    }
  }

  // Split into sentences using lookbehind for punctuation
  const sentences = cleaned.split(/(?<=[.!?])\s+/).filter(Boolean);
  
  // Enforce max 2 sentences
  const keptSentences = sentences.slice(0, 2);
  cleaned = keptSentences.join(' ');

  // Final trim and capitalization check
  cleaned = cleaned.trim().replace(/^["']|["']$/g, '').trim();
  if (cleaned.length > 0) {
    cleaned = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
  }

  return cleaned;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      topic,
      sideA,
      sideB,
      neutralStance,
      speaker,
      history = [],
      selectedIds = [],
      personaSides = {}
    } = body;

    // Validate inputs
    if (!topic || !speaker || !speaker.id) {
      return NextResponse.json(
        { error: 'Missing required parameters: topic, speaker, or speaker.id.' },
        { status: 400 }
      );
    }

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'API_KEY_MISSING', message: 'No Groq API key configured on the server. Set GROQ_API_KEY in your .env.local file.' },
        { status: 400 }
      );
    }

    const modelName = process.env.GROQ_MODEL?.trim() || 'llama-3.3-70b-versatile';

    // 1. Personality Engine: Retrieve detailed, anonymized character profile
    const speakerProfile = PersonalityEngine.getProfile(speaker.id);
    if (!speakerProfile) {
      return NextResponse.json(
        { error: 'INVALID_SPEAKER', message: `Speaker ID ${speaker.id} not found.` },
        { status: 400 }
      );
    }
    const anonymizedBrief = PersonalityEngine.getAnonymizedProfilePrompt(speakerProfile);

    // 2. Topic Engine: Perform/retrieve topic breakdown & subtopic assignment
    // Use the participant IDs from request body, fallback to history or current speaker if selectedIds is empty
    const participants = selectedIds.length > 0 ? selectedIds : Array.from(new Set([speaker.id, ...history.map((m: any) => m.personaId)]));
    const topicAnalysis = await TopicEngine.getOrAnalyzeTopic(topic, participants, apiKey, modelName);
    const activeSubtopic = TopicEngine.getActiveSubtopic(topicAnalysis, speaker.id, history);

    // Map stances to user-friendly titles
    let stanceLabel = 'Neutral';
    let stanceDetail = neutralStance?.description || 'Present a balanced, context-aware perspective.';
    if (speaker.side === 'for') {
      stanceLabel = `Side A: ${sideA?.title || 'Pro'}`;
      stanceDetail = sideA?.description || 'Support the main topic.';
    } else if (speaker.side === 'against') {
      stanceLabel = `Side B: ${sideB?.title || 'Con'}`;
      stanceDetail = sideB?.description || 'Oppose the main topic.';
    }

    // 3. Memory Engine: Formulate used concept & repetition constraints
    const memoryConstraints = MemoryEngine.extractMemoryConstraints(history, speaker.id, speaker.name);

    // 4. Conversation Engine: Flow control, debate styles, stages, and emotion parameters
    const turnParams = ConversationEngine.determineTurnParams(history, speaker.id);

    // 5. Prompt Engine: Dynamic stitching of system and user prompts
    const systemPrompt = PromptEngine.buildSystemPrompt(
      anonymizedBrief,
      stanceLabel,
      stanceDetail,
      topic,
      activeSubtopic,
      memoryConstraints,
      turnParams
    );

    const userPrompt = PromptEngine.buildUserPrompt(
      turnParams.opponentLastMessage,
      turnParams,
      activeSubtopic
    );

    // Build anonymized chat history message stack for Groq API call
    // Generic labels are used to prevent leaking raw names to the LLM
    const apiMessages: any[] = [
      { role: 'system', content: systemPrompt }
    ];

    // Format sorted history oldest-to-newest
    const sortedHistory = [...history].reverse();
    for (const msg of sortedHistory) {
      // Find history msg speaker's stance
      const msgSpeakerSide = personaSides[msg.personaId] || msg.stance || 'neutral';
      let sideLabel = 'Neutral_Speaker';
      if (msgSpeakerSide === 'for') sideLabel = 'Side_A_Speaker';
      if (msgSpeakerSide === 'against') sideLabel = 'Side_B_Speaker';

      if (msg.personaId === speaker.id) {
        apiMessages.push({
          role: 'assistant',
          content: msg.argument
        });
      } else {
        apiMessages.push({
          role: 'user',
          name: sideLabel,
          content: msg.argument
        });
      }
    }

    // Append final prompt
    apiMessages.push({
      role: 'user',
      content: userPrompt
    });

    console.log(`[API] Agent: ${speaker.name} | Subtopic: ${activeSubtopic} | Style: ${turnParams.style} | Stage: ${turnParams.stage}`);

    // Call Groq API
    const apiResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: modelName,
        messages: apiMessages,
        temperature: 0.8,
        max_tokens: 120,
      })
    });

    if (!apiResponse.ok) {
      const errorText = await apiResponse.text();
      console.error('Groq API error:', apiResponse.status, errorText);
      return NextResponse.json(
        { error: 'GROQ_API_ERROR', status: apiResponse.status, message: errorText },
        { status: apiResponse.status }
      );
    }

    const responseData = await apiResponse.json();
    const rawArgument = responseData.choices?.[0]?.message?.content?.trim() || '';

    if (!rawArgument) {
      return NextResponse.json(
        { error: 'EMPTY_RESPONSE', message: 'Groq returned an empty response.' },
        { status: 502 }
      );
    }

    const cleanedArgument = sanitizeResponse(rawArgument);

    return NextResponse.json({
      argument: cleanedArgument,
      stance: speaker.side,
      subtopic: activeSubtopic,
      style: turnParams.style
    });

  } catch (error: any) {
    console.error('Error in API route:', error);
    return NextResponse.json(
      { error: 'INTERNAL_SERVER_ERROR', message: error?.message || 'An unexpected error occurred.' },
      { status: 500 }
    );
  }
}
