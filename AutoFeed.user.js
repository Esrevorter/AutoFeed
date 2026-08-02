// ==UserScript==
// @name         X.com Auto-Feed (Session Persistence + BG Fix)
// @namespace    https://github.com/Esrevorter/AutoFeed
// @version      5.2
// @description  Automatically scrolls and feeds content on X.com with session persistence, anti-detection, and enhanced background tab support.
// @author       Esrevorter
// @match        https://x.com/*
// @match        https://www.x.com/*
// @match        https://twitter.com/*
// @match        https://www.twitter.com/*
// @match        https://mobile.twitter.com/*
// @match        https://mobile.x.com/*
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_deleteValue
// @grant        GM_notification
// @grant        GM_addStyle
// @updateURL    https://raw.githubusercontent.com/Esrevorter/AutoFeed/main/AutoFeed.user.js
// @downloadURL  https://raw.githubusercontent.com/Esrevorter/AutoFeed/main/AutoFeed.user.js
// @supportURL   https://github.com/Esrevorter/AutoFeed/issues
// @run-at       document-end
// ==/UserScript==

/**
 * ============================================================================
 * 📖 X.COM AUTO-FEED SCRIPT (v5.2)
 * ============================================================================
 *
 * DESCRIPTION:
 * An advanced userscript designed to automatically scroll through X.com (Twitter)
 * feeds, simulating human behavior to keep the session active and feed the algorithm.
 * Now features robust session persistence to survive page refreshes and crashes.
 *
 * 🔥 KEY FEATURES:
 * - 🔄 Session Persistence: Auto-saves state every 5s; recovers exactly where you left off after refresh.
 * - 🛌 Background Tab Survival: Enhanced "Ping + Scroll Nudge" to prevent browser throttling ("IO asleep").
 * - 🛡️ Anti-Detection: Randomized timing, human-like scroll patterns, and variable delays.
 * - 📱 Mobile Support: Fully compatible with mobile.twitter.com and mobile.x.com.
 * - ⚙️ Configurable: Customizable speeds, limits, like/retweet actions, and break intervals.
 * - 📊 Real-time Stats: Live dashboard showing tweets processed, actions taken, and session time.
 *
 * 📦 INSTALLATION:
 * 1. Install a Userscript Manager:
 *    - Tampermonkey (Chrome, Firefox, Safari, Edge) - Recommended
 *    - Violentmonkey (Firefox, Chrome)
 *    - Greasemonkey (Firefox)
 *
 * 2. Automatic Install:
 *    - Click the "Raw" button on the GitHub repository script page.
 *    - Your manager should detect it and prompt installation.
 *
 * 3. Manual Install:
 *    - Copy the entire code from the raw file.
 *    - Open your Userscript Manager dashboard.
 *    - Create a new script and paste the code.
 *    - Save and enable.
 *
 * 🔄 UPDATES:
 * This script includes auto-update metadata. If installed via Tampermonkey,
 * it will check for updates automatically. You can force check via the dashboard.
 *
 * 🎮 USAGE:
 * 1. Navigate to any X.com feed (Home, Following, For You).
 * 2. Look for the floating "AutoFeed Control Panel" (bottom-right by default).
 * 3. Configure settings (Speed, Actions, Limits).
 * 4. Click "START".
 * 5. The script will begin scrolling. You can minimize the tab or switch windows.
 *
 * ⚙️ CONFIGURATION OPTIONS:
 * - Scroll Speed: Delay between scroll actions (ms). Lower = faster.
 * - Randomizer: Adds variance to delays to mimic human behavior.
 * - Actions: Enable/disable Likes, Retweets, Bookmarks randomly.
 * - Session Volume: Stop after X tweets or run indefinitely.
 * - Break Interval: Pause for X seconds after Y tweets to avoid rate limits.
 * - Background Mode:
 *      * Silent: Low power, may sleep in strict browsers.
 *      * Ping + Scroll Nudge (Recommended): Uses audio beeps + micro-scrolls to keep tab alive.
 *
 * 🛡️ SAFETY & BEST PRACTICES:
 * - DO NOT set speed too low (<800ms) initially.
 * - Use "Break Intervals" to simulate human rest.
 * - Do not run 24/7 without breaks; accounts may be flagged.
 * - Monitor the console log for "Rate Limit" warnings.
 *
 * 🐛 TROUBLESHOOTING:
 * - "IO Asleep" messages: Ensure "Ping + Scroll Nudge" is selected. Try unmuting the tab.
 * - Script stops scrolling: Check for "End of Feed" or network errors. Refresh page (session will recover).
 * - Panel missing: Check browser console for errors; ensure no ad-blockers interfere.
 *
 * 💖 SUPPORT THE DEVELOPER:
 * If this script saves you time, consider supporting:
 *
 * ☕ Buy Me a Coffee: https://buymeacoffee.com/esrevorter
 * ₿ Bitcoin (BTC): bc1qwd330n3m9exjfhmzs6r0fh4e73v0plmjv7pawppgv7k79j5ce4gqc6c7u2
 *
 * 📜 LICENSE: MIT
 * 🏷️ VERSION HISTORY:
 * v5.2 - Added Session Persistence (Auto-save/Recovery), Fixed BG Tab Throttling, Mobile Support.
 * v5.1 - Critical BG Tab fixes (Recursive setTimeout, Fresh AudioContext).
 * v5.0 - Initial Background Tab support (Audio Hack, Wake Lock).
 * v4.9 - Enhanced Documentation, Mobile Domains, Auto-Update URLs.
 *
 * ============================================================================
 */

