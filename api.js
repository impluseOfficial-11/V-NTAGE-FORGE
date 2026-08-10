/**
 * VΛNTAGE FORGE — API Module
 * 
 * Handles all communication with OpenRouter API.
 * Uses deepseek/deepseek-chat model.
 * 
 * SECURITY NOTE:
 * - API key is passed at runtime, never hardcoded
 * - API key is never logged to console
 * - API key is never placed in URLs
 * - For production, use a backend proxy:
 *     Frontend → Backend Proxy → OpenRouter
 *   so the API key stays on the server.
 */

const OPENROUTER_ENDPOINT = "https://openrouter.ai/api/v1/chat/completions";
const MODEL = "deepseek/deepseek-chat";
const TIMEOUT_MS = 30000;

/**
 * System prompt for generating dynamic configuration options
 */
const SYSTEM_PROMPT_OPTIONS = `Kamu adalah VΛNTAGE FORGE, mesin mutator prompt tingkat Principal Engineer.

Tugas utama:
Menerima prompt dasar user, menganalisis tujuan, konteks, kekurangan, ambiguitas, kompleksitas, kebutuhan teknis, kebutuhan keamanan, dan kebutuhan output.

Kemudian buat konfigurasi dinamis yang benar-benar relevan dengan prompt.

JANGAN menggunakan jumlah opsi tetap.

Jika prompt sederhana, gunakan opsi secukupnya (5-10).
Jika prompt menengah, gunakan 10-30 opsi.
Jika prompt kompleks, gunakan 30-70 opsi.
Jika prompt sangat kompleks, gunakan sampai maksimal 100 opsi.

Setiap opsi harus memiliki tujuan yang jelas.

Jenis opsi yang tersedia:
- multiple_choice: pilihan tunggal dari beberapa opsi (gunakan field "choices" berupa array string)
- checkbox: pilihan ganda dari beberapa opsi (gunakan field "choices" berupa array string)
- dropdown: pilihan tunggal dalam dropdown (gunakan field "choices" berupa array string)
- text_input: input teks bebas (gunakan field "placeholder" berupa string)
- number: input angka (gunakan field "min", "max", "default" berupa angka)
- slider: slider angka (gunakan field "min", "max", "step", "default" berupa angka)
- boolean: pilihan ya/tidak (gunakan field "default" berupa boolean)
- multi_select: pilihan ganda seperti checkbox tapi ditampilkan berbeda (gunakan field "choices" berupa array string)
- color: color picker (gunakan field "default" berupa string hex color)
- code_style: pilihan gaya kode (gunakan field "choices" berupa array string)

ATURAN:
1. Jangan menghasilkan AI Slop.
2. Jangan gunakan kata: Delve, Tapestry, Bustling, Symphony, In conclusion, Furthermore, Moreover, Embark, Realm, Navigating, Testament, Myriad.
3. Jangan menggunakan basa-basi.
4. Jangan menjelaskan proses secara berlebihan.
5. Jangan menambahkan requirement yang tidak berhubungan dengan tujuan user.
6. Jangan mengarang detail yang tidak diketahui.
7. Jika informasi penting belum tersedia, buat opsi konfigurasi untuk meminta user menentukan informasi tersebut.

KETIKA DIMINTA GENERATE OPTIONS:
WAJIB mengembalikan JSON valid SAJA.
Jangan menggunakan Markdown code block.
Jangan memberikan teks pembuka.
Jangan memberikan teks penutup.
Hanya JSON murni.

Format yang WAJIB dikembalikan:
{"analysis":"...","complexity":"simple|medium|complex|extreme","options":[{"id":1,"type":"...","question":"...","choices":[],"placeholder":"","min":0,"max":100,"step":1,"default":null}]}

Pastikan setiap option memiliki minimal: id (number), type (string), question (string).
Field lain sesuai tipe option.`;

/**
 * System prompt for generating the final super prompt
 */
