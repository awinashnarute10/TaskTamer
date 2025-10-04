# TaskTamer

An ADHD-friendly task tamer that turns one overwhelming goal into a clean, checkbox-only checklist — with tiny dopamine boosts at every 5% you complete and a boastful victory line at 100%.

- One task per chat, broken into actionable steps with checkboxes only (no extra AI text).
- Progress bar with motivation pings at each new 5% milestone (5, 10, 15, …, 100).
- Final 100% message is proudly celebratory.
- Duplicate steps are automatically removed and messy labels are cleaned.
- Local-first by default (chats saved in your browser). You bring your own AI endpoint.

## Why it helps ADHD brains
- Reduces overwhelm by showing only the next tiny action.
- Frequent small wins: motivation nudges at each +5% keep momentum.
- Visual progress makes finishing feel rewarding.
- Clear boundaries: one task per chat to prevent context switching.

## Quick start

Requirements:
- Node.js 18+ (or newer)

Install and run:
- Install dependencies: `npm install`
- Start dev server: `npm run dev`
  - Open the URL shown (usually http://localhost:5173/)
- Build for production: `npm run build`
- Preview build: `npm run preview`

If you need to expose on your LAN, run dev with host enabled: `vite --host` (or configure in `vite.config.js`).

## Configure your AI endpoint
Create a file named `.env.local` in the project root:

```
VITE_AI_API_URL=https://your-ai-endpoint.example.com/v1/chat/completions
# Optional if your API requires it:
VITE_AI_API_KEY=your_api_key_here
# Optional model override for messages sent to your API
VITE_AI_MODEL=gpt-oss-120b
```

How requests look:
- The app POSTs JSON containing `{ model, messages }` to `VITE_AI_API_URL`.
- It accepts several response shapes; the safest is OpenAI-style `{ choices: [{ message: { content } }] }`.
- If your model returns a plain checklist in text, TaskTamer will parse it into steps automatically.

## 🧠 Tech Stack
- React (Vite)  
- TailwindCSS  
- JavaScript  
- LocalStorage (for persistent data)

## Using TaskTamer
1) Tell TaskTamer your big task in the chat.
2) Reply `1` when prompted to generate a checklist with checkboxes.
3) Check items off as you complete them.

What you’ll see:
- AI replies render as checkboxes only (no duplicate or messy lines).
- Progress bar updates as you toggle checkboxes.
- Motivation message appears whenever you reach a new 5% milestone.
- At 100%, you’ll get a bold, brag-worthy victory line.

Tips:
- Keep each step tiny (1–5 minutes). If it feels heavy, split it.
- Start with a 2-minute “starter” step (e.g., “Open the project”).
- Use a new chat for a different task to stay focused.

## Feature details
- Checkbox-only AI output: The app parses lists (bulleted, numbered, or markdown checkboxes) and shows just the steps.
- Deduplication and sanitization: Duplicate items are removed; labels are cleaned of symbols/HTML.
- 5% milestone motivation: Messages are fetched at each new 5% progress threshold; responses are cached to avoid spam.
- 100% celebration: The final message is intentionally boastful to reinforce finishing.
- Local persistence: Chats are stored in `localStorage` in your browser.
- Model picker: Switch models from the top bar menu.
- Keyboard: Enter to send, Shift+Enter for a new line.

## Troubleshooting
- Nothing happens / AI blank:
  - Check `.env.local` is set with a valid `VITE_AI_API_URL` (and key if needed).
  - Check your browser devtools console for CORS errors.
- Motivation not appearing:
  - Ensure at least one step exists and you’ve crossed a new 5% boundary (it won’t repeat within the same milestone).
- Duplicate or weird checkbox labels:
  - The parser sanitizes and deduplicates automatically; if you still see issues, share an example line.
- Port in use / dev server issues:
  - Vite uses port 5173 by default. You can change or pass `--port 5174`.

## Privacy & safety
- Your chats live in your browser. No accounts. No cloud storage.
- The only outbound requests go to your configured AI endpoint.
- Keep your API key in `.env.local` and do not commit it.

## Project structure (high level)
- `src/App.jsx` — chat logic and flow
- `src/components/MessageItem.jsx` — message bubble, checkboxes, and progress bar
- `src/services/aiClient.js` — AI calls, response normalization, motivation generator

## Contributing
Issues and PRs are welcome. If you have ADHD-friendly UX ideas (color cues, timers, or focus modes), please share them!

## License
This project is licensed under the MIT License – see the LICENSE file for full details..
