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
        if (!ALLOWED_EXT.includes(ext)) { toast(`File type ${ext} not supported.`, "warning"); continue; }
        if (file.size > 500000) { toast(`${file.name} too large (max 500KB).`, "warning"); continue; }
        if (state.attachedFiles.some(f => f.name === file.name)) continue;
        state.attachedFiles.push(file);
        readFileContent(file);
    }
    renderFileList();
    if (state.attachedFiles.length > 0) $.fileWarning.classList.remove("hidden");
}

function readFileContent(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
        state.fileContexts.push({ name: file.name, type: file.type || "text/plain", content: e.target.result });
    };
    reader.readAsText(file);
}

function renderFileList() {
    $.fileList.innerHTML = "";
    for (const file of state.attachedFiles) {
        const item = document.createElement("div");
        item.className = "file-item";
        item.innerHTML = `<div class="file-item-info"><span class="file-item-name">${escapeHtml(file.name)}</span><span class="file-item-size">${formatBytes(file.size)}</span></div>`;
        const rm = document.createElement("button");
        rm.className = "file-remove";
        rm.type = "button";
        rm.textContent = "×";
        rm.setAttribute("aria-label", `Remove ${file.name}`);
        rm.addEventListener("click", () => {
            state.attachedFiles = state.attachedFiles.filter(f => f.name !== file.name);
            state.fileContexts = state.fileContexts.filter(f => f.name !== file.name);
            renderFileList();
            if (state.attachedFiles.length === 0) $.fileWarning.classList.add("hidden");
        });
        item.appendChild(rm);
        $.fileList.appendChild(item);
    }
}

function formatBytes(b) { if (b < 1024) return b + " B"; return (b / 1024).toFixed(1) + " KB"; }

// ================================================================
// PROCESSING PHASES (UI animation)
// ================================================================
const PROCESSING_PHASES = [
    "ANALYZING INTENT", "DETECTING DOMAIN", "EVALUATING COMPLEXITY",
    "IDENTIFYING GAPS", "BUILDING CONFIGURATION", "VALIDATING OPTIONS"
];

function showProcessing() {
    $.processingSection.classList.remove("hidden");
    $.analysisSection.classList.add("hidden");
    $.configSection.classList.add("hidden");
    $.contextSection.classList.add("hidden");
    $.finalSection.classList.add("hidden");

    let idx = 0;
    const interval = setInterval(() => {
        idx++;
        if (idx < PROCESSING_PHASES.length) $.processingStatus.textContent = PROCESSING_PHASES[idx];
        else clearInterval(interval);
    }, 1800);
    return interval;
}

// ================================================================
// START UPGRADE
// ================================================================
async function handleStartUpgrade() {
    if (!state.unlocked || !state.apiKey) { toast("Validate API Key first.", "warning"); return; }
    const prompt = state.basePrompt.trim();
    if (!prompt) { toast("Enter a prompt first.", "warning"); return; }
    if (!rateLimiter.canProceed()) { showRateModal(); return; }

    setBtnLoading($.startUpgradeBtn, true);
    setStatus("processing", "ANALYZING PROMPT...");
    const procInterval = showProcessing();

    try {
        rateLimiter.record();
        const result = await generateOptions(state.apiKey, prompt, state.fileContexts, state.persona, state.outputMode);

        clearInterval(procInterval);
        $.processingSection.classList.add("hidden");

        state.analysis = result.analysis;
        state.phases = result.configuration.phases;
        state.currentPhase = 0;
        state.selections = {};
        state.customRequirements = [];
        state.promptVersions = [];
        state.currentVersion = -1;

        initSelections();
        renderAnalysis();
        renderContextStack();
        renderPhaseNav();
        renderPhase();

        $.analysisSection.classList.remove("hidden");
        $.contextSection.classList.remove("hidden");
        $.configSection.classList.remove("hidden");

        setStatus("complete", "ANALYSIS COMPLETE");
        const totalOpts = state.phases.reduce((s, p) => s + p.options.length, 0);
        toast(`Analysis complete. ${totalOpts} options generated.`, "success");
    } catch (err) {
        clearInterval(procInterval);
        $.processingSection.classList.add("hidden");
        setStatus("error", "ANALYSIS FAILED");
        toast(err.message, "error");
    } finally { setBtnLoading($.startUpgradeBtn, false); }
}

