/**
 * VΛNTAGE FORGE — Main Application Module
 * 
 * Dynamic AI Prompt Mutation Engine
 * 
 * Architecture Note:
 * This is a frontend-only application for demonstration.
 * For production deployment:
 *   - API key should be stored server-side
 *   - Use a backend proxy: Frontend → Backend → OpenRouter
 *   - Implement server-side rate limiting, auth, CSP, HTTPS
 *   - Never expose API keys in client-side code
 */

import { validateApiKey, generateOptions, generateFinalPrompt } from "./api.js";
import { initSecurity, RateLimiter } from "./security.js";

// ================================================================
// STATE
// ================================================================
const state = {
    unlocked: false,
    apiKey: null,
    basePrompt: "",
    analysis: null,
    complexity: null,
    options: [],
    selections: {},
    finalPrompt: "",
    history: [],
    currentPanel: "dashboard",
    optionPage: 0,
    optionsPerPage: 20,
};

// Rate limiter: max 3 requests per 60 seconds (in-memory, client-side deterrent only)
const rateLimiter = new RateLimiter(3, 60000);

// ================================================================
// DOM REFERENCES
// ================================================================
const dom = {};

function cacheDom() {
    dom.splashScreen = document.getElementById("splash-screen");
    dom.splashVideo = document.getElementById("splash-video");
    dom.vintageLogo = document.getElementById("vintage-logo");
    dom.bgVideo = document.getElementById("bg-video");
    dom.app = document.getElementById("app");
    dom.sidebar = document.getElementById("sidebar");
    dom.mobileMenuToggle = document.getElementById("mobile-menu-toggle");
    dom.sidebarBackdrop = document.getElementById("sidebar-backdrop");
    dom.menuBtns = document.querySelectorAll(".menu-btn");
    dom.panels = document.querySelectorAll(".panel");
    dom.statusDot = document.getElementById("status-dot");
    dom.statusText = document.getElementById("status-text");
    dom.apiKeyInput = document.getElementById("api-key-input");
    dom.toggleKeyVis = document.getElementById("toggle-key-vis");
    dom.validateBtn = document.getElementById("validate-btn");
    dom.apiGateMsg = document.getElementById("api-gate-msg");
    dom.mainFeature = document.getElementById("main-feature");
    dom.basePrompt = document.getElementById("base-prompt");
    dom.charCounter = document.getElementById("char-counter");
    dom.charWarning = document.getElementById("char-warning");
    dom.startUpgradeBtn = document.getElementById("start-upgrade-btn");
    dom.analysisSection = document.getElementById("analysis-section");
    dom.analysisContent = document.getElementById("analysis-content");
    dom.complexityTag = document.getElementById("complexity-tag");
    dom.optionsCountTag = document.getElementById("options-count-tag");
    dom.optionsSection = document.getElementById("options-section");
    dom.optionsPagination = document.getElementById("options-pagination");
    dom.optPrev = document.getElementById("opt-prev");
    dom.optNext = document.getElementById("opt-next");
    dom.optPageInfo = document.getElementById("opt-page-info");
    dom.optionsGrid = document.getElementById("options-grid");
    dom.generateFinalBtn = document.getElementById("generate-final-btn");
    dom.finalSection = document.getElementById("final-section");
    dom.finalPrompt = document.getElementById("final-prompt");
    dom.copyBtn = document.getElementById("copy-btn");
    dom.regenerateBtn = document.getElementById("regenerate-btn");
    dom.saveHistoryBtn = document.getElementById("save-history-btn");
    dom.historyList = document.getElementById("history-list");
    dom.settingsApiStatus = document.getElementById("settings-api-status");
    dom.settingsClearKey = document.getElementById("settings-clear-key");
    dom.settingsClearHistory = document.getElementById("settings-clear-history");
    dom.toastContainer = document.getElementById("toast-container");
    dom.rateModal = document.getElementById("rate-modal");
    dom.rateCountdown = document.getElementById("rate-countdown");
    dom.rateModalClose = document.getElementById("rate-modal-close");
    dom.cardVideo = document.getElementById("card-video");
}

// ================================================================
// INIT
// ================================================================
document.addEventListener("DOMContentLoaded", () => {
    cacheDom();
    initSecurity();
    loadHistory();
    initSplash();
    bindEvents();
});

