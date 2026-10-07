// Supabase Edge Function: price-search
//
// Looks up current Bangladesh market prices for budget items using Claude
// with the web search tool. The Anthropic API key stays server-side.
//
// Deploy:
//   supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
//   supabase functions deploy price-search
//
// Request body:  { items: [{ name: string, unit: string }], location?: string }
// Response body: { prices: [{ name, unit, price, low, high, source, sourceUrl, note }] }

import Anthropic from 'npm:@anthropic-ai/sdk';

declare const Deno: {
  serve: (handler: (req: Request) => Response | Promise<Response>) => void;
  env: { get: (key: string) => string | undefined };
};

const MAX_ITEMS = 15;
const MAX_CONTINUATIONS = 4;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });

const SYSTEM_PROMPT = `You are a procurement assistant for a corporate canteen in Bangladesh.
For each item you are given, search the web for its current market price in Bangladeshi Taka (BDT).
Prefer recent sources: TCB daily market price lists, Chaldal, Shwapno, Meena Bazar, Daraz grocery, and Bangladeshi news reports of kitchen-market (kacha bazar) prices.
Convert every price to the unit requested for that item (for example per KG, per Litre, per PCS/piece, per dozen ÷ 12 for pieces). If a pack size differs, scale it.
Group similar items into as few searches as possible.

When you are done, reply with ONLY a JSON object in a \`\`\`json code block, in exactly this shape and in the same order as the input:
{"prices":[{"name":"<input name>","unit":"<input unit>","price":<typical BDT number or null>,"low":<number or null>,"high":<number or null>,"source":"<short source name>","sourceUrl":"<url or empty>","note":"<one short line, e.g. date seen or assumption>"}]}
Use null for price when you genuinely cannot find a reasonable figure. Do not add commentary outside the code block.`;

type ItemIn = { name: string; unit: string };

const sanitizeItems = (raw: unknown): ItemIn[] | null => {
  if (!Array.isArray(raw) || raw.length === 0 || raw.length > MAX_ITEMS) return null;
  const items: ItemIn[] = [];
  for (const r of raw) {
    const name = typeof r?.name === 'string' ? r.name.trim().slice(0, 120) : '';
    const unit = typeof r?.unit === 'string' ? r.unit.trim().slice(0, 20) : '';
    if (!name) return null;
    items.push({ name, unit: unit || 'unit' });
  }
  return items;
};

const extractJson = (text: string): any => {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced ? fenced[1] : text.slice(text.indexOf('{'), text.lastIndexOf('}') + 1);
  return JSON.parse(candidate);
};

const toNum = (v: unknown): number | null => {
  const n = typeof v === 'string' ? Number(v.replace(/[^0-9.]/g, '')) : Number(v);
  return Number.isFinite(n) && n > 0 ? Math.round(n * 100) / 100 : null;
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  let body: any;
  try {
    body = await req.json();
  } catch {
    return json({ error: 'Invalid JSON body' }, 400);
  }

  const items = sanitizeItems(body?.items);
  if (!items) return json({ error: `Send 1-${MAX_ITEMS} items, each with a name.` }, 400);
  const location = typeof body?.location === 'string' && body.location.trim() ? body.location.trim().slice(0, 80) : 'Dhaka, Bangladesh';

  const apiKey = Deno.env.get('ANTHROPIC_API_KEY');
  if (!apiKey) {
    return json({ error: 'AI is not configured yet: set the ANTHROPIC_API_KEY secret for the price-search Edge Function in Supabase.' }, 503);
  }
  const client = new Anthropic({ apiKey });
  const today = new Date().toISOString().slice(0, 10);
  const userPrompt = `Today is ${today}. Location: ${location}.
Find the current market price for each of these items:
${items.map((it, i) => `${i + 1}. ${it.name} — price per ${it.unit}`).join('\n')}`;

  const messages: Anthropic.Beta.BetaMessageParam[] = [{ role: 'user', content: userPrompt }];

  try {
    let response: Anthropic.Beta.BetaMessage | undefined;
    for (let i = 0; i < MAX_CONTINUATIONS; i++) {
      response = await client.beta.messages.create({
        model: 'claude-opus-5-5',
        max_tokens: 16000,
        betas: ['server-side-fallback-2026-07-01'],
        fallbacks: 'default',
        output_config: { effort: 'low' },
        system: SYSTEM_PROMPT,
        tools: [
          {
            type: 'web_search_20260209',
            name: 'web_search',
            max_uses: 8,
            user_location: { type: 'approximate', country: 'BD', city: 'Dhaka', timezone: 'Asia/Dhaka' },
          },
        ],
        messages,
      });
      // Long server-side search loops pause; resend the partial turn to resume.
      if (response.stop_reason !== 'pause_turn') break;
      messages.push({ role: 'assistant', content: response.content });
    }

    if (!response) return json({ error: 'No response from AI' }, 502);
    if (response.stop_reason === 'refusal') {
      return json({ error: 'The AI declined this request. Try rephrasing the item names.' }, 422);
    }

    const text = response.content
      .filter((b): b is Anthropic.Beta.BetaTextBlock => b.type === 'text')
      .map((b) => b.text)
      .join('\n');

    let parsed: any;
    try {
      parsed = extractJson(text);
    } catch {
      return json({ error: 'Could not read prices from the AI response. Please try again.' }, 502);
    }

    const rows: any[] = Array.isArray(parsed?.prices) ? parsed.prices : [];
    const prices = items.map((it, i) => {
      const r = rows[i] && String(rows[i].name || '').toLowerCase() === it.name.toLowerCase()
        ? rows[i]
        : rows.find((x) => String(x?.name || '').toLowerCase() === it.name.toLowerCase()) || rows[i] || {};
      return {
        name: it.name,
        unit: it.unit,
        price: toNum(r.price),
        low: toNum(r.low),
        high: toNum(r.high),
        source: typeof r.source === 'string' ? r.source.slice(0, 80) : '',
        sourceUrl: typeof r.sourceUrl === 'string' && /^https?:\/\//.test(r.sourceUrl) ? r.sourceUrl : '',
        note: typeof r.note === 'string' ? r.note.slice(0, 200) : '',
      };
    });

    return json({ prices });
  } catch (err) {
    if (err instanceof Anthropic.AuthenticationError) {
      return json({ error: 'ANTHROPIC_API_KEY is missing or invalid on the server.' }, 500);
    }
    if (err instanceof Anthropic.RateLimitError) {
      return json({ error: 'AI is busy right now (rate limited). Try again in a minute.' }, 429);
    }
    if (err instanceof Anthropic.APIError) {
      return json({ error: `AI request failed (${err.status}): ${err.message}` }, 502);
    }
    return json({ error: `Price search failed: ${(err as Error)?.message || err}` }, 500);
  }
});