// ================================================================
// INIT SELECTIONS
// ================================================================
function initSelections() {
    state.selections = {};
    for (const phase of state.phases) {
        for (const opt of phase.options) {
            const k = opt.id;
            switch (opt.type) {
                case "multiple_choice": case "dropdown": case "code_style":
                    state.selections[k] = opt.default || null; break;
                case "checkbox": case "multi_select":
                    state.selections[k] = []; break;
                case "text_input": case "textarea":
                    state.selections[k] = opt.default || ""; break;
                case "number":
                    state.selections[k] = opt.default ?? (opt.min ?? 0); break;
                case "slider":
                    state.selections[k] = opt.default ?? (opt.min ?? 50); break;
                case "boolean":
                    state.selections[k] = opt.default ?? false; break;
                case "color":
                    state.selections[k] = opt.default || "#ff6b00"; break;
                default:
                    state.selections[k] = opt.default || null;
            }
        }
    }
}

// ================================================================
// RENDER ANALYSIS
// ================================================================
function renderAnalysis() {
    const a = state.analysis;
    $.analysisIntent.textContent = a.intent || "—";
    $.analysisDomain.textContent = a.domain || "—";
    $.analysisComplexity.textContent = (a.complexity || "—").toUpperCase();
    $.analysisText.textContent = a.summary || "—";

    $.analysisMissing.innerHTML = "";
    if (a.missing_information?.length > 0) {
        for (const m of a.missing_information) {
            const d = document.createElement("div");
            d.className = "analysis-list-item";
            d.textContent = m;
            $.analysisMissing.appendChild(d);
        }
    } else { $.analysisMissing.textContent = "None detected"; }

    $.analysisRecs.innerHTML = "";
    if (a.recommendations?.length > 0) {
        for (const r of a.recommendations) {
            const d = document.createElement("div");
            d.className = "analysis-list-item";
            d.textContent = r;
            $.analysisRecs.appendChild(d);
        }
    } else { $.analysisRecs.textContent = "None"; }
}

// ================================================================
// CONTEXT STACK
// ================================================================
function renderContextStack() {
    $.contextItems.innerHTML = "";
    addContextItem("PROMPT", state.basePrompt.substring(0, 80) + (state.basePrompt.length > 80 ? "..." : ""));
    for (const f of state.fileContexts) addContextItem("FILE", f.name);
    if (state.analysis) addContextItem("ANALYSIS", `${state.analysis.domain} — ${state.analysis.complexity}`);
    for (const cr of state.customRequirements) addContextItem("CUSTOM", cr.title);
}

function addContextItem(badge, text) {
    const d = document.createElement("div");
    d.className = "context-item";
    d.innerHTML = `<span class="context-badge">${escapeHtml(badge)}</span><span class="context-text">${escapeHtml(text)}</span>`;
    $.contextItems.appendChild(d);
}

// ================================================================
// PHASE NAVIGATION
// ================================================================
function renderPhaseNav() {
    $.phaseNav.innerHTML = "";
    state.phases.forEach((p, i) => {
        const tab = document.createElement("button");
        tab.className = "phase-tab" + (i === state.currentPhase ? " active" : "");
        tab.type = "button";
        tab.textContent = p.title;
        tab.addEventListener("click", () => { state.currentPhase = i; renderPhase(); });
        $.phaseNav.appendChild(tab);
    });
}

