// ==UserScript==
// @name         X.com Auto-Feed
// @namespace    http://tampermonkey.net/
// @version      4.8
// @description  Safely likes/retweets/bookmarks tweets in Feeds/Lists with VERIFIED actions, RANDOMISED session volume, consecutive-failure throttle detection, DIRECTION-AWARE progressive scrolling, FOLDED config + PINNED console/controls, background-tab keep-alive, virtualisation-proof dedupe, end-of-feed + privacy-blocker detection, FLOATING/draggable UI, ADVANCED HUMAN-LIKE RANDOMIZER (dynamic attention drift), and ANIMATED UI feedback. (CSP-Proof)
// @author       Esrevorter
// @match        https://x.com/home
// @match        https://x.com/i/lists/*
// @match        https://twitter.com/i/lists/*
// @match        https://x.com/*/lists/*
// @match        https://twitter.com/*/lists/*
// @grant        GM_addStyle
// @run-at       document-idle
// @inject-into  content
// ==/UserScript==

(function () {
    'use strict';

    const $ = (id) => document.getElementById(id);
    const SETTINGS_KEY = 'xAutoFeedSettingsV4';
    const POS_KEY = 'xAutoFeedPanelPosV4';

    // Safe bounds for the session volume range
    const VOL_ABS_MIN = 20;
    const VOL_ABS_MAX = 500;

    const DEFAULTS = {
        enableLike: true, enableRetweet: false, enableBookmark: false,
        randomizeActions: true,
        randomizeOrder: false,
        keepAliveSilent: true, keepAliveAudible: false,
        direction: 'down',
        minDelay: 4000, maxDelay: 9000,
        volMin: 50, volMax: 200,          // NEW: session volume range
    };

    // --- STATE ---
    const state = {
        isRunning: false, isPaused: false, bgMode: document.hidden,
        actionCount: 0, maxActions: 100,   // maxActions is now set randomly per session
        enableLike: true, enableRetweet: false, enableBookmark: false,
        randomizeActions: true,
        randomizeOrder: false,
        keepAliveSilent: true, keepAliveAudible: false,
        direction: 'down',
        minDelay: 4000, maxDelay: 9000,
        volMin: 50, volMax: 200,           // NEW
        likeCount: 0, rtCount: 0, bmCount: 0,
        processedIds: new Set(),
        emptyStreak: 0, privacyWarned: false,
        consecutiveFailures: 0,
        audioCtx: null, silentNode: null, silentGain: null, audibleTimer: null,
        focusLevel: 0.5,
    };

    function loadSettings() {
        try { return Object.assign({}, DEFAULTS, JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}')); }
        catch (e) { return Object.assign({}, DEFAULTS); }
    }

    function persistSettings() {
        try {
            localStorage.setItem(SETTINGS_KEY, JSON.stringify({
                enableLike: $('chk-like').checked,
                enableRetweet: $('chk-rt').checked,
                enableBookmark: $('chk-bm').checked,
                randomizeActions: $('tgl-random').classList.contains('x-on'),
                randomizeOrder: $('tgl-randomizer').classList.contains('x-on'),
                keepAliveSilent: $('tgl-silent').classList.contains('x-on'),
                keepAliveAudible: $('tgl-audible').classList.contains('x-on'),
                direction: state.direction,
                minDelay: parseInt($('inp-min').value) || 4000,
                maxDelay: parseInt($('inp-max').value) || 9000,
                volMin: clampVol(parseInt($('inp-vol-min').value) || 50),
                volMax: clampVol(parseInt($('inp-vol-max').value) || 200),
            }));
        } catch (e) {}
        refreshFoldSummaries();
    }

    function clampVol(v) { return Math.max(VOL_ABS_MIN, Math.min(VOL_ABS_MAX, v)); }

    // Roll a random session target within the configured range
    function rollSessionTarget() {
        const// ==UserScript==
// @name         X.com Auto-Feed
// @namespace    http://tampermonkey.net/
// @version      4.8
// @description  Safely likes/retweets/bookmarks tweets in Feeds/Lists with VERIFIED actions, consecutive-failure throttle detection, DIRECTION-AWARE progressive scrolling, FOLDED config + PINNED console/controls, background-tab keep-alive, virtualisation-proof dedupe, end-of-list + privacy-blocker detection, FLOATING/draggable UI, ADVANCED HUMAN-LIKE RANDOMIZER (dynamic attention drift), RANDOMISED SESSION TARGETS, and ANIMATED UI feedback. (CSP-Proof)
// @author       Esrevorter
// @match        https://x.com/home
// @match        https://x.com/i/lists/*
// @match        https://twitter.com/i/lists/*
// @match        https://x.com/*/lists/*
// @match        https://twitter.com/*/lists/*
// @grant        GM_addStyle
// @run-at       document-idle
// @inject-into  content
// ==/UserScript==

(function () {
    'use strict';

    const $ = (id) => document.getElementById(id);
    const SETTINGS_KEY = 'xAutoFeedSettingsV4';
    const POS_KEY = 'xAutoFeedPanelPosV4';

    const DEFAULTS = {
        enableLike: true, enableRetweet: false, enableBookmark: false,
        randomizeActions: true,
        randomizeOrder: false,
        keepAliveSilent: true, keepAliveAudible: false,
        direction: 'down',
        minDelay: 4000, maxDelay: 9000,
        minTweets: 50, maxTweets: 200,   // Humanised session target range
    };

    // --- STATE ---
    const state = {
        isRunning: false, isPaused: false, bgMode: document.hidden,
        actionCount: 0, maxActions: 100,
        enableLike: true, enableRetweet: false, enableBookmark: false,
        randomizeActions: true,
        randomizeOrder: false,
        keepAliveSilent: true, keepAliveAudible: false,
        direction: 'down',
        minDelay: 4000, maxDelay: 9000,
        minTweets: 50, maxTweets: 200,
        likeCount: 0, rtCount: 0, bmCount: 0,
        processedIds: new Set(),
        emptyStreak: 0, privacyWarned: false,
        consecutiveFailures: 0,
        audioCtx: null, silentNode: null, silentGain: null, audibleTimer: null,
        focusLevel: 0.5,
    };

    function loadSettings() {
        try { return Object.assign({}, DEFAULTS, JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}')); }
        catch (e) { return Object.assign({}, DEFAULTS); }
    }

    function persistSettings() {
        try {
            localStorage.setItem(SETTINGS_KEY, JSON.stringify({
                enableLike: $('chk-like').checked,
                enableRetweet: $('chk-rt').checked,
                enableBookmark: $('chk-bm').checked,
                randomizeActions: $('tgl-random').classList.contains('x-on'),
                randomizeOrder: $('tgl-randomizer').classList.contains('x-on'),
                keepAliveSilent: $('tgl-silent').classList.contains('x-on'),
                keepAliveAudible: $('tgl-audible').classList.contains('x-on'),
                direction: state.direction,
                minDelay: parseInt($('inp-min').value) || 4000,
                maxDelay: parseInt($('inp-max').value) || 9000,
                minTweets: parseInt($('inp-tmin').value) || 50,
                maxTweets: parseInt($('inp-tmax').value) || 200,
            }));
        } catch (e) {}
        refreshFoldSummaries();
    }

    function loadPanelPos() { try { return JSON.parse(localStorage.getItem(POS_KEY) || 'null'); } catch (e) { return null; } }
    function savePanelPos() {
        const p = $('x-auto-action-panel'); if (!p) return;
        const r = p.getBoundingClientRect();
        try {
            localStorage.setItem(POS_KEY, JSON.stringify({
                left: r.left, top: r.top, collapsed: p.classList.contains('x-collapsed'),
            }));
        } catch (e) {}
    }

    // --- CSS ---
    function injectStyles() {
        const css = `
            #x-auto-action-panel {
                position: fixed; bottom: 20px; right: 20px; z-index: 99999;
                background: #1e1e1e; color: #e7e9ea; border: 1px solid #333;
                border-radius: 12px; padding: 0;
                width: min(320px, calc(100vw - 16px));
                max-height: calc(100vh - 24px); max-height: min(680px, calc(100dvh - 24px));
                box-shadow: 0 8px 24px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.05);
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
                font-size: 13px; transition: opacity 0.3s; overflow: hidden;
                display: flex; flex-direction: column;
            }
            #x-auto-action-panel .x-body {
                display: flex; flex-direction: column; min-height: 0; flex: 1 1 auto;
                padding: 0 16px 12px;
            }
            #x-auto-action-panel.x-collapsed .x-body { display: none; }

            .x-folds { flex: 1 1 auto; min-height: 0; overflow-y: auto; margin: 0 -2px; padding: 0 2px; }
            .x-folds::-webkit-scrollbar, .x-log::-webkit-scrollbar { width: 6px; }
            .x-folds::-webkit-scrollbar-thumb, .x-log::-webkit-scrollbar-thumb { background: #3a3f43; border-radius: 3px; }
            .x-folds::-webkit-scrollbar-track, .x-log::-webkit-scrollbar-track { background: transparent; }
            .x-folds { scrollbar-width: thin; scrollbar-color: #3a3f43 transparent; }

            .x-footer { flex: 0 0 auto; padding-top: 8px; border-top: 1px solid rgba(255,255,255,0.08); }

            .x-header { display:flex; justify-content:space-between; align-items:center;
                padding: 12px 14px; border-bottom:1px solid #333; cursor: grab; user-select: none; flex: 0 0 auto;
                position: relative; overflow: hidden; }
            .x-header.x-grabbing { cursor: grabbing; }

            .x-header.x-scanning::after {
                content: ''; position: absolute; top: 0; left: -20%; width: 20%; height: 100%;
                background: linear-gradient(90deg, transparent, rgba(29,155,240,0.15), transparent);
                animation: xScan 2.5s ease-in-out infinite; pointer-events: none;
            }
            @keyframes xScan { 0% { left: -20%; } 100% { left: 120%; } }

            .x-title { color:#1d9bf0; font-size:14px; font-weight:bold; z-index: 1; }
            .x-hdr-right { display:flex; align-items:center; gap:6px; z-index: 1; }
            .x-status { background:#333; padding:2px 8px; border-radius:10px; font-size:11px; color:#e7e9ea; white-space:nowrap; }
            .x-icon-btn { background:#2f3336; border:1px solid #333; color:#e7e9ea; border-radius:6px;
                width:22px; height:22px; cursor:pointer; line-height:1; font-size:12px; padding:0; transition:background .15s; }
            .x-icon-btn:hover { background:#3a3f43; }

            .x-fold { border-top: 1px solid rgba(255,255,255,0.06); }
            .x-fold:first-child { border-top: none; }
            .x-fold-head { display:flex; align-items:center; gap:8px; padding:9px 6px; margin:0 -6px;
                border-radius:6px; cursor:pointer; user-select:none; transition:background .15s; }
            .x-fold-head:hover { background: rgba(255,255,255,0.035); }
            .x-fold-title { font-size:11px; color:#71767b; text-transform:uppercase; letter-spacing:0.5px; font-weight:700; }
            .x-fold-sum { font-size:10px; color:#8b98a5; text-transform:none; letter-spacing:0; font-weight:500;
                margin-left:auto; max-width:60%; text-align:right; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
            .x-fold-chev { color:#71767b; font-size:10px; transition:transform .25s ease; flex-shrink:0; }
            .x-fold.x-open .x-fold-chev { transform: rotate(180deg); }
            .x-fold-body { max-height:0; overflow:hidden; transition:max-height .28s ease; }
            .x-fold.x-open .x-fold-body { max-height:500px; }
            .x-fold-inner { padding: 2px 0 8px; }

            .x-mb-8 { margin-bottom:8px; } .x-mb-0 { margin-bottom:0; }
            .x-label { display:flex; align-items:center; cursor:pointer; margin-bottom:6px; }
            .x-checkbox { margin-right:8px; accent-color:#1d9bf0; width:15px; height:15px; }

            .x-seg { display:flex; gap:6px; }
            .x-seg-btn { flex:1; background:#2f3336; border:1px solid #333; color:#e7e9ea; border-radius:8px;
                padding:7px 4px; cursor:pointer; font-size:11px; font-weight:700; line-height:1.3; transition:background .15s, border-color .15s, transform .1s; }
            .x-seg-btn .x-seg-hint { display:block; font-weight:400; font-size:9px; color:#71767b; }
            .x-seg-btn:hover { background:#353a3e; }
            .x-seg-btn:active { transform: scale(0.96); }
            .x-seg-btn.x-seg-active { background:#1d9bf0; border-color:#1d9bf0; color:#fff; }
            .x-seg-btn.x-seg-active .x-seg-hint { color:#cfe9ff; }

            .x-delay-group { display:flex; gap:8px; }
            .x-delay-col { flex:1; }
            .x-delay-label { font-size:11px; color:#71767b; display:block; }
            .x-delay-input { width:100%; background:#2f3336; border:1px solid #333; color:white; border-radius:4px; padding:4px; margin-top:2px; box-sizing:border-box; }
            .x-delay-hint { font-size:9px; color:#536471; margin-top:2px; }

            .x-counter { margin-bottom:4px; font-size:12px; color:#71767b; display: flex; justify-content: space-between; }
            .x-count-val { color:#e7e9ea; font-weight:bold; }

            .x-progress-wrap { width: 100%; height: 6px; background: #2f3336; border-radius: 3px; margin-bottom: 8px; overflow: hidden; }
            .x-progress-bar { height: 100%; width: 0%; background: linear-gradient(90deg, #1d9bf0, #00ba7c); border-radius: 3px; transition: width 0.6s cubic-bezier(0.4, 0, 0.2, 1); }

            .x-action-counters { display:flex; gap:6px; margin-bottom:8px; }
            .x-action-chip { flex:1; text-align:center; padding:6px 4px; border-radius:8px; font-size:11px; font-weight:700; background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.06); transition: transform 0.2s ease, box-shadow 0.2s ease; }
            .x-chip-like { color:#f91880; } .x-chip-rt { color:#00ba7c; } .x-chip-bm { color:#1d9bf0; }
            .x-chip-val { font-size:16px; display:block; }

            @keyframes xChipBurst {
                0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(255,255,255,0.4); }
                40% { transform: scale(1.15); }
                100% { transform: scale(1); box-shadow: 0 0 15px 2px rgba(255,255,255,0); }
            }
            .x-action-chip.x-chip-anim { animation: xChipBurst 0.5s ease-out; }

            .x-btn-group { display:flex; gap:8px; }
            .x-btn { flex:1; color:white; border:none; border-radius:20px; padding:8px; cursor:pointer; font-weight:bold; font-size:13px;
                transition:transform .12s ease, filter .12s ease; }
            .x-btn:hover { filter:brightness(1.12); transform:translateY(-1px); }
            .x-btn:active { transform:translateY(0) scale(0.98); }
            .x-btn-start { background:#1d9bf0; } .x-btn-pause { background:#333; } .x-btn-resume { background:#f4212e; }

            .x-warning { margin-top:8px; background:#3a1c1c; border:1px solid #f4212e; color:#f4212e; padding:8px; border-radius:6px; font-size:11px; text-align:center; }
            .x-hide { display:none !important; }
            .x-log { max-height:72px; overflow-y:auto; font-size:10px; color:#536471; padding:6px 8px; background:rgba(0,0,0,0.25); border-radius:6px; margin-top:8px; font-family:monospace; line-height:1.5; }

            @keyframes xSlideIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
            .x-log-entry { white-space:nowrap; overflow:hidden; text-overflow:ellipsis; animation: xSlideIn 0.3s ease-out; }

            .x-toggle-wrap { display:flex; align-items:center; justify-content:space-between; padding:5px 0; margin-bottom:2px; gap:8px; }
            .x-toggle-label { font-size:12px; color:#e7e9ea; }
            .x-toggle-sub { font-size:10px; color:#71767b; }
            .x-toggle { width:36px; height:20px; border-radius:10px; background:#38444d; position:relative; cursor:pointer; transition:background 0.3s, box-shadow 0.2s; flex-shrink:0; }
            .x-toggle.x-on { background:#1d9bf0; box-shadow: 0 0 8px rgba(29,155,240,0.4); }
            .x-toggle::after { content:''; position:absolute; top:2px; left:2px; width:16px; height:16px; border-radius:50%; background:#fff; transition:transform 0.3s cubic-bezier(0.5, 1.5, 0.5, 1); }
            .x-toggle.x-on::after { transform:translateX(16px); }

            .x-combo-preview { font-size:10px; color:#536471; padding:6px 8px; background:rgba(255,255,255,0.02); border-radius:6px; margin-top:4px; line-height:1.6; }

            @keyframes xbreath   { 0%,100%{ box-shadow:0 0 0 0 rgba(29,155,240,0.0); } 50%{ box-shadow:0 0 0 3px rgba(29,155,240,0.18); } }
            @keyframes xbreathbg { 0%,100%{ box-shadow:0 0 0 0 rgba(10,106,168,0.0); } 50%{ box-shadow:0 0 0 3px rgba(10,106,168,0.22); } }
            .x-status-running  { background:#1d9bf0 !important; animation: xbreath 2.6s ease-in-out infinite; }
            .x-status-runningbg{ background:#0a6aa8 !important; animation: xbreathbg 2.6s ease-in-out infinite; }
            .x-status-paused   { background:#71767b !important; }
            .x-status-blocked  { background:#f4212e !important; }
            .x-status-finished { background:#00ba7c !important; }
        `;
        if (typeof GM_addStyle !== 'undefined') GM_addStyle(css);
        else { const s = document.createElement('style'); s.textContent = css; document.head.appendChild(s); }
    }

    // --- UI ---
    function createUI() {
        injectStyles();
        const s = loadSettings();
        const panel = document.createElement('div');
        panel.id = 'x-auto-action-panel';
        panel.innerHTML = `
            <div class="x-header" id="x-drag-handle">
                <strong class="x-title">⚡ Auto-Feed</strong>
                <div class="x-hdr-right">
                    <span id="x-status" class="x-status">Idle</span>
                    <button id="x-collapse" class="x-icon-btn" title="Collapse / Expand">▾</button>
                </div>
            </div>
            <div class="x-body" id="x-body">
                <div class="x-folds" id="x-folds">
                    <div class="x-fold x-open" data-fold="actions">
                        <div class="x-fold-head">
                            <span class="x-fold-title">Actions</span>
                            <span class="x-fold-sum" id="sum-actions"></span>
                            <span class="x-fold-chev">▾</span>
                        </div>
                        <div class="x-fold-body"><div class="x-fold-inner">
                            <div class="x-mb-8">
                                <label class="x-label"><input type="checkbox" id="chk-like" class="x-checkbox">❤️ Likes</label>
                                <label class="x-label"><input type="checkbox" id="chk-rt" class="x-checkbox">🔁 Retweets</label>
                                <label class="x-label x-mb-0"><input type="checkbox" id="chk-bm" class="x-checkbox">🔖 Bookmarks</label>
                            </div>
                            <div class="x-toggle-wrap x-mb-0">
                                <div><div class="x-toggle-label">🎲 Random Combo</div>
                                <div class="x-toggle-sub">Random subset of enabled actions per tweet</div></div>
                                <div class="x-toggle x-on" id="tgl-random"></div>
                            </div>
                            <div class="x-toggle-wrap x-mb-0" style="margin-top: 8px; border-top: 1px solid rgba(255,255,255,0.06); padding-top: 8px;">
                                <div><div class="x-toggle-label">🔀 Randomizer</div>
                                <div class="x-toggle-sub">Shuffles order & dynamic attention drift</div></div>
                                <div class="x-toggle" id="tgl-randomizer"></div>
                            </div>
                            <div class="x-combo-preview" id="x-combo-preview"></div>
                        </div></div>
                    </div>
                    <div class="x-fold" data-fold="dir">
                        <div class="x-fold-head">
                            <span class="x-fold-title">Scroll direction</span>
                            <span class="x-fold-sum" id="sum-dir"></span>
                            <span class="x-fold-chev">▾</span>
                        </div>
                        <div class="x-fold-body"><div class="x-fold-inner">
                            <div class="x-seg" id="seg-dir">
                                <button type="button" class="x-seg-btn" data-dir="down">⬇️ Top→Down<span class="x-seg-hint">Feeds/Lists (newest first)</span></button>
                                <button type="button" class="x-seg-btn" data-dir="up">⬆️ Bottom→Up<span class="x-seg-hint">For‑You / backlog</span></button>
                            </div>
                        </div></div>
                    </div>
                    <div class="x-fold" data-fold="bg">
                        <div class="x-fold-head">
                            <span class="x-fold-title">Background tab</span>
                            <span class="x-fold-sum" id="sum-bg"></span>
                            <span class="x-fold-chev">▾</span>
                        </div>
                        <div class="x-fold-body"><div class="x-fold-inner">
                            <div class="x-toggle-wrap">
                                <div><div class="x-toggle-label">🔇 Silent keep-alive</div>
                                <div class="x-toggle-sub">No sound; defeats timer throttling on most builds</div></div>
                                <div class="x-toggle x-on" id="tgl-silent"></div>
                            </div>
                            <div class="x-toggle-wrap x-mb-0">
                                <div><div class="x-toggle-label">🔊 Audible ping</div>
                                <div class="x-toggle-sub">Faint blip ONLY while hidden — keeps rendering/IO alive</div></div>
                                <div class="x-toggle" id="tgl-audible"></div>
                            </div>
                        </div></div>
                    </div>
                    <div class="x-fold" data-fold="timing">
                        <div class="x-fold-head">
                            <span class="x-fold-title">Timing & Limits</span>
                            <span class="x-fold-sum" id="sum-timing"></span>
                            <span class="x-fold-chev">▾</span>
                        </div>
                        <div class="x-fold-body"><div class="x-fold-inner">
                            <div class="x-delay-group x-mb-8">
                                <div class="x-delay-col"><label class="x-delay-label">🎯 Min Tweets</label>
                                    <input type="number" id="inp-tmin" class="x-delay-input" value="50" min="10" max="1000"></div>
                                <div class="x-delay-col"><label class="x-delay-label">🎯 Max Tweets</label>
                                    <input type="number" id="inp-tmax" class="x-delay-input" value="200" min="10" max="1000"></div>
                            </div>
                            <div class="x-delay-hint x-mb-8">Random target picked each session within this range</div>
                            <div class="x-delay-group x-mb-0">
                                <div class="x-delay-col"><label class="x-delay-label">⏱️ Min Delay (ms)</label>
                                    <input type="number" id="inp-min" class="x-delay-input" value="4000"></div>
                                <div class="x-delay-col"><label class="x-delay-label">⏱️ Max Delay (ms)</label>
                                    <input type="number" id="inp-max" class="x-delay-input" value="9000"></div>
                            </div>
                        </div></div>
                    </div>
                </div>

                <div class="x-footer" id="x-footer">
                    <div class="x-counter">
                        <span>Total: <span id="x-count" class="x-count-val">0</span> / <span id="x-max" class="x-count-val">—</span></span>
                        <span id="x-percent" class="x-count-val" style="color: #1d9bf0;">0%</span>
                    </div>
                    <div class="x-progress-wrap"><div class="x-progress-bar" id="x-progress"></div></div>

                    <div class="x-action-counters">
                        <div class="x-action-chip x-chip-like" id="chip-like"><span class="x-chip-val" id="x-like-count">0</span>❤️</div>
                        <div class="x-action-chip x-chip-rt" id="chip-rt"><span class="x-chip-val" id="x-rt-count">0</span>🔁</div>
                        <div class="x-action-chip x-chip-bm" id="chip-bm"><span class="x-chip-val" id="x-bm-count">0</span>🔖</div>
                    </div>
                    <div class="x-btn-group">
                        <button id="btn-start" class="x-btn x-btn-start">Start</button>
                        <button id="btn-pause" class="x-btn x-btn-pause x-hide">Pause</button>
                        <button id="btn-resume" class="x-btn x-btn-resume x-hide">Resume</button>
                    </div>
                    <div id="x-warning" class="x-warning x-hide">⚠️ Rate Limit Detected! Wait 15+ mins before resuming.</div>
                    <div id="x-log" class="x-log"><div class="x-log-entry">🚀 Ready. Drag the header to move me.</div></div>
                </div>
            </div>
        `;
        document.body.appendChild(panel);

        $('chk-like').checked = s.enableLike;
        $('chk-rt').checked = s.enableRetweet;
        $('chk-bm').checked = s.enableBookmark;
        $('tgl-random').classList.toggle('x-on', s.randomizeActions);
        $('tgl-randomizer').classList.toggle('x-on', s.randomizeOrder);
        $('tgl-silent').classList.toggle('x-on', s.keepAliveSilent);
        $('tgl-audible').classList.toggle('x-on', s.keepAliveAudible);
        $('inp-min').value = s.minDelay;
        $('inp-max').value = s.maxDelay;
        $('inp-tmin').value = s.minTweets;
        $('inp-tmax').value = s.maxTweets;

        state.randomizeActions = s.randomizeActions;
        state.randomizeOrder = s.randomizeOrder;
        state.keepAliveSilent = s.keepAliveSilent;
        state.keepAliveAudible = s.keepAliveAudible;
        state.minTweets = s.minTweets;
        state.maxTweets = s.maxTweets;
        state.direction = (s.direction === 'up') ? 'up' : 'down';
        $('seg-dir').querySelectorAll('.x-seg-btn').forEach(b =>
            b.classList.toggle('x-seg-active', b.getAttribute('data-dir') === state.direction));

        const pos = loadPanelPos();
        if (pos) {
            panel.style.left = pos.left + 'px';
            panel.style.top = pos.top + 'px';
            panel.style.right = 'auto';
            panel.style.bottom = 'auto';
            if (pos.collapsed) { panel.classList.add('x-collapsed'); $('x-collapse').textContent = '▸'; }
        }

        setupEventListeners();
        updateComboPreview();
        refreshFoldSummaries();
    }

    function refreshFoldSummaries() {
        const a = $('sum-actions'), d = $('sum-dir'), b = $('sum-bg'), t = $('sum-timing');
        if (a) {
            const em = [];
            if ($('chk-like').checked) em.push('❤️');
            if ($('chk-rt').checked) em.push('🔁');
            if ($('chk-bm').checked) em.push('🔖');
            const rnd = $('tgl-random').classList.contains('x-on');
            const rndOrd = $('tgl-randomizer').classList.contains('x-on');
            let sum = (em.length ? em.join(' ') : 'none') + ' · ' + (rnd ? 'random combo' : 'all');
            if (rndOrd) sum += ' · 🔀 drift';
            a.textContent = sum;
        }
        if (d) d.textContent = state.direction === 'down' ? '⬇️ top→down' : '⬆️ bottom→up';
        if (b) b.textContent = '🔇' + (state.keepAliveSilent ? 'on' : 'off') + ' · 🔊' + (state.keepAliveAudible ? 'on' : 'off');
        if (t) {
            const tmin = $('inp-tmin').value || 50;
            const tmax = $('inp-tmax').value || 200;
            const dmin = $('inp-min').value || 4000;
            const dmax = $('inp-max').value || 9000;
            t.textContent = '🎯' + tmin + '–' + tmax + ' · ⏱️' + dmin + '–' + dmax + 'ms';
        }
    }

    function setupEventListeners() {
        const bindToggle = (id, key, after) => {
            $(id).addEventListener('click', function () {
                state[key] = !state[key];
                this.classList.toggle('x-on', state[key]);
                persistSettings();
                if (after) after();
            });
        };
        bindToggle('tgl-random', 'randomizeActions', updateComboPreview);
        bindToggle('tgl-randomizer', 'randomizeOrder', refreshFoldSummaries);
        bindToggle('tgl-silent', 'keepAliveSilent', refreshKeepAlive);
        bindToggle('tgl-audible', 'keepAliveAudible', refreshKeepAlive);
        ['chk-like', 'chk-rt', 'chk-bm'].forEach(id => $(id).addEventListener('change', () => { persistSettings(); updateComboPreview(); }));
        ['inp-min', 'inp-max', 'inp-tmin', 'inp-tmax'].forEach(id => $(id).addEventListener('change', persistSettings));

        $('x-folds').addEventListener('click', (e) => {
            const head = e.target.closest('.x-fold-head'); if (!head) return;
            head.parentElement.classList.toggle('x-open');
        });

        $('seg-dir').addEventListener('click', (e) => {
            const b = e.target.closest('.x-seg-btn'); if (!b) return;
            state.direction = b.getAttribute('data-dir');
            $('seg-dir').querySelectorAll('.x-seg-btn').forEach(x => x.classList.toggle('x-seg-active', x === b));
            persistSettings();
            addLog('🧭 Direction → ' + (state.direction === 'down' ? '⬇️ top→down' : '⬆️ bottom→up'));
        });

        $('x-collapse').addEventListener('click', (e) => {
            e.stopPropagation();
            const p = $('x-auto-action-panel');
            p.classList.toggle('x-collapsed');
            $('x-collapse').textContent = p.classList.contains('x-collapsed') ? '▸' : '▾';
            savePanelPos();
        });

        const handle = $('x-drag-handle');
        const panel = $('x-auto-action-panel');
        let dragging = false, ox = 0, oy = 0;
        handle.addEventListener('pointerdown', (e) => {
            if (e.target.closest('.x-icon-btn') || e.target.closest('#x-status')) return;
            dragging = true; handle.classList.add('x-grabbing');
            const r = panel.getBoundingClientRect();
            panel.style.left = r.left + 'px'; panel.style.top = r.top + 'px';
            panel.style.right = 'auto'; panel.style.bottom = 'auto';
            ox = e.clientX - r.left; oy = e.clientY - r.top;
            try { handle.setPointerCapture(e.pointerId); } catch (err) {}
            e.preventDefault();
        });
        handle.addEventListener('pointermove', (e) => {
            if (!dragging) return;
            const r = panel.getBoundingClientRect();
            let nx = Math.max(0, Math.min(window.innerWidth - r.width, e.clientX - ox));
            let ny = Math.max(0, Math.min(window.innerHeight - r.height, e.clientY - oy));
            panel.style.left = nx + 'px'; panel.style.top = ny + 'px';
        });
        const endDrag = () => { if (!dragging) return; dragging = false; handle.classList.remove('x-grabbing'); savePanelPos(); };
        handle.addEventListener('pointerup', endDrag);
        handle.addEventListener('pointercancel', endDrag);

        $('btn-start').addEventListener('click', () => {
            state.enableLike = $('chk-like').checked;
            state.enableRetweet = $('chk-rt').checked;
            state.enableBookmark = $('chk-bm').checked;
            state.minDelay = parseInt($('inp-min').value) || 4000;
            state.maxDelay = parseInt($('inp-max').value) || 9000;
            state.minTweets = Math.max(10, parseInt($('inp-tmin').value) || 50);
            state.maxTweets = Math.max(state.minTweets, parseInt($('inp-tmax').value) || 200);
            persistSettings();

            if (!state.enableLike && !state.enableRetweet && !state.enableBookmark) {
                alert('Please enable at least one action (Like, Retweet, or Bookmark).'); return;
            }
            if ($('btn-start').innerText === 'Restart') {
                state.actionCount = 0; state.likeCount = 0; state.rtCount = 0; state.bmCount = 0;
                state.processedIds.clear();
                document.querySelectorAll('[data-testid="tweet"][data-processed="true"]')
                    .forEach(t => t.removeAttribute('data-processed'));
                updateActionChips();
                $('x-progress').style.width = '0%';
                $('x-percent').innerText = '0%';
                $('btn-start').innerText = 'Start';
            }
            state.emptyStreak = 0;
            state.privacyWarned = false;
            state.consecutiveFailures = 0;
            state.focusLevel = 0.5 + (Math.random() * 0.4);

            // --- HUMANISED SESSION TARGET ---
            // Pick a random target within the user-defined range each session
            state.maxActions = Math.floor(Math.random() * (state.maxTweets - state.minTweets + 1)) + state.minTweets;
            $('x-max').innerText = state.maxActions;

            ensureAudio();
            state.isRunning = true; state.isPaused = false;

            if (state.direction === 'down') goTop(); else goBottom();

            document.querySelectorAll('#x-auto-action-panel .x-fold').forEach(f => f.classList.remove('x-open'));

            updateUIState('RUNNING'); refreshKeepAlive();
            addLog('▶️ Started — ' + getEnabledActionsLabel() +
                   ' | 🎯 target: ' + state.maxActions + ' tweets' +
                   ' | ' + (state.direction === 'down' ? '⬇️ top→down' : '⬆️ bottom→up') +
                   (state.randomizeOrder ? ' | 🔀 Drift ON' : ''));
            mainLoop();
        });

        $('btn-pause').addEventListener('click', () => {
            state.isPaused = true; updateUIState('PAUSED'); refreshKeepAlive(); addLog('⏸️ Paused');
        });
        $('btn-resume').addEventListener('click', () => {
            state.isPaused = false; state.consecutiveFailures = 0;
            $('x-warning').classList.add('x-hide');
            ensureAudio(); updateUIState('RUNNING'); refreshKeepAlive();
            addLog('▶️ Resumed'); mainLoop();
        });

        document.addEventListener('visibilitychange', () => {
            state.bgMode = document.hidden;
            if (!state.isRunning) return;
            if (document.hidden) {
                addLog('👁️ Tab hidden → background mode (keep-alive active)');
                refreshKeepAlive();
            } else {
                addLog('👁️ Tab visible → nudging loader in current direction');
                stepReveal();
                refreshKeepAlive();
            }
            refreshStatus();
        });
    }

    // --- COMBO ---
    function updateComboPreview() {
        const el = $('x-combo-preview'); if (!el) return;
        const like = $('chk-like').checked, rt = $('chk-rt').checked, bm = $('chk-bm').checked;
        const random = $('tgl-random').classList.contains('x-on');
        const avail = []; if (like) avail.push('❤️'); if (rt) avail.push('🔁'); if (bm) avail.push('🔖');
        if (!avail.length) { el.textContent = 'No actions selected.'; return; }
        if (!random) { el.textContent = 'Mode: ALL → ' + avail.join(' + ') + ' on every tweet'; return; }
        const combos = getAllCombos(avail);
        el.innerHTML = '<strong>' + combos.length + ' possible combos:</strong><br>' + combos.map(c => c.join('+')).join(' &nbsp;|&nbsp; ');
    }
    function getAllCombos(items) {
        const out = [];
        for (let m = 1; m < (1 << items.length); m++) {
            const sub = []; for (let i = 0; i < items.length; i++) if (m & (1 << i)) sub.push(items[i]);
            out.push(sub);
        }
        return out;
    }
    function pickActionCombo() {
        const avail = [];
        if (state.enableLike) avail.push('like');
        if (state.enableRetweet) avail.push('retweet');
        if (state.enableBookmark) avail.push('bookmark');
        if (!avail.length) return [];
        if (!state.randomizeActions) return avail;
        const combos = getAllCombos(avail);
        return combos[Math.floor(Math.random() * combos.length)];
    }

    // --- UI STATE ---
    function refreshStatus() { if (!state.isRunning || state.isPaused) return; updateUIState('RUNNING'); }

    function updateUIState(status) {
        const statusEl = $('x-status');
        const btnStart = $('btn-start'), btnPause = $('btn-pause'), btnResume = $('btn-resume'), warn = $('x-warning');
        const header = $('x-drag-handle');
        const progress = $('x-progress');
        const percent = $('x-percent');

        $('x-count').innerText = state.actionCount;

        const pct = state.maxActions > 0 ? Math.min(100, Math.round((state.actionCount / state.maxActions) * 100)) : 0;
        progress.style.width = pct + '%';
        percent.innerText = pct + '%';

        statusEl.classList.remove('x-status-running', 'x-status-runningbg', 'x-status-paused', 'x-status-blocked', 'x-status-finished');
        header.classList.remove('x-scanning');

        if (status === 'RUNNING') {
            const bg = state.bgMode;
            statusEl.innerText = bg ? 'Running (BG)' : 'Running';
            statusEl.classList.add(bg ? 'x-status-runningbg' : 'x-status-running');
            header.classList.add('x-scanning');
            btnStart.classList.add('x-hide'); btnPause.classList.remove('x-hide'); btnResume.classList.add('x-hide'); warn.classList.add('x-hide');
        } else if (status === 'PAUSED') {
            statusEl.innerText = 'Paused'; statusEl.classList.add('x-status-paused');
            btnStart.classList.add('x-hide'); btnPause.classList.add('x-hide'); btnResume.classList.remove('x-hide');
        } else if (status === 'RATE_LIMIT') {
            statusEl.innerText = 'Blocked'; statusEl.classList.add('x-status-blocked');
            btnStart.classList.add('x-hide'); btnPause.classList.add('x-hide'); btnResume.classList.remove('x-hide');
            warn.innerHTML = '⚠️ Rate Limit Detected! Wait 15+ mins before resuming.'; warn.classList.remove('x-hide');
        } else if (status === 'ACTION_FAIL') {
            statusEl.innerText = 'Failing'; statusEl.classList.add('x-status-blocked');
            btnStart.classList.add('x-hide'); btnPause.classList.add('x-hide'); btnResume.classList.remove('x-hide');
            warn.innerHTML = `🛑 Actions aren't registering. Usually a privacy/ad-blocker blocking X's requests or a soft throttle. Disable blockers for x.com / wait a few minutes, then Resume.`;
            warn.classList.remove('x-hide');
        } else if (status === 'PRIVACY_BLOCK') {
            statusEl.innerText = 'Blocked'; statusEl.classList.add('x-status-blocked');
            btnStart.classList.add('x-hide'); btnPause.classList.add('x-hide'); btnResume.classList.remove('x-hide');
            warn.innerHTML = '🧩 X says a privacy/ad-blocker is breaking the page. Disable it for x.com, then Resume.';
            warn.classList.remove('x-hide');
        } else if (status === 'EXHAUSTED') {
            statusEl.innerText = 'End of feed'; statusEl.classList.add('x-status-finished');
            btnStart.classList.remove('x-hide'); btnStart.innerText = 'Restart';
            btnPause.classList.add('x-hide'); btnResume.classList.add('x-hide');
            state.isRunning = false; refreshKeepAlive();
        } else if (status === 'FINISHED') {
            statusEl.innerText = 'Finished'; statusEl.classList.add('x-status-finished');
            btnStart.classList.remove('x-hide'); btnStart.innerText = 'Restart';
            btnPause.classList.add('x-hide'); btnResume.classList.add('x-hide');
            state.isRunning = false; refreshKeepAlive();
            addLog('✅ Finished! ' + state.actionCount + ' tweets processed (target was ' + state.maxActions + ').');
        }
    }

    function updateActionChips() {
        $('x-like-count').innerText = state.likeCount;
        $('x-rt-count').innerText = state.rtCount;
        $('x-bm-count').innerText = state.bmCount;
    }

    function popChip(chipId) {
        const chip = $(chipId);
        if (!chip) return;
        chip.classList.remove('x-chip-anim');
        void chip.offsetWidth;
        chip.classList.add('x-chip-anim');
    }

    function addLog(msg) {
        const logEl = $('x-log'); if (!logEl) return;
        const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        const e = document.createElement('div'); e.className = 'x-log-entry';
        e.textContent = '[' + time + '] ' + msg; logEl.appendChild(e); logEl.scrollTop = logEl.scrollHeight;
        while (logEl.children.length > 40) logEl.removeChild(logEl.firstChild);
    }
    function getEnabledActionsLabel() {
        const p = [];
        if (state.enableLike) p.push('❤️'); if (state.enableRetweet) p.push('🔁'); if (state.enableBookmark) p.push('🔖');
        return p.join('+') + (state.randomizeActions ? ' (random combo)' : ' (all)');
    }
    const ACTION_EMOJI = { like: '❤️', retweet: '🔁', bookmark: '🔖' };

    // --- HELPERS ---
    const sleep = (min, max) => new Promise(r => setTimeout(r, Math.floor(Math.random() * (max - min + 1)) + min));

    const shuffleArray = (array) => {
        const arr = [...array];
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
        return arr;
    };

    const waitForElement = (sel, timeout = 3000) => new Promise(resolve => {
        const el = document.querySelector(sel); if (el) return resolve(el);
        const obs = new MutationObserver(() => { const t = document.querySelector(sel); if (t) { obs.disconnect(); resolve(t); } });
        obs.observe(document.body, { childList: true, subtree: true });
        setTimeout(() => { obs.disconnect(); resolve(null); }, timeout);
    });

    const waitFor = (pred, timeout = 1500) => new Promise(res => {
        if (pred()) return res(true);
        const obs = new MutationObserver(() => { if (pred()) { obs.disconnect(); res(true); } });
        obs.observe(document.body, { childList: true, subtree: true, attributes: true,
            attributeFilter: ['data-testid', 'aria-label', 'aria-pressed'] });
        setTimeout(() => { obs.disconnect(); res(pred()); }, timeout);
    });

    function isRateLimited() {
        if (document.querySelector('iframe[src*="captcha"]')) return true;
        const modal = document.querySelector('[data-testid="error-detail"], [role="dialog"]');
        if (modal) {
            const txt = (modal.innerText || '').toLowerCase();
            if (/rate ?limit|too many|limit exceeded|hourly limit|daily limit/.test(txt)) return true;
        }
        return false;
    }
    function privacyBlockDetected() {
        const t = document.body.innerText.toLowerCase();
        return t.includes('privacy related extensions') || t.includes('privacy-related extensions');
    }

    // --- SCROLL ENGINE ---
    function firstTweet() { const t = document.querySelectorAll('[data-testid="tweet"]'); return t.length ? t[0] : null; }
    function lastTweet() { const t = document.querySelectorAll('[data-testid="tweet"]'); return t.length ? t[t.length - 1] : null; }

    function goTop() {
        const ft = firstTweet();
        if (ft) try { ft.scrollIntoView({ behavior: 'auto', block: 'start' }); } catch (e) {}
        const dse = document.scrollingElement || document.documentElement;
        dse.scrollTop = 0; try { window.scrollTo(0, 0); } catch (e) {}
        window.dispatchEvent(new Event('scroll')); document.dispatchEvent(new Event('scroll'));
    }
    function goBottom() {
        const lt = lastTweet();
        if (lt) try { lt.scrollIntoView({ behavior: 'auto', block: 'end' }); } catch (e) {}
        const dse = document.scrollingElement || document.documentElement;
        dse.scrollTop = dse.scrollHeight; try { window.scrollTo(0, dse.scrollHeight); } catch (e) {}
        window.dispatchEvent(new Event('scroll')); document.dispatchEvent(new Event('scroll'));
    }
    function stepReveal() {
        if (state.direction === 'down') {
            const lt = lastTweet();
            if (lt) try { lt.scrollIntoView({ behavior: 'auto', block: 'start' }); } catch (e) {}
        } else {
            const ft = firstTweet();
            if (ft) try { ft.scrollIntoView({ behavior: 'auto', block: 'end' }); } catch (e) {}
        }
        clickLoadMore();
        window.dispatchEvent(new Event('scroll')); document.dispatchEvent(new Event('scroll'));
    }
    function clickLoadMore() {
        const btns = document.querySelectorAll('[role="button"], button');
        for (const b of btns) {
            const t = (b.innerText || '').trim();
            if (/^(show|load)\s+(more|older|newer|tweets|posts|replies)/i.test(t) ||
                /new (tweets|posts) are available/i.test(t)) {
                b.click(); addLog('🔘 Clicked loader: "' + t + '"'); return true;
            }
        }
        return false;
    }

    // --- KEEP-ALIVE AUDIO ---
    function ensureAudio() {
        if (state.audioCtx) { if (state.audioCtx.state === 'suspended') state.audioCtx.resume().catch(() => {}); return state.audioCtx; }
        try { const Ctx = window.AudioContext || window.webkitAudioContext; if (Ctx) state.audioCtx = new Ctx(); } catch (e) {}
        return state.audioCtx;
    }
    function startSilent() {
        const ctx = ensureAudio(); if (!ctx || state.silentNode) return;
        try {
            const src = ctx.createConstantSource();
            const g = ctx.createGain(); g.gain.value = 0.001;
            src.connect(g); g.connect(ctx.destination); src.start();
            state.silentNode = src; state.silentGain = g;
        } catch (e) {}
    }
    function stopSilent() { try { if (state.silentNode) state.silentNode.stop(); } catch (e) {} state.silentNode = null; }
    function startAudible() {
        if (state.audibleTimer) return;
        const ctx = ensureAudio(); if (!ctx) return;
        const blip = () => {
            try {
                const o = ctx.createOscillator(), g = ctx.createGain();
                o.type = 'sine'; o.frequency.value = 880;
                g.gain.setValueAtTime(0.0001, ctx.currentTime);
                g.gain.exponentialRampToValueAtTime(0.03, ctx.currentTime + 0.01);
                g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.05);
                o.connect(g); g.connect(ctx.destination); o.start(); o.stop(ctx.currentTime + 0.06);
            } catch (e) {}
        };
        blip();
        state.audibleTimer = setInterval(() => {
            if (document.hidden && state.isRunning && !state.isPaused) blip();
        }, 6000);
    }
    function stopAudible() { if (state.audibleTimer) { clearInterval(state.audibleTimer); state.audibleTimer = null; } }
    function refreshKeepAlive() {
        const active = state.isRunning && !state.isPaused;
        if (state.keepAliveSilent && active) startSilent(); else stopSilent();
        if (state.keepAliveAudible && active && document.hidden) startAudible(); else stopAudible();
    }

    // --- ACTIONS ---
    async function doLike(tweet) {
        const hasLike = !!tweet.querySelector('[data-testid="like"]');
        const hasUnlike = !!tweet.querySelector('[data-testid="unlike"]');
        if (!hasLike && !hasUnlike) return 0;
        if (hasUnlike) return 0;
        const btn = tweet.querySelector('[data-testid="like"]');
        btn.scrollIntoView({ behavior: 'auto', block: 'center' }); await sleep(400, 900);
        btn.click();
        const ok = await waitFor(() => !!tweet.querySelector('[data-testid="unlike"]'), 1500);
        if (ok) { state.likeCount++; popChip('chip-like'); return 1; }
        return -1;
    }
    async function doRetweet(tweet) {
        const hasRT = !!tweet.querySelector('[data-testid="retweet"]');
        const hasUnRT = !!tweet.querySelector('[data-testid="unretweet"]');
        if (!hasRT && !hasUnRT) return 0;
        if (hasUnRT) return 0;
        const btn = tweet.querySelector('[data-testid="retweet"]');
        btn.scrollIntoView({ behavior: 'auto', block: 'center' }); await sleep(400, 900);
        btn.click();
        const confirm = await waitForElement('[data-testid="retweetConfirm"]', 2000);
        if (!confirm) return -1;
        confirm.click();
        const ok = await waitFor(() => !!tweet.querySelector('[data-testid="unretweet"]'), 1500);
        if (ok) { state.rtCount++; popChip('chip-rt'); return 1; }
        return -1;
    }
    function bmIsSet(tweet) {
        if (tweet.querySelector('[data-testid="removeBookmark"]')) return true;
        const b = tweet.querySelector('[data-testid="bookmark"]');
        if (b && (b.getAttribute('aria-label') || '').toLowerCase().includes('remove')) return true;
        return false;
    }
    async function doBookmark(tweet) {
        const hasBtn = !!tweet.querySelector('[data-testid="bookmark"]') || !!tweet.querySelector('[data-testid="removeBookmark"]');
        if (!hasBtn) return 0;
        if (bmIsSet(tweet)) return 0;
        const btn = tweet.querySelector('[data-testid="bookmark"]');
        if (!btn) return 0;
        btn.scrollIntoView({ behavior: 'auto', block: 'center' }); await sleep(400, 900);
        btn.click();
        const ok = await waitFor(() => bmIsSet(tweet), 1500);
        if (ok) { state.bmCount++; popChip('chip-bm'); return 1; }
        return -1;
    }
    function tweetId(tweet) {
        const a = tweet.querySelector('a[href*="/status/"]');
        if (!a) return null;
        const m = a.href.match(/status\/(\d+)/);
        return m ? m[1] : null;
    }

    // --- MAIN LOOP ---
    async function mainLoop() {
        await sleep(1200, 1800);

        while (state.isRunning) {
            if (state.isPaused) { await sleep(1000, 1000); continue; }

            if (privacyBlockDetected() && !state.privacyWarned) {
                state.privacyWarned = true; state.isPaused = true;
                updateUIState('PRIVACY_BLOCK'); refreshKeepAlive();
                addLog('🧩 Privacy/ad-blocker is breaking X — disable it for x.com, then Resume.');
                continue;
            }
            if (isRateLimited()) {
                state.isPaused = true; updateUIState('RATE_LIMIT'); refreshKeepAlive();
                addLog('🚦 Rate limit detected — pausing.'); continue;
            }
            if (state.actionCount >= state.maxActions) { updateUIState('FINISHED'); break; }

            const tweets = Array.from(document.querySelectorAll('[data-testid="tweet"]')).filter(t => t.isConnected);
            let fresh = tweets.filter(t => { const id = tweetId(t); return id && !state.processedIds.has(id); });

            if (state.direction === 'up' && !state.randomizeOrder) {
                fresh.reverse();
            }

            if (state.randomizeOrder) {
                fresh = shuffleArray(fresh);
            }

            if (fresh.length === 0) {
                state.emptyStreak++;
                stepReveal();
                if (state.emptyStreak >= 12 && !state.bgMode) {
                    updateUIState('EXHAUSTED');
                    addLog('🏁 No more pages from X — likely the real end of the feed.');
                    break;
                }
                if (state.emptyStreak === 1 || state.emptyStreak % 5 === 0) {
                    addLog('📜 No new tweets (streak ' + state.emptyStreak + ') — ' +
                           (state.bgMode ? 'BG: IO asleep, use audible ping or a dedicated window'
                                         : (state.direction === 'down' ? 'stepping down' : 'stepping up')) + '...');
                }
                await sleep(1500, 2500);
                continue;
            }
            state.emptyStreak = 0;

            let pausedOrDone = false;
            for (const tweet of fresh) {
                if (!state.isRunning || state.isPaused) { pausedOrDone = true; break; }
                if (state.actionCount >= state.maxActions) { pausedOrDone = true; break; }
                if (privacyBlockDetected()) {
                    state.privacyWarned = true; state.isPaused = true; pausedOrDone = true;
                    updateUIState('PRIVACY_BLOCK'); refreshKeepAlive();
                    addLog('🧩 Privacy/ad-blocker broke X mid-run — disable it for x.com, then Resume.'); break;
                }
                if (isRateLimited()) {
                    state.isPaused = true; pausedOrDone = true;
                    updateUIState('RATE_LIMIT'); refreshKeepAlive();
                    addLog('🚦 Rate limit mid-batch — pausing.'); break;
                }
                if (!tweet.isConnected) continue;
                const id = tweetId(tweet);
                if (!id || state.processedIds.has(id)) continue;

                if (state.randomizeOrder) {
                    if (Math.random() < 0.15) {
                        state.focusLevel += (Math.random() - 0.5) * 0.6;
                        state.focusLevel = Math.max(0.1, Math.min(0.95, state.focusLevel));
                    }
                    const dynamicSkipChance = 0.50 - (state.focusLevel * 0.45);
                    if (Math.random() < dynamicSkipChance) {
                        state.processedIds.add(id);
                        tweet.setAttribute('data-processed', 'true');
                        addLog('👀 Skipped (attention drift)');
                        await sleep(state.minDelay, state.maxDelay);
                        continue;
                    }
                }

                const combo = pickActionCombo();
                if (!combo.length) {
                    state.processedIds.add(id);
                    tweet.setAttribute('data-processed', 'true');
                    continue;
                }

                if (state.randomizeOrder) {
                    await sleep(300, 1200);
                }

                const performed = []; let failed = 0;
                for (const act of combo) {
                    let r = 0;
                    if (act === 'like') r = await doLike(tweet);
                    else if (act === 'retweet') r = await doRetweet(tweet);
                    else if (act === 'bookmark') r = await doBookmark(tweet);
                    if (r === 1) performed.push(ACTION_EMOJI[act]);
                    else if (r === -1) failed++;
                    if (combo.length > 1) await sleep(800, 1500);
                }

                if (performed.length) {
                    state.consecutiveFailures = 0;
                    state.processedIds.add(id);
                    tweet.setAttribute('data-processed', 'true');
                    state.actionCount++; updateUIState('RUNNING'); updateActionChips();
                    addLog('🎲 ' + performed.join('+') + ' → tweet #' + state.actionCount);
                } else if (failed > 0) {
                    state.consecutiveFailures++;
                    addLog('⚠️ action did not register (consecutive ' + state.consecutiveFailures + ')');
                    if (state.consecutiveFailures >= 3) {
                        state.isPaused = true; pausedOrDone = true;
                        updateUIState('ACTION_FAIL'); refreshKeepAlive();
                        addLog('🛑 3 actions in a row failed to register — likely a privacy/ad-blocker or soft throttle.');
                        break;
                    }
                } else {
                    state.consecutiveFailures = 0;
                    state.processedIds.add(id);
                    tweet.setAttribute('data-processed', 'true');
                }

                await sleep(state.minDelay, state.maxDelay);
            }

            if (!pausedOrDone && !state.isPaused && state.actionCount < state.maxActions) {
                stepReveal();
                await sleep(1000, 1600);
            }
        }
    }

    // --- INIT ---
    const initObserver = new MutationObserver(() => {
        if (document.querySelector('[data-testid="primaryColumn"]')) {
            initObserver.disconnect();
            createUI();
            console.log('%c⚡ Auto-Feed v4.8 loaded — Randomised Targets + Dynamic Drift + Animated UI', 'color:#1d9bf0;font-weight:bold;');
        }
    });
    initObserver.observe(document.body, { childList: true, subtree: true });
})();