const SYSTEM_PROMPT_FINAL = `Kamu adalah VΛNTAGE FORGE FINAL PROMPT ENGINE.

Gabungkan:
1. Original Prompt
2. Prompt Analysis
3. User Configuration
4. Selected Options
5. Custom Inputs

menjadi satu Super Prompt.

Jangan mengubah tujuan utama user.
Jangan menambahkan requirement yang tidak diminta kecuali diperlukan untuk menghilangkan ambiguity.
Gunakan bahasa teknis yang jelas.
Hilangkan AI Slop.

Jangan gunakan kata-kata ini: Delve, Tapestry, Bustling, Symphony, In conclusion, Furthermore, Moreover, Embark, Realm, Navigating, Testament, Myriad.

Jangan menggunakan pembukaan seperti: "Berikut adalah...", "tentu saja...", "sebagai AI..."

Output harus langsung berupa final prompt tanpa pembukaan atau penutup.

Gunakan struktur teknis apabila relevan:
ROLE:
OBJECTIVE:
CONTEXT:
REQUIREMENTS:
CONSTRAINTS:
SECURITY:
ERROR HANDLING:
EDGE CASES:
VALIDATION:
OUTPUT FORMAT:

Jika struktur tersebut tidak relevan, gunakan struktur yang lebih sesuai.
Final prompt harus terasa seperti spesifikasi yang ditulis oleh Principal Engineer atau Senior Technical Architect.`;


/**
 * Core request function with timeout via AbortController
 */
async function requestOpenRouter(apiKey, messages, forceJson = false) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

    const body = {
        model: MODEL,
        messages: messages,
        temperature: 0.7,
        max_tokens: 8000,
    };

    if (forceJson) {
        body.response_format = { type: "json_object" };
    }

    try {
        const response = await fetch(OPENROUTER_ENDPOINT, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${apiKey}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify(body),
            signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
            const status = response.status;
            let errorMsg = "";
            try {
                const errBody = await response.json();
                errorMsg = errBody?.error?.message || "";
            } catch (_) {
                // ignore parse error
            }

            switch (status) {
                case 401: throw new Error("API Key tidak valid. Periksa kembali key Anda.");
                case 403: throw new Error("Akses ditolak. API Key mungkin tidak memiliki izin.");
                case 429: throw new Error("Rate limit tercapai di OpenRouter. Coba lagi nanti.");
                case 500: throw new Error("Server OpenRouter mengalami error internal. Coba lagi.");
                case 502: throw new Error("Bad gateway. Server OpenRouter tidak tersedia.");
                case 503: throw new Error("Layanan OpenRouter sedang tidak tersedia. Coba lagi nanti.");
                default: throw new Error(errorMsg || `Request gagal dengan status ${status}.`);
            }
        }

        const data = await response.json();
        return data;

    } catch (err) {
        clearTimeout(timeoutId);
        if (err.name === "AbortError") {
            throw new Error("AI tidak merespons dalam 30 detik. Coba lagi.");
        }
        throw err;
    }
}

/**
 * Validate API key by making a minimal request
 */
export async function validateApiKey(apiKey) {
    if (!apiKey || typeof apiKey !== "string" || apiKey.trim().length < 10) {
        throw new Error("API Key tidak valid. Masukkan key yang benar.");
    }

    const messages = [
        { role: "system", content: "Respond with exactly: OK" },
        { role: "user", content: "ping" },
    ];

    const data = await requestOpenRouter(apiKey.trim(), messages);

    const content = data?.choices?.[0]?.message?.content;
    if (!content) {
        throw new Error("API Key valid tetapi response tidak terbaca. Coba lagi.");
    }

    return true;
}

/**
 * Clean JSON from potential markdown wrappers
 */
function cleanJsonResponse(raw) {
    if (!raw || typeof raw !== "string") {
        throw new Error("Response AI kosong.");
    }

    let cleaned = raw.trim();

    // Remove ```json ... ``` wrappers
    const jsonBlockMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonBlockMatch) {
        cleaned = jsonBlockMatch[1].trim();
    }

    // Try to find JSON object boundaries if still wrapped in text
    const firstBrace = cleaned.indexOf("{");
    const lastBrace = cleaned.lastIndexOf("}");
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
        cleaned = cleaned.substring(firstBrace, lastBrace + 1);
    }

    try {
        return JSON.parse(cleaned);
    } catch (e) {
        throw new Error("AI mengembalikan format tidak valid. Silakan generate ulang.");
    }
}

