

function getEnv(name, { required = true } = {}) {
    const value = import.meta.env[name];
    if (required && (!value || typeof value !== "string")) {
        throw new Error(`Missing required env: ${name}`);
    }
    return value;
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
            text = parsed.textWithoutList; // avoid rendering duplicates
        }
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
        text: s.text ?? String(s),
        done: Boolean(s.done),
    }));
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
            // 2) Bulleted list
            const m2 = line.match(/^\s*[-*]\s+(.*)$/u);
            if (m2) {
                matched = true;
                stepLines.push({ text: m2[1].trim(), done: false });
            }
        }
        if (!matched) {
            // 3) Numbered list
            const m3 = line.match(/^\s*\d+[\.)]\s+(.*)$/u);
            if (m3) {
                matched = true;
                stepLines.push({ text: m3[1].trim(), done: false });
            }
        }
        if (!matched) {
            // 4) ### heading as a step
            const m4 = line.match(/^\s*#{3}\s+(.*)$/u);
            if (m4) {
                matched = true;
                const headingText = m4[1].trim();
                if (headingText.length > 0) {
                    stepLines.push({ text: headingText, done: false });
                }
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