function renderPhase() {
    const phase = state.phases[state.currentPhase];
    if (!phase) return;

    // Update tabs
    $.phaseNav.querySelectorAll(".phase-tab").forEach((t, i) => t.classList.toggle("active", i === state.currentPhase));

    // Progress
    const totalOpts = state.phases.reduce((s, p) => s + p.options.length, 0);
    const filled = Object.entries(state.selections).filter(([_, v]) => {
        if (v === null || v === undefined || v === "") return false;
        if (Array.isArray(v) && v.length === 0) return false;
        return true;
    }).length;
    $.configProgressFill.style.width = totalOpts > 0 ? `${(filled / totalOpts) * 100}%` : "0%";
    $.configProgressText.textContent = `${filled} / ${totalOpts}`;

    // Nav buttons
    $.phasePrev.disabled = state.currentPhase === 0;
    $.phaseNext.disabled = state.currentPhase >= state.phases.length - 1;

    // Show generate on last phase
    const isLast = state.currentPhase === state.phases.length - 1;
    $.generateFinalBtn.classList.toggle("hidden", !isLast);

    // Render options
    const frag = document.createDocumentFragment();
    phase.options.forEach((opt, i) => {
        const card = buildOptionCard(opt, i);
        card.style.animationDelay = `${i * 40}ms`;
        frag.appendChild(card);
    });
    $.optionsGrid.innerHTML = "";
    $.optionsGrid.appendChild(frag);
}

// ================================================================
// OPTION CARD
// ================================================================
function buildOptionCard(opt, idx) {
    const card = document.createElement("div");
    card.className = "option-card";
    card.dataset.optId = opt.id;

    let html = `<div class="option-header"><span class="option-number">#${idx + 1}</span><span class="option-question">${escapeHtml(opt.question)}</span></div>`;
    if (opt.description) html += `<div class="option-desc">${escapeHtml(opt.description)}</div>`;
    html += `<div class="option-body" id="opt-body-${opt.id}"></div>`;
    if (opt.recommended) html += `<div class="option-rec">${escapeHtml(opt.recommended)}</div>`;

    card.innerHTML = html;
    const body = card.querySelector(`#opt-body-${opt.id}`);

    switch (opt.type) {
        case "multiple_choice": case "code_style": body.appendChild(buildRadioGroup(opt)); break;
        case "checkbox": case "multi_select": body.appendChild(buildCheckboxGroup(opt)); break;
        case "dropdown": body.appendChild(buildDropdown(opt)); break;
        case "text_input": body.appendChild(buildTextInput(opt)); break;
        case "textarea": body.appendChild(buildTextarea(opt)); break;
        case "number": body.appendChild(buildNumberInput(opt)); break;
        case "slider": body.appendChild(buildSlider(opt)); break;
        case "boolean": body.appendChild(buildBoolean(opt)); break;
        case "color": body.appendChild(buildColorPicker(opt)); break;
        default: body.appendChild(buildTextInput(opt));
    }

    return card;
}

function buildRadioGroup(opt) {
    const w = document.createElement("div"); w.className = "option-choices";
    for (const c of (opt.choices || [])) {
        const l = document.createElement("label"); l.className = "option-choice";
        const inp = document.createElement("input"); inp.type = "radio"; inp.name = `r_${opt.id}`; inp.value = c;
        if (state.selections[opt.id] === c) inp.checked = true;
        inp.addEventListener("change", () => { state.selections[opt.id] = c; });
        l.appendChild(inp); l.appendChild(document.createTextNode(c)); w.appendChild(l);
    }
    return w;
}

function buildCheckboxGroup(opt) {
    const w = document.createElement("div"); w.className = "option-choices multi-select-wrap";
    for (const c of (opt.choices || [])) {
        const l = document.createElement("label"); l.className = "option-choice";
        const inp = document.createElement("input"); inp.type = "checkbox"; inp.value = c;
        if (Array.isArray(state.selections[opt.id]) && state.selections[opt.id].includes(c)) inp.checked = true;
        inp.addEventListener("change", () => {
            if (!Array.isArray(state.selections[opt.id])) state.selections[opt.id] = [];
            if (inp.checked) { if (!state.selections[opt.id].includes(c)) state.selections[opt.id].push(c); }
            else state.selections[opt.id] = state.selections[opt.id].filter(x => x !== c);
        });
        l.appendChild(inp); l.appendChild(document.createTextNode(c)); w.appendChild(l);
    }
    return w;
}