// ================================================================
// SPLASH SCREEN
// ================================================================
function initSplash() {
    const video = dom.splashVideo;
    const logo = dom.vintageLogo;

    // Prevent context menu on splash video
    video.addEventListener("contextmenu", (e) => e.preventDefault());

    // Listen for video end - this is the ONLY trigger, no timer fallback
    video.addEventListener("ended", () => {
        // Hide video
        video.style.display = "none";

        // Show logo animation
        logo.classList.add("animate-in");

        // After slide-up animation completes (1.5s)
        setTimeout(() => {
            logo.classList.remove("animate-in");
            logo.classList.add("animate-hold");

            // Hold for 2 seconds
            setTimeout(() => {
                logo.classList.remove("animate-hold");
                logo.classList.add("animate-out");

                // After fade-out (1s)
                setTimeout(() => {
                    dom.splashScreen.remove();
                    document.body.classList.add("loaded");
                    dom.app.classList.remove("app-hidden");
                    dom.app.classList.add("app-visible");
                    checkStoredApiKey();
                }, 1000);
            }, 2000);
        }, 1500);
    });

    // Fallback: if video fails to load entirely, still proceed after a long delay
    video.addEventListener("error", () => {
        // Video failed to load - skip splash gracefully
        setTimeout(() => {
            if (dom.splashScreen && dom.splashScreen.parentNode) {
                dom.splashScreen.remove();
                document.body.classList.add("loaded");
                dom.app.classList.remove("app-hidden");
                dom.app.classList.add("app-visible");
                checkStoredApiKey();
            }
        }, 2000);
    });
}

// ================================================================
// EVENT BINDINGS
// ================================================================
function bindEvents() {
    // Sidebar menu
    dom.menuBtns.forEach((btn) => {
        btn.addEventListener("click", () => {
            switchPanel(btn.dataset.panel);
            closeMobileSidebar();
        });
    });

    // Mobile menu
    dom.mobileMenuToggle.addEventListener("click", toggleMobileSidebar);
    dom.sidebarBackdrop.addEventListener("click", closeMobileSidebar);

    // API key visibility toggle
    dom.toggleKeyVis.addEventListener("click", () => {
        const input = dom.apiKeyInput;
        if (input.type === "password") {
            input.type = "text";
            dom.toggleKeyVis.textContent = "HIDE";
        } else {
            input.type = "password";
            dom.toggleKeyVis.textContent = "SHOW";
        }
    });

    // Validate API key
    dom.validateBtn.addEventListener("click", handleValidateApiKey);
    dom.apiKeyInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter") handleValidateApiKey();
    });

    // Base prompt input with debounce
    let debounceTimer = null;
    dom.basePrompt.addEventListener("input", () => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
            state.basePrompt = dom.basePrompt.value;
            updateCharCounter();
            updateUpgradeBtn();
        }, 300);
    });

    // Start Upgrade
    dom.startUpgradeBtn.addEventListener("click", handleStartUpgrade);

    // Generate Final
    dom.generateFinalBtn.addEventListener("click", handleGenerateFinal);

    // Copy
    dom.copyBtn.addEventListener("click", handleCopy);

    // Regenerate
    dom.regenerateBtn.addEventListener("click", handleGenerateFinal);

    // Save history
    dom.saveHistoryBtn.addEventListener("click", handleSaveHistory);

    // Pagination
    dom.optPrev.addEventListener("click", () => {
        if (state.optionPage > 0) {
            state.optionPage--;
            renderCurrentOptionsPage();
        }
    });

    dom.optNext.addEventListener("click", () => {
        const totalPages = Math.ceil(state.options.length / state.optionsPerPage);
        if (state.optionPage < totalPages - 1) {
            state.optionPage++;
            renderCurrentOptionsPage();
        }
    });

    // Settings
    dom.settingsClearKey.addEventListener("click", handleClearApiKey);
    dom.settingsClearHistory.addEventListener("click", handleClearHistory);

    // Rate modal close
    dom.rateModalClose.addEventListener("click", () => {
        dom.rateModal.classList.add("hidden");
    });

    // Prevent video controls on all videos
    document.querySelectorAll("video").forEach((v) => {
        v.addEventListener("contextmenu", (e) => e.preventDefault());
    });
}

// ================================================================
// PANEL SWITCHING
// ================================================================
function switchPanel(panelName) {
    state.currentPanel = panelName;

    dom.menuBtns.forEach((btn) => {
        btn.classList.toggle("active", btn.dataset.panel === panelName);
        btn.setAttribute("aria-current", btn.dataset.panel === panelName ? "page" : "false");
    });

    dom.panels.forEach((panel) => {
        panel.classList.toggle("active", panel.id === `panel-${panelName}`);
    });

    if (panelName === "history") {
        renderHistory();
    }

    if (panelName === "settings") {
        updateSettingsPanel();
    }
}

