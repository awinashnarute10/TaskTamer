

function getEnv(name, { required = true } = {}) {
    const value = import.meta.env[name];
    if (required && (!value || typeof value !== "string")) {
        throw new Error(`Missing required env: ${name}`);
    }
    return value;
}

// Cache for previous motivations to avoid repetition
const motivationCache = new Map();

export async function generateMotivation({ taskDescription, completedTasks, totalTasks, progressPercent, previousMotivations = [] }) {
    // Create cache key based on task and 5% progress milestones
    const progressMilestone = Math.floor(progressPercent / 5) * 5; // 5%, 10%, 15%, ...
    const cacheKey = `${taskDescription}_${progressMilestone}_${completedTasks}`;

    // Return cached motivation if available (reduces API calls significantly)
    if (motivationCache.has(cacheKey)) {
        return motivationCache.get(cacheKey);
    }

    const apiUrl = getEnv("VITE_AI_API_URL");
    const apiKey = import.meta.env.VITE_AI_API_KEY;
    const model = import.meta.env.VITE_AI_MODEL || "gpt-oss-120b";

    const progressStage =
        progressPercent === 100 ? "completed" :
            progressPercent >= 75 ? "near-completion" :
                progressPercent >= 50 ? "making-good-progress" :
                    progressPercent > 0 ? "just-started" :
                        "not-started";

    let prompt;
    if (progressStage === "completed") {
        prompt = `Generate ONE bold, brag-worthy victory line for: "${taskDescription}"

Progress: ${completedTasks}/${totalTasks} completed (${progressPercent}%)
Stage: ${progressStage}

Requirements:
- Maximum 45 characters
- Include exactly ONE emoji (victory/celebration or task-related)
- Sound triumphant and proud; celebrate the user
- Avoid generic phrases like "keep going" or "great job"
- Be specific to the task or outcome
- Natural, not corporate

Good examples:
- "🏆 Flawless finish. You set the bar."
- "👑 Masterclass delivered."
- "🚀 Goal obliterated. Champion move."

Generate ONE message:`;
    } else {
        prompt = `Generate ONE fresh, creative motivational message for: "${taskDescription}"

Progress: ${completedTasks}/${totalTasks} completed (${progressPercent}%)
Stage: ${progressStage}

Requirements:
- Maximum 45 characters
- Include exactly ONE emoji (related to the actual task)
- Avoid generic phrases like "keep going", "great job", "you got this"
- Be specific to what they're actually doing
- Sound natural and authentic, not corporate
- Be encouraging but not overly enthusiastic

Good examples:
- "📝 Drafting excellence!"
- "🏠 Room transformation underway!"
- "🎯 Target locked and loaded!"

Bad examples: "Keep going!", "Great progress!", "You're doing amazing!"

Generate ONE specific motivational message:`;
    }

    const body = {
        model,
        messages: [
            { role: "user", content: prompt }
        ],
        max_tokens: 60,
        temperature: 1.0, // Higher creativity
    };

    const headers = {
        "Content-Type": "application/json",
    };
    if (apiKey) headers["Authorization"] = `Bearer ${apiKey}`;

    try {
        const res = await fetch(apiUrl, {
            method: "POST",
            headers,
            body: JSON.stringify(body),
        });

        if (!res.ok) {
            const text = await res.text().catch(() => "");
            throw new Error(`AI API error ${res.status}: ${text}`);
        }

        const data = await res.json();

        // Extract text from response
        let motivationText = "";
        if (typeof data.text === "string") {
            motivationText = data.text.trim();
        } else if (Array.isArray(data.choices) && data.choices[0]?.message?.content) {
            motivationText = data.choices[0].message.content.trim();
        } else {
            throw new Error("No valid response format");
        }

        // Clean and validate the response
        motivationText = motivationText
            .replace(/^["']|["']$/g, "")
            .replace(/^(Great|Awesome|Keep|You|Good|Amazing|Excellent|Wonderful|Fantastic|Outstanding|Incredible|Brilliant)/i, "")
            .trim();

        // More validation - reject if too generic or wrong length
        if (!motivationText || motivationText.length > 50 || motivationText.length < 8) {
            throw new Error("Response validation failed");
        }

        // Cache the good response
        motivationCache.set(cacheKey, motivationText);

        return motivationText;
    } catch (error) {
        console.warn("Failed to generate AI motivation:", error);

        // Much better static fallbacks that are specific and varied
        const dynamicFallbacks = {
            completed: [
                "👑 Dominance achieved.",
                "🏆 Flawless finish. Champion.",
                "🚀 Goal obliterated.",
                "🎯 Masterclass delivered."
            ],
            "near-completion": [
                "Final stretch! 🏁",
                "Almost flawless! 💎",
                "Endgame mode! ⚡",
                "Victory imminent! 🌟"
            ],
            "making-good-progress": [
                "In the zone! 🎯",
                "Riding waves! 🌊",
                "Electric progress! ⚡",
                "Firing on all cylinders! 🔥"
            ],
            "just-started": [
                "Launch sequence! 🚀",
                "First sparks! ⚡",
                "Ignition complete! 🔥",
                "Systems go! 💫"
            ]
        };

        const stageFallbacks = dynamicFallbacks[progressStage] || dynamicFallbacks["just-started"];
        const selectedFallback = stageFallbacks[completedTasks % stageFallbacks.length];

        // Cache fallback too
        motivationCache.set(cacheKey, selectedFallback);

        return selectedFallback;
    }
}

export async function sendMessageToAI({ prompt, history = [], modelOverride }) {
    const apiUrl = getEnv("VITE_AI_API_URL");
    const apiKey = import.meta.env.VITE_AI_API_KEY;
    const model = modelOverride || import.meta.env.VITE_AI_MODEL || "gpt-oss-120b";


    const messages = [
        ...history.map((m) => ({
            role: m.type === "ai" ? "assistant" : m.type, // map internal 'ai' -> 'assistant'
            content: m.text
        })),
        { role: "user", content: prompt },
    ];

    const body = {
        model,
        messages,
    };

    const headers = {
        "Content-Type": "application/json",
    };
    if (apiKey) headers["Authorization"] = `Bearer ${apiKey}`;

    const res = await fetch(apiUrl, {
        method: "POST",
        headers,
        body: JSON.stringify(body),
    });

    if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(`AI API error ${res.status}: ${text}`);
    }

    /**
     * Try to normalize various possible response shapes into:
     * { text: string, steps?: {id, text, done}[] }
     */
    const data = await res.json();
    return normalizeAIResponse(data);
}

function normalizeAIResponse(data) {
    if (!data) return { text: "(empty response)" };

    // Extract primary text from common shapes
    let text;
    if (typeof data.text === "string") {
        text = data.text;
    } else if (typeof data.answer === "string") {
        text = data.answer;
    } else if (Array.isArray(data.choices) && data.choices[0]?.message?.content) {
        text = data.choices[0].message.content;
    } else if (Array.isArray(data.messages)) {
        const assistant = data.messages.find((m) => m.role === "assistant");
        text = assistant?.content;
    }

    // Normalize provided steps if present
    let steps = normalizeSteps(data.steps);

    // Parse checklist-like items from text; if found, strip them from visible text
    if (typeof text === "string") {
        const parsed = parseStepsFromText(text);
        if (parsed.steps.length > 0) {
            steps = steps && steps.length > 0 ? steps : parsed.steps;
            // Hide the original AI text entirely when we have steps
            text = "";
        }
    }

    // Normalize, sanitize, and deduplicate steps
    if (Array.isArray(steps)) {
        steps = normalizeSteps(steps);
        steps = sanitizeSteps(steps);
        steps = dedupeSteps(steps);
    }

    // Return steps-only if available
    if (Array.isArray(steps) && steps.length > 0) {
        return { text: "", steps };
    }

    // Fallbacks
    if (typeof text !== "string" || text.length === 0) {
        return { text: typeof data === "string" ? data : JSON.stringify(data) };
    }
    return { text, steps };
}

function normalizeSteps(steps) {
    if (!Array.isArray(steps)) return undefined;
    return steps.map((s, i) => ({
        id: s.id ?? `step-${i + 1}`,
        text: typeof s.text === "string" ? s.text : String(s),
        done: Boolean(s.done),
    }));
}

function sanitizeSteps(steps) {
    const clean = (t) => {
        let s = String(t || "");
        // Strip HTML tags
        s = s.replace(/<[^>]+>/g, "");
        // Remove wrapping quotes/backticks
        s = s.replace(/^["'`]+|["'`]+$/g, "");
        // Remove leading checkbox/bullet/number prefixes
        s = s.replace(/^\s*(?:[-*]\s+|\d+[\.)]\s+|\[(?: |x|X)\]\s+)/, "");
        // Collapse whitespace
        s = s.replace(/\s+/g, " ").trim();
        return s;
    };
    return steps
        .map((s) => ({ ...s, text: clean(s.text) }))
        .filter((s) => s.text.length > 0);
}

function dedupeSteps(steps) {
    if (!Array.isArray(steps)) return steps;
    const seen = new Set();
    const result = [];
    for (const s of steps) {
        const key = String(s.text || "").trim().replace(/\s+/g, " ").toLowerCase();
        if (!key || seen.has(key)) continue;
        seen.add(key);
        result.push(s);
    }
    // Ensure stable, unique IDs
    return result.map((s, i) => ({ ...s, id: s.id ?? `step-${i + 1}` }));
}

// Heuristic parser: extract steps from common list formats in plain text
function parseStepsFromText(text) {
    const lines = String(text).split(/\r?\n/);
    const stepLines = [];
    const otherLines = [];

    const listPatterns = [
        /^\s*[-*]\s+\[( |x|X)\]\s+(.*)$/u,     // - [ ] task or - [x] task
        /^\s*[-*]\s+(.*)$/u,                      // - task
        /^\s*\d+[\.)]\s+(.*)$/u,                // 1. task or 1) task
        /^\s*#{3}\s+(.*)$/u,                      // ### heading treated as a step
    ];

    for (const line of lines) {
        let matched = false;
        // 0) Table row with checkbox symbol (e.g., | ... | ☐ | ... |)
        const isTableRow = /^\s*\|(.+)\|\s*$/u.test(line);
        if (isTableRow) {
            const rawCells = line
                .trim()
                .split("|")
                .map((c) => c.trim())
                .filter((c) => c.length > 0);
            if (rawCells.length > 0) {
                const hasUnchecked = rawCells.some((c) => /^(☐|\[ \])$/u.test(c));
                const hasChecked = rawCells.some((c) => /^(☑|\[[xX]\])$/u.test(c));
                if (hasUnchecked || hasChecked) {
                    matched = true;
                    const textCells = rawCells.filter((c) => !/^(☐|☑|\[ \]|\[[xX]\])$/u.test(c) && !/^\d+$/.test(c));
                    // Heuristic: choose the longest non-checkbox, non-index cell as the step text
                    const text = (textCells.sort((a, b) => b.length - a.length)[0] || "").trim();
                    if (text) {
                        stepLines.push({ text, done: hasChecked });
                    }
                }
            }
        }
        // 1) Checkbox pattern first
        const m1 = line.match(/^\s*[-*]\s+\[( |x|X)\]\s+(.*)$/u);
        if (m1) {
            matched = true;
            const done = m1[1].toLowerCase() === "x";
            const text = m1[2].trim();
            stepLines.push({ text, done });
        }
        if (!matched) {
        // 2) Bulleted list (ignore section headings like "Good examples:")
        const m2 = line.match(/^\s*[-*]\s+(.*)$/u);
        if (m2) {
            const content = m2[1].trim();
            const isSection = /:$/u.test(content) || /^(good examples|bad examples|requirements|notes|context)\b/i.test(content);
            if (!isSection) {
                matched = true;
                stepLines.push({ text: content, done: false });
            } else {
                matched = true; // treat as handled but don't add as step
            }
        }
        }
        if (!matched) {
            // 3) Numbered list (ignore section headings)
            const m3 = line.match(/^\s*\d+[\.)]\s+(.*)$/u);
            if (m3) {
                const content = m3[1].trim();
                const isSection = /:$/u.test(content) || /^(good examples|bad examples|requirements|notes|context)\b/i.test(content);
                if (!isSection) {
                    matched = true;
                    stepLines.push({ text: content, done: false });
                } else {
                    matched = true;
                }
            }
        }
        if (!matched) {
            // 4) Ignore ### headings (do not treat as steps)
            const m4 = line.match(/^\s*#{3}\s+(.*)$/u);
            if (m4) {
                matched = true;
                // ignore headings entirely for checklist extraction
            }
        }
        if (!matched) {
            otherLines.push(line);
        }
    }

    const steps = stepLines.map((s, i) => ({ id: `step-${i + 1}`, text: s.text, done: s.done }));
    const textWithoutList = otherLines.join("\n").trim();
    return { steps, textWithoutList };
}


