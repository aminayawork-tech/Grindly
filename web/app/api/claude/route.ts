import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

export async function POST(req: NextRequest) {
  const { messages, system, userApiKey } = await req.json();

  const apiKey = process.env.ANTHROPIC_API_KEY ?? userApiKey ?? '';
  if (!apiKey) {
    return NextResponse.json({ error: 'No Anthropic API key configured. Add it in Settings.' }, { status: 200 });
  }

  const client = new Anthropic({ apiKey });

  try {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      system,
      messages,
    });
    const text = response.content[0]?.type === 'text' ? response.content[0].text : 'Keep pushing.';
    return NextResponse.json({ text });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Coach is unavailable right now.';
    return NextResponse.json({ error: message }, { status: 200 });
  }
}