function buildDropdown(opt) {
    const sel = document.createElement("select"); sel.setAttribute("aria-label", opt.question);
    const empty = document.createElement("option"); empty.value = ""; empty.textContent = "— Select —"; sel.appendChild(empty);
    for (const c of (opt.choices || [])) {
        const o = document.createElement("option"); o.value = c; o.textContent = c;
        if (state.selections[opt.id] === c) o.selected = true;
        sel.appendChild(o);
    }
    sel.addEventListener("change", () => { state.selections[opt.id] = sel.value || null; });
    return sel;
}

function buildTextInput(opt) {
    const inp = document.createElement("input"); inp.type = "text"; inp.placeholder = opt.placeholder || "Enter value...";
    inp.value = state.selections[opt.id] || ""; inp.setAttribute("aria-label", opt.question);
    inp.addEventListener("input", () => { state.selections[opt.id] = inp.value; });
    return inp;
}

function buildTextarea(opt) {
    const ta = document.createElement("textarea"); ta.rows = 3; ta.placeholder = opt.placeholder || "Enter value...";
    ta.value = state.selections[opt.id] || ""; ta.setAttribute("aria-label", opt.question);
    ta.addEventListener("input", () => { state.selections[opt.id] = ta.value; });
    return ta;
}

function buildNumberInput(opt) {
    const inp = document.createElement("input"); inp.type = "number";
    if (opt.min !== undefined && opt.min !== null) inp.min = opt.min;
    if (opt.max !== undefined && opt.max !== null) inp.max = opt.max;
    inp.value = state.selections[opt.id] ?? (opt.default || 0);
    inp.setAttribute("aria-label", opt.question);
    inp.addEventListener("input", () => { state.selections[opt.id] = parseFloat(inp.value) || 0; });
    return inp;
}

function buildSlider(opt) {
    const w = document.createElement("div"); w.className = "option-slider-wrap";
    const inp = document.createElement("input"); inp.type = "range";
    inp.min = opt.min ?? 0; inp.max = opt.max ?? 100; inp.step = opt.step ?? 1;
    inp.value = state.selections[opt.id] ?? (opt.default ?? 50);
    inp.setAttribute("aria-label", opt.question);
    const val = document.createElement("span"); val.className = "slider-value"; val.textContent = inp.value;
    inp.addEventListener("input", () => { state.selections[opt.id] = parseFloat(inp.value); val.textContent = inp.value; });
    w.appendChild(inp); w.appendChild(val);
    return w;
}

function buildBoolean(opt) {
    const w = document.createElement("div"); w.className = "boolean-toggle";
    const yes = document.createElement("button"); yes.type = "button"; yes.className = "bool-btn" + (state.selections[opt.id] === true ? " selected" : ""); yes.textContent = "YES";
    const no = document.createElement("button"); no.type = "button"; no.className = "bool-btn" + (state.selections[opt.id] === false ? " selected" : ""); no.textContent = "NO";
    yes.addEventListener("click", () => { state.selections[opt.id] = true; yes.classList.add("selected"); no.classList.remove("selected"); });
    no.addEventListener("click", () => { state.selections[opt.id] = false; no.classList.add("selected"); yes.classList.remove("selected"); });
    w.appendChild(yes); w.appendChild(no);
    return w;
}

function buildColorPicker(opt) {
    const inp = document.createElement("input"); inp.type = "color"; inp.value = state.selections[opt.id] || opt.default || "#ff6b00";
    inp.setAttribute("aria-label", opt.question);
    inp.addEventListener("input", () => { state.selections[opt.id] = inp.value; });
    return inp;
}