/**
 * Validate the options response schema
 */
function validateOptionsResponse(parsed) {
    if (!parsed || typeof parsed !== "object") {
        throw new Error("Invalid AI response: bukan object.");
    }
    if (typeof parsed.analysis !== "string" || parsed.analysis.length === 0) {
        throw new Error("Invalid AI response: analysis tidak ditemukan.");
    }
    if (!Array.isArray(parsed.options)) {
        throw new Error("Invalid AI response: options bukan array.");
    }
    for (let i = 0; i < parsed.options.length; i++) {
        const opt = parsed.options[i];
        if (typeof opt.id === "undefined") {
            throw new Error(`Invalid AI response: option ${i} tidak memiliki id.`);
        }
        if (typeof opt.type !== "string") {
            throw new Error(`Invalid AI response: option ${opt.id} tidak memiliki type.`);
        }
        if (typeof opt.question !== "string") {
            throw new Error(`Invalid AI response: option ${opt.id} tidak memiliki question.`);
        }
    }
    return parsed;
}

/**
 * Generate dynamic options based on user's base prompt
 */
export async function generateOptions(apiKey, basePrompt) {
    if (!basePrompt || basePrompt.trim().length === 0) {
        throw new Error("Prompt tidak boleh kosong.");
    }

    const messages = [
        { role: "system", content: SYSTEM_PROMPT_OPTIONS },
        {
            role: "user",
            content: `Analisis prompt berikut dan hasilkan konfigurasi dinamis dalam format JSON.\n\nPROMPT:\n${basePrompt.trim()}`
        },
    ];

    const data = await requestOpenRouter(apiKey, messages, true);
    const rawContent = data?.choices?.[0]?.message?.content;

    if (!rawContent) {
        throw new Error("AI tidak mengembalikan response. Coba lagi.");
    }

    const parsed = cleanJsonResponse(rawContent);
    return validateOptionsResponse(parsed);
}

/**
 * Generate the final super prompt
 */
export async function generateFinalPrompt(apiKey, basePrompt, analysis, selections) {
    if (!basePrompt || basePrompt.trim().length === 0) {
        throw new Error("Prompt tidak boleh kosong.");
    }

    const configSummary = formatSelectionsForAI(selections);

    const messages = [
        { role: "system", content: SYSTEM_PROMPT_FINAL },
        {
            role: "user",
            content: `ORIGINAL PROMPT:\n${basePrompt.trim()}\n\nAI ANALYSIS:\n${analysis}\n\nUSER CONFIGURATION:\n${configSummary}\n\nBuatkan Super Prompt berdasarkan semua informasi di atas. Output HANYA final prompt, tanpa pembukaan atau penutup.`
        },
    ];

    const data = await requestOpenRouter(apiKey, messages, false);
    const content = data?.choices?.[0]?.message?.content;

    if (!content || content.trim().length === 0) {
        throw new Error("AI tidak menghasilkan final prompt. Coba lagi.");
    }

    return content.trim();
}

/**
 * Format user selections into readable text for AI
 */
function formatSelectionsForAI(selections) {
    if (!selections || typeof selections !== "object") return "Tidak ada konfigurasi dipilih.";

    const lines = [];
    for (const [key, value] of Object.entries(selections)) {
        if (value === null || value === undefined || value === "") continue;

        if (Array.isArray(value)) {
            if (value.length > 0) {
                lines.push(`- ${key}: ${value.join(", ")}`);
            }
        } else if (typeof value === "boolean") {
            lines.push(`- ${key}: ${value ? "Ya" : "Tidak"}`);
        } else {
            lines.push(`- ${key}: ${value}`);
        }
    }

    return lines.length > 0 ? lines.join("\n") : "Tidak ada konfigurasi dipilih.";
}