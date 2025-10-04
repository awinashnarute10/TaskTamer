# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

Project overview
- Stack: React 19 + Vite, Tailwind CSS v4, ESLint 9
- App type: Front-end SPA. No server code in-repo; relies on an external AI HTTP API.
- Package manager: npm (package-lock.json present)

Commands
- Install dependencies
  ```bash path=null start=null
  npm ci
  # or
  npm install
  ```
- Start dev server (Vite)
  ```bash path=null start=null
  npm run dev
  ```
- Build for production (outputs to dist/)
  ```bash path=null start=null
  npm run build
  ```
- Preview built app locally
  ```bash path=null start=null
  npm run preview
  ```
- Lint entire codebase
  ```bash path=null start=null
  npm run lint
  ```
- Lint a single file (example)
  ```bash path=null start=null
  npx eslint src/components/MessageItem.jsx
  ```

Environment and AI backend
- Create .env.local in the project root:
  ```bash path=null start=null
  VITE_AI_API_URL=YOUR_ENDPOINT
  # Optional, if your API needs it:
  VITE_AI_API_KEY=YOUR_KEY
  # Optional preferred default model (overridden by UI selection):
  VITE_AI_MODEL=gpt-oss-120b
  ```
- The app sends POST requests to VITE_AI_API_URL with body containing an OpenAI-style messages array. Authorization: Bearer VITE_AI_API_KEY when provided.
- Expected response contract (normalized in src/services/aiClient.js):
  - Primary text can be under text, answer, choices[0].message.content, or messages[role=assistant].content.
  - Optional steps array: [{ id, text, done }]. If steps aren’t returned by the API, the client will heuristically parse checklist-like items from the text.

High-level architecture and data flow
- Entry point
  - src/main.jsx mounts <App /> under React StrictMode and imports global styles.
- Top-level state and persistence (src/App.jsx)
  - Manages an array of chats: [{ id, title, messages: [{ id, type: 'user'|'ai', text, steps? }] }].
  - Persists chats to localStorage under key tasktamer.chats. On first load, it restores chats and sets the current chat.
  - Message flow:
    - First message in a chat triggers guidance to describe a task.
    - The app “captures” the first meaningful task and prompts the user to reply with 1 to break it into subtasks.
    - If the user replies with 1, the app calls the AI to generate a breakdown (see AI integration below), renames the chat title from the task text (extractTaskName), and renders the resulting checklist with toggles and progress.
    - If the user continues chatting after a checklist exists, input is treated as refinement; the app requests an updated breakdown that refreshes steps.
    - If input appears to describe a different task, the app asks to start a new chat.
  - Step toggling mutates the steps for the specific message and drives progress UI.
  - Model selection UI stores selectedModel in state and passes it to AI calls.
- AI integration (src/services/aiClient.js)
  - sendMessageToAI({ prompt, history, modelOverride })
    - Maps internal messages to OpenAI-style roles (ai -> assistant, user -> user).
    - Posts JSON { model, messages } to VITE_AI_API_URL with optional Authorization header.
    - Normalizes diverse response shapes into { text, steps? } via normalizeAIResponse.
    - Heuristics (parseStepsFromText) extract steps from common list formats:
      - - [ ] and - [x] checklists
      - Bulleted and numbered lists
      - ### headings (treated as steps)
      - Simple table rows containing checkbox symbols
  - generateMotivation({ taskDescription, completedTasks, totalTasks, progressPercent })
    - Produces a short, specific motivational message as progress advances; caches by task and 20% milestones to reduce API calls.
    - Falls back to varied local messages if the API fails.
- UI composition
  - Sidebar: chat navigation; add/delete/select chats.
  - ChatWindow: header + scrollable message list; shows loading and empty-state guidance.
  - Header: model selector (predefined model options); updates selectedModel in App state.
  - MessageItem: renders user/AI bubbles, supports inline bold via **...**, optional steps checklist with a progress footer.
  - InputBox: multiline input; Enter submits (without Shift).
- Styling
  - Tailwind v4 (via @tailwindcss/vite) plus small custom CSS (src/index.css, src/App.css). Most layout and components are Tailwind utility classes.

AI backend tips for compatibility
- To supply steps explicitly, return steps: [{ id, text, done }]. If omitted, the client attempts to parse list-like content from the text.
- Keep outputs concise where possible; the UI elides duplicated lists when both text and steps are present.
- The default model is gpt-oss-120b unless overridden via UI or VITE_AI_MODEL.

Notable files
- package.json: scripts and dev/build toolchain.
- src/App.jsx: stateful chat and task-breakdown orchestration.
- src/services/aiClient.js: API calls, response normalization, checklist parsing, motivational messaging.
- src/components/*: Sidebar, ChatWindow, Header, InputBox, MessageItem (UI + interactions).
- src/index.css and Tailwind: global styles and utility classes.