// ================================================================
// MOBILE SIDEBAR
// ================================================================
function toggleMobileSidebar() {
    dom.sidebar.classList.toggle("sidebar-open");
    dom.sidebarBackdrop.classList.toggle("show");
}

function closeMobileSidebar() {
    dom.sidebar.classList.remove("sidebar-open");
    dom.sidebarBackdrop.classList.remove("show");
}

// ================================================================
// STATUS
// ================================================================
function setStatus(type, text) {
    dom.statusDot.className = "status-dot status-" + type;
    dom.statusText.textContent = text;
}

// ================================================================
// TOAST
// ================================================================
function showToast(message, type = "info", duration = 4000) {
    const toast = document.createElement("div");
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    dom.toastContainer.appendChild(toast);

    setTimeout(() => {
        toast.classList.add("toast-out");
        setTimeout(() => {
            if (toast.parentNode) toast.parentNode.removeChild(toast);
        }, 300);
    }, duration);
}

// ================================================================
// API KEY HANDLING
// ================================================================
function checkStoredApiKey() {
    try {
        const stored = localStorage.getItem("vf_api_key");
        if (stored && stored.length > 10) {
            dom.apiKeyInput.value = stored;
        }
    } catch (_) {
        // localStorage unavailable
    }
}

async function handleValidateApiKey() {
    const key = dom.apiKeyInput.value.trim();
    if (!key) {
        showGateMsg("Masukkan API Key terlebih dahulu.", "error");
        return;
    }

    setButtonLoading(dom.validateBtn, true);
    showGateMsg("Memvalidasi API Key...", "");
    setStatus("processing", "VALIDATING API KEY...");

    try {
        await validateApiKey(key);

        state.apiKey = key;
        state.unlocked = true;

        // Store with explicit user action (clicking validate is the explicit action)
        try {
            localStorage.setItem("vf_api_key", key);
        } catch (_) {
            // localStorage may be unavailable
        }

        showGateMsg("API Key valid. Engine unlocked.", "success");
        setStatus("connected", "API CONNECTED");
        showToast("API Key validated. VΛNTAGE FORGE unlocked.", "success");

        // Show main feature
        dom.mainFeature.classList.remove("main-feature-hidden");
        dom.mainFeature.classList.add("main-feature-visible");

        updateSettingsPanel();

    } catch (err) {
        showGateMsg(err.message, "error");
        setStatus("error", "VALIDATION FAILED");
        showToast(err.message, "error");
    } finally {
        setButtonLoading(dom.validateBtn, false);
    }
}

function showGateMsg(msg, type) {
    dom.apiGateMsg.textContent = msg;
    dom.apiGateMsg.className = "gate-msg" + (type ? ` ${type}` : "");
}

// ================================================================
// CHARACTER COUNTER
// ================================================================
function updateCharCounter() {
    const len = state.basePrompt.length;
    dom.charCounter.textContent = `${len} character${len !== 1 ? "s" : ""}`;

    if (len > 10000) {
        dom.charWarning.classList.remove("hidden");
    } else {
        dom.charWarning.classList.add("hidden");
    }
}

function updateUpgradeBtn() {
    dom.startUpgradeBtn.disabled = state.basePrompt.trim().length === 0;
}

// ================================================================
// BUTTON LOADING STATE
// ================================================================
function setButtonLoading(btn, loading) {
    const textEl = btn.querySelector(".btn-text");
    const spinnerEl = btn.querySelector(".btn-spinner");
    if (loading) {
        btn.disabled = true;
        if (textEl) textEl.style.opacity = "0.5";
        if (spinnerEl) spinnerEl.classList.remove("hidden");
    } else {
        btn.disabled = false;
        if (textEl) textEl.style.opacity = "1";
        if (spinnerEl) spinnerEl.classList.add("hidden");
    }
}

// ================================================================
// RATE LIMIT CHECK
// ================================================================
function checkRateLimit() {
    if (!rateLimiter.canProceed()) {
        const wait = rateLimiter.getWaitTime();
        showRateLimitModal(wait);
        return false;
    }
    return true;
}

function showRateLimitModal(seconds) {
    dom.rateCountdown.textContent = seconds;
    dom.rateModal.classList.remove("hidden");
    setStatus("limited", "RATE LIMITED");

    let remaining = seconds;
    const interval = setInterval(() => {
        remaining--;
        dom.rateCountdown.textContent = remaining;
        if (remaining <= 0) {
            clearInterval(interval);
            dom.rateModal.classList.add("hidden");
            setStatus("connected", "API CONNECTED");
        }
    }, 1000);
}

