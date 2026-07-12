// ================================================================
// utils-loader.js: 모든 유틸리티 통합 (시계, 계산기, 메모장, 단위변환, 스톱워치)
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
            <button class="utils-icon-btn" data-util="clock" title="시계">🕐</button>
            <button class="utils-icon-btn" data-util="calculator" title="계산기">🔢</button>
            <button class="utils-icon-btn" data-util="memo" title="메모장">📝</button>
            <button class="utils-icon-btn" data-util="unit" title="단위 변환기">📐</button>
            <button class="utils-icon-btn" data-util="stopwatch" title="스톱워치">⏱️</button>
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

        // -------- UT-0410: 시계 --------
        clock: {
            name: '🕐 시계',
            load: function() {
                let seconds = 134 * 60;
                let interval = null;
                panelContent.innerHTML = `<div class="util-display" id="utilClockDisplay">02:14:00</div>`;
                const display = document.getElementById('utilClockDisplay');
                const update = () => {
                    const h = String(Math.floor(seconds / 3600)).padStart(2, '0');
                    const m = String(Math.floor((seconds % 3600) / 60)).padStart(2, '0');
                    const s = String(seconds % 60).padStart(2, '0');
                    display.textContent = h + ':' + m + ':' + s;
                };
                interval = setInterval(() => { if (seconds > 0) { seconds--; update(); } else { clearInterval(interval); } }, 1000);
                cleanupFn = () => { if (interval) clearInterval(interval); };
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
        },

        // -------- UT-0450: 스톱워치 --------
        stopwatch: {
            name: '⏱️ 스톱워치',
            load: function() {
                let ms = 0, running = false, interval = null;
                panelContent.innerHTML = `
                    <div class="util-display" id="swDisplay">00:00.0</div>
                    <div class="util-flex">
                        <button class="util-btn" id="swStart" style="background:#27ae60;">▶ 시작</button>
                        <button class="util-btn" id="swStop" style="background:#e74c3c;">⏹ 정지</button>
                        <button class="util-btn util-btn-secondary" id="swReset">↺ 초기화</button>
                    </div>
                `;
                const display = document.getElementById('swDisplay');
                const update = () => {
                    const m = String(Math.floor(ms / 60000)).padStart(2, '0');
                    const s = String(Math.floor((ms % 60000) / 1000)).padStart(2, '0');
                    const d = String(Math.floor((ms % 1000) / 100));
                    display.textContent = `${m}:${s}.${d}`;
                };
                document.getElementById('swStart').addEventListener('click', () => {
                    if (running) return;
                    running = true;
                    interval = setInterval(() => { ms += 100; update(); }, 100);
                });
                document.getElementById('swStop').addEventListener('click', () => {
                    running = false;
                    if (interval) { clearInterval(interval); interval = null; }
                });
                document.getElementById('swReset').addEventListener('click', () => {
                    running = false;
                    if (interval) { clearInterval(interval); interval = null; }
                    ms = 0; update();
                });
                cleanupFn = () => { if (interval) { clearInterval(interval); interval = null; } };
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

    console.log('✅ utils-loader.js loaded (all-in-one)');
})();
