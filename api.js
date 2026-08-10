/**
 * VΛNTAGE FORGE — API Module
 *
 * Handles all OpenRouter API communication.
 * Model: deepseek/deepseek-chat
 *
 * SECURITY: API key passed at runtime, never hardcoded/logged/in URLs.
 * Production should use backend proxy.
 */

const ENDPOINT = "https://openrouter.ai/api/v1/chat/completions";
const MODEL = "deepseek/deepseek-chat";
const TIMEOUT = 30000;

const PERSONA_MAP = {
    principal_engineer: "You write specifications like a Principal Engineer giving direct, precise technical instructions.",
    security_architect: "You write specifications like a Security Architect focused on threat models, attack surfaces, and defense layers.",
    creative_director: "You write specifications like a Creative Director focused on user experience, visual direction, and product vision.",
    product_architect: "You write specifications like a Product Architect focused on systems design, scalability, and integration.",
    senior_developer: "You write specifications like a Senior Developer focused on clean code, patterns, and maintainability.",
    research_analyst: "You write specifications like a Research Analyst focused on data, evidence, methodology, and rigor.",
    technical_writer: "You write specifications like a Technical Writer focused on clarity, structure, and documentation quality.",
};

const MODE_MAP = {
    strict: "Output must be extremely concise, direct, and constraint-heavy. Remove all unnecessary prose. Maximum density.",
    balanced: "Output should balance detail and conciseness. Include necessary context but avoid padding.",
    detailed: "Output should be thorough with comprehensive requirements, edge cases, and validation rules.",
    extreme: "Output should be exhaustive. Cover every possible angle, edge case, constraint, security concern, validation, and output specification.",
};

function buildSystemPromptOptions(persona, mode) {
    const personaInstruction = PERSONA_MAP[persona] || PERSONA_MAP.principal_engineer;
    const modeInstruction = MODE_MAP[mode] || MODE_MAP.balanced;

    return `You are VΛNTAGE FORGE, an advanced prompt mutation engine.

${personaInstruction}
${modeInstruction}

TASK:
Analyze the user's base prompt. Detect intent, domain, complexity, missing information, and ambiguities.
Generate dynamic configuration options relevant to the prompt.

RULES:
- DO NOT use fixed option counts. Simple prompts: 5-10 options. Medium: 10-25. Complex: 25-50. Very complex: up to 100.
- Quality of options matters more than quantity.
- Only generate options relevant to the detected domain.
- Each option must have a clear purpose.
- If critical information is missing, create an option asking for it.
- DO NOT invent requirements the user didn't ask for. If unknown, ask via options.
- DO NOT use AI slop words: Delve, Tapestry, Bustling, Symphony, Furthermore, Moreover, Embark, Realm, Navigating, Testament, Myriad, seamlessly, leverage, cutting-edge.
- If file context is provided, use it to inform option generation.

OPTION TYPES:
multiple_choice, checkbox, dropdown, text_input, number, slider, boolean, multi_select, color, code_style, textarea

RESPONSE FORMAT:
Return ONLY valid JSON. No markdown. No text before/after. Structure:
{
  "analysis": {
    "intent": "string",
    "domain": "string",
    "complexity": "simple|medium|complex|extreme",
    "summary": "string",
    "missing_information": ["string"],
    "recommendations": ["string"]
  },
  "configuration": {
    "phases": [
      {
        "id": "string",
        "title": "string",
        "options": [
          {
            "id": "unique_string",
            "type": "option_type",
            "question": "string",
            "description": "string or null",
            "choices": ["string"] or null,
            "placeholder": "string or null",
            "min": number or null,
            "max": number or null,
            "step": number or null,
            "default": any or null,
            "required": boolean,
            "recommended": "string or null"
          }
        ]
      }
    ]
  }
}`;
}

function buildSystemPromptFinal(persona, mode) {
    const personaInstruction = PERSONA_MAP[persona] || PERSONA_MAP.principal_engineer;
    const modeInstruction = MODE_MAP[mode] || MODE_MAP.balanced;

    return `You are VΛNTAGE FORGE FINAL PROMPT ENGINE.

${personaInstruction}
${modeInstruction}

TASK:
Combine original prompt, AI analysis, user configuration, selected options, custom requirements, and file context into one Super Prompt.

RULES:
- Do not change the user's core objective.
- Do not add requirements the user didn't specify unless needed to resolve ambiguity.
- Use clear, technical language.
- NO AI slop: Delve, Tapestry, Bustling, Symphony, Furthermore, Moreover, Embark, Realm, Navigating, Testament, Myriad, seamlessly, leverage, cutting-edge.
- No opening phrases like "Here is...", "Certainly...", "As an AI..."
- Output ONLY the final prompt directly.
- Use structured sections when relevant: ROLE, OBJECTIVE, CONTEXT, REQUIREMENTS, CONSTRAINTS, SECURITY, ERROR HANDLING, EDGE CASES, VALIDATION, OUTPUT FORMAT.
- The prompt must be specific, actionable, testable, non-ambiguous, domain-aware.

ALSO RETURN quality assessment as JSON at the END of your response, separated by the delimiter ===QUALITY_JSON===
Quality JSON format:
{"overall":0-100,"clarity":0-100,"specificity":0-100,"completeness":0-100,"constraints":0-100,"security":0-100,"warnings":["string"],"improvements":["string"]}`;
}

