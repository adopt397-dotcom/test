// ================================================================
// utils-loader.js: 고급 공학용 계산기 + 통합 시계
// ================================================================
(function() {
    'use strict';

    // ---------- CSS ----------
    const style = document.createElement('style');
    style.textContent = `
        /* --------------------------------
           컨테이너 및 아이콘 행
        -------------------------------- */
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
            border: 1px solid rgba(255,255,255,0.1);
            box-shadow: 0 4px 20px rgba(0,0,0,0.3);
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
            background: rgba(245,166,35,0.2);
            color: #f5a623;
        }
        .utils-icon-btn.active {
            color: #f5a623;
            background: rgba(245,166,35,0.15);
        }

        /* --------------------------------
           메인 패널
        -------------------------------- */
        .utils-panel {
            background: rgba(26, 26, 46, 0.95);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255,255,255,0.1);
            border-radius: 12px;
            padding: 16px 18px;
            min-width: 280px;
            max-width: 420px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.3);
            color: #fff;
            display: none;
            margin-top: 4px;
        }
        .utils-panel.visible { display: block; }
        .utils-panel-title {
            font-size: 0.75rem;
            color: rgba(255,255,255,0.3);
            text-align: center;
            margin-bottom: 6px;
            letter-spacing: 2px;
            text-transform: uppercase;
        }

        /* --------------------------------
           시계 / 타이머 영역
        -------------------------------- */
        .clock-area {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 12px;
            background: rgba(0,0,0,0.2);
            border-radius: 8px;
            padding: 6px 12px;
            margin-bottom: 12px;
        }
        .clock-display {
            font-size: 1.5rem;
            font-weight: 700;
            color: #f5a623;
            font-variant-numeric: tabular-nums;
            letter-spacing: 1px;
            min-width: 100px;
        }
        .clock-controls {
            display: flex;
            gap: 6px;
            flex-wrap: wrap;
        }
        .clock-controls button {
            background: rgba(255,255,255,0.06);
            border: none;
            color: #fff;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 0.7rem;
            cursor: pointer;
            transition: 0.15s;
        }
        .clock-controls button:hover {
            background: rgba(245,166,35,0.2);
            color: #f5a623;
        }
        .clock-controls button.active-mode {
            background: rgba(245,166,35,0.25);
            color: #f5a623;
        }

        /* --------------------------------
           계산기 영역
        -------------------------------- */
        .calc-display {
            background: rgba(0,0,0,0.4);
            border-radius: 8px;
            padding: 12px 14px;
            margin-bottom: 10px;
            text-align: right;
            font-size: 1.6rem;
            font-weight: 600;
            color: #fff;
            font-family: 'Courier New', monospace;
            min-height: 56px;
            word-break: break-all;
            border: 1px solid rgba(255,255,255,0.05);
            position: relative;
        }
        .calc-display .sub {
            font-size: 0.75rem;
            color: rgba(255,255,255,0.3);
            position: absolute;
            top: 4px;
            right: 14px;
            font-weight: 400;
        }
        .calc-grid {
            display: grid;
            grid-template-columns: repeat(6, 1fr);
            gap: 5px;
        }
        .calc-grid button {
            background: rgba(255,255,255,0.05);
            border: 1px solid rgba(255,255,255,0.04);
            border-radius: 6px;
            color: #fff;
            font-size: 0.95rem;
            font-weight: 500;
            padding: 10px 0;
            cursor: pointer;
            transition: all 0.1s;
            min-height: 38px;
        }
        .calc-grid button:hover {
            background: rgba(245,166,35,0.15);
            border-color: rgba(245,166,35,0.2);
        }
        .calc-grid button:active {
            transform: scale(0.94);
        }
        .calc-grid .op { color: #f5a623; }
        .calc-grid .del { color: #ff6b6b; }
        .calc-grid .func { color: #7ec8e3; font-size: 0.8rem; }
        .calc-grid .eq { background: rgba(245,166,35,0.2); color: #f5a623; }

        /* 계산 기록 (히스토리) */
        .calc-history {
            max-height: 60px;
            overflow-y: auto;
            font-size: 0.75rem;
            color: rgba(255,255,255,0.3);
            margin-top: 6px;
            padding: 4px 6px;
            background: rgba(0,0,0,0.15);
            border-radius: 4px;
            text-align: right;
        }
        .calc-history div {
            padding: 2px 0;
            border-bottom: 1px solid rgba(255,255,255,0.03);
            cursor: pointer;
        }
        .calc-history div:hover {
            color: #f5a623;
        }

        /* 반응형 */
        @media (max-width: 600px) {
            #utilsContainer { top: 10px; right: 10px; left: 10px; }
            .utils-icon-row { justify-content: flex-end; padding: 4px 10px; }
            .utils-icon-btn { font-size: 1.2rem; }
            .utils-panel { min-width: unset; width: 100%; max-width: 360px; padding: 12px; }
            .clock-display { font-size: 1.2rem; min-width: 70px; }
            .calc-display { font-size: 1.3rem; min-height: 44px; padding: 8px 10px; }
            .calc-grid button { font-size: 0.8rem; padding: 6px 0; min-height: 32px; }
        }
    `;
    document.head.appendChild(style);

    // ---------- HTML 구조 ----------
    const container = document.createElement('div');
    container.id = 'utilsContainer';
    container.innerHTML = `
        <div class="utils-icon-row" id="utilsIconRow">
            <button class="utils-icon-btn" data-util="allinone" title="Calculator + Clock">🧮</button>
            <button class="utils-icon-btn" data-util="memo" title="Memo">📝</button>
            <button class="utils-icon-btn" data-util="unit" title="Unit Converter">📐</button>
        </div>
        <div class="utils-panel" id="utilsPanel">
            <div class="utils-panel-title" id="utilsPanelTitle">🧮 All-in-One</div>
            <div id="utilsPanelContent"></div>
        </div>
    `;
    document.body.appendChild(container);

    // ---------- DOM 참조 ----------
    const panel = document.getElementById('utilsPanel');
    const panelTitle = document.getElementById('utilsPanelTitle');
    const panelContent = document.getElementById('utilsPanelContent');
    let currentUtil = null;
    let cleanupFn = null;

    // ---------- 전역 시계 상태 ----------
    let globalTimerSeconds = parseInt(localStorage.getItem('util_timer_seconds')) || 134 * 60;
    let globalTimerInterval = null;
    let globalTimerRunning = false;

    function formatTime(sec) {
        const h = String(Math.floor(sec / 3600)).padStart(2, '0');
        const m = String(Math.floor((sec % 3600) / 60)).padStart(2, '0');
        const s = String(sec % 60).padStart(2, '0');
        return h + ':' + m + ':' + s;
    }

    function updateGlobalTimerDisplay() {
        const el = document.getElementById('allinoneClockDisplay');
        if (el) el.textContent = formatTime(globalTimerSeconds);
        localStorage.setItem('util_timer_seconds', String(globalTimerSeconds));
    }

    function startGlobalTimer() {
        if (globalTimerInterval) return;
        globalTimerRunning = true;
        globalTimerInterval = setInterval(() => {
            if (globalTimerSeconds > 0) {
                globalTimerSeconds--;
                updateGlobalTimerDisplay();
            } else {
                clearInterval(globalTimerInterval);
                globalTimerInterval = null;
                globalTimerRunning = false;
                alert('⏰ Time is up!');
            }
        }, 1000);
    }

    function stopGlobalTimer() {
        globalTimerRunning = false;
        if (globalTimerInterval) {
            clearInterval(globalTimerInterval);
            globalTimerInterval = null;
        }
    }

    function resetGlobalTimerTo(seconds) {
        stopGlobalTimer();
        globalTimerSeconds = seconds || 134 * 60;
        updateGlobalTimerDisplay();
        localStorage.setItem('util_timer_seconds', String(globalTimerSeconds));
    }

    // ---------- 올인원 유틸리티 ----------
    const utils = {
        allinone: {
            name: '🧮 Calculator + Clock',
            load: function() {
                // ---- 계산기 상태 ----
                let expression = '';
                let displayValue = '0';
                let isNewInput = true;
                let memory = null;
                let history = JSON.parse(localStorage.getItem('calc_history') || '[]');
                let ans = 0;
                let angleMode = 'deg'; // 'deg' or 'rad'

                // ---- UI 렌더링 ----
                panelContent.innerHTML = `
                    <!-- 시계/타이머 영역 -->
                    <div class="clock-area">
                        <span class="clock-display" id="allinoneClockDisplay">${formatTime(globalTimerSeconds)}</span>
                        <div class="clock-controls">
                            <button id="clockSetBtn">⏱️ Set</button>
                            <button id="clockStartBtn">▶</button>
                            <button id="clockStopBtn">⏹</button>
                            <button id="clockResetBtn">↺</button>
                        </div>
                    </div>
                    <!-- 계산기 영역 -->
                    <div class="calc-display" id="calcDisplay">
                        <span class="sub" id="calcAngleLabel">DEG</span>
                        <span id="calcDisplayText">0</span>
                    </div>
                    <div class="calc-grid" id="calcGrid">
                        <!-- 1행: 공학 함수 + 모드 -->
                        <button class="func" data-action="sin">sin</button>
                        <button class="func" data-action="cos">cos</button>
                        <button class="func" data-action="tan">tan</button>
                        <button class="func" data-action="log">log</button>
                        <button class="func" data-action="ln">ln</button>
                        <button class="func" data-action="sqrt">√</button>
                        <!-- 2행 -->
                        <button data-action="7">7</button>
                        <button data-action="8">8</button>
                        <button data-action="9">9</button>
                        <button class="op" data-action="/">÷</button>
                        <button class="op" data-action="*">×</button>
                        <button class="del" data-action="backspace">⌫</button>
                        <!-- 3행 -->
                        <button data-action="4">4</button>
                        <button data-action="5">5</button>
                        <button data-action="6">6</button>
                        <button class="op" data-action="-">−</button>
                        <button class="op" data-action="+">+</button>
                        <button class="del" data-action="clear">C</button>
                        <!-- 4행 -->
                        <button data-action="1">1</button>
                        <button data-action="2">2</button>
                        <button data-action="3">3</button>
                        <button data-action="(">(</button>
                        <button data-action=")">)</button>
                        <button class="eq" data-action="=">=</button>
                        <!-- 5행 -->
                        <button data-action="0">0</button>
                        <button data-action=".">.</button>
                        <button class="func" data-action="pi">π</button>
                        <button class="func" data-action="e">e</button>
                        <button class="func" data-action="^">x^y</button>
                        <button class="func" data-action="%">%</button>
                        <!-- 6행: Ans, 모드, 메모리 -->
                        <button class="func" data-action="ans">Ans</button>
                        <button class="func" data-action="degrad">DEG/RAD</button>
                        <button class="func" data-action="m+">M+</button>
                        <button class="func" data-action="m-">M-</button>
                        <button class="func" data-action="mr">MR</button>
                        <button class="func" data-action="mc">MC</button>
                    </div>
                    <!-- 계산 기록 -->
                    <div class="calc-history" id="calcHistory"></div>
                `;

                // ---- DOM 요소 ----
                const displayText = document.getElementById('calcDisplayText');
                const angleLabel = document.getElementById('calcAngleLabel');
                const historyContainer = document.getElementById('calcHistory');
                const clockDisplay = document.getElementById('allinoneClockDisplay');

                // ---- 업데이트 함수 ----
                function updateDisplay() {
                    displayText.textContent = displayValue;
                }

                function updateHistory() {
                    historyContainer.innerHTML = history.slice(-5).reverse().map(h =>
                        `<div data-expr="${h.expr}" data-result="${h.result}">${h.expr} = ${h.result}</div>`
                    ).join('');
                    // 기록 클릭 시 재사용
                    historyContainer.querySelectorAll('div').forEach(el => {
                        el.addEventListener('click', () => {
                            const result = el.dataset.result;
                            if (result) {
                                displayValue = result;
                                expression = result;
                                isNewInput = true;
                                updateDisplay();
                            }
                        });
                    });
                }

                function addHistory(expr, result) {
                    history.push({ expr: expr.trim(), result: result.trim() });
                    if (history.length > 20) history.shift();
                    localStorage.setItem('calc_history', JSON.stringify(history));
                    updateHistory();
                }

                function setAngleMode(mode) {
                    angleMode = mode;
                    angleLabel.textContent = mode.toUpperCase();
                }

                // ---- 계산 엔진 ----
                function evaluate(expr) {
                    try {
                        let sanitized = expr
                            .replace(/sin\(/g, 'Math.sin(')
                            .replace(/cos\(/g, 'Math.cos(')
                            .replace(/tan\(/g, 'Math.tan(')
                            .replace(/log\(/g, 'Math.log10(')
                            .replace(/ln\(/g, 'Math.log(')
                            .replace(/sqrt\(/g, 'Math.sqrt(')
                            .replace(/π/g, 'Math.PI')
                            .replace(/e(?![xp])/g, 'Math.E')
                            .replace(/\^/g, '**')
                            .replace(/ans/g, '(' + ans + ')');

                        // 각도 변환 (sin/cos/tan)
                        if (angleMode === 'deg') {
                            sanitized = sanitized
                                .replace(/Math\.sin\(/g, 'Math.sin(deg2rad(')
                                .replace(/Math\.cos\(/g, 'Math.cos(deg2rad(')
                                .replace(/Math\.tan\(/g, 'Math.tan(deg2rad(');
                            // 닫는 괄호 자동 추가를 위해 함수로 감쌈
                            // 대신 각도 변환 함수를 직접 정의
                        }

                        // 각도 변환 헬퍼 함수
                        const fn = new Function(
                            'deg2rad',
                            `"use strict"; return (${sanitized})`
                        );
                        const deg2rad = (d) => d * Math.PI / 180;
                        const result = fn(deg2rad);
                        return String(result);
                    } catch (e) {
                        return 'Error';
                    }
                }

                // ---- 계산기 액션 핸들러 ----
                function handleAction(action) {
                    // --- 메모리 ---
                    if (action === 'm+') {
                        const val = parseFloat(displayValue);
                        if (!isNaN(val)) memory = (memory || 0) + val;
                        return;
                    }
                    if (action === 'm-') {
                        const val = parseFloat(displayValue);
                        if (!isNaN(val)) memory = (memory || 0) - val;
                        return;
                    }
                    if (action === 'mr') {
                        if (memory !== null) {
                            displayValue = String(memory);
                            expression = String(memory);
                            isNewInput = true;
                            updateDisplay();
                        }
                        return;
                    }
                    if (action === 'mc') {
                        memory = null;
                        return;
                    }

                    // --- 각도 모드 전환 ---
                    if (action === 'degrad') {
                        const newMode = angleMode === 'deg' ? 'rad' : 'deg';
                        setAngleMode(newMode);
                        return;
                    }

                    // --- Ans ---
                    if (action === 'ans') {
                        if (isNewInput) {
                            displayValue = '0';
                            expression = '';
                        }
                        expression += String(ans);
                        displayValue = expression;
                        isNewInput = false;
                        updateDisplay();
                        return;
                    }

                    // --- 상수 ---
                    if (action === 'pi') {
                        if (isNewInput) {
                            displayValue = '0';
                            expression = '';
                            isNewInput = false;
                        }
                        expression += 'π';
                        displayValue = expression;
                        updateDisplay();
                        return;
                    }
                    if (action === 'e') {
                        if (isNewInput) {
                            displayValue = '0';
                            expression = '';
                            isNewInput = false;
                        }
                        expression += 'e';
                        displayValue = expression;
                        updateDisplay();
                        return;
                    }

                    // --- 공학 함수 ---
                    if (['sin', 'cos', 'tan', 'log', 'ln', 'sqrt'].includes(action)) {
                        if (isNewInput) {
                            displayValue = '0';
                            expression = '';
                            isNewInput = false;
                        }
                        expression += action + '(';
                        displayValue = expression;
                        updateDisplay();
                        return;
                    }

                    // --- clear ---
                    if (action === 'clear') {
                        expression = '';
                        displayValue = '0';
                        isNewInput = true;
                        updateDisplay();
                        return;
                    }

                    // --- backspace ---
                    if (action === 'backspace') {
                        if (isNewInput) {
                            displayValue = '0';
                            expression = '';
                            updateDisplay();
                            return;
                        }
                        expression = expression.slice(0, -1);
                        displayValue = expression || '0';
                        updateDisplay();
                        return;
                    }

                    // --- = (계산) ---
                    if (action === '=') {
                        if (!expression) return;
                        const result = evaluate(expression);
                        if (result !== 'Error' && !isNaN(parseFloat(result))) {
                            const formatted = parseFloat(result).toString();
                            addHistory(expression, formatted);
                            ans = parseFloat(formatted);
                            displayValue = formatted;
                            expression = formatted;
                            isNewInput = true;
                            updateDisplay();
                        } else {
                            displayValue = 'Error';
                            updateDisplay();
                            setTimeout(() => {
                                displayValue = '0';
                                expression = '';
                                isNewInput = true;
                                updateDisplay();
                            }, 1200);
                        }
                        return;
                    }

                    // --- 숫자 및 연산자 ---
                    if (isNewInput && !'+-*/^%()'.includes(action)) {
                        expression = '';
                        isNewInput = false;
                    }
                    if (action === '%') {
                        // 현재 값의 퍼센트 (나누기 100)
                        const current = parseFloat(expression) || 0;
                        expression = String(current / 100);
                        displayValue = expression;
                        updateDisplay();
                        return;
                    }
                    expression += action;
                    displayValue = expression;
                    updateDisplay();
                }

                // ---- 버튼 이벤트 ----
                document.querySelectorAll('#calcGrid button').forEach(btn => {
                    btn.addEventListener('click', () => {
                        const action = btn.dataset.action;
                        handleAction(action);
                    });
                });

                // ---- 키보드 지원 ----
                const keyHandler = (e) => {
                    const k = e.key;
                    if (k >= '0' && k <= '9') handleAction(k);
                    if (k === '.') handleAction('.');
                    if (k === '+') handleAction('+');
                    if (k === '-') handleAction('-');
                    if (k === '*') handleAction('*');
                    if (k === '/') handleAction('/');
                    if (k === 'Enter' || k === '=') { e.preventDefault(); handleAction('='); }
                    if (k === 'Backspace') { e.preventDefault(); handleAction('backspace'); }
                    if (k === 'Escape') { handleAction('clear'); }
                    if (k === '(') handleAction('(');
                    if (k === ')') handleAction(')');
                    if (k === '%') handleAction('%');
                    if (k === '^') handleAction('^');
                };
                document.addEventListener('keydown', keyHandler);

                // ---- 시계 컨트롤 ----
                // Set 버튼: 사용자 설정 (모달 또는 간단 입력)
                document.getElementById('clockSetBtn').addEventListener('click', () => {
                    const input = prompt('Set timer (minutes):', Math.floor(globalTimerSeconds / 60));
                    if (input !== null) {
                        const mins = parseInt(input);
                        if (!isNaN(mins) && mins >= 0) {
                            resetGlobalTimerTo(mins * 60);
                        }
                    }
                });
                document.getElementById('clockStartBtn').addEventListener('click', () => {
                    if (!globalTimerRunning) startGlobalTimer();
                });
                document.getElementById('clockStopBtn').addEventListener('click', stopGlobalTimer);
                document.getElementById('clockResetBtn').addEventListener('click', () => {
                    resetGlobalTimerTo(parseInt(localStorage.getItem('util_timer_seconds')) || 134 * 60);
                });

                // ---- 초기화 ----
                setAngleMode('deg');
                updateDisplay();
                updateHistory();

                // 시계 업데이트 인터벌
                const clockInterval = setInterval(() => {
                    const el = document.getElementById('allinoneClockDisplay');
                    if (el) el.textContent = formatTime(globalTimerSeconds);
                }, 1000);

                // ---- 정리 ----
                cleanupFn = () => {
                    document.removeEventListener('keydown', keyHandler);
                    clearInterval(clockInterval);
                };
            }
        },

        // -------- 메모장 --------
        memo: {
            name: '📝 Memo',
            load: function() {
                const saved = localStorage.getItem('util_memo') || '';
                panelContent.innerHTML = `
                    <textarea class="util-textarea" id="utilMemoInput">${saved}</textarea>
                    <div style="display:flex;gap:8px;margin-top:8px;">
                        <button class="util-btn" id="utilMemoSave">💾 Save</button>
                        <button class="util-btn util-btn-secondary" id="utilMemoClear">🗑️ Clear</button>
                    </div>
                `;
                document.getElementById('utilMemoSave').addEventListener('click', () => {
                    const val = document.getElementById('utilMemoInput').value;
                    localStorage.setItem('util_memo', val);
                    alert('✅ Memo saved.');
                });
                document.getElementById('utilMemoClear').addEventListener('click', () => {
                    if (confirm('Clear memo?')) {
                        document.getElementById('utilMemoInput').value = '';
                        localStorage.removeItem('util_memo');
                    }
                });
                cleanupFn = null;
            }
        },

        // -------- 단위 변환기 --------
        unit: {
            name: '📐 Unit Converter',
            load: function() {
                const conversions = {
                    length: { m: 1, km: 0.001, cm: 100, mm: 1000, mi: 0.000621371, ft: 3.28084, in: 39.3701 },
                    weight: { kg: 1, g: 1000, mg: 1000000, lb: 2.20462, oz: 35.274 },
                    temperature: { c: 1, f: 1, k: 1 }
                };
                panelContent.innerHTML = `
                    <div style="display:flex;flex-direction:column;gap:8px;">
                        <select class="util-select" id="unitType">
                            <option value="length">📏 Length</option>
                            <option value="weight">⚖️ Weight</option>
                            <option value="temperature">🌡️ Temperature</option>
                        </select>
                        <div style="display:flex;gap:8px;">
                            <input class="util-input" id="unitInput" type="number" value="1" style="flex:1;">
                            <span style="color:#f5a623;font-weight:600;padding:8px;">=</span>
                            <input class="util-input" id="unitOutput" type="text" readonly style="flex:2;color:#f5a623;background:rgba(0,0,0,0.2);">
                        </div>
                        <button class="util-btn" id="unitConvertBtn">🔄 Convert</button>
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

    // ---------- 유틸리티 로더 ----------
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

    // ---------- 이벤트 ----------
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

    // 초기 시계 표시
    updateGlobalTimerDisplay();

    console.log('✅ utils-loader.js loaded (Advanced Engineering Calculator + Clock)');
})();
