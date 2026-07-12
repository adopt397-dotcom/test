// ================================================================
// utils-loader.js: 모든 유틸리티 통합 (시계+계산기 우선 배치)
// ================================================================
(function() {
    'use strict';

    // ================================================================
    // UT-0100: CSS
    // ================================================================
    const style = document.createElement('style');
    style.textContent = `
        #utilsContainer {
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 1001;
            font-family: 'Segoe UI', 'Malgun Gothic', sans-serif;
            display: flex;
            flex-direction: column;
            align-items: flex-end;
            gap: 8px;
        }
        .utils-icon-row {
            display: flex;
            gap: 8px;
            background: rgba(26, 26, 46, 0.85);
            backdrop-filter: blur(10px);
            padding: 6px 12px;
            border-radius: 30px;
            border: 1px solid rgba(255, 255, 255, 0.1);
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
            flex-wrap: wrap;
            justify-content: flex-end;
        }
        .utils-icon-btn {
            background: none;
            border: none;
            color: #fff;
            font-size: 1.4rem;
            cursor: pointer;
            padding: 4px 6px;
            border-radius: 6px;
            transition: all 0.2s;
            line-height: 1;
        }
        .utils-icon-btn:hover {
            background: rgba(245, 166, 35, 0.2);
            color: #f5a623;
        }
        .utils-icon-btn.active {
            color: #f5a623;
            background: rgba(245, 166, 35, 0.15);
        }
        .utils-panel {
            background: rgba(26, 26, 46, 0.95);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 12px;
            padding: 12px 16px;
            min-width: 200px;
            max-width: 420px;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
            color: #fff;
            display: none;
            margin-top: 4px;
        }
        .utils-panel.visible {
            display: block;
        }
        .utils-panel-title {
            font-size: 0.8rem;
            color: rgba(255, 255, 255, 0.4);
            text-align: center;
            margin-bottom: 8px;
            letter-spacing: 2px;
            text-transform: uppercase;
        }
        .util-btn {
            padding: 8px 12px;
            background: #f5a623;
            border: none;
            border-radius: 8px;
            color: #fff;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s;
        }
        .util-btn:hover {
            background: #e0951f;
        }
        .util-btn-secondary {
            background: rgba(255, 255, 255, 0.1);
        }
        .util-btn-secondary:hover {
            background: rgba(255, 255, 255, 0.2);
        }
        .util-btn-green {
            background: #27ae60;
        }
        .util-btn-green:hover {
            background: #1e8449;
        }
        .util-btn-red {
            background: #e74c3c;
        }
        .util-btn-red:hover {
            background: #c0392b;
        }
        .util-input {
            width: 100%;
            padding: 8px 12px;
            background: rgba(0, 0, 0, 0.3);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 8px;
            color: #fff;
            font-size: 0.95rem;
            font-family: inherit;
        }
        .util-input:focus {
            outline: none;
            border-color: #f5a623;
        }
        .util-input-small {
            width: 60px;
            text-align: center;
            display: inline-block;
        }
        .util-select {
            padding: 8px 12px;
            border-radius: 8px;
            background: rgba(0, 0, 0, 0.3);
            color: #fff;
            border: 1px solid rgba(255, 255, 255, 0.1);
            font-family: inherit;
            width: 100%;
        }
        .util-select:focus {
            outline: none;
            border-color: #f5a623;
        }
        .util-display {
            text-align: center;
            font-size: 2rem;
            font-weight: 700;
            color: #f5a623;
            padding: 10px 0;
            font-variant-numeric: tabular-nums;
        }
        .util-flex {
            display: flex;
            gap: 8px;
            flex-wrap: wrap;
        }
        .util-flex > * {
            flex: 1;
        }
        .util-textarea {
            width: 100%;
            min-height: 100px;
            background: rgba(0, 0, 0, 0.3);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 8px;
            color: #fff;
            padding: 10px;
            font-size: 0.95rem;
            resize: vertical;
            font-family: inherit;
        }
        .util-textarea:focus {
            outline: none;
            border-color: #f5a623;
        }
        .util-grid {
            display: grid;
            grid-template-columns: repeat(6, 1fr);
            gap: 6px;
        }
        .util-grid button {
            background: rgba(255, 255, 255, 0.06);
            border: 1px solid rgba(255, 255, 255, 0.06);
            border-radius: 8px;
            color: #fff;
            font-size: 1rem;
            font-weight: 600;
            padding: 8px 4px;
            cursor: pointer;
            transition: all 0.15s;
            min-height: 38px;
        }
        .util-grid button:hover {
            background: rgba(245, 166, 35, 0.15);
            border-color: rgba(245, 166, 35, 0.3);
        }
        .util-grid button:active {
            transform: scale(0.95);
        }
        .util-grid .op {
            color: #f5a623;
        }
        .util-grid .del {
            color: #ff6b6b;
        }
        .util-grid .func {
            color: #7ec8e3;
            font-size: 0.8rem;
        }
        .util-result {
            background: rgba(0, 0, 0, 0.3);
            border-radius: 8px;
            padding: 10px 14px;
            margin-bottom: 10px;
            text-align: right;
            font-size: 1.4rem;
            font-weight: 600;
            color: #fff;
            font-family: 'Courier New', monospace;
            min-height: 48px;
            word-break: break-all;
            border: 1px solid rgba(255, 255, 255, 0.05);
        }
        .util-tabs {
            display: flex;
            gap: 4px;
            margin-bottom: 10px;
            background: rgba(255, 255, 255, 0.05);
            border-radius: 8px;
            padding: 4px;
        }
        .util-tab {
            flex: 1;
            padding: 6px 0;
            border: none;
            border-radius: 6px;
            background: transparent;
            color: rgba(255, 255, 255, 0.5);
            font-size: 0.8rem;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s;
        }
        .util-tab.active {
            background: rgba(245, 166, 35, 0.2);
            color: #f5a623;
        }
        .util-tab:hover:not(.active) {
            background: rgba(255, 255, 255, 0.05);
        }
        .util-lap-list {
            max-height: 80px;
            overflow-y: auto;
            font-size: 0.8rem;
            color: rgba(255, 255, 255, 0.6);
            margin-top: 6px;
            padding: 4px 8px;
            background: rgba(0, 0, 0, 0.2);
            border-radius: 6px;
        }
        .util-lap-list div {
            padding: 2px 0;
            border-bottom: 1px solid rgba(255, 255, 255, 0.03);
        }
        .util-lap-list .highlight {
            color: #f5a623;
        }
        @media (max-width: 600px) {
            #utilsContainer {
                top: 10px;
                right: 10px;
                left: 10px;
            }
            .utils-icon-row {
                justify-content: flex-end;
                padding: 4px 10px;
            }
            .utils-icon-btn {
                font-size: 1.2rem;
            }
            .utils-panel {
                min-width: unset;
                width: 100%;
                max-width: 360px;
            }
            .util-display {
                font-size: 1.6rem;
            }
        }
    `;
    document.head.appendChild(style);

    // ================================================================
    // UT-0200: HTML 구조
    // ================================================================
    const container = document.createElement('div');
    container.id = 'utilsContainer';
    container.innerHTML = `
        <div class="utils-icon-row" id="utilsIconRow">
            <button class="utils-icon-btn" data-util="clock" title="타이머/스톱워치">⏱️</button>
            <button class="utils-icon-btn" data-util="calculator" title="계산기">🔢</button>
            <button class="utils-icon-btn" data-util="memo" title="메모장">📝</button>
            <button class="utils-icon-btn" data-util="unit" title="단위 변환기">📐</button>
        </div>
        <div class="utils-panel" id="utilsPanel">
            <div class="utils-panel-title" id="utilsPanelTitle">📦 유틸리티</div>
            <div id="utilsPanelContent">
                <p style="color:rgba(255,255,255,0.4);text-align:center;font-size:0.9rem;">아이콘을 클릭하세요</p>
            </div>
        </div>
    `;
    document.body.appendChild(container);

    // ================================================================
    // UT-0300: DOM 참조
    // ================================================================
    const panel = document.getElementById('utilsPanel');
    const panelTitle = document.getElementById('utilsPanelTitle');
    const panelContent = document.getElementById('utilsPanelContent');
    let currentUtil = null;
    let cleanupFn = null;

    // ================================================================
    // UT-0400: 유틸리티 정의
    // ================================================================
    const utils = {

        // -------- UT-0410: 통합 타이머 + 스톱워치 (시계 대체) --------
        clock: {
            name: '⏱️ 타이머 / 스톱워치',
            load: function() {
                // -------- 상태 --------
                let mode = 'timer'; // 'timer' | 'stopwatch'
                let timerSeconds = parseInt(localStorage.getItem('util_timer_seconds')) || 134 * 60;
                let swMs = 0;
                let running = false;
                let interval = null;
                let lapCount = 0;
                let lapStartMs = 0;
                let laps = [];

                // -------- UI 생성 --------
                panelContent.innerHTML = `
                    <div class="util-tabs" id="utilTimeTabs">
                        <button class="util-tab active" data-mode="timer">⏱️ 타이머</button>
                        <button class="util-tab" data-mode="stopwatch">⏱️ 스톱워치</button>
                    </div>
                    <div id="utilTimeContent">
                        <!-- 타이머 -->
                        <div id="utilTimerMode">
                            <div class="util-display" id="utilTimerDisplay">${formatTime(timerSeconds)}</div>
                            <div class="util-flex" style="justify-content:center;gap:8px;margin-bottom:8px;">
                                <input class="util-input util-input-small" id="utilTimerMinutes" type="number" min="0" max="99" value="${Math.floor(timerSeconds / 60)}" placeholder="분">
                                <span style="color:#fff;">분</span>
                                <input class="util-input util-input-small" id="utilTimerSeconds" type="number" min="0" max="59" value="${timerSeconds % 60}" placeholder="초">
                                <span style="color:#fff;">초</span>
                                <button class="util-btn util-btn-secondary" id="utilTimerSet">설정</button>
                            </div>
                            <div class="util-flex">
                                <button class="util-btn util-btn-green" id="utilTimerStart">▶ 시작</button>
                                <button class="util-btn util-btn-red" id="utilTimerStop">⏹ 정지</button>
                                <button class="util-btn util-btn-secondary" id="utilTimerReset">↺ 리셋</button>
                            </div>
                        </div>
                        <!-- 스톱워치 -->
                        <div id="utilStopwatchMode" style="display:none;">
                            <div class="util-display" id="utilSwDisplay">00:00.0</div>
                            <div class="util-flex">
                                <button class="util-btn util-btn-green" id="utilSwStart">▶ 시작</button>
                                <button class="util-btn util-btn-red" id="utilSwStop">⏹ 정지</button>
                                <button class="util-btn util-btn-secondary" id="utilSwLap">📌 랩</button>
                                <button class="util-btn util-btn-secondary" id="utilSwReset">↺ 리셋</button>
                            </div>
                            <div class="util-lap-list" id="utilSwLapList"></div>
                        </div>
                    </div>
                `;

                // -------- DOM 요소 --------
                const timerDisplay = document.getElementById('utilTimerDisplay');
                const timerMinutes = document.getElementById('utilTimerMinutes');
                const timerSecondsInput = document.getElementById('utilTimerSeconds');
                const timerSetBtn = document.getElementById('utilTimerSet');
                const timerStartBtn = document.getElementById('utilTimerStart');
                const timerStopBtn = document.getElementById('utilTimerStop');
                const timerResetBtn = document.getElementById('utilTimerReset');
                const swDisplay = document.getElementById('utilSwDisplay');
                const swStartBtn = document.getElementById('utilSwStart');
                const swStopBtn = document.getElementById('utilSwStop');
                const swLapBtn = document.getElementById('utilSwLap');
                const swResetBtn = document.getElementById('utilSwReset');
                const swLapList = document.getElementById('utilSwLapList');
                const tabs = document.querySelectorAll('#utilTimeTabs .util-tab');
                const timerMode = document.getElementById('utilTimerMode');
                const stopwatchMode = document.getElementById('utilStopwatchMode');

                // -------- 헬퍼 함수 --------
                function formatTime(sec) {
                    const h = String(Math.floor(sec / 3600)).padStart(2, '0');
                    const m = String(Math.floor((sec % 3600) / 60)).padStart(2, '0');
                    const s = String(sec % 60).padStart(2, '0');
                    return h + ':' + m + ':' + s;
                }

                function formatSw(ms) {
                    const m = String(Math.floor(ms / 60000)).padStart(2, '0');
                    const s = String(Math.floor((ms % 60000) / 1000)).padStart(2, '0');
                    const d = String(Math.floor((ms % 1000) / 100));
                    return m + ':' + s + '.' + d;
                }

                function updateTimerDisplay() {
                    timerDisplay.textContent = formatTime(timerSeconds);
                }

                function updateSwDisplay() {
                    swDisplay.textContent = formatSw(swMs);
                }

                function updateLapList() {
                    swLapList.innerHTML = laps.map((l, i) =>
                        `<div><span class="highlight">랩 ${i+1}</span> ${formatSw(l)}</div>`
                    ).join('');
                    if (laps.length === 0) {
                        swLapList.innerHTML = '<div style="color:rgba(255,255,255,0.2);">랩 기록이 없습니다</div>';
                    }
                }

                function saveTimerSetting() {
                    localStorage.setItem('util_timer_seconds', String(timerSeconds));
                }

                // -------- 타이머 로직 --------
                function timerStart() {
                    if (running) return;
                    if (timerSeconds <= 0) return;
                    running = true;
                    interval = setInterval(() => {
                        if (timerSeconds > 0) {
                            timerSeconds--;
                            updateTimerDisplay();
                            saveTimerSetting();
                        } else {
                            clearInterval(interval);
                            interval = null;
                            running = false;
                            alert('⏰ 시간이 다 되었습니다!');
                        }
                    }, 1000);
                }

                function timerStop() {
                    running = false;
                    if (interval) { clearInterval(interval); interval = null; }
                }

                function timerReset() {
                    timerStop();
                    timerSeconds = parseInt(timerMinutes.value) * 60 + parseInt(timerSecondsInput.value) || 0;
                    if (timerSeconds < 0) timerSeconds = 0;
                    updateTimerDisplay();
                    saveTimerSetting();
                }

                function timerSet() {
                    timerStop();
                    const mins = parseInt(timerMinutes.value) || 0;
                    const secs = parseInt(timerSecondsInput.value) || 0;
                    timerSeconds = mins * 60 + secs;
                    if (timerSeconds < 0) timerSeconds = 0;
                    updateTimerDisplay();
                    saveTimerSetting();
                }

                // -------- 스톱워치 로직 --------
                function swStart() {
                    if (running) return;
                    running = true;
                    lapStartMs = swMs;
                    interval = setInterval(() => {
                        swMs += 100;
                        updateSwDisplay();
                    }, 100);
                }

                function swStop() {
                    running = false;
                    if (interval) { clearInterval(interval); interval = null; }
                }

                function swLap() {
                    if (!running) return;
                    const lapTime = swMs - lapStartMs;
                    laps.push(lapTime);
                    lapStartMs = swMs;
                    updateLapList();
                }

                function swReset() {
                    swStop();
                    swMs = 0;
                    laps = [];
                    lapStartMs = 0;
                    updateSwDisplay();
                    updateLapList();
                }

                // -------- 모드 전환 --------
                function switchMode(mode) {
                    // 현재 실행 중인 타이머/스톱워치 정지
                    if (running) {
                        if (mode === 'timer') swStop();
                        else timerStop();
                    }
                    mode = mode;
                    if (mode === 'timer') {
                        timerMode.style.display = 'block';
                        stopwatchMode.style.display = 'none';
                        tabs.forEach(t => t.classList.toggle('active', t.dataset.mode === 'timer'));
                    } else {
                        timerMode.style.display = 'none';
                        stopwatchMode.style.display = 'block';
                        tabs.forEach(t => t.classList.toggle('active', t.dataset.mode === 'stopwatch'));
                    }
                }

                // -------- 이벤트 바인딩 --------
                timerStartBtn.addEventListener('click', timerStart);
                timerStopBtn.addEventListener('click', timerStop);
                timerResetBtn.addEventListener('click', timerReset);
                timerSetBtn.addEventListener('click', timerSet);

                swStartBtn.addEventListener('click', swStart);
                swStopBtn.addEventListener('click', swStop);
                swLapBtn.addEventListener('click', swLap);
                swResetBtn.addEventListener('click', swReset);

                tabs.forEach(tab => {
                    tab.addEventListener('click', () => {
                        switchMode(tab.dataset.mode);
                    });
                });

                // 엔터키로 설정
                timerMinutes.addEventListener('keydown', (e) => { if (e.key === 'Enter') timerSet(); });
                timerSecondsInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') timerSet(); });

                // -------- 초기화 --------
                updateTimerDisplay();
                updateSwDisplay();
                updateLapList();
                switchMode('timer');

                cleanupFn = () => {
                    if (interval) { clearInterval(interval); interval = null; }
                    running = false;
                };
            }
        },

        // -------- UT-0420: 계산기 --------
        calculator: {
            name: '🔢 계산기',
            load: function() {
                let expr = '';
                panelContent.innerHTML = `
                    <div class="util-result" id="utilCalcDisplay">0</div>
                    <div class="util-grid">
                        ${['sin','cos','tan','log','ln','sqrt'].map(v => `<button data-calc="${v}" class="func">${v}</button>`).join('')}
                        ${['7','8','9','/','*','⌫'].map(v => `<button data-calc="${v==='⌫'?'backspace':v}" ${['/','*'].includes(v)?'class="op"':''} ${v==='⌫'?'class="del"':''}>${v}</button>`).join('')}
                        ${['4','5','6','-','+','C'].map(v => `<button data-calc="${v==='C'?'clear':v}" ${['-','+'].includes(v)?'class="op"':''} ${v==='C'?'class="del"':''}>${v}</button>`).join('')}
                        ${['1','2','3','(',')','='].map(v => `<button data-calc="${v}" ${v==='='?'class="op"':''}>${v}</button>`).join('')}
                        ${['0','.','π','e','^','%'].map(v => `<button data-calc="${v}" ${['π','e','^','%'].includes(v)?'class="func"':''}>${v}</button>`).join('')}
                    </div>
                `;
                const display = document.getElementById('utilCalcDisplay');
                const update = () => { display.textContent = expr || '0'; };
                const handle = (val) => {
                    if (val === 'clear') { expr = ''; update(); return; }
                    if (val === 'backspace') { expr = expr.slice(0, -1); update(); return; }
                    if (val === '=') {
                        try {
                            let e = expr.replace(/sin\(/g,'Math.sin(').replace(/cos\(/g,'Math.cos(').replace(/tan\(/g,'Math.tan(').replace(/log\(/g,'Math.log10(').replace(/ln\(/g,'Math.log(').replace(/sqrt\(/g,'Math.sqrt(').replace(/π/g,'Math.PI').replace(/e(?![xp])/g,'Math.E').replace(/\^/g,'**');
                            const result = Function('"use strict"; return (' + e + ')')();
                            expr = String(result); update();
                        } catch(e) { expr = 'Error'; update(); setTimeout(() => { expr = ''; update(); }, 1500); }
                        return;
                    }
                    const map = { 'sin':'sin(','cos':'cos(','tan':'tan(','log':'log(','ln':'ln(','sqrt':'sqrt(','π':'π','e':'e' };
                    expr += map[val] || val;
                    update();
                };
                panelContent.querySelectorAll('[data-calc]').forEach(btn => {
                    btn.addEventListener('click', () => handle(btn.dataset.calc));
                });
                const keyHandler = (e) => {
                    const k = e.key;
                    if ('0123456789.+-*/'.includes(k)) handle(k);
                    if (k === 'Enter' || k === '=') handle('=');
                    if (k === 'Backspace') handle('backspace');
                    if (k === 'Escape') handle('clear');
                    if (k === '(' || k === ')') handle(k);
                    if (k === '%') handle('%');
                };
                document.addEventListener('keydown', keyHandler);
                cleanupFn = () => { document.removeEventListener('keydown', keyHandler); };
            }
        },

        // -------- UT-0430: 메모장 --------
        memo: {
            name: '📝 메모장',
            load: function() {
                const saved = localStorage.getItem('util_memo') || '';
                panelContent.innerHTML = `
                    <textarea class="util-textarea" id="utilMemoInput">${saved}</textarea>
                    <div class="util-flex" style="margin-top:8px;">
                        <button class="util-btn" id="utilMemoSave">💾 저장</button>
                        <button class="util-btn util-btn-secondary" id="utilMemoClear">🗑️ 지우기</button>
                    </div>
                `;
                document.getElementById('utilMemoSave').addEventListener('click', () => {
                    const val = document.getElementById('utilMemoInput').value;
                    localStorage.setItem('util_memo', val);
                    alert('✅ 메모가 저장되었습니다.');
                });
                document.getElementById('utilMemoClear').addEventListener('click', () => {
                    if (confirm('정말 지우시겠습니까?')) {
                        document.getElementById('utilMemoInput').value = '';
                        localStorage.removeItem('util_memo');
                    }
                });
                cleanupFn = null;
            }
        },

        // -------- UT-0440: 단위 변환기 --------
        unit: {
            name: '📐 단위 변환기',
            load: function() {
                const conversions = {
                    length: { m: 1, km: 0.001, cm: 100, mm: 1000, mi: 0.000621371, ft: 3.28084, in: 39.3701 },
                    weight: { kg: 1, g: 1000, mg: 1000000, lb: 2.20462, oz: 35.274 },
                    temperature: { c: 1, f: 1, k: 1 }
                };
                panelContent.innerHTML = `
                    <div style="display:flex;flex-direction:column;gap:8px;">
                        <select class="util-select" id="unitType">
                            <option value="length">📏 길이</option>
                            <option value="weight">⚖️ 무게</option>
                            <option value="temperature">🌡️ 온도</option>
                        </select>
                        <div class="util-flex">
                            <input class="util-input" id="unitInput" type="number" value="1" style="flex:1;">
                            <span style="color:#f5a623;font-weight:600;padding:8px;">=</span>
                            <input class="util-input" id="unitOutput" type="text" readonly style="flex:2;color:#f5a623;background:rgba(0,0,0,0.2);">
                        </div>
                        <button class="util-btn" id="unitConvertBtn">🔄 변환</button>
                    </div>
                `;
                const convert = () => {
                    const type = document.getElementById('unitType').value;
                    const val = parseFloat(document.getElementById('unitInput').value) || 0;
                    if (type === 'temperature') {
                        const f = (val * 9/5) + 32;
                        const k = val + 273.15;
                        document.getElementById('unitOutput').value = `${f.toFixed(2)} °F | ${k.toFixed(2)} K`;
                    } else {
                        const units = conversions[type];
                        const result = Object.entries(units).map(([k, v]) => `${k}: ${(val * v).toFixed(4)}`).join(' | ');
                        document.getElementById('unitOutput').value = result;
                    }
                };
                document.getElementById('unitConvertBtn').addEventListener('click', convert);
                document.getElementById('unitInput').addEventListener('input', convert);
                document.getElementById('unitType').addEventListener('change', convert);
                convert();
                cleanupFn = null;
            }
        }
    };

    // ================================================================
    // UT-0500: 유틸리티 로더
    // ================================================================
    function loadUtil(key) {
        if (cleanupFn) { cleanupFn(); cleanupFn = null; }
        const util = utils[key];
        if (!util) return;
        currentUtil = key;
        panelTitle.textContent = util.name;
        panel.classList.add('visible');
        document.querySelectorAll('.utils-icon-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.util === key);
        });
        util.load();
    }

    // ================================================================
    // UT-0600: 이벤트
    // ================================================================
    document.querySelectorAll('.utils-icon-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const key = btn.dataset.util;
            if (currentUtil === key && panel.classList.contains('visible')) {
                panel.classList.remove('visible');
                btn.classList.remove('active');
                if (cleanupFn) { cleanupFn(); cleanupFn = null; }
                currentUtil = null;
            } else {
                loadUtil(key);
            }
        });
    });

    console.log('✅ utils-loader.js loaded (시계+계산기 우선 배치)');
})();