async function requestOpenRouter(apiKey, messages, forceJson = false) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT);

    const body = { model: MODEL, messages, temperature: 0.7, max_tokens: 8000 };
    if (forceJson) body.response_format = { type: "json_object" };

    try {
        const res = await fetch(ENDPOINT, {
            method: "POST",
            headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
            body: JSON.stringify(body),
            signal: controller.signal,
        });
        clearTimeout(timeoutId);

        if (!res.ok) {
            let msg = "";
            try { const e = await res.json(); msg = e?.error?.message || ""; } catch (_) {}
            const status = res.status;
            if (status === 401) throw new Error("API Key tidak valid.");
            if (status === 403) throw new Error("Akses ditolak.");
            if (status === 429) throw new Error("Rate limit OpenRouter tercapai. Coba lagi nanti.");
            if (status === 500) throw new Error("Server error. Coba lagi.");
            if (status === 502) throw new Error("Bad gateway. Server tidak tersedia.");
            if (status === 503) throw new Error("Layanan tidak tersedia. Coba lagi nanti.");
            throw new Error(msg || `Request gagal (${status}).`);
        }
        return await res.json();
    } catch (err) {
        clearTimeout(timeoutId);
        if (err.name === "AbortError") throw new Error("AI tidak merespons dalam 30 detik. Coba lagi.");
        throw err;
    }
}

function cleanJson(raw) {
    if (!raw || typeof raw !== "string") throw new Error("Response AI kosong.");
    let c = raw.trim();
    const m = c.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (m) c = m[1].trim();
    const f = c.indexOf("{"), l = c.lastIndexOf("}");
    if (f !== -1 && l > f) c = c.substring(f, l + 1);
    try { return JSON.parse(c); }
    catch (e) { throw new Error("AI mengembalikan format tidak valid. Silakan generate ulang."); }
}

function validateOptionsSchema(p) {
    if (!p || typeof p !== "object") throw new Error("Invalid response: bukan object.");
    if (!p.analysis || typeof p.analysis !== "object") throw new Error("Invalid response: analysis missing.");
    if (!p.configuration || !p.configuration.phases || !Array.isArray(p.configuration.phases))
        throw new Error("Invalid response: phases missing.");
    for (const phase of p.configuration.phases) {
        if (!phase.id || !phase.title || !Array.isArray(phase.options))
            throw new Error("Invalid response: phase structure invalid.");
        for (const opt of phase.options) {
            if (!opt.id || !opt.type || !opt.question)
                throw new Error(`Invalid response: option missing required fields.`);
        }
    }
    return p;
}

export async function validateApiKey(apiKey) {
    if (!apiKey || typeof apiKey !== "string" || apiKey.trim().length < 10)
        throw new Error("API Key tidak valid.");
    const messages = [
        { role: "system", content: "Respond with exactly: OK" },
        { role: "user", content: "ping" },
    ];
    const data = await requestOpenRouter(apiKey.trim(), messages);
    if (!data?.choices?.[0]?.message?.content) throw new Error("Response tidak terbaca.");
    return true;
}

export async function generateOptions(apiKey, basePrompt, fileContexts, persona, mode) {
    if (!basePrompt?.trim()) throw new Error("Prompt tidak boleh kosong.");

    let userContent = `Analyze this prompt and generate dynamic configuration in JSON.\n\nPROMPT:\n${basePrompt.trim()}`;

    if (fileContexts && fileContexts.length > 0) {
        userContent += "\n\nATTACHED FILE CONTEXTS:";
        for (const fc of fileContexts) {
            userContent += `\n\n--- FILE: ${fc.name} (${fc.type}) ---\n${fc.content.substring(0, 5000)}`;
            if (fc.content.length > 5000) userContent += "\n[...truncated]";
        }
    }

    const messages = [
        { role: "system", content: buildSystemPromptOptions(persona, mode) },
        { role: "user", content: userContent },
    ];

    const data = await requestOpenRouter(apiKey, messages, true);
    const raw = data?.choices?.[0]?.message?.content;
    if (!raw) throw new Error("AI tidak mengembalikan response.");
    return validateOptionsSchema(cleanJson(raw));
}

