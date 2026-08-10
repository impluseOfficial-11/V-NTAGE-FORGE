/**
 * VΛNTAGE FORGE — Main Application
 * Dynamic AI Prompt Mutation Engine
 *
 * Architecture: Frontend-only demo.
 * Production should use: Frontend → Backend Proxy → OpenRouter
 */

import { validateApiKey, generateOptions, generateFinalPrompt, improvePrompt } from "./api.js";
import { initSecurity, RateLimiter } from "./security.js";

// ================================================================
// STATE
// ================================================================
const state = {
    unlocked: false,
    apiKey: null,
    basePrompt: "",
    outputMode: "balanced",
    persona: "principal_engineer",
    analysis: null,
    phases: [],
    currentPhase: 0,
    selections: {},
    customRequirements: [],
    attachedFiles: [],
    fileContexts: [],
    finalPrompt: "",
    quality: null,
    promptVersions: [],
    currentVersion: -1,
    history: [],
    currentPanel: "dashboard",
    settings: {
        bgVideo: true,
        particles: true,
        cursorGlow: true,
        reducedMotion: false,
    },
};

const rateLimiter = new RateLimiter(3, 60000);

// ================================================================
// DOM CACHE
// ================================================================
const $ = {};
function cacheDom() {
    $.splash = document.getElementById("splash-screen");
    $.splashVideo = document.getElementById("splash-video");
    $.splashLogoContainer = document.getElementById("splash-logo-container");
    $.splashLogoImg = document.getElementById("splash-logo-img");
    $.splashLogoFallback = document.getElementById("splash-logo-fallback");
    $.bgVideo = document.getElementById("bg-video");
    $.particleCanvas = document.getElementById("particle-canvas");
    $.cursorGlow = document.getElementById("cursor-glow");
    $.app = document.getElementById("app");
    $.sidebar = document.getElementById("sidebar");
    $.mobileToggle = document.getElementById("mobile-menu-toggle");
    $.sidebarBackdrop = document.getElementById("sidebar-backdrop");
    $.menuBtns = document.querySelectorAll(".menu-btn");
    $.panels = document.querySelectorAll(".panel");
    $.statusDot = document.getElementById("status-dot");
    $.statusText = document.getElementById("status-text");
    $.apiKeyInput = document.getElementById("api-key-input");
    $.toggleKeyVis = document.getElementById("toggle-key-vis");
    $.rememberToggle = document.getElementById("remember-key-toggle");
    $.validateBtn = document.getElementById("validate-btn");
    $.apiGateMsg = document.getElementById("api-gate-msg");
    $.mainFeature = document.getElementById("main-feature");
    $.outputModeSelector = document.getElementById("output-mode-selector");
    $.personaSelect = document.getElementById("persona-select");
    $.basePrompt = document.getElementById("base-prompt");
    $.charCounter = document.getElementById("char-counter");
    $.charWarning = document.getElementById("char-warning");
    $.startUpgradeBtn = document.getElementById("start-upgrade-btn");
    $.fileDropZone = document.getElementById("file-drop-zone");
    $.fileInput = document.getElementById("file-input");
    $.fileList = document.getElementById("file-list");
    $.fileWarning = document.getElementById("file-warning");
    $.processingSection = document.getElementById("processing-section");
    $.processingStatus = document.getElementById("processing-status");
    $.analysisSection = document.getElementById("analysis-section");
    $.analysisIntent = document.getElementById("analysis-intent");
    $.analysisDomain = document.getElementById("analysis-domain");
    $.analysisComplexity = document.getElementById("analysis-complexity");
    $.analysisText = document.getElementById("analysis-text");
    $.analysisMissing = document.getElementById("analysis-missing");
    $.analysisRecs = document.getElementById("analysis-recommendations");
    $.contextSection = document.getElementById("context-section");
    $.contextItems = document.getElementById("context-items");
    $.configSection = document.getElementById("config-section");
    $.configSubtitle = document.getElementById("config-subtitle");
    $.phaseNav = document.getElementById("phase-nav");
    $.configProgressFill = document.getElementById("config-progress-fill");
    $.configProgressText = document.getElementById("config-progress-text");
    $.optionsGrid = document.getElementById("options-grid");
    $.phasePrev = document.getElementById("phase-prev");
    $.phaseNext = document.getElementById("phase-next");
    $.autoConfigBtn = document.getElementById("auto-configure-btn");
    $.addCustomBtn = document.getElementById("add-custom-btn");
    $.generateFinalBtn = document.getElementById("generate-final-btn");
    $.finalSection = document.getElementById("final-section");
    $.qualitySection = document.getElementById("quality-section");
    $.qualityBarFill = document.getElementById("quality-bar-fill");
    $.qualityScore = document.getElementById("quality-score");
    $.qualityBreakdown = document.getElementById("quality-breakdown");
    $.qualityWarnings = document.getElementById("quality-warnings");
    $.finalPrompt = document.getElementById("final-prompt");
    $.copyBtn = document.getElementById("copy-btn");
    $.editModeBtn = document.getElementById("edit-mode-btn");
    $.improveBtn = document.getElementById("improve-btn");
    $.regenerateBtn = document.getElementById("regenerate-btn");
    $.saveHistoryBtn = document.getElementById("save-history-btn");
    $.exportTxtBtn = document.getElementById("export-txt-btn");
    $.exportJsonBtn = document.getElementById("export-json-btn");
    $.versionHistory = document.getElementById("version-history");
    $.versionList = document.getElementById("version-list");
    $.diffSection = document.getElementById("diff-section");
    $.diffOutput = document.getElementById("diff-output");
    $.historyList = document.getElementById("history-list");
    $.settingsApiStatus = document.getElementById("settings-api-status");
    $.settingsClearKey = document.getElementById("settings-clear-key");
    $.settingsClearHistory = document.getElementById("settings-clear-history");
    $.settingsResetApp = document.getElementById("settings-reset-app");
    $.settingBgVideo = document.getElementById("setting-bg-video");
    $.settingParticles = document.getElementById("setting-particles");
    $.settingCursorGlow = document.getElementById("setting-cursor-glow");
    $.settingReducedMotion = document.getElementById("setting-reduced-motion");
    $.toastContainer = document.getElementById("toast-container");
    $.rateModal = document.getElementById("rate-modal");
    $.rateCountdown = document.getElementById("rate-countdown");
    $.rateModalClose = document.getElementById("rate-modal-close");
    $.customModal = document.getElementById("custom-modal");
    $.customTitle = document.getElementById("custom-title");
    $.customValue = document.getElementById("custom-value");
    $.customPriority = document.getElementById("custom-priority");
    $.customCancel = document.getElementById("custom-cancel");
    $.customSave = document.getElementById("custom-save");
    $.hvModal = document.getElementById("history-view-modal");
    $.hvTitle = document.getElementById("hv-title");
    $.hvTime = document.getElementById("hv-time");
    $.hvBase = document.getElementById("hv-base");
    $.hvFinal = document.getElementById("hv-final");
    $.hvCopy = document.getElementById("hv-copy");
    $.hvUse = document.getElementById("hv-use");
    $.hvClose = document.getElementById("hv-close");
}