// ================================================================
// AUTO CONFIGURE
// ================================================================
function handleAutoConfig() {
    for (const phase of state.phases) {
        for (const opt of phase.options) {
            const k = opt.id;
            if (opt.recommended && (opt.type === "multiple_choice" || opt.type === "code_style" || opt.type === "dropdown")) {
                const rec = opt.choices?.find(c => c.toLowerCase().includes(opt.recommended.toLowerCase()));
                if (rec) state.selections[k] = rec;
            }
            if (opt.type === "boolean" && opt.default !== undefined && opt.default !== null) {
                state.selections[k] = opt.default;
            }
        }
    }
    renderPhase();
    toast("Auto-configured with AI recommendations.", "info");
}

// ================================================================
// CUSTOM REQUIREMENT
// ================================================================
function handleSaveCustom() {
    const title = $.customTitle.value.trim();
    const value = $.customValue.value.trim();
    const priority = $.customPriority.value;
    if (!title || !value) { toast("Title and value are required.", "warning"); return; }
    state.customRequirements.push({ title, value, priority, id: Date.now().toString(36) });
    $.customTitle.value = ""; $.customValue.value = "";
    $.customModal.classList.add("hidden");
    renderContextStack();
    toast("Custom requirement added.", "success");
}

// ================================================================
// GENERATE FINAL
// ================================================================
async function handleGenerateFinal() {
    if (!state.unlocked || !state.apiKey) { toast("Validate API Key first.", "warning"); return; }
    if (!state.analysis || state.phases.length === 0) { toast("Run analysis first.", "warning"); return; }
    if (!rateLimiter.canProceed()) { showRateModal(); return; }

    setBtnLoading($.generateFinalBtn, true);
    setStatus("processing", "GENERATING FINAL PROMPT...");
    $.finalSection.classList.add("hidden");

    try {
        rateLimiter.record();
        const readable = buildReadable();
        const result = await generateFinalPrompt(state.apiKey, state.basePrompt, state.analysis, readable, state.customRequirements, state.fileContexts, state.persona, state.outputMode);

        state.finalPrompt = result.finalPrompt;
        state.quality = result.quality;

        // Version tracking
        state.promptVersions.push({ prompt: result.finalPrompt, quality: result.quality, timestamp: new Date().toISOString() });
        state.currentVersion = state.promptVersions.length - 1;

        renderFinal();
        $.finalSection.classList.remove("hidden");
        setStatus("complete", "GENERATION COMPLETE");
        toast("Super Prompt generated.", "success");
    } catch (err) {
        setStatus("error", "GENERATION FAILED");
        toast(err.message, "error");
    } finally { setBtnLoading($.generateFinalBtn, false); }
}

function buildReadable() {
    const r = {};
    for (const phase of state.phases) {
        for (const opt of phase.options) {
            const v = state.selections[opt.id];
            if (v === null || v === undefined || v === "" || (Array.isArray(v) && v.length === 0)) continue;
            r[opt.question] = v;
        }
    }
    return r;
}

// ================================================================
// RENDER FINAL
// ================================================================
function renderFinal() {
    $.finalPrompt.value = state.finalPrompt;
    $.finalPrompt.readOnly = true;
    $.editModeBtn.textContent = "EDIT";

    renderQuality();
    renderVersionHistory();
}

function renderQuality() {
    if (!state.quality) return;
    const q = state.quality;
    $.qualityBarFill.style.width = `${q.overall}%`;
    $.qualityScore.textContent = `${q.overall}%`;
    $.qualityScore.style.color = q.overall >= 80 ? "var(--success)" : q.overall >= 60 ? "var(--warning)" : "var(--danger)";

    const metrics = [
        { name: "Clarity", val: q.clarity },
        { name: "Specificity", val: q.specificity },
        { name: "Completeness", val: q.completeness },
        { name: "Constraints", val: q.constraints },
        { name: "Security", val: q.security },
    ];
    $.qualityBreakdown.innerHTML = "";
    for (const m of metrics) {
        const d = document.createElement("div"); d.className = "quality-metric";
        d.innerHTML = `<span class="quality-metric-name">${m.name}</span><span class="quality-metric-val">${m.val ?? "—"}</span>`;
        $.qualityBreakdown.appendChild(d);
    }

    $.qualityWarnings.innerHTML = "";
    if (q.warnings?.length > 0) {
        for (const w of q.warnings) {
            const d = document.createElement("div"); d.className = "quality-warn-item"; d.textContent = w;
            $.qualityWarnings.appendChild(d);
        }
    }
}