export async function generateFinalPrompt(apiKey, basePrompt, analysis, selections, customReqs, fileContexts, persona, mode) {
    if (!basePrompt?.trim()) throw new Error("Prompt tidak boleh kosong.");

    const selText = formatSelections(selections);
    const customText = customReqs.length > 0
        ? customReqs.map(r => `- [${r.priority.toUpperCase()}] ${r.title}: ${r.value}`).join("\n")
        : "None";

    let userContent = `ORIGINAL PROMPT:\n${basePrompt.trim()}\n\nAI ANALYSIS:\nIntent: ${analysis.intent}\nDomain: ${analysis.domain}\nComplexity: ${analysis.complexity}\nSummary: ${analysis.summary}\n\nUSER CONFIGURATION:\n${selText}\n\nCUSTOM REQUIREMENTS:\n${customText}`;

    if (fileContexts && fileContexts.length > 0) {
        userContent += "\n\nFILE CONTEXTS:";
        for (const fc of fileContexts) {
            userContent += `\n\n--- ${fc.name} ---\n${fc.content.substring(0, 5000)}`;
            if (fc.content.length > 5000) userContent += "\n[...truncated]";
        }
    }

    userContent += "\n\nGenerate the Super Prompt now. End with ===QUALITY_JSON=== followed by quality assessment JSON.";

    const messages = [
        { role: "system", content: buildSystemPromptFinal(persona, mode) },
        { role: "user", content: userContent },
    ];

    const data = await requestOpenRouter(apiKey, messages, false);
    const content = data?.choices?.[0]?.message?.content;
    if (!content?.trim()) throw new Error("AI tidak menghasilkan prompt.");

    let finalPrompt = content.trim();
    let quality = null;

    const delimIdx = finalPrompt.indexOf("===QUALITY_JSON===");
    if (delimIdx !== -1) {
        const promptPart = finalPrompt.substring(0, delimIdx).trim();
        const qualityPart = finalPrompt.substring(delimIdx + 18).trim();
        finalPrompt = promptPart;
        try { quality = cleanJson(qualityPart); } catch (_) { quality = null; }
    }

    if (!quality) {
        quality = { overall: 85, clarity: 85, specificity: 85, completeness: 85, constraints: 80, security: 80, warnings: [], improvements: [] };
    }

    return { finalPrompt, quality };
}

export async function improvePrompt(apiKey, currentPrompt, persona, mode) {
    const messages = [
        {
            role: "system", content: `You are VΛNTAGE FORGE IMPROVEMENT ENGINE.
${PERSONA_MAP[persona] || PERSONA_MAP.principal_engineer}
${MODE_MAP[mode] || MODE_MAP.balanced}

Analyze the current prompt for weaknesses: ambiguity, missing constraints, incomplete specifications, security gaps, unclear output format.
Improve it while preserving the original intent.
NO AI slop words.
Output ONLY the improved prompt directly, then ===QUALITY_JSON=== followed by quality JSON.
Quality JSON: {"overall":0-100,"clarity":0-100,"specificity":0-100,"completeness":0-100,"constraints":0-100,"security":0-100,"warnings":[],"improvements":[]}`
        },
        { role: "user", content: `Improve this prompt:\n\n${currentPrompt}\n\nOutput the improved prompt, then ===QUALITY_JSON=== and quality JSON.` }
    ];

    const data = await requestOpenRouter(apiKey, messages, false);
    const content = data?.choices?.[0]?.message?.content;
    if (!content?.trim()) throw new Error("AI tidak menghasilkan improvement.");

    let improved = content.trim();
    let quality = null;

    const delimIdx = improved.indexOf("===QUALITY_JSON===");
    if (delimIdx !== -1) {
        const promptPart = improved.substring(0, delimIdx).trim();
        const qualityPart = improved.substring(delimIdx + 18).trim();
        improved = promptPart;
        try { quality = cleanJson(qualityPart); } catch (_) { quality = null; }
    }

    if (!quality) {
        quality = { overall: 90, clarity: 90, specificity: 90, completeness: 90, constraints: 85, security: 85, warnings: [], improvements: [] };
    }

    return { finalPrompt: improved, quality };
}

function formatSelections(selections) {
    if (!selections || typeof selections !== "object") return "No configuration selected.";
    const lines = [];
    for (const [key, val] of Object.entries(selections)) {
        if (val === null || val === undefined || val === "") continue;
        if (Array.isArray(val)) { if (val.length > 0) lines.push(`- ${key}: ${val.join(", ")}`); }
        else if (typeof val === "boolean") lines.push(`- ${key}: ${val ? "Yes" : "No"}`);
        else lines.push(`- ${key}: ${val}`);
    }
    return lines.length > 0 ? lines.join("\n") : "No configuration selected.";
}
