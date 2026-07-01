import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      topic,
      sideA,
      sideB,
      neutralStance,
      speaker,
      history = []
    } = body;

    // Validate inputs
    if (!topic || !speaker) {
      return NextResponse.json(
        { error: 'Missing required parameters: topic or speaker.' },
        { status: 400 }
      );
    }

    // Use only the server-side environment variable API key
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: 'API_KEY_MISSING', message: 'No Gemini API key configured on the server. Set GEMINI_API_KEY in your .env.local file.' },
        { status: 400 }
      );
    }

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

    // Format debate history — most recent 6 messages in chronological order
    const historyText = history.length > 0
      ? history
        .slice(-6)
        .reverse()
        .map((m: any) => `[${m.personaName} (${m.stance.toUpperCase()})]: ${m.argument}`)
        .join('\n\n')
      : 'No previous arguments. You are making the opening statement.';

    // Construct the Gemini prompt — avoid repeating the topic in every response
    const prompt = `You are participating in a structured live debate. Generate the next argument for your assigned side.

Debate Topic: "${topic}"

Sides:
- Side A: "${sideA?.title || 'Pro'}" — ${sideA?.description || ''}
- Side B: "${sideB?.title || 'Con'}" — ${sideB?.description || ''}
- Neutral: ${neutralStance?.description || 'Balanced view.'}

Your Persona: ${speaker.name} | Tone: ${speaker.tone}
Your Position: ${stanceLabel}
Your Goal: ${stanceDetail}

RULES (follow strictly):
1. Write your argument directly — no meta commentary like "As ${speaker.name}..." or "Here is my argument".
2. Stay in character: use your persona's tone and style.
3. Engage with what previous speakers said — agree, dispute, or refine specific points they made.
4. Do NOT restate the debate topic in your argument — it is already established.
5. Keep it concise: 2–4 sentences, punchy and persuasive.
6. English only.

Recent Debate History:
${historyText}

[${speaker.name}]:`;

    // Call Gemini API
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`; const apiResponse = await fetch(geminiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: prompt
              }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.75,
          maxOutputTokens: 220,
        }
      })
    });

    if (!apiResponse.ok) {
      const errorData = await apiResponse.json();
      console.error('Gemini API returned error:', errorData);
      return NextResponse.json(
        { error: 'GEMINI_API_ERROR', message: errorData?.error?.message || 'Failed to call Gemini API.' },
        { status: 502 }
      );
    }

    const data = await apiResponse.json();
    const argumentText = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';

    if (!argumentText) {
      return NextResponse.json(
        { error: 'EMPTY_RESPONSE', message: 'Gemini returned an empty response.' },
        { status: 502 }
      );
    }

    // Clean up surrounding quotes if present
    const cleanedArgumentText = argumentText.replace(/^[\"']|[\"']$/g, '');

    return NextResponse.json({
      argument: cleanedArgumentText,
      stance: speaker.side
    });

  } catch (error: any) {
    console.error('Error in debate API route:', error);
    return NextResponse.json(
      { error: 'INTERNAL_SERVER_ERROR', message: error?.message || 'An unexpected error occurred.' },
      { status: 500 }
    );
  }
}