// ================================================================
// START UPGRADE — Generate Dynamic Options
// ================================================================
async function handleStartUpgrade() {
    if (!state.unlocked || !state.apiKey) {
        showToast("Validasi API Key terlebih dahulu.", "warning");
        return;
    }

    const prompt = state.basePrompt.trim();
    if (!prompt) {
        showToast("Masukkan prompt terlebih dahulu.", "warning");
        return;
    }

    if (!checkRateLimit()) return;

    setButtonLoading(dom.startUpgradeBtn, true);
    setStatus("processing", "ANALYZING PROMPT...");

    // Hide previous results
    dom.analysisSection.classList.add("hidden");
    dom.optionsSection.classList.add("hidden");
    dom.finalSection.classList.add("hidden");

    try {
        rateLimiter.record();
        const result = await generateOptions(state.apiKey, prompt);

        state.analysis = result.analysis;
        state.complexity = result.complexity || "medium";
        state.options = result.options || [];
        state.selections = {};
        state.optionPage = 0;

        // Render analysis
        dom.analysisContent.textContent = state.analysis;
        dom.complexityTag.textContent = state.complexity.toUpperCase();
        dom.optionsCountTag.textContent = state.options.length.toString();
        dom.analysisSection.classList.remove("hidden");

        // Render options
        if (state.options.length > 0) {
            initializeSelections();
            renderCurrentOptionsPage();
            dom.optionsSection.classList.remove("hidden");
        }

        setStatus("complete", "ANALYSIS COMPLETE");
        showToast(`Analisis selesai. ${state.options.length} opsi dihasilkan.`, "success");

    } catch (err) {
        setStatus("error", "ANALYSIS FAILED");
        showToast(err.message, "error");
    } finally {
        setButtonLoading(dom.startUpgradeBtn, false);
    }
}

// ================================================================
// INITIALIZE SELECTIONS WITH DEFAULTS
// ================================================================
function initializeSelections() {
    state.selections = {};
    for (const opt of state.options) {
        const key = `opt_${opt.id}`;
        switch (opt.type) {
            case "multiple_choice":
            case "dropdown":
            case "code_style":
                state.selections[key] = null;
                break;
            case "checkbox":
            case "multi_select":
                state.selections[key] = [];
                break;
            case "text_input":
                state.selections[key] = "";
                break;
            case "number":
                state.selections[key] = opt.default !== undefined && opt.default !== null ? opt.default : (opt.min !== undefined ? opt.min : 0);
                break;
            case "slider":
                state.selections[key] = opt.default !== undefined && opt.default !== null ? opt.default : (opt.min !== undefined ? opt.min : 50);
                break;
            case "boolean":
                state.selections[key] = opt.default !== undefined && opt.default !== null ? opt.default : false;
                break;
            case "color":
                state.selections[key] = opt.default || "#ff6b00";
                break;
            default:
                state.selections[key] = null;
        }
    }
}

// ================================================================
// OPTIONS RENDERING WITH PAGINATION
// ================================================================
function renderCurrentOptionsPage() {
    const total = state.options.length;
    const perPage = state.optionsPerPage;
    const totalPages = Math.ceil(total / perPage);
    const page = state.optionPage;

    // Show/hide pagination
    if (total > perPage) {
        dom.optionsPagination.classList.remove("hidden");
        dom.optPrev.disabled = page === 0;
        dom.optNext.disabled = page >= totalPages - 1;
        dom.optPageInfo.textContent = `Page ${page + 1} / ${totalPages}`;
    } else {
        dom.optionsPagination.classList.add("hidden");
    }

    const start = page * perPage;
    const end = Math.min(start + perPage, total);
    const pageOptions = state.options.slice(start, end);

    // Build DOM with fragment
    const fragment = document.createDocumentFragment();

    for (const opt of pageOptions) {
        const card = createOptionCard(opt);
        fragment.appendChild(card);
    }

    dom.optionsGrid.innerHTML = "";
    dom.optionsGrid.appendChild(fragment);
}

