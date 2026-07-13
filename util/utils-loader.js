// ================================================================
// utils-loader.js v2.1
// 공용 유틸리티: 타이머 + 계산기
// - 검은 헤더(.quiz-header) 안에 아이콘 2개
// - 브라우저 prompt() 제거
// - 타이머 패널 안에서 시간 직접 설정
// - main.js / initialize()와 독립 실행
// ================================================================
(function () {
  'use strict';

  if (document.getElementById('quizCommonUtils')) return;

  var header = document.querySelector('.quiz-header');
  if (!header) {
    console.warn('⚠️ utils-loader: .quiz-header not found');
    return;
  }

  if (getComputedStyle(header).position === 'static') {
    header.style.position = 'relative';
  }

  var DEFAULT_MINUTES = 134;
  var TIMER_KEY = 'common_util_timer_seconds';
  var HISTORY_KEY = 'common_util_calc_history';

  var style = document.createElement('style');
  style.textContent = `
    #quizCommonUtils {
      position: absolute;
      top: 14px;
      right: 16px;
      z-index: 50;
      font-family: 'Segoe UI', 'Malgun Gothic', sans-serif;
      -webkit-text-fill-color: initial;
    }

    .qcu-icons {
      display: flex;
      gap: 8px;
      justify-content: flex-end;
    }

    .qcu-icon {
      width: 42px;
      height: 42px;
      border: 1px solid rgba(255,255,255,.22);
      border-radius: 50%;
      background: rgba(255,255,255,.10);
      color: #fff;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-size: 19px;
      line-height: 1;
      cursor: pointer;
      box-shadow: 0 6px 16px rgba(0,0,0,.24);
      transition: transform .18s, background .18s;
    }

    .qcu-icon:hover,
    .qcu-icon.active {
      background: #f5a623;
      transform: translateY(-2px);
    }

    .qcu-panel {
      position: absolute;
      top: 50px;
      right: 0;
      display: none;
      color: #fff;
      background: rgba(18,28,48,.98);
      border: 1px solid rgba(255,255,255,.15);
      border-radius: 14px;
      box-shadow: 0 15px 38px rgba(0,0,0,.40);
      overflow: hidden;
      text-align: left;
      -webkit-text-fill-color: initial;
    }

    .qcu-panel.open { display: block; }
    #qcuTimerPanel { width: 290px; }
    #qcuCalcPanel { width: 326px; max-height: 72vh; overflow-y: auto; }

    .qcu-panel-head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 10px 12px;
      background: rgba(0,0,0,.18);
      border-bottom: 1px solid rgba(255,255,255,.08);
      font-size: 13px;
      font-weight: 700;
    }

    .qcu-close {
      width: 27px;
      height: 27px;
      border: 0;
      border-radius: 50%;
      background: rgba(255,255,255,.08);
      color: #fff;
      cursor: pointer;
      font-size: 17px;
    }

    .qcu-body { padding: 13px; }

    .qcu-time {
      text-align: center;
      color: #f5a623;
      font-size: 2rem;
      font-weight: 800;
      font-variant-numeric: tabular-nums;
      letter-spacing: 1px;
      padding: 5px 0 12px;
    }

    .qcu-time-set {
      display: grid;
      grid-template-columns: 1fr 78px;
      gap: 7px;
      margin-bottom: 9px;
    }

    .qcu-time-set input {
      width: 100%;
      height: 38px;
      border: 1px solid rgba(255,255,255,.16);
      border-radius: 8px;
      background: rgba(0,0,0,.28);
      color: #fff;
      padding: 0 10px;
      font-size: 14px;
      outline: none;
      -webkit-text-fill-color: #fff;
    }

    .qcu-time-set input:focus { border-color: #f5a623; }

    .qcu-time-set button,
    .qcu-timer-buttons button,
    .qcu-calc-grid button {
      border: 1px solid rgba(255,255,255,.08);
      border-radius: 8px;
      background: rgba(255,255,255,.07);
      color: #fff;
      cursor: pointer;
    }

    .qcu-time-set button {
      font-weight: 700;
      background: rgba(245,166,35,.20);
      color: #f5a623;
    }

    .qcu-timer-buttons {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 7px;
    }

    .qcu-timer-buttons button {
      min-height: 38px;
      font-size: 13px;
    }

    .qcu-time-set button:hover,
    .qcu-timer-buttons button:hover,
    .qcu-calc-grid button:hover {
      background: rgba(245,166,35,.22);
    }

    .qcu-set-note {
      min-height: 18px;
      margin-top: 7px;
      color: rgba(255,255,255,.55);
      font-size: 11px;
      text-align: center;
    }

    .qcu-calc-display {
      position: relative;
      min-height: 50px;
      padding: 18px 10px 7px;
      margin-bottom: 8px;
      border-radius: 8px;
      background: rgba(0,0,0,.34);
      border: 1px solid rgba(255,255,255,.06);
      text-align: right;
      font: 700 1.32rem 'Courier New', monospace;
      word-break: break-all;
    }

    .qcu-angle {
      position: absolute;
      top: 4px;
      right: 9px;
      color: rgba(255,255,255,.42);
      font: 10px 'Segoe UI', sans-serif;
    }

    .qcu-calc-grid {
      display: grid;
      grid-template-columns: repeat(6, 1fr);
      gap: 5px;
    }

    .qcu-calc-grid button {
      min-height: 33px;
      padding: 5px 1px;
      font-size: 12px;
    }

    .qcu-calc-grid .func { color: #8ed4ef; font-size: 11px; }
    .qcu-calc-grid .op { color: #f5a623; }
    .qcu-calc-grid .del { color: #ff8585; }
    .qcu-calc-grid .eq {
      color: #f5a623;
      background: rgba(245,166,35,.18);
    }

    .qcu-history {
      max-height: 48px;
      overflow-y: auto;
      margin-top: 7px;
      padding: 5px 7px;
      border-radius: 7px;
      background: rgba(0,0,0,.17);
      color: rgba(255,255,255,.40);
      font-size: 11px;
      text-align: right;
    }

    .qcu-history div { padding: 2px 0; cursor: pointer; }
    .qcu-history div:hover { color: #f5a623; }

    @media (max-width: 650px) {
      #quizCommonUtils { top: 10px; right: 10px; }
      .qcu-icon { width: 38px; height: 38px; font-size: 17px; }
      .qcu-panel { top: 46px; }
      #qcuTimerPanel { width: min(285px, calc(100vw - 28px)); }
      #qcuCalcPanel { width: min(318px, calc(100vw - 28px)); }
    }
  `;
  document.head.appendChild(style);

  var root = document.createElement('div');
  root.id = 'quizCommonUtils';
  root.innerHTML = `
    <div class="qcu-icons">
      <button type="button" id="qcuTimerIcon" class="qcu-icon" title="Timer" aria-label="Timer">⏱️</button>
      <button type="button" id="qcuCalcIcon" class="qcu-icon" title="Calculator" aria-label="Calculator">🧮</button>
    </div>

    <section id="qcuTimerPanel" class="qcu-panel">
      <div class="qcu-panel-head">
        <span>⏱️ Timer</span>
        <button type="button" class="qcu-close" data-close="timer">×</button>
      </div>
      <div class="qcu-body">
        <div id="qcuTimeDisplay" class="qcu-time">02:14:00</div>

        <div class="qcu-time-set">
          <input id="qcuMinutesInput" type="number" min="1" max="999"
                 inputmode="numeric" placeholder="Minutes">
          <button type="button" id="qcuApplyTime">Apply</button>
        </div>

        <div class="qcu-timer-buttons">
          <button type="button" id="qcuStartTimer">▶ Start</button>
          <button type="button" id="qcuPauseTimer">⏸ Pause</button>
          <button type="button" id="qcuResetTimer">↺ Reset</button>
        </div>

        <div id="qcuSetNote" class="qcu-set-note">
          Enter minutes above to change the timer.
        </div>
      </div>
    </section>

    <section id="qcuCalcPanel" class="qcu-panel">
      <div class="qcu-panel-head">
        <span>🧮 Calculator</span>
        <button type="button" class="qcu-close" data-close="calc">×</button>
      </div>
      <div class="qcu-body">
        <div class="qcu-calc-display">
          <span id="qcuAngle" class="qcu-angle">DEG</span>
          <span id="qcuCalcText">0</span>
        </div>

        <div id="qcuCalcGrid" class="qcu-calc-grid">
          <button class="func" data-a="sin">sin</button>
          <button class="func" data-a="cos">cos</button>
          <button class="func" data-a="tan">tan</button>
          <button class="func" data-a="log">log</button>
          <button class="func" data-a="ln">ln</button>
          <button class="func" data-a="sqrt">√</button>

          <button data-a="7">7</button><button data-a="8">8</button><button data-a="9">9</button>
          <button class="op" data-a="/">÷</button><button class="op" data-a="*">×</button>
          <button class="del" data-a="back">⌫</button>

          <button data-a="4">4</button><button data-a="5">5</button><button data-a="6">6</button>
          <button class="op" data-a="-">−</button><button class="op" data-a="+">+</button>
          <button class="del" data-a="clear">C</button>

          <button data-a="1">1</button><button data-a="2">2</button><button data-a="3">3</button>
          <button data-a="(">(</button><button data-a=")">)</button><button class="eq" data-a="=">=</button>

          <button data-a="0">0</button><button data-a=".">.</button>
          <button class="func" data-a="pi">π</button><button class="func" data-a="e">e</button>
          <button class="func" data-a="^">xʸ</button><button class="func" data-a="%">%</button>

          <button class="func" data-a="ans">Ans</button><button class="func" data-a="mode">DEG/RAD</button>
          <button class="func" data-a="m+">M+</button><button class="func" data-a="m-">M-</button>
          <button class="func" data-a="mr">MR</button><button class="func" data-a="mc">MC</button>
        </div>

        <div id="qcuHistory" class="qcu-history"></div>
      </div>
    </section>
  `;
  header.appendChild(root);

  var timerIcon = document.getElementById('qcuTimerIcon');
  var calcIcon = document.getElementById('qcuCalcIcon');
  var timerPanel = document.getElementById('qcuTimerPanel');
  var calcPanel = document.getElementById('qcuCalcPanel');

  function closeAll() {
    timerPanel.classList.remove('open');
    calcPanel.classList.remove('open');
    timerIcon.classList.remove('active');
    calcIcon.classList.remove('active');
  }

  function togglePanel(panel, icon) {
    var wasOpen = panel.classList.contains('open');
    closeAll();
    if (!wasOpen) {
      panel.classList.add('open');
      icon.classList.add('active');
    }
  }

  timerIcon.addEventListener('click', function (e) {
    e.stopPropagation();
    togglePanel(timerPanel, timerIcon);
  });

  calcIcon.addEventListener('click', function (e) {
    e.stopPropagation();
    togglePanel(calcPanel, calcIcon);
  });

  root.querySelectorAll('[data-close]').forEach(function (btn) {
    btn.addEventListener('click', closeAll);
  });

  root.addEventListener('click', function (e) {
    e.stopPropagation();
  });

  document.addEventListener('click', closeAll);

  // ---------------- Timer ----------------
  var timerSeconds = parseInt(localStorage.getItem(TIMER_KEY), 10);
  if (!Number.isFinite(timerSeconds) || timerSeconds < 0) {
    timerSeconds = DEFAULT_MINUTES * 60;
  }

  var timerId = null;
  var timeDisplay = document.getElementById('qcuTimeDisplay');
  var minutesInput = document.getElementById('qcuMinutesInput');
  var setNote = document.getElementById('qcuSetNote');

  function formatTime(seconds) {
    var h = String(Math.floor(seconds / 3600)).padStart(2, '0');
    var m = String(Math.floor((seconds % 3600) / 60)).padStart(2, '0');
    var s = String(seconds % 60).padStart(2, '0');
    return h + ':' + m + ':' + s;
  }

  function drawTime() {
    timeDisplay.textContent = formatTime(timerSeconds);
    localStorage.setItem(TIMER_KEY, String(timerSeconds));
  }

  function pauseTimer() {
    if (timerId) {
      clearInterval(timerId);
      timerId = null;
    }
  }

  function startTimer() {
    if (timerId) return;
    setNote.textContent = 'Timer is running.';
    timerId = setInterval(function () {
      if (timerSeconds > 0) {
        timerSeconds -= 1;
        drawTime();
      } else {
        pauseTimer();
        setNote.textContent = 'Time is up!';
        timeDisplay.textContent = '00:00:00';
      }
    }, 1000);
  }

  document.getElementById('qcuApplyTime').addEventListener('click', function () {
    var minutes = parseInt(minutesInput.value, 10);

    if (!Number.isFinite(minutes) || minutes < 1 || minutes > 999) {
      setNote.textContent = 'Enter a number from 1 to 999 minutes.';
      minutesInput.focus();
      return;
    }

    pauseTimer();
    timerSeconds = minutes * 60;
    drawTime();
    setNote.textContent = minutes + ' minutes applied.';
    minutesInput.value = '';
  });

  minutesInput.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      document.getElementById('qcuApplyTime').click();
    }
  });

  document.getElementById('qcuStartTimer').addEventListener('click', startTimer);

  document.getElementById('qcuPauseTimer').addEventListener('click', function () {
    pauseTimer();
    setNote.textContent = 'Timer paused.';
  });

  document.getElementById('qcuResetTimer').addEventListener('click', function () {
    pauseTimer();
    timerSeconds = DEFAULT_MINUTES * 60;
    drawTime();
    setNote.textContent = 'Reset to ' + DEFAULT_MINUTES + ' minutes.';
  });

  drawTime();

  // ---------------- Calculator ----------------
  var expression = '';
  var shown = '0';
  var newInput = true;
  var memory = null;
  var ans = 0;
  var angleMode = 'deg';
  var history = [];

  try {
    history = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
    if (!Array.isArray(history)) history = [];
  } catch (_) {
    history = [];
  }

  var calcText = document.getElementById('qcuCalcText');
  var angleText = document.getElementById('qcuAngle');
  var historyBox = document.getElementById('qcuHistory');

  function drawCalc() { calcText.textContent = shown; }

  function drawHistory() {
    historyBox.innerHTML = history.slice(-5).reverse().map(function (h) {
      return '<div data-result="' + h.result + '">' + h.expr + ' = ' + h.result + '</div>';
    }).join('');

    historyBox.querySelectorAll('div').forEach(function (el) {
      el.addEventListener('click', function () {
        shown = this.getAttribute('data-result') || '0';
        expression = shown;
        newInput = true;
        drawCalc();
      });
    });
  }

  function saveHistory(expr, result) {
    history.push({ expr: expr, result: result });
    if (history.length > 20) history.shift();
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
    drawHistory();
  }

  function evaluate(expr) {
    try {
      var safe = expr
        .replace(/sin\(/g, 'Math.sin(')
        .replace(/cos\(/g, 'Math.cos(')
        .replace(/tan\(/g, 'Math.tan(')
        .replace(/log\(/g, 'Math.log10(')
        .replace(/ln\(/g, 'Math.log(')
        .replace(/sqrt\(/g, 'Math.sqrt(')
        .replace(/π/g, 'Math.PI')
        .replace(/e(?![xp])/g, 'Math.E')
        .replace(/\^/g, '**');

      if (angleMode === 'deg') {
        safe = safe
          .replace(/Math\.sin\(/g, 'Math.sin(rad(')
          .replace(/Math\.cos\(/g, 'Math.cos(rad(')
          .replace(/Math\.tan\(/g, 'Math.tan(rad(');
      }

      var fn = new Function('rad', '"use strict"; return (' + safe + ')');
      return String(fn(function (d) { return d * Math.PI / 180; }));
    } catch (_) {
      return 'Error';
    }
  }

  function action(a) {
    if (a === 'm+') {
      var plus = parseFloat(shown);
      if (!Number.isNaN(plus)) memory = (memory || 0) + plus;
      return;
    }
    if (a === 'm-') {
      var minus = parseFloat(shown);
      if (!Number.isNaN(minus)) memory = (memory || 0) - minus;
      return;
    }
    if (a === 'mr') {
      if (memory !== null) {
        shown = String(memory);
        expression = shown;
        newInput = true;
        drawCalc();
      }
      return;
    }
    if (a === 'mc') { memory = null; return; }
    if (a === 'mode') {
      angleMode = angleMode === 'deg' ? 'rad' : 'deg';
      angleText.textContent = angleMode.toUpperCase();
      return;
    }
    if (a === 'clear') {
      expression = '';
      shown = '0';
      newInput = true;
      drawCalc();
      return;
    }
    if (a === 'back') {
      expression = newInput ? '' : expression.slice(0, -1);
      shown = expression || '0';
      newInput = false;
      drawCalc();
      return;
    }
    if (a === '=') {
      if (!expression) return;
      var result = evaluate(expression);
      var number = parseFloat(result);

      if (result !== 'Error' && Number.isFinite(number)) {
        var formatted = String(number);
        saveHistory(expression, formatted);
        ans = number;
        expression = formatted;
        shown = formatted;
        newInput = true;
      } else {
        expression = '';
        shown = 'Error';
        newInput = true;
      }
      drawCalc();
      return;
    }
    if (a === 'ans') a = String(ans);
    if (a === 'pi') a = 'π';
    if (['sin','cos','tan','log','ln','sqrt'].indexOf(a) >= 0) a += '(';
    if (a === '%') {
      expression = String((parseFloat(expression) || 0) / 100);
      shown = expression;
      newInput = false;
      drawCalc();
      return;
    }
    if (newInput && '+-*/^()'.indexOf(a) < 0) {
      expression = '';
      newInput = false;
    }
    expression += a;
    shown = expression;
    drawCalc();
  }

  document.querySelectorAll('#qcuCalcGrid button').forEach(function (btn) {
    btn.addEventListener('click', function () {
      action(this.getAttribute('data-a'));
    });
  });

  document.addEventListener('keydown', function (e) {
    if (!calcPanel.classList.contains('open')) return;

    var k = e.key;
    if (k >= '0' && k <= '9') action(k);
    else if (['.','+','-','*','/','(',')','%','^'].indexOf(k) >= 0) action(k);
    else if (k === 'Enter' || k === '=') { e.preventDefault(); action('='); }
    else if (k === 'Backspace') { e.preventDefault(); action('back'); }
    else if (k === 'Escape') { e.preventDefault(); action('clear'); }
  });

  drawCalc();
  drawHistory();

  console.log('✅ utils-loader.js v2.1 loaded');
})();