function renderVersionHistory() {
    if (state.promptVersions.length <= 1) { $.versionHistory.classList.add("hidden"); return; }
    $.versionHistory.classList.remove("hidden");
    $.versionList.innerHTML = "";
    state.promptVersions.forEach((v, i) => {
        const item = document.createElement("div");
        item.className = "version-item" + (i === state.currentVersion ? " active" : "");
        item.innerHTML = `<span class="version-label">Generation ${i + 1} — Q:${v.quality?.overall || "?"}</span><span class="version-time">${formatTime(v.timestamp)}</span>`;
        item.addEventListener("click", () => {
            state.currentVersion = i;
            state.finalPrompt = v.prompt;
            state.quality = v.quality;
            renderFinal();
            if (i > 0) showDiff(state.promptVersions[i - 1].prompt, v.prompt);
            else $.diffSection.classList.add("hidden");
        });
        $.versionList.appendChild(item);
    });
}

// ================================================================
// DIFF
// ================================================================
function showDiff(oldText, newText) {
    $.diffSection.classList.remove("hidden");
    const oldLines = oldText.split("\n");
    const newLines = newText.split("\n");
    let html = "";
    const max = Math.max(oldLines.length, newLines.length);
    for (let i = 0; i < max; i++) {
        const o = oldLines[i] || "";
        const n = newLines[i] || "";
        if (o === n) html += `<div class="diff-same">${escapeHtml(n)}</div>`;
        else {
            if (o) html += `<div class="diff-remove">${escapeHtml(o)}</div>`;
            if (n) html += `<div class="diff-add">${escapeHtml(n)}</div>`;
        }
    }
    $.diffOutput.innerHTML = html;
}

// ================================================================
// ACTIONS
// ================================================================
async function handleCopy() { await copyText($.finalPrompt.value); }

async function copyText(text) {
    if (!text) { toast("Nothing to copy.", "warning"); return; }
    try {
        if (navigator.clipboard?.writeText) await navigator.clipboard.writeText(text);
        else { const ta = document.createElement("textarea"); ta.value = text; ta.style.cssText = "position:fixed;left:-9999px;opacity:0"; document.body.appendChild(ta); ta.select(); document.execCommand("copy"); ta.remove(); }
        toast("Copied to clipboard.", "success");
    } catch (_) { toast("Copy failed.", "error"); }
}

function handleEditMode() {
    const isReadonly = $.finalPrompt.readOnly;
    $.finalPrompt.readOnly = !isReadonly;
    $.editModeBtn.querySelector("svg + *")?.remove();
    const txt = $.editModeBtn.childNodes;
    if (isReadonly) {
        $.finalPrompt.focus();
        $.editModeBtn.innerHTML = $.editModeBtn.querySelector("svg").outerHTML + " LOCK";
        toast("Edit mode enabled.", "info");
    } else {
        state.finalPrompt = $.finalPrompt.value;
        $.editModeBtn.innerHTML = $.editModeBtn.querySelector("svg")?.outerHTML + " EDIT";
        toast("Prompt locked.", "info");
    }
}