function createOptionCard(opt) {
    const card = document.createElement("div");
    card.className = "option-card";
    card.dataset.optionId = opt.id;

    const header = document.createElement("div");
    header.className = "option-header";

    const num = document.createElement("span");
    num.className = "option-number";
    num.textContent = `#${opt.id}`;

    const question = document.createElement("span");
    question.className = "option-question";
    question.textContent = opt.question;

    header.appendChild(num);
    header.appendChild(question);
    card.appendChild(header);

    const body = document.createElement("div");
    body.className = "option-body";

    const key = `opt_${opt.id}`;

    switch (opt.type) {
        case "multiple_choice":
        case "code_style":
            body.appendChild(createRadioGroup(opt, key));
            break;
        case "checkbox":
        case "multi_select":
            body.appendChild(createCheckboxGroup(opt, key));
            break;
        case "dropdown":
            body.appendChild(createDropdown(opt, key));
            break;
        case "text_input":
            body.appendChild(createTextInput(opt, key));
            break;
        case "number":
            body.appendChild(createNumberInput(opt, key));
            break;
        case "slider":
            body.appendChild(createSlider(opt, key));
            break;
        case "boolean":
            body.appendChild(createBooleanToggle(opt, key));
            break;
        case "color":
            body.appendChild(createColorPicker(opt, key));
            break;
        default:
            body.appendChild(createTextInput(opt, key));
    }

    card.appendChild(body);
    return card;
}

function createRadioGroup(opt, key) {
    const wrap = document.createElement("div");
    wrap.className = "option-choices";

    const choices = opt.choices || [];
    const name = `radio_${opt.id}`;

    for (const choice of choices) {
        const label = document.createElement("label");
        label.className = "option-choice";

        const input = document.createElement("input");
        input.type = "radio";
        input.name = name;
        input.value = choice;
        if (state.selections[key] === choice) input.checked = true;

        input.addEventListener("change", () => {
            state.selections[key] = choice;
        });

        const text = document.createTextNode(choice);
        label.appendChild(input);
        label.appendChild(text);
        wrap.appendChild(label);
    }

    return wrap;
}

function createCheckboxGroup(opt, key) {
    const wrap = document.createElement("div");
    wrap.className = "option-choices multi-select-wrap";

    const choices = opt.choices || [];

    for (const choice of choices) {
        const label = document.createElement("label");
        label.className = "option-choice";

        const input = document.createElement("input");
        input.type = "checkbox";
        input.value = choice;

        const currentArr = state.selections[key];
        if (Array.isArray(currentArr) && currentArr.includes(choice)) {
            input.checked = true;
        }

        input.addEventListener("change", () => {
            if (!Array.isArray(state.selections[key])) {
                state.selections[key] = [];
            }
            if (input.checked) {
                if (!state.selections[key].includes(choice)) {
                    state.selections[key].push(choice);
                }
            } else {
                state.selections[key] = state.selections[key].filter(c => c !== choice);
            }
        });

        const text = document.createTextNode(choice);
        label.appendChild(input);
        label.appendChild(text);
        wrap.appendChild(label);
    }

    return wrap;
}

function createDropdown(opt, key) {
    const select = document.createElement("select");
    select.setAttribute("aria-label", opt.question);

    const emptyOpt = document.createElement("option");
    emptyOpt.value = "";
    emptyOpt.textContent = "— Pilih —";
    select.appendChild(emptyOpt);

    const choices = opt.choices || [];
    for (const choice of choices) {
        const option = document.createElement("option");
        option.value = choice;
        option.textContent = choice;
        if (state.selections[key] === choice) option.selected = true;
        select.appendChild(option);
    }

    select.addEventListener("change", () => {
        state.selections[key] = select.value || null;
    });

    return select;
}

function createTextInput(opt, key) {
    const input = document.createElement("input");
    input.type = "text";
    input.placeholder = opt.placeholder || "Masukkan teks...";
    input.value = state.selections[key] || "";
    input.setAttribute("aria-label", opt.question);

    input.addEventListener("input", () => {
        state.selections[key] = input.value;
    });

    return input;
}

function createNumberInput(opt, key) {
    const input = document.createElement("input");
    input.type = "number";
    if (opt.min !== undefined) input.min = opt.min;
    if (opt.max !== undefined) input.max = opt.max;
    input.value = state.selections[key] !== undefined && state.selections[key] !== null ? state.selections[key] : (opt.default || 0);
    input.setAttribute("aria-label", opt.question);

    input.addEventListener("input", () => {
        const val = parseFloat(input.value);
        state.selections[key] = isNaN(val) ? 0 : val;
    });

    return input;
}