// ================================================================
// INIT
// ================================================================
document.addEventListener("DOMContentLoaded", () => {
    cacheDom();
    initSecurity();
    loadHistory();
    loadSettings();
    initSplash();
    initParticles();
    initCursorGlow();
    bindAll();
});

// ================================================================
// SPLASH
// ================================================================
function initSplash() {
    const v = $.splashVideo;
    v.addEventListener("contextmenu", e => e.preventDefault());

    v.addEventListener("ended", () => {
        v.style.display = "none";
        $.splashLogoContainer.style.display = "flex";

        const target = $.splashLogoImg.complete && $.splashLogoImg.naturalWidth > 0
            ? $.splashLogoImg : $.splashLogoFallback;

        if (target === $.splashLogoFallback) {
            $.splashLogoImg.style.display = "none";
            $.splashLogoFallback.style.display = "block";
        }

        target.classList.add("splash-anim-in");

        setTimeout(() => {
            target.classList.remove("splash-anim-in");
            target.classList.add("splash-anim-hold");
            setTimeout(() => {
                target.classList.remove("splash-anim-hold");
                target.classList.add("splash-anim-out");
                setTimeout(() => {
                    $.splash.remove();
                    document.body.classList.add("loaded");
                    $.app.classList.remove("app-hidden");
                    $.app.classList.add("app-visible");
                    animateEntrance();
                    checkStoredApiKey();
                }, 1000);
            }, 2000);
        }, 1500);
    });

    v.addEventListener("error", () => {
        setTimeout(() => {
            if ($.splash?.parentNode) {
                $.splash.remove();
                document.body.classList.add("loaded");
                $.app.classList.remove("app-hidden");
                $.app.classList.add("app-visible");
                animateEntrance();
                checkStoredApiKey();
            }
        }, 1500);
    });
}

