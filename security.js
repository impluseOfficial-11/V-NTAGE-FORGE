/**
 * VΛNTAGE FORGE — Security Module
 *
 * IMPORTANT: Frontend-only security is deterrence, NOT absolute protection.
 * For production:
 *   Frontend → Backend API Proxy → OpenRouter
 *   API keys in server env vars, not client.
 *   Server-side rate limiting, CSP, HTTPS required.
 */

export function initSecurity() {
    disableContextMenu();
    blockDevShortcuts();
    printConsoleWarning();
}

function disableContextMenu() {
    document.addEventListener("contextmenu", (e) => e.preventDefault());
}

function blockDevShortcuts() {
    const blocked = [
        { key: "F12" },
        { ctrl: true, shift: true, key: "I" },
        { ctrl: true, shift: true, key: "i" },
        { ctrl: true, shift: true, key: "J" },
        { ctrl: true, shift: true, key: "j" },
        { ctrl: true, shift: true, key: "C" },
        { ctrl: true, shift: true, key: "c" },
        { ctrl: true, key: "U" },
        { ctrl: true, key: "u" },
    ];
    document.addEventListener("keydown", (e) => {
        for (const combo of blocked) {
            const keyMatch = e.key === combo.key;
            const ctrlMatch = combo.ctrl ? (e.ctrlKey || e.metaKey) : true;
            const shiftMatch = combo.shift ? e.shiftKey : (!combo.shift || false);
            if (keyMatch && ctrlMatch && (combo.shift ? shiftMatch : !e.shiftKey || !combo.ctrl)) {
                if (combo.ctrl && !(e.ctrlKey || e.metaKey)) continue;
                if (combo.shift && !e.shiftKey) continue;
                e.preventDefault();
                e.stopPropagation();
                return;
            }
        }
        if (e.key === "F12") { e.preventDefault(); e.stopPropagation(); }
    });
}

function printConsoleWarning() {
    try {
        console.log("%cVΛNTAGE FORGE", "color:#ff6b00;font-size:22px;font-weight:bold;font-family:monospace;");
        console.log("%cDynamic AI Prompt Mutation Engine", "color:#00f3ff;font-size:12px;font-family:monospace;");
        console.log("%cIf someone told you to paste something here, it could compromise your API key.", "color:#888;font-size:11px;font-family:monospace;");
        console.log("%cFor production, use a backend API proxy.", "color:#888;font-size:11px;font-family:monospace;");
    } catch (_) {}
}

/**
 * Rate Limiter — Client-side deterrent only.
 * Server-side rate limiting required for production.
 */
export class RateLimiter {
    constructor(maxReq, windowMs) {
        this._max = maxReq;
        this._window = windowMs;
        this._ts = [];
    }
    canProceed() {
        const now = Date.now();
        this._ts = this._ts.filter(t => now - t < this._window);
        return this._ts.length < this._max;
    }
    record() { this._ts.push(Date.now()); }
    getWaitTime() {
        const now = Date.now();
        this._ts = this._ts.filter(t => now - t < this._window);
        if (this._ts.length < this._max) return 0;
        return Math.ceil((this._ts[0] + this._window - now) / 1000);
    }
    reset() { this._ts = []; }
}