function createSlider(opt, key) {
    const wrap = document.createElement("div");
    wrap.className = "option-slider-wrap";

    const input = document.createElement("input");
    input.type = "range";
    input.min = opt.min !== undefined ? opt.min : 0;
    input.max = opt.max !== undefined ? opt.max : 100;
    input.step = opt.step !== undefined ? opt.step : 1;
    input.value = state.selections[key] !== undefined && state.selections[key] !== null ? state.selections[key] : (opt.default || 50);
    input.setAttribute("aria-label", opt.question);

    const valueLabel = document.createElement("span");
    valueLabel.className = "slider-value";
    valueLabel.textContent = input.value;

    input.addEventListener("input", () => {
        state.selections[key] = parseFloat(input.value);
        valueLabel.textContent = input.value;
    });

    wrap.appendChild(input);
    wrap.appendChild(valueLabel);
    return wrap;
}

function createBooleanToggle(opt, key) {
    const wrap = document.createElement("div");
    wrap.className = "boolean-toggle";

    const yesBtn = document.createElement("button");
    yesBtn.type = "button";
    yesBtn.className = "bool-btn" + (state.selections[key] === true ? " selected" : "");
    yesBtn.textContent = "YES";
    yesBtn.setAttribute("aria-label", `${opt.question} - Yes`);

    const noBtn = document.createElement("button");
    noBtn.type = "button";
    noBtn.className = "bool-btn" + (state.selections[key] === false ? " selected" : "");
    noBtn.textContent = "NO";
    noBtn.setAttribute("aria-label", `${opt.question} - No`);

    yesBtn.addEventListener("click", () => {
        state.selections[key] = true;
        yesBtn.classList.add("selected");
        noBtn.classList.remove("selected");
    });

    noBtn.addEventListener("click", () => {
        state.selections[key] = false;
        noBtn.classList.add("selected");
        yesBtn.classList.remove("selected");
    });

    wrap.appendChild(yesBtn);
    wrap.appendChild(noBtn);
    return wrap;
}

function createColorPicker(opt, key) {
    const input = document.createElement("input");
    input.type = "color";
    input.value = state.selections[key] || opt.default || "#ff6b00";
    input.setAttribute("aria-label", opt.question);

    input.addEventListener("input", () => {
        state.selections[key] = input.value;
    });

    return input;
}

// ================================================================
// GENERATE FINAL PROMPT
// ================================================================
async function handleGenerateFinal() {
    if (!state.unlocked || !state.apiKey) {
        showToast("Validasi API Key terlebih dahulu.", "warning");
        return;
    }

    if (!state.analysis || state.options.length === 0) {
        showToast("Jalankan analisis terlebih dahulu.", "warning");
        return;
    }

    if (!checkRateLimit()) return;

    setButtonLoading(dom.generateFinalBtn, true);
    setStatus("processing", "GENERATING FINAL PROMPT...");
    dom.finalSection.classList.add("hidden");

    try {
        rateLimiter.record();

        // Build human-readable selections
        const readableSelections = buildReadableSelections();

        const finalText = await generateFinalPrompt(
            state.apiKey,
            state.basePrompt,
            state.analysis,
            readableSelections
        );

        state.finalPrompt = finalText;
        dom.finalPrompt.value = finalText;
        dom.finalSection.classList.remove("hidden");

        setStatus("complete", "GENERATION COMPLETE");
        showToast("Super Prompt berhasil di-generate.", "success");

    } catch (err) {
        setStatus("error", "GENERATION FAILED");
        showToast(err.message, "error");
    } finally {
        setButtonLoading(dom.generateFinalBtn, false);
    }
}

function buildReadableSelections() {
    const readable = {};

    for (const opt of state.options) {
        const key = `opt_${opt.id}`;
        const val = state.selections[key];

        if (val === null || val === undefined || val === "" || (Array.isArray(val) && val.length === 0)) {
            continue;
        }

        readable[opt.question] = val;
    }

    return readable;
}

// ================================================================
// COPY TO CLIPBOARD
// ================================================================
async function handleCopy() {
    const text = dom.finalPrompt.value;
    if (!text) {
        showToast("Tidak ada prompt untuk disalin.", "warning");
        return;
    }

    try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
            await navigator.clipboard.writeText(text);
        } else {
            // Fallback
            const textarea = document.createElement("textarea");
            textarea.value = text;
            textarea.style.position = "fixed";
            textarea.style.left = "-9999px";
            textarea.style.opacity = "0";
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand("copy");
            document.body.removeChild(textarea);
        }
        showToast("Prompt disalin ke clipboard.", "success");
    } catch (err) {
        showToast("Gagal menyalin. Salin secara manual.", "error");
    }
}

