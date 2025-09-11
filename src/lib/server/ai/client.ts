import { NextResponse } from 'next/server';

export interface ClaudeCallResult {
  ok: boolean;
  text?: string;
  usage?: { input_tokens?: number; output_tokens?: number };
  status?: number;
  error?: string;
}

export interface ClaudeCallOptions {
  model?: string;
  system: string;
  user: string;
  maxTokens?: number;
  temperature?: number;
  timeoutMs?: number;
}

function getApiKey(): string | null {
  return process.env.CLAUDE_API_KEY || null;
}

export function hasApiKey() {
  return !!getApiKey();
}

export async function callClaude(opts: ClaudeCallOptions): Promise<ClaudeCallResult> {
  const apiKey = getApiKey();
  if (!apiKey) return { ok: false, error: 'no_api_key' };

  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), opts.timeoutMs ?? 25000);
  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: opts.model || process.env.CLAUDE_MODEL || 'claude-3-haiku-20240307',
        system: opts.system,
        messages: [ { role: 'user', content: opts.user } ],
        max_tokens: opts.maxTokens ?? 4000,
        temperature: opts.temperature ?? 0.7,
      }),
      signal: controller.signal,
    });
    clearTimeout(t);
    const text = await res.text();
    if (!res.ok) {
      return { ok: false, status: res.status, error: text?.slice(0, 500) || 'anthropic_error' };
    }
    let json: any = null;
    try { json = JSON.parse(text); } catch {}
    const usage = json?.usage || undefined;
    const contentText = json?.content?.[0]?.text ?? '';
    return { ok: true, text: contentText, usage };
  } catch (e: any) {
    clearTimeout(t);
    const msg = e?.name === 'AbortError' ? 'timeout' : (e?.message || 'error');
    return { ok: false, error: msg };
  }
}

export async function healthPing(): Promise<{ hasEnv: boolean; ok: boolean; status?: number; error?: string }>{
  const hasEnv = hasApiKey();
  if (!hasEnv) return { hasEnv, ok: false, error: 'no_api_key' };
  const res = await callClaude({ system: 'pong', user: 'reply "pong"', maxTokens: 1, temperature: 0, timeoutMs: 8000 });
  return { hasEnv, ok: !!res.ok, status: res.status, error: res.error };
}