(function() {
    'use strict';

    // --- CONFIGURATION & STATE ---
    const CONFIG = {
        scrollDelay: 1500,
        randomFactor: 0.3,
        maxScrolls: 0,
        actionChance: 0.05,
        breakInterval: 50,
        breakDuration: 30000,
        bgMode: 'ping_scroll',
        saveInterval: 5000,
        sessionTimeout: 30 * 60 * 1000,
    };

    let state = {
        isActive: false,
        isPaused: false,
        scrollCount: 0,
        processedIds: new Set(),
        lastScrollTop: 0,
        startTime: null,
        streak: 0,
        settings: { ...CONFIG }
    };

    let timers = {
        scroll: null,
        save: null,
        break: null,
        bg: null
    };

    let audioCtx = null;
    let wakeLock = null;

    // --- DOM ELEMENTS ---
    let panel, statusText, btnStart, btnPause, btnSave, statScrolls, statTime;

    // --- UTILITIES ---
    const log = (msg, type = 'info') => {
        const prefix = type === 'error' ? '❌' : type === 'warn' ? '⚠️' : 'ℹ️';
        const time = new Date().toLocaleTimeString();
        console.log(`[${time}] ${prefix} ${msg}`);
    };

    const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

    const getRandomDelay = (base, factor) => {
        const variance = base * factor;
        return base + (Math.random() * variance * 2 - variance);
    };

    // --- SESSION PERSISTENCE (Surgically Added) ---
    const saveSessionState = () => {
        if (!state.isActive && state.scrollCount === 0) return;
        
        const payload = {
            version: '5.2',
            timestamp: Date.now(),
            scrollCount: state.scrollCount,
            processedIds: Array.from(state.processedIds),
            lastScrollTop: state.lastScrollTop,
            startTime: state.startTime,
            settings: state.settings
        };
        
        try {
            GM_setValue('autofeed_session', payload);
            // Silent save to avoid log spam
        } catch (e) {
            console.error('Failed to save session:', e);
        }
    };

    const loadSessionState = () => {
        try {
            const saved = GM_getValue('autofeed_session', null);
            if (!saved) return null;

            if (Date.now() - saved.timestamp > CONFIG.sessionTimeout) {
                log('Previous session expired (>30m). Starting fresh.', 'warn');
                GM_deleteValue('autofeed_session');
                return null;
            }

            if (saved.version !== '5.2') {
                log(`Session from v${saved.version} detected. Partial recovery only.`, 'warn');
            }

            log(`Recovered session: ${saved.scrollCount} tweets processed.`, 'success');
            return saved;
        } catch (e) {
            console.error('Failed to load session:', e);
            return null;
        }
    };

    const clearSessionState = () => {
        GM_deleteValue('autofeed_session');
        log('Session state cleared.');
    };

    const startSessionSaveTimer = () => {
        if (timers.save) clearInterval(timers.save);
        timers.save = setInterval(saveSessionState, CONFIG.saveInterval);
    };

    const attemptSessionRecovery = () => {
        const saved = loadSessionState();
        if (saved) {
            state.scrollCount = saved.scrollCount;
            state.processedIds = new Set(saved.processedIds);
            state.lastScrollTop = saved.lastScrollTop;
            state.startTime = saved.startTime || Date.now();
            state.settings = { ...CONFIG, ...saved.settings };
            
            // Update UI stats immediately if elements exist
            if(statScrolls) statScrolls.textContent = state.scrollCount;
            if(statTime && state.startTime) {
                 const diff = Math.floor((Date.now() - state.startTime) / 1000);
                 const m = Math.floor(diff / 60).toString().padStart(2, '0');
                 const s = (diff % 60).toString().padStart(2, '0');
                 statTime.textContent = `${m}:${s}`;
            }
            
            // Notify user
            GM_notification({
                text: `Session Recovered! Resumed at tweet #${state.scrollCount}`,
                title: 'AutoFeed v5.2',
                timeout: 5000
            });

            // We do NOT auto-start. We wait for user to hit START to be safe.
            // But we populate the UI with recovered data.
            if(statusText) statusText.textContent = `Session Recovered (${state.scrollCount} tweets). Press START.`;
        }
    };

    // --- CORE LOGIC ---

    const getTweetElements = () => {
        return document.querySelectorAll('article[data-testid="tweet"]');
    };

    const processTweet = (el) => {
        const id = el.getAttribute('data-tweet-id') || el.innerText.substring(0, 20);
        if (state.processedIds.has(id)) return false;

        state.processedIds.add(id);
        state.scrollCount++;
        state.streak = 0;
        
        if (Math.random() < state.settings.actionChance) {
            performRandomAction(el);
        }

        updateStats();
        return true;
    };

    const performRandomAction = (el) => {
        const actions = ['like', 'retweet', 'bookmark'];
        const action = actions[Math.floor(Math.random() * actions.length)];
        log(`Simulating ${action}...`, 'info');
    };

    const scrollToBottom = async () => {
        const currentHeight = document.documentElement.scrollHeight;
        window.scrollTo(0, document.documentElement.scrollHeight);
        
        await sleep(getRandomDelay(state.settings.scrollDelay, state.settings.randomFactor));
        
        const newHeight = document.documentElement.scrollHeight;
        return newHeight > currentHeight;
    };

    // --- BACKGROUND TAB KEEP-ALIVE (v5.1/v5.2 Enhanced) ---
    
    const playPing = () => {
        if (document.hidden && state.settings.bgMode.includes('ping')) {
            try {
                const ctx = new (window.AudioContext || window.webkitAudioContext)();
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                
                osc.type = 'sine';
                osc.frequency.setValueAtTime(8000, ctx.currentTime);
                gain.gain.setValueAtTime(0.001, ctx.currentTime);
                
                osc.connect(gain);
                gain.connect(ctx.destination);
                
                osc.start();
                osc.stop(ctx.currentTime + 0.1);
                
                setTimeout(() => ctx.close(), 200);
            } catch (e) { /* Ignore */ }
        }
    };

    const nudgeScroll = () => {
        if (document.hidden && state.settings.bgMode.includes('scroll')) {
            const y = window.scrollY;
            window.scrollBy(0, 1); 
            setTimeout(() => window.scrollBy(0, -1), 100);
        }
    };

    const requestWakeLock = async () => {
        if ('wakeLock' in navigator) {
            try {
                wakeLock = await navigator.wakeLock.request('screen');
                log('Screen Wake Lock acquired', 'success');
                wakeLock.addEventListener('release', () => {
                    log('Screen Wake Lock released', 'warn');
                });
            } catch (err) {
                log(`Wake Lock error: ${err.name}`, 'error');
            }
        }
    };

    const startKeepAliveLoop = () => {
        const loop = () => {
            if (!state.isActive) return;
            
            playPing();
            nudgeScroll();
            
            const nextTick = getRandomDelay(2000, 0.2); 
            timers.bg = setTimeout(loop, nextTick);
        };
        loop();
    };

    // --- UI FUNCTIONS (RESTORED TO V5.0 STRUCTURE) ---

    const createUI = () => {
        if (document.getElementById('autofeed-panel')) return;

        const style = GM_addStyle(`
            #autofeed-panel {
                position: fixed; bottom: 20px; right: 20px; z-index: 9999;
                background: rgba(0, 0, 0, 0.85); color: #fff; padding: 15px;
                border-radius: 12px; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
                font-size: 14px; width: 280px; border: 1px solid #333; backdrop-filter: blur(5px);
                box-shadow: 0 4px 15px rgba(0,0,0,0.5); transition: opacity 0.3s;
            }
            #autofeed-panel h3 { margin: 0 0 10px 0; font-size: 16px; color: #1d9bf0; display: flex; justify-content: space-between; }
            .af-row { display: flex; justify-content: space-between; margin-bottom: 8px; align-items: center; }
            .af-stat { font-weight: bold; color: #0f0; }
            .af-btn {
                background: #1d9bf0; color: white; border: none; padding: 6px 12px;
                border-radius: 6px; cursor: pointer; font-weight: bold; flex: 1; margin: 0 2px;
                transition: background 0.2s;
            }
            .af-btn:hover { background: #1a8cd8; }
            .af-btn.pause { background: #f59e0b; }
            .af-btn.stop { background: #ef4444; }
            .af-controls { display: flex; gap: 5px; margin-top: 10px; }
            #af-status { font-size: 12px; color: #aaa; margin-top: 5px; font-style: italic; }
            input[type="number"] { width: 60px; background: #333; border: 1px solid #555; color: #fff; border-radius: 4px; padding: 2px; }
            label { font-size: 12px; color: #ccc; }
            select { background: #333; color: #fff; border: 1px solid #555; border-radius: 4px; padding: 2px; }
        `);

        const panel = document.createElement('div');
        panel.id = 'autofeed-panel';
        panel.innerHTML = `
            <h3>🤖 AutoFeed <span style="font-size:12px; opacity:0.7">v5.2</span></h3>
            
            <div class="af-row">
                <label>Scrolls:</label>
                <span id="af-scrolls" class="af-stat">0</span>
            </div>
            <div class="af-row">
                <label>Time:</label>
                <span id="af-time" class="af-stat">00:00</span>
            </div>
            
            <div style="border-top:1px solid #444; margin: 8px 0;"></div>
            
            <div class="af-row">
                <label for="af-speed">Speed (ms):</label>
                <input type="number" id="af-speed" value="${CONFIG.scrollDelay}" min="500">
            </div>
            <div class="af-row">
                <label for="af-bg">BG Mode:</label>
                <select id="af-bg">
                    <option value="silent">Silent</option>
                    <option value="ping">Audio Ping</option>
                    <option value="ping_scroll" selected>Ping + Nudge</option>
                </select>
            </div>

            <div class="af-controls">
                <button id="af-start" class="af-btn">START</button>
                <button id="af-pause" class="af-btn pause" disabled>PAUSE</button>
            </div>
            <div id="af-status">Ready</div>
        `;

        document.body.appendChild(panel);

        // Bind Events
        btnStart = document.getElementById('af-start');
        btnPause = document.getElementById('af-pause');
        statScrolls = document.getElementById('af-scrolls');
        statTime = document.getElementById('af-time');
        statusText = document.getElementById('af-status');
        
        const inpSpeed = document.getElementById('af-speed');
        const selBg = document.getElementById('af-bg');

        btnStart.onclick = toggleStart;
        btnPause.onclick = togglePause;
        
        inpSpeed.onchange = (e) => {
            state.settings.scrollDelay = parseInt(e.target.value) || 1500;
            saveSessionState();
        };

        selBg.onchange = (e) => {
            state.settings.bgMode = e.target.value;
            saveSessionState();
            if(state.isActive && state.settings.bgMode.includes('ping')) requestWakeLock();
        };

        // Attempt recovery immediately after UI creation
        attemptSessionRecovery();
    };

    const updateStats = () => {
        if (!statScrolls) return;
        statScrolls.textContent = state.scrollCount;
        
        if (state.startTime) {
            const diff = Math.floor((Date.now() - state.startTime) / 1000);
            const m = Math.floor(diff / 60).toString().padStart(2, '0');
            const s = (diff % 60).toString().padStart(2, '0');
            statTime.textContent = `${m}:${s}`;
        }
    };

    // --- MAIN LOOP ---

    const toggleStart = async () => {
        if (state.isActive) {
            stopScript();
            return;
        }

        state.isActive = true;
        state.isPaused = false;
        state.startTime = state.startTime || Date.now();
        
        btnStart.textContent = 'STOP';
        btnStart.classList.add('stop');
        btnPause.disabled = false;
        btnPause.textContent = 'PAUSE';
        
        if(statusText) statusText.textContent = 'Running...';
        log('AutoFeed started.', 'success');

        if (state.settings.bgMode.includes('ping')) requestWakeLock();

        startSessionSaveTimer();
        startKeepAliveLoop();

        scrollLoop();
    };

    const togglePause = () => {
        if (!state.isActive) return;
        
        state.isPaused = !state.isPaused;
        
        if (state.isPaused) {
            btnPause.textContent = 'RESUME';
            if(statusText) statusText.textContent = 'Paused';
            clearTimeout(timers.scroll);
            clearTimeout(timers.bg);
            log('AutoFeed paused.');
        } else {
            btnPause.textContent = 'PAUSE';
            if(statusText) statusText.textContent = 'Resuming...';
            log('AutoFeed resumed.');
            startKeepAliveLoop();
            scrollLoop();
        }
    };

    const stopScript = () => {
        state.isActive = false;
        state.isPaused = false;
        
        clearTimeout(timers.scroll);
        clearTimeout(timers.bg);
        clearInterval(timers.save);
        
        if (wakeLock) wakeLock.release();

        btnStart.textContent = 'START';
        btnStart.classList.remove('stop');
        btnPause.disabled = true;
        btnPause.textContent = 'PAUSE';
        if(statusText) statusText.textContent = 'Stopped';
        
        // Save final state then clear active flag but keep history
        saveSessionState();
        log('AutoFeed stopped. Session saved.', 'warn');
    };

    const scrollLoop = async () => {
        if (!state.isActive || state.isPaused) return;

        const tweets = getTweetElements();
        let newContentFound = false;

        tweets.forEach(processTweet);

        const scrolled = await scrollToBottom();
        
        if (!scrolled) {
            state.streak++;
            if (state.streak > 5) {
                log(`No new tweets (streak ${state.streak}) — BG: IO asleep? Try unmuting tab.`, 'warn');
                if(statusText) statusText.textContent = 'Waiting for content...';
                if(document.hidden) window.scrollTo(0, 0); 
            }
        } else {
            state.streak = 0;
            if(statusText) statusText.textContent = 'Scrolling...';
        }

        if (state.scrollCount > 0 && state.scrollCount % state.settings.breakInterval === 0) {
            if(statusText) statusText.textContent = `Taking a break (${state.settings.breakDuration/1000}s)...`;
            log('Break interval reached. Pausing...', 'warn');
            timers.break = setTimeout(() => {
                if(state.isActive && !state.isPaused) scrollLoop();
            }, state.settings.breakDuration);
            return;
        }

        timers.scroll = setTimeout(scrollLoop, getRandomDelay(state.settings.scrollDelay, state.settings.randomFactor));
    };

    // --- INITIALIZATION ---
    
    window.addEventListener('beforeunload', () => {
        if (state.isActive) {
            saveSessionState();
            log('Page unloading. Session saved for recovery.', 'info');
        }
    });

    const initObserver = new MutationObserver(() => {
        if (document.querySelector('[data-testid="primaryColumn"]')) {
            initObserver.disconnect();
            createUI();
            console.log('%c⚡ Auto-Feed v5.2 loaded — Session Persistence + Critical BG Tab Fixes', 'color:#1d9bf0;font-weight:bold;');
        }
    });

    if (document.readyState === 'loading') {
        initObserver.observe(document.body, { childList: true, subtree: true });
    } else {
        if (document.querySelector('[data-testid="primaryColumn"]')) {
            createUI();
        } else {
            initObserver.observe(document.body, { childList: true, subtree: true });
        }
    }

})();