// ================================================================
// HISTORY
// ================================================================
function loadHistory() {
    try {
        const stored = localStorage.getItem("vf_history");
        if (stored) {
            state.history = JSON.parse(stored);
            if (!Array.isArray(state.history)) state.history = [];
        }
    } catch (_) {
        state.history = [];
    }
}

function saveHistoryToStorage() {
    try {
        localStorage.setItem("vf_history", JSON.stringify(state.history));
    } catch (_) {
        showToast("Gagal menyimpan history ke localStorage.", "warning");
    }
}

function handleSaveHistory() {
    if (!state.finalPrompt) {
        showToast("Tidak ada final prompt untuk disimpan.", "warning");
        return;
    }

    const entry = {
        id: generateId(),
        title: generateTitle(state.basePrompt),
        basePrompt: state.basePrompt,
        finalPrompt: state.finalPrompt,
        timestamp: new Date().toISOString(),
    };

    state.history.unshift(entry);

    // Keep max 50 entries
    if (state.history.length > 50) {
        state.history = state.history.slice(0, 50);
    }

    saveHistoryToStorage();
    showToast("Prompt disimpan ke history.", "success");
}

function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substring(2, 8);
}

function generateTitle(prompt) {
    const cleaned = prompt.trim().replace(/\s+/g, " ");
    if (cleaned.length <= 60) return cleaned;
    return cleaned.substring(0, 57) + "...";
}

function renderHistory() {
    loadHistory();

    if (state.history.length === 0) {
        dom.historyList.innerHTML = '<div class="history-empty">Belum ada history tersimpan.</div>';
        return;
    }

    const fragment = document.createDocumentFragment();

    for (const entry of state.history) {
        const item = document.createElement("div");
        item.className = "history-item";

        const header = document.createElement("div");
        header.className = "history-item-header";

        const title = document.createElement("div");
        title.className = "history-title";
        title.textContent = entry.title;

        const time = document.createElement("div");
        time.className = "history-time";
        time.textContent = formatTimestamp(entry.timestamp);

        header.appendChild(title);
        header.appendChild(time);

        const base = document.createElement("div");
        base.className = "history-base";
        base.textContent = entry.basePrompt;

        const actions = document.createElement("div");
        actions.className = "history-actions";

        const viewBtn = document.createElement("button");
        viewBtn.className = "action-btn";
        viewBtn.type = "button";
        viewBtn.textContent = "VIEW";
        viewBtn.setAttribute("aria-label", `View prompt: ${entry.title}`);
        viewBtn.addEventListener("click", () => showHistoryView(entry));

        const copyBtn = document.createElement("button");
        copyBtn.className = "action-btn";
        copyBtn.type = "button";
        copyBtn.textContent = "COPY";
        copyBtn.setAttribute("aria-label", `Copy prompt: ${entry.title}`);
        copyBtn.addEventListener("click", async () => {
            try {
                if (navigator.clipboard && navigator.clipboard.writeText) {
                    await navigator.clipboard.writeText(entry.finalPrompt);
                } else {
                    const ta = document.createElement("textarea");
                    ta.value = entry.finalPrompt;
                    ta.style.position = "fixed";
                    ta.style.left = "-9999px";
                    ta.style.opacity = "0";
                    document.body.appendChild(ta);
                    ta.select();
                    document.execCommand("copy");
                    document.body.removeChild(ta);
                }
                showToast("Prompt disalin.", "success");
            } catch (_) {
                showToast("Gagal menyalin.", "error");
            }
        });

        const deleteBtn = document.createElement("button");
        deleteBtn.className = "action-btn danger-btn";
        deleteBtn.type = "button";
        deleteBtn.textContent = "DELETE";
        deleteBtn.setAttribute("aria-label", `Delete prompt: ${entry.title}`);
        deleteBtn.addEventListener("click", () => {
            state.history = state.history.filter(h => h.id !== entry.id);
            saveHistoryToStorage();
            renderHistory();
            showToast("History dihapus.", "info");
        });

        actions.appendChild(viewBtn);
        actions.appendChild(copyBtn);
        actions.appendChild(deleteBtn);

        item.appendChild(header);
        item.appendChild(base);
        item.appendChild(actions);
        fragment.appendChild(item);
    }

    dom.historyList.innerHTML = "";
    dom.historyList.appendChild(fragment);
}