async function handleImprove() {
    if (!state.finalPrompt) { toast("No prompt to improve.", "warning"); return; }
    if (!rateLimiter.canProceed()) { showRateModal(); return; }

    setBtnLoading($.improveBtn, true);
    setStatus("processing", "IMPROVING PROMPT...");

    try {
        rateLimiter.record();
        const result = await improvePrompt(state.apiKey, state.finalPrompt, state.persona, state.outputMode);

        const prevPrompt = state.finalPrompt;
        state.finalPrompt = result.finalPrompt;
        state.quality = result.quality;
        state.promptVersions.push({ prompt: result.finalPrompt, quality: result.quality, timestamp: new Date().toISOString() });
        state.currentVersion = state.promptVersions.length - 1;

        renderFinal();
        showDiff(prevPrompt, result.finalPrompt);
        setStatus("complete", "IMPROVEMENT COMPLETE");
        toast("Prompt improved.", "success");
    } catch (err) {
        setStatus("error", "IMPROVEMENT FAILED");
        toast(err.message, "error");
    } finally { setBtnLoading($.improveBtn, false); }
}

function handleExportTxt() {
    if (!state.finalPrompt) { toast("No prompt to export.", "warning"); return; }
    downloadFile("vantage-forge-prompt.txt", state.finalPrompt, "text/plain");
    toast("Exported as .txt", "success");
}

function handleExportJson() {
    if (!state.finalPrompt) { toast("No prompt to export.", "warning"); return; }
    const data = { application: "VΛNTAGE FORGE", basePrompt: state.basePrompt, configuration: state.selections, customRequirements: state.customRequirements, finalPrompt: state.finalPrompt, quality: state.quality, timestamp: new Date().toISOString() };
    downloadFile("vantage-forge-prompt.json", JSON.stringify(data, null, 2), "application/json");
    toast("Exported as .json", "success");
}

function downloadFile(name, content, mime) {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = name;
    document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(url);
}

// ================================================================
// HISTORY
// ================================================================
function loadHistory() {
    try { const s = localStorage.getItem("vf_history"); if (s) { state.history = JSON.parse(s); if (!Array.isArray(state.history)) state.history = []; } } catch (_) { state.history = []; }
}

function saveHistory() {
    try { localStorage.setItem("vf_history", JSON.stringify(state.history)); } catch (_) { toast("Failed to save history.", "warning"); }
}

function handleSaveHistory() {
    if (!state.finalPrompt) { toast("No prompt to save.", "warning"); return; }
    state.history.unshift({
        id: Date.now().toString(36) + Math.random().toString(36).substr(2, 6),
        title: state.basePrompt.trim().substring(0, 60) + (state.basePrompt.length > 60 ? "..." : ""),
        basePrompt: state.basePrompt,
        finalPrompt: state.finalPrompt,
        quality: state.quality,
        timestamp: new Date().toISOString(),
    });
    if (state.history.length > 50) state.history = state.history.slice(0, 50);
    saveHistory();
    toast("Saved to history.", "success");
}

function renderHistory() {
    loadHistory();
    if (state.history.length === 0) { $.historyList.innerHTML = '<div class="empty-state">Belum ada history tersimpan.</div>'; return; }
    const frag = document.createDocumentFragment();
    for (const entry of state.history) {
        const item = document.createElement("div"); item.className = "history-item";
        item.innerHTML = `
            <div class="history-item-header">
                <div class="history-title">${escapeHtml(entry.title)}</div>
                <div class="history-time">${formatTime(entry.timestamp)}</div>
            </div>
            <div class="history-base">${escapeHtml(entry.basePrompt)}</div>
            <div class="history-actions"></div>`;
        const actions = item.querySelector(".history-actions");

        const viewBtn = createActionBtn("VIEW", () => {
            $.hvTitle.textContent = entry.title;
            $.hvTime.textContent = formatTime(entry.timestamp);
            $.hvBase.textContent = entry.basePrompt;
            $.hvFinal.value = entry.finalPrompt;
            $.hvUse.onclick = () => {
                $.basePrompt.value = entry.basePrompt;
                state.basePrompt = entry.basePrompt;
                updateCharCounter(); updateUpgradeBtn();
                $.hvModal.classList.add("hidden");
                switchPanel("dashboard");
                toast("Loaded to prompt input.", "info");
            };
            $.hvModal.classList.remove("hidden");
        });
        const copyBtn = createActionBtn("COPY", () => copyText(entry.finalPrompt));
        const delBtn = createActionBtn("DELETE", () => {
            state.history = state.history.filter(h => h.id !== entry.id);
            saveHistory(); renderHistory();
            toast("Deleted.", "info");
        }, true);

        actions.appendChild(viewBtn);
        actions.appendChild(copyBtn);
        actions.appendChild(delBtn);
        frag.appendChild(item);
    }
    $.historyList.innerHTML = "";
    $.historyList.appendChild(frag);
}

