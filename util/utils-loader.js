// ================================================================
// utils-loader.js v2.0
// 공용 유틸리티: 타이머 + 계산기
// - 아이콘 2개 분리
// - 시험지(.quiz-container) 우측 상단 기준 배치
// - 패널은 작게 열림
// ================================================================
(function () {
  'use strict';

  const DEFAULT_TIMER_SECONDS = 134 * 60;
  const TIMER_KEY = 'util_timer_seconds';
  const CALC_HISTORY_KEY = 'calc_history';

  function ready(fn) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', fn, { once: true });
    } else {
      fn();
    }
  }

  ready(function initQuizUtilities() {
    if (document.getElementById('utilsContainer')) return;

    const quizShell =
      document.querySelector('.quiz-container') ||
      document.getElementById('mainContainer') ||
      document.body;

    if (quizShell !== document.body) {
      const position = getComputedStyle(quizShell).position;
      if (position === 'static') quizShell.style.position = 'relative';
    }

    const style = document.createElement('style');
    style.textContent = `
      #utilsContainer {
        position: absolute;
        top: 14px;
        right: 16px;
        z-index: 10020;
        font-family: 'Segoe UI', 'Malgun Gothic', sans-serif;
      }

      .utils-icon-row {
        display: flex;
        justify-content: flex-end;
        gap: 9px;
      }

      .utils-icon-btn {
        width: 44px;
        height: 44px;
        border: 1px solid rgba(255,255,255,.22);
        border-radius: 50%;
        background: rgba(10,22,40,.94);
        color: #fff;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        font-size: 20px;
        cursor: pointer;
        box-shadow: 0 7px 18px rgba(0,0,0,.28);
        transition: transform .18s ease, background .18s ease, box-shadow .18s ease;
        line-height: 1;
      }

      .utils-icon-btn:hover,
      .utils-icon-btn.active {
        background: #f5a623;
        transform: translateY(-2px) scale(1.05);
        box-shadow: 0 9px 22px rgba(0,0,0,.32);
      }

      .utils-panel {
        position: absolute;
        top: 54px;
        right: 0;
        display: none;
        color: #fff;
        background: rgba(18,28,48,.98);
        border: 1px solid rgba(255,255,255,.13);
        border-radius: 14px;
        box-shadow: 0 14px 38px rgba(0,0,0,.38);
        backdrop-filter: blur(12px);
        overflow: hidden;
      }

      .utils-panel.visible { display: block; }

      #timerPanel { width: 275px; }
      #calculatorPanel { width: 330px; max-height: 72vh; overflow-y: auto; }

      .utils-panel-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 11px 13px;
        background: rgba(0,0,0,.18);
        border-bottom: 1px solid rgba(255,255,255,.08);
        font-size: 13px;
        font-weight: 700;
        letter-spacing: .3px;
      }

      .utils-close-btn {
        width: 28px;
        height: 28px;
        border: 0;
        border-radius: 50%;
        background: rgba(255,255,255,.08);
        color: #fff;
        cursor: pointer;
        font-size: 15px;
      }

      .utils-close-btn:hover { background: rgba(245,166,35,.25); }

      .utils-panel-body { padding: 13px; }

      .util-timer-display {
        text-align: center;
        font-size: 2rem;
        font-weight: 800;
        color: #f5a623;
        font-variant-numeric: tabular-nums;
        letter-spacing: 1px;
        padding: 12px 8px 14px;
      }

      .util-timer-controls {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 7px;
      }

      .util-timer-controls button,
      .calc-grid button {
        border: 1px solid rgba(255,255,255,.08);
        background: rgba(255,255,255,.065);
        color: #fff;
        border-radius: 8px;
        cursor: pointer;
        transition: background .12s ease, transform .12s ease;
      }

      .util-timer-controls button {
        padding: 9px 4px;
        font-size: 12px;
      }

      .util-timer-controls button:hover,
      .calc-grid button:hover {
        background: rgba(245,166,35,.2);
      }

      .util-timer-controls button:active,
      .calc-grid button:active {
        transform: scale(.95);
      }

      .calc-display {
        position: relative;
        min-height: 52px;
        padding: 18px 11px 8px;
        margin-bottom: 9px;
        border-radius: 9px;
        background: rgba(0,0,0,.34);
        border: 1px solid rgba(255,255,255,.06);
        text-align: right;
        font-family: 'Courier New', monospace;
        font-size: 1.35rem;
        font-weight: 700;
        word-break: break-all;
      }

      .calc-display .sub {
        position: absolute;
        top: 4px;
        right: 10px;
        font-size: 10px;
        color: rgba(255,255,255,.42);
        font-family: 'Segoe UI', sans-serif;
      }

      .calc-grid {
        display: grid;
        grid-template-columns: repeat(6, 1fr);
        gap: 5px;
      }

      .calc-grid button {
        min-height: 34px;
        padding: 6px 1px;
        font-size: 12px;
      }

      .calc-grid .op { color: #f5a623; }
      .calc-grid .del { color: #ff8585; }
      .calc-grid .func { color: #8ed4ef; font-size: 11px; }
      .calc-grid .eq {
        color: #f5a623;
        background: rgba(245,166,35,.18);
      }

      .calc-history {
        max-height: 52px;
        overflow-y: auto;
        margin-top: 7px;
        padding: 5px 7px;
        border-radius: 7px;
        background: rgba(0,0,0,.17);
        color: rgba(255,255,255,.42);
        font-size: 11px;
        text-align: right;
      }

      .calc-history div {
        padding: 2px 0;
        cursor: pointer;
        border-bottom: 1px solid rgba(255,255,255,.035);
      }

      .calc-history div:hover { color: #f5a623; }

      @media (max-width: 700px) {
        #utilsContainer {
          top: 10px;
          right: 10px;
        }

        .utils-icon-btn {
          width: 39px;
          height: 39px;
          font-size: 18px;
        }

        .utils-panel { top: 48px; }
        #timerPanel { width: min(270px, calc(100vw - 32px)); }
        #calculatorPanel { width: min(320px, calc(100vw - 32px)); }

        .calc-grid button {
          min-height: 31px;
          font-size: 11px;
        }
      }
    `;
    document.head.appendChild(style);

    const container = document.createElement('div');
    container.id = 'utilsContainer';
    container.innerHTML = `
      <div class="utils-icon-row">
        <button type="button" class="utils-icon-btn" id="timerIconBtn" title="Timer" aria-label="Timer">⏱️</button>
        <button type="button" class="utils-icon-btn" id="calculatorIconBtn" title="Calculator" aria-label="Calculator">🧮</button>
      </div>

      <section class="utils-panel" id="timerPanel" aria-hidden="true">
        <div class="utils-panel-header">
          <span>⏱️ Timer</span>
          <button type="button" class="utils-close-btn" data-close-panel="timerPanel">×</button>
        </div>
        <div class="utils-panel-body">
          <div class="util-timer-display" id="utilTimerDisplay">02:14:00</div>
          <div class="util-timer-controls">
            <button type="button" id="utilTimerSetBtn">Set</button>
            <button type="button" id="utilTimerStartBtn">▶</button>
            <button type="button" id="utilTimerStopBtn">⏸</button>
            <button type="button" id="utilTimerResetBtn">↺</button>
          </div>
        </div>
      </section>

      <section class="utils-panel" id="calculatorPanel" aria-hidden="true">
        <div class="utils-panel-header">
          <span>🧮 Calculator</span>
          <button type="button" class="utils-close-btn" data-close-panel="calculatorPanel">×</button>
        </div>
        <div class="utils-panel-body">
          <div class="calc-display">
            <span class="sub" id="calcAngleLabel">DEG</span>
            <span id="calcDisplayText">0</span>
          </div>

          <div class="calc-grid" id="calcGrid">
            <button class="func" data-action="sin">sin</button>
            <button class="func" data-action="cos">cos</button>
            <button class="func" data-action="tan">tan</button>
            <button class="func" data-action="log">log</button>
            <button class="func" data-action="ln">ln</button>
            <button class="func" data-action="sqrt">√</button>

            <button data-action="7">7</button>
            <button data-action="8">8</button>
            <button data-action="9">9</button>
            <button class="op" data-action="/">÷</button>
            <button class="op" data-action="*">×</button>
            <button class="del" data-action="backspace">⌫</button>

            <button data-action="4">4</button>
            <button data-action="5">5</button>
            <button data-action="6">6</button>
            <button class="op" data-action="-">−</button>
            <button class="op" data-action="+">+</button>
            <button class="del" data-action="clear">C</button>

            <button data-action="1">1</button>
            <button data-action="2">2</button>
            <button data-action="3">3</button>
            <button data-action="(">(</button>
            <button data-action=")">)</button>
            <button class="eq" data-action="=">=</button>

            <button data-action="0">0</button>
            <button data-action=".">.</button>
            <button class="func" data-action="pi">π</button>
            <button class="func" data-action="e">e</button>
            <button class="func" data-action="^">xʸ</button>
            <button class="func" data-action="%">%</button>

            <button class="func" data-action="ans">Ans</button>
            <button class="func" data-action="degrad">DEG/RAD</button>
            <button class="func" data-action="m+">M+</button>
            <button class="func" data-action="m-">M-</button>
            <button class="func" data-action="mr">MR</button>
            <button class="func" data-action="mc">MC</button>
          </div>

          <div class="calc-history" id="calcHistory"></div>
        </div>
      </section>
    `;

    quizShell.appendChild(container);

    const timerIconBtn = document.getElementById('timerIconBtn');
    const calculatorIconBtn = document.getElementById('calculatorIconBtn');
    const timerPanel = document.getElementById('timerPanel');
    const calculatorPanel = document.getElementById('calculatorPanel');

    function closePanel(panel, button) {
      panel.classList.remove('visible');
      panel.setAttribute('aria-hidden', 'true');
      button.classList.remove('active');
    }

    function openOnly(panel, button) {
      if (panel.classList.contains('visible')) {
        closePanel(panel, button);
        return;
      }

      closePanel(timerPanel, timerIconBtn);
      closePanel(calculatorPanel, calculatorIconBtn);

      panel.classList.add('visible');
      panel.setAttribute('aria-hidden', 'false');
      button.classList.add('active');
    }

    timerIconBtn.addEventListener('click', function () {
      openOnly(timerPanel, timerIconBtn);
    });

    calculatorIconBtn.addEventListener('click', function () {
      openOnly(calculatorPanel, calculatorIconBtn);
    });

    document.querySelectorAll('[data-close-panel]').forEach(function (button) {
      button.addEventListener('click', function () {
        const panelId = this.getAttribute('data-close-panel');
        if (panelId === 'timerPanel') closePanel(timerPanel, timerIconBtn);
        if (panelId === 'calculatorPanel') closePanel(calculatorPanel, calculatorIconBtn);
      });
    });

    document.addEventListener('click', function (event) {
      if (!container.contains(event.target)) {
        closePanel(timerPanel, timerIconBtn);
        closePanel(calculatorPanel, calculatorIconBtn);
      }
    });

    // ---------------- Timer ----------------
    let timerSeconds = parseInt(localStorage.getItem(TIMER_KEY), 10);
    if (!Number.isFinite(timerSeconds) || timerSeconds < 0) {
      timerSeconds = DEFAULT_TIMER_SECONDS;
    }

    let timerInterval = null;

    function formatTime(totalSeconds) {
      const hours = String(Math.floor(totalSeconds / 3600)).padStart(2, '0');
      const minutes = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, '0');
      const seconds = String(totalSeconds % 60).padStart(2, '0');
      return hours + ':' + minutes + ':' + seconds;
    }

    function updateTimerDisplay() {
      const display = document.getElementById('utilTimerDisplay');
      if (display) display.textContent = formatTime(timerSeconds);
      localStorage.setItem(TIMER_KEY, String(timerSeconds));
    }

    function stopTimer() {
      if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
      }
    }

    function startTimer() {
      if (timerInterval) return;

      timerInterval = setInterval(function () {
        if (timerSeconds > 0) {
          timerSeconds -= 1;
          updateTimerDisplay();
        } else {
          stopTimer();
          alert('⏰ Time is up!');
        }
      }, 1000);
    }

    document.getElementById('utilTimerSetBtn').addEventListener('click', function () {
      const input = prompt('Set timer in minutes:', String(Math.floor(timerSeconds / 60)));
      if (input === null) return;

      const minutes = parseInt(input, 10);
      if (Number.isFinite(minutes) && minutes >= 0) {
        stopTimer();
        timerSeconds = minutes * 60;
        updateTimerDisplay();
      }
    });

    document.getElementById('utilTimerStartBtn').addEventListener('click', startTimer);
    document.getElementById('utilTimerStopBtn').addEventListener('click', stopTimer);

    document.getElementById('utilTimerResetBtn').addEventListener('click', function () {
      stopTimer();
      timerSeconds = DEFAULT_TIMER_SECONDS;
      updateTimerDisplay();
    });

    updateTimerDisplay();

    // ---------------- Calculator ----------------
    let expression = '';
    let displayValue = '0';
    let isNewInput = true;
    let memory = null;
    let ans = 0;
    let angleMode = 'deg';

    let history;
    try {
      history = JSON.parse(localStorage.getItem(CALC_HISTORY_KEY) || '[]');
      if (!Array.isArray(history)) history = [];
    } catch (_) {
      history = [];
    }

    const displayText = document.getElementById('calcDisplayText');
    const angleLabel = document.getElementById('calcAngleLabel');
    const historyContainer = document.getElementById('calcHistory');

    function updateDisplay() {
      displayText.textContent = displayValue;
    }

    function updateHistory() {
      historyContainer.innerHTML = history
        .slice(-5)
        .reverse()
        .map(function (item) {
          return '<div data-result="' + item.result + '">' +
            item.expr + ' = ' + item.result +
            '</div>';
        })
        .join('');

      historyContainer.querySelectorAll('div').forEach(function (item) {
        item.addEventListener('click', function () {
          const result = this.getAttribute('data-result');
          if (!result) return;
          displayValue = result;
          expression = result;
          isNewInput = true;
          updateDisplay();
        });
      });
    }

    function addHistory(expr, result) {
      history.push({ expr: String(expr), result: String(result) });
      if (history.length > 20) history.shift();
      localStorage.setItem(CALC_HISTORY_KEY, JSON.stringify(history));
      updateHistory();
    }

    function setAngleMode(mode) {
      angleMode = mode;
      angleLabel.textContent = mode.toUpperCase();
    }

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

        if (angleMode === 'deg') {
          sanitized = sanitized
            .replace(/Math\.sin\(/g, 'Math.sin(deg2rad(')
            .replace(/Math\.cos\(/g, 'Math.cos(deg2rad(')
            .replace(/Math\.tan\(/g, 'Math.tan(deg2rad(');
        }

        const fn = new Function(
          'deg2rad',
          '"use strict"; return (' + sanitized + ')'
        );

        const deg2rad = function (degree) {
          return degree * Math.PI / 180;
        };

        return String(fn(deg2rad));
      } catch (_) {
        return 'Error';
      }
    }

    function handleAction(action) {
      if (action === 'm+') {
        const value = parseFloat(displayValue);
        if (!Number.isNaN(value)) memory = (memory || 0) + value;
        return;
      }

      if (action === 'm-') {
        const value = parseFloat(displayValue);
        if (!Number.isNaN(value)) memory = (memory || 0) - value;
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

      if (action === 'degrad') {
        setAngleMode(angleMode === 'deg' ? 'rad' : 'deg');
        return;
      }

      if (action === 'ans') {
        if (isNewInput) {
          expression = '';
          isNewInput = false;
        }
        expression += String(ans);
        displayValue = expression;
        updateDisplay();
        return;
      }

      if (action === 'pi' || action === 'e') {
        if (isNewInput) {
          expression = '';
          isNewInput = false;
        }
        expression += action === 'pi' ? 'π' : 'e';
        displayValue = expression;
        updateDisplay();
        return;
      }

      if (['sin', 'cos', 'tan', 'log', 'ln', 'sqrt'].includes(action)) {
        if (isNewInput) {
          expression = '';
          isNewInput = false;
        }
        expression += action + '(';
        displayValue = expression;
        updateDisplay();
        return;
      }

      if (action === 'clear') {
        expression = '';
        displayValue = '0';
        isNewInput = true;
        updateDisplay();
        return;
      }

      if (action === 'backspace') {
        if (isNewInput) {
          expression = '';
          displayValue = '0';
        } else {
          expression = expression.slice(0, -1);
          displayValue = expression || '0';
        }
        updateDisplay();
        return;
      }

      if (action === '=') {
        if (!expression) return;

        const result = evaluate(expression);
        const parsed = parseFloat(result);

        if (result !== 'Error' && Number.isFinite(parsed)) {
          const formatted = String(parsed);
          addHistory(expression, formatted);
          ans = parsed;
          displayValue = formatted;
          expression = formatted;
          isNewInput = true;
          updateDisplay();
        } else {
          displayValue = 'Error';
          updateDisplay();

          setTimeout(function () {
            displayValue = '0';
            expression = '';
            isNewInput = true;
            updateDisplay();
          }, 1000);
        }
        return;
      }

      if (action === '%') {
        const current = parseFloat(expression) || 0;
        expression = String(current / 100);
        displayValue = expression;
        isNewInput = false;
        updateDisplay();
        return;
      }

      if (isNewInput && !'+-*/^%()'.includes(action)) {
        expression = '';
        isNewInput = false;
      }

      expression += action;
      displayValue = expression;
      updateDisplay();
    }

    document.querySelectorAll('#calcGrid button').forEach(function (button) {
      button.addEventListener('click', function () {
        handleAction(this.getAttribute('data-action'));
      });
    });

    function keyHandler(event) {
      if (!calculatorPanel.classList.contains('visible')) return;

      const key = event.key;

      if (key >= '0' && key <= '9') handleAction(key);
      else if (key === '.') handleAction('.');
      else if (key === '+') handleAction('+');
      else if (key === '-') handleAction('-');
      else if (key === '*') handleAction('*');
      else if (key === '/') handleAction('/');
      else if (key === '(') handleAction('(');
      else if (key === ')') handleAction(')');
      else if (key === '%') handleAction('%');
      else if (key === '^') handleAction('^');
      else if (key === 'Enter' || key === '=') {
        event.preventDefault();
        handleAction('=');
      } else if (key === 'Backspace') {
        event.preventDefault();
        handleAction('backspace');
      } else if (key === 'Escape') {
        handleAction('clear');
      }
    }

    document.addEventListener('keydown', keyHandler);

    setAngleMode('deg');
    updateDisplay();
    updateHistory();

    console.log('✅ utils-loader.js v2.0 loaded');
  });
})();
