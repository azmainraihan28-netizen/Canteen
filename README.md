<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/d33ae128-9cd7-4a54-8850-9bacd2cbaf7d

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Budget Planner

Sidebar → **Operations → Budget planner**. Plan the budget for any program/event
(sections such as Breakfast / Lunch / Snacks, items with unit, quantity, rate and
remarks), then export it.

- **Rates from inventory** — pick an item from the inventory list (or type a name
  like `Onion - পিঁয়াজ`) and click **Use inventory prices** to pull the unit price
  from the `ingredients` table.
- **AI market prices** — click **AI market prices** (whole budget) or the ✨ icon on a
  row. The AI searches the web for today's Dhaka market prices and fills them in.
  Modes: *Empty rates only*, *All items*, or *Compare only* (shows the market price
  next to your rate without changing it).
- **Export PDF** — opens a print-ready A4 budget approval sheet; choose
  *Save as PDF* in the print dialog.
- **CSV** — UTF-8 (Bangla-safe) CSV laid out like the approval sheet, with
  sub-totals, total, cost per head and amount in words.
- Budgets autosave. Viewers (guest login) can open and export but not edit.

### One-time setup

1. **Database table** — run the `budget_plans` part of `supabase_schema.sql` in the
   Supabase SQL editor. Until then budgets are saved in the browser only (the page
   shows "This device only").
2. **AI price search** — deploy the Edge Function with your OpenAI API key
   (uses an OpenAI model with web search, default `gpt-5.4-mini`; override with an
   `OPENAI_MODEL` secret. The key never reaches the browser):

   ```bash
   supabase secrets set OPENAI_API_KEY=sk-...
   supabase functions deploy price-search
   ```