function animateEntrance() {
    const targets = document.querySelectorAll(".anim-target");
    targets.forEach((el, i) => {
        const delay = parseInt(el.dataset.animDelay || "0") + i * 60;
        setTimeout(() => el.classList.add("anim-visible"), delay);
    });
}

// ================================================================
// PARTICLES
// ================================================================
let particleCtx, particles = [], particleRAF;
function initParticles() {
    const canvas = $.particleCanvas;
    particleCtx = canvas.getContext("2d");
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);
    for (let i = 0; i < 40; i++) particles.push(createParticle(canvas));
    animateParticles();
    document.addEventListener("visibilitychange", () => {
        if (document.hidden) cancelAnimationFrame(particleRAF);
        else animateParticles();
    });
}

function resizeCanvas() {
    $.particleCanvas.width = window.innerWidth;
    $.particleCanvas.height = window.innerHeight;
}

function createParticle(canvas) {
    return {
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        r: Math.random() * 1.5 + 0.5,
        o: Math.random() * 0.3 + 0.05,
    };
}

function animateParticles() {
    if (!state.settings.particles || state.settings.reducedMotion) {
        particleCtx.clearRect(0, 0, $.particleCanvas.width, $.particleCanvas.height);
        return;
    }
    const ctx = particleCtx, w = $.particleCanvas.width, h = $.particleCanvas.height;
    ctx.clearRect(0, 0, w, h);
    for (const p of particles) {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0) p.x = w; if (p.x > w) p.x = 0;
        if (p.y < 0) p.y = h; if (p.y > h) p.y = 0;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,107,0,${p.o})`;
        ctx.fill();
    }
    particleRAF = requestAnimationFrame(animateParticles);
}

// ================================================================
// CURSOR GLOW
// ================================================================
function initCursorGlow() {
    if (window.matchMedia("(pointer:coarse)").matches) return;
    document.addEventListener("mousemove", (e) => {
        if (!state.settings.cursorGlow || state.settings.reducedMotion) {
            $.cursorGlow.classList.remove("active");
            return;
        }
        $.cursorGlow.style.left = e.clientX + "px";
        $.cursorGlow.style.top = e.clientY + "px";
        $.cursorGlow.classList.add("active");
    });
    document.addEventListener("mouseleave", () => $.cursorGlow.classList.remove("active"));
}

// ================================================================
// BIND
// ================================================================
function bindAll() {
    // Sidebar
    $.menuBtns.forEach(b => b.addEventListener("click", () => { switchPanel(b.dataset.panel); closeMobile(); }));
    $.mobileToggle.addEventListener("click", () => { $.sidebar.classList.toggle("sidebar-open"); $.sidebarBackdrop.classList.toggle("show"); });
    $.sidebarBackdrop.addEventListener("click", closeMobile);

    // API Key
    $.toggleKeyVis.addEventListener("click", () => {
        const isPass = $.apiKeyInput.type === "password";
        $.apiKeyInput.type = isPass ? "text" : "password";
    });
    $.validateBtn.addEventListener("click", handleValidate);
    $.apiKeyInput.addEventListener("keydown", e => { if (e.key === "Enter") handleValidate(); });

    // Prompt
    let debounce = null;
    $.basePrompt.addEventListener("input", () => {
        clearTimeout(debounce);
        debounce = setTimeout(() => {
            state.basePrompt = $.basePrompt.value;
            updateCharCounter();
            updateUpgradeBtn();
        }, 300);
    });

    // Output mode
    $.outputModeSelector.addEventListener("click", (e) => {
        const btn = e.target.closest(".mode-btn");
        if (!btn) return;
        $.outputModeSelector.querySelectorAll(".mode-btn").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        state.outputMode = btn.dataset.mode;
    });
    $.personaSelect.addEventListener("change", () => { state.persona = $.personaSelect.value; });

    // Files
    $.fileDropZone.addEventListener("click", () => $.fileInput.click());
    $.fileDropZone.addEventListener("keydown", e => { if (e.key === "Enter" || e.key === " ") $.fileInput.click(); });
    $.fileInput.addEventListener("change", handleFileSelect);
    $.fileDropZone.addEventListener("dragover", e => { e.preventDefault(); $.fileDropZone.classList.add("drag-over"); });
    $.fileDropZone.addEventListener("dragleave", () => $.fileDropZone.classList.remove("drag-over"));
    $.fileDropZone.addEventListener("drop", e => { e.preventDefault(); $.fileDropZone.classList.remove("drag-over"); handleFileDrop(e.dataTransfer.files); });

    // Start upgrade
    $.startUpgradeBtn.addEventListener("click", handleStartUpgrade);

    // Phase nav
    $.phasePrev.addEventListener("click", () => { if (state.currentPhase > 0) { state.currentPhase--; renderPhase(); } });
    $.phaseNext.addEventListener("click", () => { if (state.currentPhase < state.phases.length - 1) { state.currentPhase++; renderPhase(); } });
    $.autoConfigBtn.addEventListener("click", handleAutoConfig);
    $.addCustomBtn.addEventListener("click", () => $.customModal.classList.remove("hidden"));
    $.generateFinalBtn.addEventListener("click", handleGenerateFinal);

    // Custom modal
    $.customCancel.addEventListener("click", () => $.customModal.classList.add("hidden"));
    $.customSave.addEventListener("click", handleSaveCustom);

    // Final actions
    $.copyBtn.addEventListener("click", handleCopy);
    $.editModeBtn.addEventListener("click", handleEditMode);
    $.improveBtn.addEventListener("click", handleImprove);
    $.regenerateBtn.addEventListener("click", handleGenerateFinal);
    $.saveHistoryBtn.addEventListener("click", handleSaveHistory);
    $.exportTxtBtn.addEventListener("click", handleExportTxt);
    $.exportJsonBtn.addEventListener("click", handleExportJson);

    // Rate modal
    $.rateModalClose.addEventListener("click", () => $.rateModal.classList.add("hidden"));

    // Settings
    $.settingsClearKey.addEventListener("click", handleClearKey);
    $.settingsClearHistory.addEventListener("click", handleClearHistory);
    $.settingsResetApp.addEventListener("click", handleResetApp);
    $.settingBgVideo.addEventListener("change", () => { state.settings.bgVideo = $.settingBgVideo.checked; applySettings(); saveSettings(); });
    $.settingParticles.addEventListener("change", () => { state.settings.particles = $.settingParticles.checked; applySettings(); saveSettings(); });
    $.settingCursorGlow.addEventListener("change", () => { state.settings.cursorGlow = $.settingCursorGlow.checked; applySettings(); saveSettings(); });
    $.settingReducedMotion.addEventListener("change", () => { state.settings.reducedMotion = $.settingReducedMotion.checked; applySettings(); saveSettings(); });

    // History view modal
    $.hvCopy.addEventListener("click", () => copyText($.hvFinal.value));
    $.hvClose.addEventListener("click", () => $.hvModal.classList.add("hidden"));

    // Videos
    document.querySelectorAll("video").forEach(v => v.addEventListener("contextmenu", e => e.preventDefault()));
}

function closeMobile() { $.sidebar.classList.remove("sidebar-open"); $.sidebarBackdrop.classList.remove("show"); }

// ================================================================
// PANEL SWITCH
// ================================================================
function switchPanel(name) {
    state.currentPanel = name;
    $.menuBtns.forEach(b => { b.classList.toggle("active", b.dataset.panel === name); b.setAttribute("aria-current", b.dataset.panel === name ? "page" : "false"); });
    $.panels.forEach(p => p.classList.toggle("active", p.dataset.panel === name));
    if (name === "history") renderHistory();
    if (name === "settings") updateSettings();
}

// ================================================================
// STATUS / TOAST
// ================================================================
function setStatus(type, text) { $.statusDot.className = `status-dot s-${type}`; $.statusText.textContent = text; }

function toast(msg, type = "info", dur = 4000) {
    const t = document.createElement("div");
    t.className = `toast t-${type}`;
    t.textContent = msg;
    $.toastContainer.appendChild(t);
    setTimeout(() => { t.classList.add("toast-out"); setTimeout(() => t.remove(), 300); }, dur);
}

// ================================================================
// BUTTON LOADING
// ================================================================
function setBtnLoading(btn, loading) {
    const text = btn.querySelector(".btn-text") || btn.querySelector(".btn-content");
    const spin = btn.querySelector(".btn-spinner");
    btn.disabled = loading;
    if (text) text.style.opacity = loading ? "0.4" : "1";
    if (spin) spin.classList.toggle("hidden", !loading);
}

// ================================================================
// API KEY
// ================================================================
function checkStoredApiKey() {
    try {
        const k = localStorage.getItem("vf_key");
        if (k && k.length > 10) { $.apiKeyInput.value = k; $.rememberToggle.checked = true; }
    } catch (_) {}
}

async function handleValidate() {
    const key = $.apiKeyInput.value.trim();
    if (!key) { showGateMsg("Masukkan API Key.", "error"); return; }
    setBtnLoading($.validateBtn, true);
    showGateMsg("Validating...", "");
    setStatus("processing", "VALIDATING...");
    try {
        await validateApiKey(key);
        state.apiKey = key;
        state.unlocked = true;
        if ($.rememberToggle.checked) { try { localStorage.setItem("vf_key", key); } catch (_) {} }
        else { try { localStorage.removeItem("vf_key"); } catch (_) {} }
        showGateMsg("API Key valid. Engine unlocked.", "success");
        setStatus("connected", "API CONNECTED");
        toast("VΛNTAGE FORGE unlocked.", "success");
        $.mainFeature.classList.remove("main-feature-hidden");
        $.mainFeature.classList.add("main-feature-visible");
        setTimeout(() => { $.mainFeature.querySelectorAll(".anim-target").forEach((el, i) => setTimeout(() => el.classList.add("anim-visible"), i * 80)); }, 100);
        updateSettings();
    } catch (err) {
        showGateMsg(err.message, "error");
        setStatus("error", "VALIDATION FAILED");
        toast(err.message, "error");
    } finally { setBtnLoading($.validateBtn, false); }
}

function showGateMsg(msg, type) { $.apiGateMsg.textContent = msg; $.apiGateMsg.className = "gate-msg" + (type ? ` ${type}` : ""); }

// ================================================================
// CHAR COUNTER
// ================================================================
function updateCharCounter() {
    const l = state.basePrompt.length;
    $.charCounter.textContent = `${l} character${l !== 1 ? "s" : ""}`;
    $.charWarning.classList.toggle("hidden", l <= 10000);
}

function updateUpgradeBtn() { $.startUpgradeBtn.disabled = state.basePrompt.trim().length === 0; }

// ================================================================
// FILE HANDLING
// ================================================================
const ALLOWED_EXT = [".txt",".md",".json",".csv",".html",".css",".js",".ts",".py",".java",".php",".sql",".xml"];

function handleFileSelect(e) { handleFileDrop(e.target.files); $.fileInput.value = ""; }

function handleFileDrop(files) {
    for (const file of files) {
        const ext = "." + file.name.split(".").pop().toLowerCase();
        if (!ALLOWED_EXT.includes(ext)) { toast(`File type ${ext} not supported.`, "warning"); 