function showHistoryView(entry) {
    const overlay = document.createElement("div");
    overlay.className = "history-view-overlay";

    const box = document.createElement("div");
    box.className = "history-view-box";

    const label = document.createElement("div");
    label.className = "section-label";
    label.textContent = entry.title;

    const sublabel = document.createElement("div");
    sublabel.className = "section-sublabel";
    sublabel.textContent = formatTimestamp(entry.timestamp);

    const baseLabel = document.createElement("div");
    baseLabel.className = "section-sublabel";
    baseLabel.style.marginTop = "12px";
    baseLabel.textContent = "BASE PROMPT:";

    const baseText = document.createElement("div");
    baseText.className = "analysis-box";
    baseText.style.marginBottom = "16px";
    baseText.textContent = entry.basePrompt;

    const finalLabel = document.createElement("div");
    finalLabel.className = "section-sublabel";
    finalLabel.textContent = "FINAL PROMPT:";

    const textarea = document.createElement("textarea");
    textarea.readOnly = true;
    textarea.value = entry.finalPrompt;
    textarea.rows = 14;
    textarea.style.minHeight = "200px";

    const actions = document.createElement("div");
    actions.className = "history-view-actions";

    const copyBtn = document.createElement("button");
    copyBtn.className = "action-btn";
    copyBtn.type = "button";
    copyBtn.textContent = "COPY FINAL PROMPT";
    copyBtn.addEventListener("click", async () => {
        try {
            if (navigator.clipboard && navigator.clipboard.writeText) {
                await navigator.clipboard.writeText(entry.finalPrompt);
            } else {
                const ta = document.createElement("textarea");
                ta.value = entry.finalPrompt;
                ta.style.position = "fixed";
                ta.style.left = "-9999px";
                ta.style.opacity = "0";
                document.body.appendChild(ta);
                ta.select();
                document.execCommand("copy");
                document.body.removeChild(ta);
            }
            showToast("Prompt disalin.", "success");
        } catch (_) {
            showToast("Gagal menyalin.", "error");
        }
    });

    const useBtn = document.createElement("button");
    useBtn.className = "action-btn";
    useBtn.type = "button";
    useBtn.textContent = "USE AS BASE PROMPT";
    useBtn.addEventListener("click", () => {
        dom.basePrompt.value = entry.basePrompt;
        state.basePrompt = entry.basePrompt;
        updateCharCounter();
        updateUpgradeBtn();
        overlay.remove();
        switchPanel("dashboard");
        showToast("Prompt dimuat ke Base Prompt.", "info");
    });

    const closeBtn = document.createElement("button");
    closeBtn.className = "action-btn danger-btn";
    closeBtn.type = "button";
    closeBtn.textContent = "CLOSE";
    closeBtn.addEventListener("click", () => overlay.remove());

    actions.appendChild(copyBtn);
    actions.appendChild(useBtn);
    actions.appendChild(closeBtn);

    box.appendChild(label);
    box.appendChild(sublabel);
    box.appendChild(baseLabel);
    box.appendChild(baseText);
    box.appendChild(finalLabel);
    box.appendChild(textarea);
    box.appendChild(actions);
    overlay.appendChild(box);

    overlay.addEventListener("click", (e) => {
        if (e.target === overlay) overlay.remove();
    });

    document.body.appendChild(overlay);
}

function formatTimestamp(iso) {
    try {
        const d = new Date(iso);
        const pad = (n) => n.toString().padStart(2, "0");
        return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
    } catch (_) {
        return iso;
    }
}

// ================================================================
// SETTINGS
// ================================================================
function updateSettingsPanel() {
    if (state.unlocked && state.apiKey) {
        dom.settingsApiStatus.textContent = "CONNECTED";
        dom.settingsApiStatus.style.color = "var(--success)";
    } else {
        dom.settingsApiStatus.textContent = "NOT SET";
        dom.settingsApiStatus.style.color = "var(--danger)";
    }
}

function handleClearApiKey() {
    state.apiKey = null;
    state.unlocked = false;
    dom.apiKeyInput.value = "";
    dom.apiKeyInput.type = "password";
    dom.toggleKeyVis.textContent = "SHOW";

    dom.mainFeature.classList.remove("main-feature-visible");
    dom.mainFeature.classList.add("main-feature-hidden");

    dom.analysisSection.classList.add("hidden");
    dom.optionsSection.classList.add("hidden");
    dom.finalSection.classList.add("hidden");

    showGateMsg("", "");

    try {
        localStorage.removeItem("vf_api_key");
    } catch (_) {
        // ignore
    }

    setStatus("ready", "SYSTEM READY");
    updateSettingsPanel();
    showToast("API Key dihapus.", "info");
}

function handleClearHistory() {
    state.history = [];
    saveHistoryToStorage();
    renderHistory();
    showToast("Semua history dihapus.", "info");
}