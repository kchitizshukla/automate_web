import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const SYSTEM_PROMPT = `You are "AutoMate Assistant", a friendly in-app support agent for AutoMate — a platform to book and track repair/maintenance services for ANY vehicle (cars, bikes, scooters, SUVs, etc.).
Help users with: finding/booking mechanics, the booking flow (service → schedule → address → confirm), tracking service status, managing their garage/vehicles, payments, and offers.
Keep replies short, warm and practical (2-4 sentences, use bullet points when listing steps). If a request needs an account action, point them to the relevant page (e.g. "Book Service", "Find Mechanics", "My Services", "Payments"). If you don't know something specific to their account, say so and suggest contacting support. Never invent prices or booking IDs.`;

export async function POST(req: NextRequest) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: 'Assistant is not configured yet. Add OPENROUTER_API_KEY to apps/web/user/.env.local and restart the dev server.' },
      { status: 503 },
    );
  }

  let payload: { messages?: { role: string; content: string }[] };
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const history = Array.isArray(payload.messages) ? payload.messages.slice(-12) : [];
  const model = process.env.OPENROUTER_MODEL || 'meta-llama/llama-3.3-70b-instruct:free';

  try {
    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'http://localhost:3001',
        'X-Title': 'AutoMate',
      },
      body: JSON.stringify({
        model,
        messages: [{ role: 'system', content: SYSTEM_PROMPT }, ...history],
        temperature: 0.4,
        max_tokens: 600,
      }),
    });

    if (!res.ok) {
      const detail = await res.text();
      return NextResponse.json(
        { error: `Assistant service returned ${res.status}.`, detail: detail.slice(0, 300) },
        { status: 502 },
      );
    }

    const data = await res.json();
    const reply: string = data?.choices?.[0]?.message?.content?.trim() || 'Sorry, I could not generate a response. Please try again.';
    return NextResponse.json({ reply });
  } catch {
    return NextResponse.json({ error: 'Could not reach the assistant service.' }, { status: 502 });
  }
}
