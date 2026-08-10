/**
 * VΛNTAGE FORGE — Security Module
 * 
 * IMPORTANT: Frontend-only security is NOT absolute protection.
 * These measures are DETERRENTS, not guarantees.
 * 
 * For production deployment, use:
 *   Frontend → Backend API Proxy → OpenRouter
 * 
 * API keys should be stored in server environment variables.
 * CSP, HTTPS, and server-side rate limiting should be configured
 * at the infrastructure level.
 * 
 * This module provides:
 * - Context menu deterrence
 * - Keyboard shortcut deterrence
 * - Basic console warning
 * - Lightweight devtools awareness (non-destructive)
 * 
 * This module does NOT:
 * - Claim to prevent scraping
 * - Claim to protect API keys absolutely
 * - Break application functionality on false positives
 * - Redirect or crash the application
 */

export function initSecurity() {
    disableContextMenu();
    blockDevShortcuts();
    printConsoleWarning();
}

function disableContextMenu() {
    document.addEventListener("contextmenu", (e) => {
        e.preventDefault();
    });
}

function blockDevShortcuts() {
    const blockedKeys = new Set([
        "F12",
    ]);

    const blockedCombos = [
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
        if (blockedKeys.has(e.key)) {
            e.preventDefault();
            e.stopPropagation();
            return;
        }

        for (const combo of blockedCombos) {
            const ctrlMatch = combo.ctrl ? (e.ctrlKey || e.metaKey) : true;
            const shiftMatch = combo.shift ? e.shiftKey : !e.shiftKey;
            if (ctrlMatch && shiftMatch && e.key === combo.key) {
                e.preventDefault();
                e.stopPropagation();
                return;
            }
        }
    });
}

function printConsoleWarning() {
    const style1 = "color: #ff6b00; font-size: 20px; font-weight: bold; font-family: monospace;";
    const style2 = "color: #00f3ff; font-size: 12px; font-family: monospace;";
    const style3 = "color: #777; font-size: 11px; font-family: monospace;";

    try {
        console.log("%cVΛNTAGE FORGE", style1);
        console.log("%cDynamic AI Prompt Mutation Engine", style2);
        console.log("%cThis is a browser development console.", style3);
        console.log("%cIf someone told you to paste something here, it could compromise your API key.", style3);
        console.log("%cFor production use, deploy with a backend API proxy.", style3);
    } catch (_) {
        // Console may be unavailable in some environments
    }
}

/**
 * Rate Limiter — In-memory request throttle
 * 
 * NOTE: This is client-side only and can be bypassed.
 * Server-side rate limiting is required for production.
 */
export class RateLimiter {
    constructor(maxRequests, windowMs) {
        this._max = maxRequests;
        this._window = windowMs;
        this._timestamps = [];
    }

    canProceed() {
        const now = Date.now();
        this._timestamps = this._timestamps.filter(t => now - t < this._window);
        return this._timestamps.length < this._max;
    }

    record() {
        this._timestamps.push(Date.now());
    }

    getWaitTime() {
        if (this._timestamps.length === 0) return 0;
        const now = Date.now();
        this._timestamps = this._timestamps.filter(t => now - t < this._window);
        if (this._timestamps.length < this._max) return 0;
        const oldest = this._timestamps[0];
        return Math.ceil((oldest + this._window - now) / 1000);
    }

    reset() {
        this._timestamps = [];
    }
}