function createActionBtn(text, handler, danger = false) {
    const b = document.createElement("button"); b.className = "action-btn" + (danger ? " danger" : ""); b.type = "button"; b.textContent = text;
    b.addEventListener("click", handler);
    return b;
}

// ================================================================
// SETTINGS
// ================================================================
function loadSettings() {
    try {
        const s = localStorage.getItem("vf_settings");
        if (s) Object.assign(state.settings, JSON.parse(s));
    } catch (_) {}
    applySettings();
    syncSettingsUI();
}

function saveSettings() { try { localStorage.setItem("vf_settings", JSON.stringify(state.settings)); } catch (_) {} }

function syncSettingsUI() {
    $.settingBgVideo.checked = state.settings.bgVideo;
    $.settingParticles.checked = state.settings.particles;
    $.settingCursorGlow.checked = state.settings.cursorGlow;
    $.settingReducedMotion.checked = state.settings.reducedMotion;
}

function applySettings() {
    $.bgVideo.classList.toggle("bg-off", !state.settings.bgVideo);
    $.particleCanvas.classList.toggle("off", !state.settings.particles);
    $.cursorGlow.classList.toggle("off", !state.settings.cursorGlow);
    if (state.settings.particles && !state.settings.reducedMotion) animateParticles();
}

function updateSettings() {
    $.settingsApiStatus.textContent = state.unlocked ? "CONNECTED" : "NOT SET";
    $.settingsApiStatus.style.color = state.unlocked ? "var(--success)" : "var(--danger)";
    syncSettingsUI();
}

function handleClearKey() {
    state.apiKey = null; state.unlocked = false;
    $.apiKeyInput.value = ""; $.apiKeyInput.type = "password";
    $.mainFeature.classList.remove("main-feature-visible"); $.mainFeature.classList.add("main-feature-hidden");
    ["analysisSection","configSection","contextSection","finalSection","processingSection"].forEach(k => $[k]?.classList.add("hidden"));
    showGateMsg("", "");
    try { localStorage.removeItem("vf_key"); } catch (_) {}
    setStatus("ready", "SYSTEM READY"); updateSettings();
    toast("API Key cleared.", "info");
}

function handleClearHistory() { state.history = []; saveHistory(); renderHistory(); toast("History cleared.", "info"); }

function handleResetApp() {
    handleClearKey(); handleClearHistory();
    state.settings = { bgVideo: true, particles: true, cursorGlow: true, reducedMotion: false };
    saveSettings(); applySettings(); syncSettingsUI();
    toast("Application reset.", "info");
}

// ================================================================
// RATE MODAL
// ================================================================
function showRateModal() {
    const wait = rateLimiter.getWaitTime();
    $.rateCountdown.textContent = wait;
    $.rateModal.classList.remove("hidden");
    setStatus("limited", "RATE LIMITED");
    let rem = wait;
    const iv = setInterval(() => {
        rem--;
        $.rateCountdown.textContent = rem;
        if (rem <= 0) { clearInterval(iv); $.rateModal.classList.add("hidden"); setStatus("connected", "API CONNECTED"); }
    }, 1000);
}

// ================================================================
// UTIL
// ================================================================
function escapeHtml(s) {
    if (!s) return "";
    const d = document.createElement("div"); d.textContent = s; return d.innerHTML;
}

function formatTime(iso) {
    try { const d = new Date(iso); return `${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`; }
    catch (_) { return iso; }
}

function p(n) { return n.toString().padStart(2, "0"); }
