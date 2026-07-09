// ============================================================
// B001: LANG 객체 및 상수 정의
// ============================================================
var LANG = {
  enterNumber: "Enter Starting Number",
  enterSub: "Enter the question number to begin",
  rangeInfo: "Range: 1 ~ ",
  startBtn: "▶ START",
  freshHint: "Enter a number and click START to begin a new session or click Resume above to continue where you left off",
  resumeTitle: "Resume from where you left off",
  resumeDetail: "{answered}/{total} answered · {time}",
  resumeHint: "Click to continue your previous session",
  qPrefix: "Question",
  of: "/",
  originalPrefix: "(Original #",
  originalSuffix: ")",
  prevBtn: "◀ PREV",
  skipBtn: "SKIP",
  nextBtn: "NEXT ▶",
  submitBtn: "SUBMIT",
  quitBtn: "✕ QUIT",
  reviewModePrefix: "Review Mode: ",
  reviewModeSuffix: " questions (Wrong/Skipped/Unanswered)",
  exitReview: "EXIT REVIEW",
  resultTitle: "📊 RESULT",
  correctLabel: "✅ CORRECT",
  accuracyLabel: "🎯 ACCURACY",
  resultClickLabel: "Results (Click to move)",
  retryBtn: "🔄 RETRY",
  reviewBtn: "📝 REVIEW",
  closeBtn: "✕ CLOSE",
  reviewModalTitle: "📝 REVIEW",
  reviewModalSubtitle: "Wrong / Skipped / Unanswered",
  retryWrongOnlyBtn: "🔄 RETRY WRONG ONLY",
  reviewQuestions: "Review Questions:",
  wrongCount: "Wrong:",
  skippedCount: "Skipped:",
  unansweredCount: "Unanswered:",
  questionPrefix: "Question",
  originalPrefixShort: "(Original #)",
  statusWrong: "WRONG",
  statusSkipped: "SKIPPED",
  statusUnanswered: "UNANSWERED",
  statusNotAnswered: "Status: You did not answer this question.",
  correctAnswerLabel: "Correct Answer:",
  explanationLabel: "Explanation",
  yourAnswerLabel: "(YOUR ANSWER)",
  correctAnswer: "✅ CORRECT! Answer:",
  wrongAnswer: "❌ WRONG. Answer:",
  noExplanation: "No explanation available.",
  loadError: "Failed to load questions:",
  allCorrect: "🎉 Congratulations! All correct!",
  perfectReview: "✨ Perfect! No questions to review!",
  confirmExit: "Return to main menu. Progress will not be saved.",
  reviewModeQuestionPrefix: "Review Question",
  loading: "Loading...",
  loadingQuestions: "Loading questions from ",
  rangeText: "Range: 1 ~ "
};

// ============================================================
// B002: API URL 및 전역 변수
// ============================================================
var API_URL = "https://script.google.com/macros/s/AKfycbzJ_5tnUjWfYSGIMnzglrB-T8nwhLwKVKUs8Kzvxb8Oe8qhX8N9wEi_wf4m6RYcjQA6/exec";
var ORIGINAL_API_URL = API_URL;

var STORAGE_KEY = 'quiz_progress_main';
var TOTAL_CACHE_KEY = 'quiz_total_questions';
var QUESTIONS_PER_SET = 120;
var TOTAL_QUESTIONS = 0;
var masterQuestions = [];
var currentQuestions = [];
var userAnswers = [];
var currentIndex = 0;
var correctCount = 0;
var isReviewMode = false;
var originalQuestions = [];
var currentStartNumber = 1;
var autoSaveInterval = null;
var chartInstances = {};
var DOM = {};

// ============================================================
// B003: Splash 화면 관련 함수
// ============================================================
function updateSplash(percent, text) {
  var bar = document.getElementById('splashBar');
  var status = document.getElementById('splashStatus');
  if (bar) bar.style.width = Math.min(100, percent) + '%';
  if (status) status.textContent = text || 'Loading...';
  console.log('Splash: ' + percent + '% - ' + text);
}

function showSplashError(msg) {
  var errorEl = document.getElementById('splashError');
  var retryBtn = document.getElementById('splashRetry');
  if (errorEl) { errorEl.style.display = 'block'; errorEl.textContent = '▲ ' + msg; }
  if (retryBtn) retryBtn.style.display = 'inline-block';
}

function hideSplash() {
  var overlay = document.getElementById('splashOverlay');
  if (overlay) {
    overlay.style.opacity = '0';
    setTimeout(function() {
      overlay.style.display = 'none';
      var mc = document.getElementById('mainContainer');
      if (mc) mc.style.display = 'block';
    }, 500);
  }
}

// ============================================================
// B004: 유틸리티 함수
// ============================================================
function escapeHtml(str) {
  if (str === null || str === undefined) return "";
  if (typeof str !== 'string') str = String(str);
  return str.replace(/[&<>]/g, function(m) {
    if (m === '&') return '&amp;';
    if (m === '<') return '&lt;';
    if (m === '>') return '&gt;';
    return m;
  });
}

function getAnswerLetter(num) {
  var n = parseInt(num);
  if (isNaN(n)) return num;
  var letters = {1:'A',2:'B',3:'C',4:'D'};
  return letters[n] || num;
}

function getValidChoiceKeys(choices) {
  return Object.keys(choices).filter(function(key) {
    var val = choices[key];
    if (typeof val === 'string') return val && val.trim() !== "";
    return val !== null && val !== undefined && val !== "";
  }).sort(function(a, b) { return Number(a) - Number(b); });
}

function hasRealChoices(q) {
  if (!q || !q.choices) return false;
  return Object.values(q.choices).some(function(v) {
    if (!v || typeof v !== 'string') return false;
    var trimmed = v.trim();
    return trimmed !== "" && trimmed.toLowerCase() !== 'no options' && trimmed.toLowerCase() !== 'no options.' && trimmed !== 'No options';
  });
}

function isSubjectiveQuestion(q) {
  if (!q || !q.choices) return true;
  return !hasRealChoices(q);
}

function randomizeChoicesOnly(q) {
  if (!q || !q.choices) return q;
  if (!hasRealChoices(q)) return q;
  try {
    var validEntries = Object.entries(q.choices).filter(function(item) {
      var k = item[0], v = item[1];
      if (typeof v === 'string') return v && v.trim() !== "";
      return v !== null && v !== undefined && v !== "";
    }).map(function(item) {
      var k = item[0], v = item[1];
      return { k: parseInt(k), v: String(v) };
    });
    var shuffled = validEntries.slice();
    for (var i = shuffled.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var temp = shuffled[i];
      shuffled[i] = shuffled[j];
      shuffled[j] = temp;
    }
    var newChoices = {};
    shuffled.forEach(function(c, idx) { newChoices[idx + 1] = c.v; });
    var originalAns = parseInt(q.answer);
    var correctIdx = shuffled.findIndex(function(c) { return c.k == originalAns; });
    return {
      ...q,
      choices: newChoices,
      answer: (correctIdx + 1).toString()
    };
  } catch(e) {
    console.error("Randomize error:", e);
    return q;
  }
}

// ============================================================
// B005: 진행 표시 및 로딩 오버레이
// ============================================================
function updateProgressDisplay() {
  var total = currentQuestions.length || 1;
  var percent = ((currentIndex + 1) / total) * 100;
  if (DOM.quizProgressBar) DOM.quizProgressBar.style.width = percent + '%';
  if (DOM.progressText) {
    DOM.progressText.style.display = 'inline-block';
    DOM.progressText.innerText = (currentIndex + 1) + ' / ' + total;
  }
}

function showLoadingOverlay(message) {
  var overlay = document.createElement('div');
  overlay.id = 'loadingOverlay';
  overlay.className = 'loading-overlay';
  overlay.innerHTML = '<div class="loading-spinner"></div><h3>' + message + '</h3>';
  document.body.appendChild(overlay);
  return overlay;
}

function hideLoadingOverlay() {
  var overlay = document.getElementById('loadingOverlay');
  if (overlay) overlay.remove();
}

// ============================================================
// B006: 진행 저장/로드/초기화 함수
// ============================================================
function saveProgress() {
  try {
    var data = {
      currentQuestions: currentQuestions,
      userAnswers: userAnswers,
      currentIndex: currentIndex,
      correctCount: correctCount,
      currentStartNumber: currentStartNumber,
      isReviewMode: isReviewMode,
      originalQuestions: originalQuestions,
      masterQuestions: masterQuestions,
      timestamp: new Date().toISOString()
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    return true;
  } catch(e) {
    console.warn('Save failed:', e);
    return false;
  }
}

function loadProgress() {
  try {
    var raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch(e) {
    console.warn('Load failed:', e);
    return null;
  }
}

function clearProgress() {
  localStorage.removeItem(STORAGE_KEY);
  if (autoSaveInterval) {
    clearInterval(autoSaveInterval);
    autoSaveInterval = null;
  }
}

function startAutoSave() {
  if (autoSaveInterval) clearInterval(autoSaveInterval);
  autoSaveInterval = setInterval(function() {
    saveProgress();
  }, 5000);
}

// ============================================================
// B007: API 호출 함수 (detectTotalQuestions - 캐시 버전)
// ============================================================
function updateSetSelector() {
  var setSelector = document.getElementById('setSelector');
  if (!setSelector) return;
  while (setSelector.options.length > 0) {
    setSelector.remove(0);
  }
  var totalQuestions = TOTAL_QUESTIONS > 0 ? TOTAL_QUESTIONS : 360;
  var totalSets = Math.ceil(totalQuestions / QUESTIONS_PER_SET);
  for (var i = 1; i <= totalSets; i++) {
    var start = (i - 1) * QUESTIONS_PER_SET + 1;
    var end = Math.min(i * QUESTIONS_PER_SET, totalQuestions);
    var option = document.createElement('option');
    option.value = i;
    option.textContent = 'Set ' + i + ' (Questions ' + start + '-' + end + ')';
    setSelector.appendChild(option);
  }
  var maxStartNumber = Math.max(1, totalQuestions - QUESTIONS_PER_SET + 1);
  if (DOM.maxNumberDisplay) {
    DOM.maxNumberDisplay.innerHTML = maxStartNumber.toLocaleString();
  }
  if (DOM.startNumberInput) {
    DOM.startNumberInput.placeholder = '1 ~ ' + maxStartNumber.toLocaleString();
    DOM.startNumberInput.max = maxStartNumber;
  }
  if (setSelector.options.length > 0) {
    setSelector.value = '1';
  }
  if (DOM.startNumberInput) {
    DOM.startNumberInput.value = '1';
  }
}

async function detectTotalQuestions() {
    // ★★★★★ 1. 캐시 확인 (5분 이내면 사용) ★★★★★
    const cached = localStorage.getItem(TOTAL_CACHE_KEY);
    const cachedTime = localStorage.getItem(TOTAL_CACHE_KEY + '_time');
    const now = Date.now();
    const CACHE_TTL = 5 * 60 * 1000; // 5분

    if (cached && cachedTime && (now - parseInt(cachedTime) < CACHE_TTL)) {
        const total = parseInt(cached);
        console.log('✅ Using cached total:', total);
        TOTAL_QUESTIONS = total;
        updateSplash(60, 'Preparing data...');
        return total;
    }

    // ★★★★★ 2. 캐시가 없거나 만료됐으면 API 호출 ★★★★★
    console.log('🔄 Fetching fresh total...');
    localStorage.removeItem(TOTAL_CACHE_KEY);
    
    try {
        updateSplash(30, 'Checking total questions...');
        const url = ORIGINAL_API_URL + '?total=true&_=' + Date.now();
        console.log('📡 Requesting total (direct):', url);
        
        const response = await fetch(url);
        if (!response.ok) throw new Error('HTTP ' + response.status);
        
        const text = await response.text();
        if (text.trim().startsWith('<!DOCTYPE') || text.trim().startsWith('<html')) {
            throw new Error('HTML response - check Apps Script URL');
        }
        
        const data = JSON.parse(text);
        const total = data.total || 0;
        
        if (total > 0) {
            TOTAL_QUESTIONS = total;
            localStorage.setItem(TOTAL_CACHE_KEY, String(TOTAL_QUESTIONS));
            localStorage.setItem(TOTAL_CACHE_KEY + '_time', String(now));
            console.log('✅ Total questions:', total);
            updateSplash(60, 'Preparing data...');
            return total;
        }
        
        console.warn('⚠️ Could not detect total, using fallback: 1320');
    } catch(e) {
        console.error('❌ Total API call failed:', e.message);
    }
    
    // ★★★★★ 3. 실패 시 fallback ★★★★★
    TOTAL_QUESTIONS = 1320;
    localStorage.setItem(TOTAL_CACHE_KEY, String(TOTAL_QUESTIONS));
    localStorage.setItem(TOTAL_CACHE_KEY + '_time', String(now));
    updateSplash(60, 'Preparing data...');
    return TOTAL_QUESTIONS;
}

// ============================================================
// B008: 퀴즈 네비게이션 함수 (goNext, goPrev, skipQuestion, submitSubjective)
// ============================================================
function goNext() {
  if (currentIndex < currentQuestions.length - 1) {
    currentIndex++;
    renderCurrentQuestion();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}

function goPrev() {
  if (currentIndex > 0) {
    currentIndex--;
    renderCurrentQuestion();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}

function skipQuestion() {
  if (userAnswers[currentIndex] === null || userAnswers[currentIndex] === undefined) {
    userAnswers[currentIndex] = -1;
    saveProgress();
  }
  if (currentIndex < currentQuestions.length - 1) {
    currentIndex++;
    renderCurrentQuestion();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}

function submitSubjective() {
  var input = document.getElementById('subjectiveInput');
  if (!input) return;
  var userAnswer = input.value.trim();
  if (userAnswer === "") {
    alert('Please enter your answer.');
    return;
  }
  var q = currentQuestions[currentIndex];
  var correctAnswer = '';
  if (q.A && q.A !== '') {
    correctAnswer = String(q.A).trim();
  } else if (q.answer && q.answer !== '' && q.answer !== '0') {
    correctAnswer = String(q.answer).trim();
  } else {
    correctAnswer = userAnswer;
  }
  var isCorrect = (userAnswer === correctAnswer) || (parseFloat(userAnswer) === parseFloat(correctAnswer));
  userAnswers[currentIndex] = userAnswer;
  if (isCorrect) correctCount++;
  saveProgress();
  renderCurrentQuestion();
}

// ============================================================
// B009: 결과 및 리뷰 함수 (getWrongSkippedUnansweredIndices, showResults, showWrongAnswersList, startWrongOnlyReview)
// ============================================================
function getWrongSkippedUnansweredIndices() {
  var result = [];
  for (var i = 0; i < currentQuestions.length; i++) {
    var q = currentQuestions[i];
    var ans = userAnswers[i];
    var isUnanswered = (ans === null || ans === undefined);
    var isSkipped = (ans === -1);
    var isSubjective = isSubjectiveQuestion(q);
    var isIncorrect = false;
    if (!isUnanswered && !isSkipped) {
      if (isSubjective) {
        var correctAns = q.A || q.answer || '';
        isIncorrect = !(String(ans).trim() === String(correctAns).trim());
      } else {
        isIncorrect = (ans !== parseInt(q.answer));
      }
    }
    if (isUnanswered || isSkipped || isIncorrect) result.push(i);
  }
  return result;
}

function showResults() {
  saveProgress();
  var answeredCount = userAnswers.filter(function(a) { return a !== null && a !== undefined && a !== -1; }).length;
  var accuracy = answeredCount > 0 ? Math.round((correctCount / answeredCount) * 100) : 0;
  DOM.correctCountSpan.innerHTML = correctCount + ' / ' + answeredCount;
  DOM.accuracyRateSpan.innerHTML = accuracy + '%';
  var gridHtml = '<div style="display:grid;grid-template-columns:repeat(10,1fr);gap:6px;">';
  for (var i = 0; i < currentQuestions.length; i++) {
    var ans = userAnswers[i];
    var isCorrect = (ans !== null && ans !== undefined && ans !== -1 && ans === parseInt(currentQuestions[i].answer));
    var isSkipped = (ans === -1);
    var isUnanswered = (ans === null || ans === undefined);
    var statusClass = isCorrect ? 'correct' : isSkipped ? 'skipped' : isUnanswered ? 'unanswered' : 'incorrect';
    gridHtml += '<div class="result-item ' + statusClass + '" data-qidx="' + i + '">' + (i + 1) + '</div>';
  }
  gridHtml += '</div>';
  DOM.resultGrid.innerHTML = gridHtml;
  DOM.resultGrid.querySelectorAll('.result-item[data-qidx]').forEach(function(el) {
    el.addEventListener('click', function() {
      var idx = parseInt(el.getAttribute('data-qidx'));
      currentIndex = idx;
      DOM.resultModal.style.display = 'none';
      renderCurrentQuestion();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  });
  DOM.resultModal.style.display = 'flex';
}

function showWrongAnswersList() {
  var wrongItems = [];
  for (var i = 0; i < currentQuestions.length; i++) {
    var q = currentQuestions[i];
    var ans = userAnswers[i];
    var isSkipped = (ans === -1);
    var isUnanswered = (ans === null || ans === undefined);
    var isSubjective = isSubjectiveQuestion(q);
    var isIncorrect = false;
    if (!isSkipped && !isUnanswered) {
      if (isSubjective) {
        var correctAns = q.A || q.answer || '';
        isIncorrect = !(String(ans).trim() === String(correctAns).trim());
      } else {
        isIncorrect = (ans !== parseInt(q.answer));
      }
    }
    if (isSkipped || isIncorrect || isUnanswered) {
      var actualNumber = q.originalNumber || (currentStartNumber + i);
      wrongItems.push({ idx: i, actualNumber: actualNumber, q: q, ans: ans, isSkipped: isSkipped, isUnanswered: isUnanswered, isSubjective: isSubjective });
    }
  }
  if (wrongItems.length === 0) {
    alert(LANG.allCorrect);
    return;
  }
  var html = '<p style="margin-bottom:15px;padding:10px;background:#f0f0f0;border-radius:8px;text-align:center;">' +
    LANG.reviewQuestions + ' <strong>' + wrongItems.length + '</strong><br>' +
    LANG.wrongCount + ' ' + wrongItems.filter(function(w) { return !w.isSkipped && !w.isUnanswered; }).length +
    ' | ' + LANG.skippedCount + ' ' + wrongItems.filter(function(w) { return w.isSkipped; }).length +
    ' | ' + LANG.unansweredCount + ' ' + wrongItems.filter(function(w) { return w.isUnanswered; }).length +
    '</p>';
  wrongItems.forEach(function(item) {
    var statusText = item.isSkipped ? LANG.statusSkipped : (item.isUnanswered ? LANG.statusUnanswered : LANG.statusWrong);
    var statusColor = item.isSkipped ? '#f39c12' : (item.isUnanswered ? '#6c757d' : '#e74c3c');
    var userAnswerDisplay = (item.ans === null || item.ans === undefined || item.ans === -1) ? '—' : String(item.ans);
    var correctAnswerDisplay = (item.isSubjective) ? (item.q.A || item.q.answer || '—') : getAnswerLetter(item.q.answer);
    if (!item.isSubjective && !item.isSkipped && !item.isUnanswered) {
      userAnswerDisplay = getAnswerLetter(item.ans);
      correctAnswerDisplay = getAnswerLetter(item.q.answer);
    }
    html += '<div class="wrong-item" style="border-left:5px solid ' + statusColor + '">' +
      '<div style="font-weight:bold;margin-bottom:10px;">' +
      'Question ' + (item.idx + 1) + ' (Original #' + item.actualNumber + ')' +
      '<span class="status-badge" style="background:' + statusColor + ';">' + statusText + '</span>' +
      (item.isSubjective ? ' Subjective' : '') +
      '</div>' +
      '<div style="margin-bottom:12px;"><strong>' + escapeHtml(item.q.question) + '</strong></div>' +
      '<div style="margin-top:12px;padding:10px;background:#f8f9fa;border-radius:8px;">' +
      '<strong>Your answer:</strong> ' + escapeHtml(String(userAnswerDisplay)) +
      '<br><strong>Correct answer:</strong> ' + escapeHtml(String(correctAnswerDisplay)) +
      '</div>' +
      '<div style="margin-top:12px;padding:10px;background:#e8f4fc;border-radius:8px;">' +
      '<strong>Explanation</strong><br>' + escapeHtml(item.q.explanation || LANG.noExplanation) +
      '</div>' +
      '</div>';
  });
  DOM.wrongListDiv.innerHTML = html;
  DOM.wrongModal.style.display = 'flex';
}

function startWrongOnlyReview() {
  var indices = getWrongSkippedUnansweredIndices();
  if (indices.length === 0) {
    alert(LANG.allCorrect);
    return;
  }
  var reviewQuestions = indices.map(function(idx) {
    return currentQuestions[idx];
  });
  currentQuestions = reviewQuestions.slice();
  userAnswers = new Array(currentQuestions.length).fill(null);
  correctCount = 0;
  currentIndex = 0;
  isReviewMode = true;
  DOM.reviewBanner.style.display = 'block';
  DOM.reviewBanner.innerHTML = '<span>Review Mode: ' + currentQuestions.length + ' questions</span>' +
    '<button id="exitReviewBtn" class="exit-review-btn">EXIT REVIEW</button>';
  document.getElementById('exitReviewBtn').addEventListener('click', function() {
    clearProgress();
    window.location.reload();
  });
  DOM.wrongModal.style.display = 'none';
  DOM.resultModal.style.display = 'none';
  renderCurrentQuestion();
  saveProgress();
}

// ============================================================
// B010: 타이머 함수
// ============================================================
var timerSeconds = 134 * 60;
var timerInterval = null;
var timerRunning = false;
var timerPaused = false;

function formatTimer(seconds) {
  var hrs = Math.floor(seconds / 3600);
  var mins = Math.floor((seconds % 3600) / 60);
  var secs = seconds % 60;
  return String(hrs).padStart(2, '0') + ':' + 
         String(mins).padStart(2, '0') + ':' + 
         String(secs).padStart(2, '0');
}

function updateTimerDisplay() {
  var display = document.getElementById('timerDisplay');
  if (display) {
    display.textContent = formatTimer(timerSeconds);
    if (timerSeconds < 300) {
      display.classList.add('warning');
    } else {
      display.classList.remove('warning');
    }
  }
}

function startTimer() {
  if (timerInterval) return;
  timerRunning = true;
  timerPaused = false;
  var btn = document.getElementById('timerPauseBtn');
  if (btn) btn.textContent = '⏸ Pause';
  timerInterval = setInterval(function() {
    if (timerSeconds > 0) {
      timerSeconds--;
      updateTimerDisplay();
      if (timerSeconds === 0) {
        clearInterval(timerInterval);
        timerInterval = null;
        timerRunning = false;
        alert('⏰ Time is up!');
      }
    }
  }, 1000);
}

function pauseTimer() {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
    timerRunning = false;
    timerPaused = true;
    var btn = document.getElementById('timerPauseBtn');
    if (btn) btn.textContent = '▶ Resume';
  } else if (timerPaused) {
    startTimer();
  }
}

function resetTimer() {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
  timerSeconds = 134 * 60;
  timerRunning = false;
  timerPaused = false;
  var btn = document.getElementById('timerPauseBtn');
  if (btn) btn.textContent = '⏸ Pause';
  updateTimerDisplay();
}

function initTimer() {
  updateTimerDisplay();
  var pauseBtn = document.getElementById('timerPauseBtn');
  var resetBtn = document.getElementById('timerResetBtn');
  if (pauseBtn) pauseBtn.addEventListener('click', pauseTimer);
  if (resetBtn) resetBtn.addEventListener('click', function() {
    if (confirm('Reset timer?')) resetTimer();
  });
}

// ============================================================
// B011: 렌더링 함수 (autoWrapLatex, renderSubjectiveQuestion, renderCurrentQuestion, showExplanation)
// ============================================================
function autoWrapLatex(text) {
  if (!text) return text;
  if (text.includes('\\(') || text.includes('$')) return text;
  var mathPatterns = [
    /[a-zA-Z]\^/, /sqrt/, /frac/, /sum/, /int/,
    /[a-zA-Z]_/, /[0-9]^/, /[a-zA-Z][0-9]/
  ];
  for (var i = 0; i < mathPatterns.length; i++) {
    if (mathPatterns[i].test(text)) {
      return '\\(' + text + '\\)';
    }
  }
  return text;
}

function renderSubjectiveQuestion(q, answered, headerText, passageHtml) {
  var isAnswered = (answered !== null && answered !== undefined && answered !== -1);
  if (!isAnswered) {
    DOM.explanationBox.classList.remove('show');
    DOM.explanationText.innerHTML = '';
  }
  var correctAnswerText = '';
  if (q.A && q.A !== '') {
    correctAnswerText = String(q.A).trim();
  } else if (q.answer && q.answer !== '' && q.answer !== '0') {
    correctAnswerText = String(q.answer).trim();
  } else {
    correctAnswerText = 'Answer not available';
  }
  var html = '<div class="question-card">' +
    '<div class="q-num">' + headerText + '</div>' +
    passageHtml +
    renderGraphic(q.graphic) +
    '<div class="question-text math-content">' + escapeHtml(q.question) + '</div>';
  if (isAnswered) {
    var userAns = String(answered).trim();
    var isCorrect = (userAns === correctAnswerText) || (parseFloat(userAns) === parseFloat(correctAnswerText));
    var statusColor = isCorrect ? '#27ae60' : '#e74c3c';
    html += '<div style="margin-top:15px;padding:15px;background:#f8f9fa;border-radius:8px;border-left:4px solid #666;">' +
      '<div style="font-size:14px;color:#666;">Your answer: <strong>' + escapeHtml(userAns) + '</strong></div>' +
      '</div>' +
      '<div class="subjective-result" style="background:' + statusColor + ';">' +
      'Answer: ' + escapeHtml(correctAnswerText) +
      '</div>' +
      '<div class="subjective-explanation">' +
      '<strong>Explanation</strong>' +
      '<p style="margin-top:8px;" class="math-content">' + escapeHtml(q.explanation || 'No explanation available.') + '</p>' +
      '</div>';
  } else {
    html += '<div class="subjective-input-group">' +
      '<input type="text" id="subjectiveInput" placeholder="Enter your answer" onkeypress="if(event.key===\'Enter\') submitSubjective()">' +
      '<button onclick="submitSubjective()">Submit</button>' +
      '</div>';
  }
  html += '</div></div>';
  DOM.questionContainer.innerHTML = html;
  
  if (window.MathJax && MathJax.typesetPromise) {
    MathJax.typesetPromise([DOM.questionContainer]).catch(console.warn);
  }
  
  var isLastQuestion = (currentIndex >= currentQuestions.length - 1);
  if (isLastQuestion) {
    DOM.nextBtn.style.display = 'none';
    DOM.submitBtn.style.display = 'inline-block';
    DOM.submitBtn.innerHTML = 'SUBMIT (Enter)';
    var isAnswered2 = (userAnswers[currentIndex] !== null && userAnswers[currentIndex] !== undefined && userAnswers[currentIndex] !== -1);
    DOM.submitBtn.disabled = !isAnswered2;
    DOM.submitBtn.style.background = isAnswered2 ? '#27ae60' : '#95a5a6';
    DOM.submitBtn.style.color = isAnswered2 ? 'white' : '#666';
  } else {
    DOM.nextBtn.style.display = 'inline-block';
    DOM.nextBtn.innerHTML = 'NEXT (N)';
    DOM.submitBtn.style.display = 'none';
  }
  DOM.prevBtn.disabled = (currentIndex === 0);
}

function renderCurrentQuestion() {
  console.log('🔴 renderCurrentQuestion START');
  
  if (!currentQuestions.length || currentIndex >= currentQuestions.length) {
    DOM.questionContainer.innerHTML = '<div style="padding:40px;text-align:center;color:red;">Error: Cannot load question</div>';
    return;
  }
  
  var q = currentQuestions[currentIndex];
  if (!q) {
    DOM.questionContainer.innerHTML = '<div style="padding:40px;text-align:center;color:red;">Error: Invalid question data</div>';
    return;
  }
  
  console.log('🔍 Current question:', q);
  console.log('🔍 q.question:', q.question);
  console.log('🔍 q.choices:', q.choices);
  
  var answered = userAnswers[currentIndex];
  updateProgressDisplay();
  
  var actualNumber = q.originalNumber || (currentStartNumber + currentIndex);
  var headerText = LANG.qPrefix + ' ' + (currentIndex + 1) + ' ' + LANG.of + ' ' + currentQuestions.length + ' ' + LANG.originalPrefix + actualNumber + LANG.originalSuffix;
  if (isReviewMode) {
    headerText = LANG.reviewModeQuestionPrefix + ' ' + (currentIndex + 1) + ' ' + LANG.of + ' ' + currentQuestions.length + ' ' + LANG.originalPrefix + actualNumber + LANG.originalSuffix;
  }
  
  var hasChoices = hasRealChoices(q);
  var isSubjective = !hasChoices;
  var passageHtml = '';
  var displayPassage = q.passage || '';
  if (displayPassage && displayPassage.trim() !== '' && displayPassage.trim() !== 'No passage.') {
    passageHtml = '<div style="background:#f8f9fa;padding:15px;border-radius:8px;margin:10px 0;border:1px solid #dee2e6;">' +
      '<div style="white-space:pre-wrap;font-size:15px;line-height:1.7;">' +
      escapeHtml(displayPassage) + '</div>' +
      '</div>';
  }
  
  if (isSubjective) {
    renderSubjectiveQuestion(q, answered, headerText, passageHtml);
    return;
  }
  
  var validKeys = getValidChoiceKeys(q.choices);
  var originalAnswerKey = String(q.answer);
  var originalAnswerText = q.choices[originalAnswerKey] || '';
  var actualAnswerKey = null;
  for (var i = 0; i < validKeys.length; i++) {
    var key = validKeys[i];
    if (q.choices[key] === originalAnswerText) {
      actualAnswerKey = key;
      break;
    }
  }
  var displayAnswer = actualAnswerKey !== null ? validKeys.indexOf(actualAnswerKey) + 1 : parseInt(originalAnswerKey);
  
  var questionDisplay = q.question || 'No question text';
  
  var html = '<div class="question-card">' +
    '<div class="q-num">' + headerText + '</div>' +
    passageHtml +
    renderGraphic(q.graphic) +
    '<div class="question-text math-content">' + questionDisplay + '</div>' +
    '<div class="choices">';
  
  for (var idx = 0; idx < validKeys.length; idx++) {
    var key = validKeys[idx];
    var choiceNum = parseInt(key);
    var letter = getAnswerLetter(idx + 1);
    var choiceText = autoWrapLatex(q.choices[key] || '');
    if (!choiceText) continue;
    var isSelected = (answered === choiceNum);
    var isCorrectChoice = (choiceNum === displayAnswer);
    var showCorrect = (answered !== null && answered !== undefined && answered !== -1);
    var cls = 'choice';
    if (showCorrect) {
      cls += ' disabled';
      if (isCorrectChoice) cls += ' correct';
      if (isSelected && !isCorrectChoice) cls += ' incorrect';
    }
    html += '<div class="' + cls + '" data-choice="' + choiceNum + '">' +
      '<span class="choice-letter">' + letter + '</span>' +
      '<span class="math-content">' + choiceText + '</span>' +
      '</div>';
  }
  html += '</div></div>';
  
  DOM.questionContainer.innerHTML = html;
  console.log('✅ Question rendered');
  
  if (window.MathJax && MathJax.typesetPromise) {
    MathJax.typesetPromise([DOM.questionContainer])
      .then(function() {
        console.log('✅ MathJax rendering complete');
      })
      .catch(function(err) {
        console.warn('⚠️ MathJax rendering error:', err);
      });
  } else {
    console.warn('⚠️ MathJax not available. LaTeX will not render.');
  }
  
  var choiceEls = DOM.questionContainer.querySelectorAll('.choice:not(.disabled)');
  choiceEls.forEach(function(el) {
    el.addEventListener('click', function() {
      var choice = parseInt(el.getAttribute('data-choice'));
      if (isNaN(choice)) return;
      userAnswers[currentIndex] = choice;
      if (choice === displayAnswer) correctCount++;
      saveProgress();
      renderCurrentQuestion();
      showExplanation();
    });
  });
  
  if (answered !== null && answered !== undefined && answered !== -1) {
    showExplanation();
  } else {
    DOM.explanationBox.classList.remove('show');
  }
  
  var isLastQuestion = (currentIndex >= currentQuestions.length - 1);
  if (isLastQuestion) {
    DOM.nextBtn.style.display = 'none';
    DOM.submitBtn.style.display = 'inline-block';
    DOM.submitBtn.innerHTML = 'SUBMIT (Enter)';
    var isAnswered = (answered !== null && answered !== undefined && answered !== -1);
    DOM.submitBtn.disabled = !isAnswered;
    DOM.submitBtn.style.background = isAnswered ? '#27ae60' : '#95a5a6';
    DOM.submitBtn.style.color = isAnswered ? 'white' : '#666';
  } else {
    DOM.nextBtn.style.display = 'inline-block';
    DOM.nextBtn.innerHTML = 'NEXT (N)';
    DOM.submitBtn.style.display = 'none';
  }
  DOM.prevBtn.disabled = (currentIndex === 0);
}

function showExplanation() {
  var q = currentQuestions[currentIndex];
  var ans = userAnswers[currentIndex];
  if (!q || ans === null || ans === undefined || ans === -1) {
    DOM.explanationBox.classList.remove('show');
    return;
  }
  var hasChoices = hasRealChoices(q);
  if (!hasChoices) {
    var correctAns = '';
    if (q.A && q.A !== '') {
      correctAns = String(q.A).trim();
    } else if (q.answer && q.answer !== '' && q.answer !== '0') {
      correctAns = String(q.answer).trim();
    } else {
      correctAns = 'Answer not available';
    }
    var userAns = String(ans).trim();
    var isCorrect = (userAns === correctAns) || (parseFloat(userAns) === parseFloat(correctAns));
    var statusColor = isCorrect ? '#27ae60' : '#e74c3c';
    var explanationText = q.explanation || LANG.noExplanation;
    DOM.explanationText.innerHTML =
      '<div style="background:' + statusColor + ';color:white;padding:8px 16px;border-radius:6px;display:inline-block;font-weight:700;margin-bottom:15px;">' +
      'Answer: ' + escapeHtml(correctAns) +
      '</div>' +
      '<div style="margin-top:8px;font-size:14px;color:#555;">' +
      'Your answer: <strong>' + escapeHtml(userAns) + '</strong>' +
      '</div>' +
      '<p style="margin-top:12px;" class="math-content">' + escapeHtml(explanationText) + '</p>';
    DOM.explanationBox.classList.add('show');
    if (window.MathJax && MathJax.typesetPromise) {
      MathJax.typesetPromise([DOM.explanationText]).catch(console.warn);
    }
    return;
  }
  var validKeys = getValidChoiceKeys(q.choices);
  var originalAnswerKey = String(q.answer);
  var originalAnswerText = q.choices[originalAnswerKey] || '';
  var actualAnswerKey = null;
  for (var i = 0; i < validKeys.length; i++) {
    var key = validKeys[i];
    if (q.choices[key] === originalAnswerText) {
      actualAnswerKey = key;
      break;
    }
  }
  var displayAnswerIndex = actualAnswerKey !== null ? validKeys.indexOf(actualAnswerKey) + 1 : parseInt(originalAnswerKey);
  var userAnswerLetter = getAnswerLetter(ans);
  var correctAnswerLetter = getAnswerLetter(displayAnswerIndex);
  var isCorrect = (ans === displayAnswerIndex);
  var statusColor = isCorrect ? '#27ae60' : '#e74c3c';
  var explanationText = q.explanation || LANG.noExplanation;
  DOM.explanationText.innerHTML =
    '<div style="background:' + statusColor + ';color:white;padding:8px 16px;border-radius:6px;display:inline-block;font-weight:700;margin-bottom:15px;">' +
    'Answer: ' + correctAnswerLetter +
    '</div>' +
    '<div style="margin-top:8px;font-size:14px;color:#555;">' +
    'Your answer: <strong>' + userAnswerLetter + '</strong>' +
    '</div>' +
    '<p style="margin-top:12px;" class="math-content">' + escapeHtml(explanationText) + '</p>';
  DOM.explanationBox.classList.add('show');
  if (window.MathJax && MathJax.typesetPromise) {
    MathJax.typesetPromise([DOM.explanationText]).catch(console.warn);
  }
}

// ============================================================
// B012: 이벤트 및 초기화 함수 (attachKeyboardEvents, attachEvents, showProgressModal, resumeProgress, initialize)
// ============================================================
function attachKeyboardEvents() {
  document.addEventListener('keydown', function(event) {
    if (event.ctrlKey && (event.key === 'c' || event.key === 'v' || event.key === 'x' || event.key === 'a' ||
        event.key === 'C' || event.key === 'V' || event.key === 'X' || event.key === 'A')) {
      return;
    }
    if (!DOM.quizContent || DOM.quizContent.style.display === 'none' || DOM.quizContent.style.display === '') return;
    if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') return;
    var key = event.key;
    if (key === 'n' || key === 'N' || key === 'L') {
      event.preventDefault();
      if (currentIndex < currentQuestions.length - 1) goNext();
      return;
    }
    if (key === 'p' || key === 'P' || key === 'H') {
      event.preventDefault();
      if (currentIndex > 0) goPrev();
      return;
    }
    if (key === 's' || key === 'S' || key === 'A') {
      event.preventDefault();
      skipQuestion();
      return;
    }
    if (key === 'Enter') {
      if (currentIndex >= currentQuestions.length - 1 && DOM.submitBtn && DOM.submitBtn.style.display !== 'none') {
        var isAnswered = (userAnswers[currentIndex] !== null && userAnswers[currentIndex] !== undefined && userAnswers[currentIndex] !== -1);
        if (isAnswered) {
          event.preventDefault();
          showResults();
        }
      }
      return;
    }
    if (key === 'ArrowLeft') {
      event.preventDefault();
      if (currentIndex > 0) goPrev();
      return;
    }
    if (key === 'ArrowRight') {
      event.preventDefault();
      if (currentIndex < currentQuestions.length - 1) goNext();
      return;
    }
  });
}

function attachEvents() {
  var continueBtn = document.getElementById('progressContinueBtn');
  if (continueBtn) {
    continueBtn.addEventListener('click', function() {
      var modal = document.getElementById('progressModal');
      var savedData = modal.getAttribute('data-saved');
      if (savedData) {
        var saved = JSON.parse(savedData);
        modal.style.display = 'none';
        resumeProgress(saved);
      }
    });
  }
  var cancelBtn = document.getElementById('progressCancelBtn');
  if (cancelBtn) {
    cancelBtn.addEventListener('click', function() {
      var modal = document.getElementById('progressModal');
      modal.style.display = 'none';
      clearProgress();
      var startNum = parseInt(document.getElementById('startNumber').value) || 1;
      startQuizWithNumber(startNum);
    });
  }
  DOM.startQuizBtn.addEventListener('click', function() {
    var startNum = parseInt(DOM.startNumberInput.value);
    if (isNaN(startNum) || DOM.startNumberInput.value === "") startNum = 1;
    if (startNum < 1) startNum = 1;
    if (startNum > TOTAL_QUESTIONS) startNum = TOTAL_QUESTIONS;
    clearProgress();
    startQuizWithNumber(startNum);
  });
  DOM.startNumberInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      DOM.startQuizBtn.click();
    }
  });
  DOM.prevBtn.addEventListener('click', goPrev);
  DOM.nextBtn.addEventListener('click', goNext);
  DOM.skipBtn.addEventListener('click', skipQuestion);
  DOM.submitBtn.addEventListener('click', showResults);
  DOM.quitBtn.addEventListener('click', function() {
    saveProgress();
    if (confirm(LANG.confirmExit)) window.location.reload();
  });
  DOM.retryAllBtn.addEventListener('click', function() {
    clearProgress();
    DOM.resultModal.style.display = 'none';
    startQuizWithNumber(currentStartNumber);
  });
  DOM.reviewWrongBtn.addEventListener('click', function() {
    DOM.resultModal.style.display = 'none';
    showWrongAnswersList();
  });
  DOM.closeModalBtn.addEventListener('click', function() {
    DOM.resultModal.style.display = 'none';
  });
  DOM.closeWrongBtn.addEventListener('click', function() {
    DOM.wrongModal.style.display = 'none';
  });
  DOM.retryWrongFromReviewBtn.addEventListener('click', startWrongOnlyReview);
  document.getElementById('splashRetry').addEventListener('click', function() {
    document.getElementById('splashError').style.display = 'none';
    document.getElementById('splashRetry').style.display = 'none';
    document.getElementById('splashStatus').textContent = 'Retrying...';
    initialize();
  });
  attachKeyboardEvents();
}

function showProgressModal(saved) {
  var answered = saved.userAnswers.filter(function(a) { return a !== null && a !== -1; }).length;
  var total = saved.currentQuestions.length;
  var progress = saved.currentIndex + 1;
  var body = document.getElementById('progressModalBody');
  body.innerHTML = '<div style="padding:10px 0;">' +
    '<p style="font-size:22px;font-weight:700;color:#2c3e50;text-align:center;margin-bottom:10px;">📊 Resume Session</p>' +
    '<div style="background:#f8f9fa;border-radius:12px;padding:16px 20px;margin:15px 0;">' +
    '<div style="display:flex;justify-content:space-between;padding:4px 0;"><span>Progress</span><strong>' + progress + ' / ' + total + '</strong></div>' +
    '<div style="display:flex;justify-content:space-between;padding:4px 0;"><span>Answered</span><strong>' + answered + ' / ' + total + '</strong></div>' +
    '<div style="display:flex;justify-content:space-between;padding:4px 0;"><span>Correct</span><strong>' + (saved.correctCount || 0) + '</strong></div>' +
    '</div>' +
    '<p style="font-size:13px;color:#999;text-align:center;margin-top:10px;">' +
    'Click <strong>"Continue"</strong> to resume. Click <strong>"Start Fresh"</strong> to begin again.' +
    '</p>' +
    '</div>';
  document.getElementById('progressModal').setAttribute('data-saved', JSON.stringify(saved));
  document.getElementById('progressModal').style.display = 'flex';
}

function resumeProgress(saved) {
  currentQuestions = saved.currentQuestions;
  userAnswers = saved.userAnswers;
  currentIndex = saved.currentIndex || 0;
  correctCount = saved.correctCount || 0;
  currentStartNumber = saved.currentStartNumber || 1;
  isReviewMode = saved.isReviewMode || false;
  if (saved.masterQuestions) masterQuestions = saved.masterQuestions;
  if (saved.originalQuestions) originalQuestions = saved.originalQuestions;
  startAutoSave();
  DOM.setupSection.style.display = 'none';
  DOM.quizMain.style.display = 'block';
  if (DOM.quizContent) DOM.quizContent.style.display = 'block';
  if (DOM.progressArea) DOM.progressArea.style.display = 'flex';
  if (isReviewMode) {
    DOM.reviewBanner.style.display = 'block';
    DOM.reviewBanner.innerHTML = '<span>Review Mode: ' + currentQuestions.length + ' questions</span>' +
      '<button id="exitReviewBtn" class="exit-review-btn">EXIT REVIEW</button>';
    document.getElementById('exitReviewBtn').addEventListener('click', function() {
      clearProgress();
      window.location.reload();
    });
  }
  renderCurrentQuestion();
}

function initialize() {
  console.log('🔧 initialize() started');
  
  DOM.setupSection = document.getElementById('setupSection');
  DOM.quizMain = document.getElementById('quizMain');
  DOM.quizContent = document.getElementById('quizContent');
  DOM.startNumberInput = document.getElementById('startNumber');
  DOM.startQuizBtn = document.getElementById('startQuizBtn');
  DOM.maxNumberSpan = document.getElementById('maxNumber');
  DOM.progressText = document.getElementById('progressText');
  DOM.quizProgressBar = document.getElementById('quizProgressBar');
  DOM.questionContainer = document.getElementById('questionContainer');
  DOM.explanationBox = document.getElementById('explanationBox');
  DOM.explanationText = document.getElementById('explanationText');
  DOM.prevBtn = document.getElementById('prevBtn');
  DOM.nextBtn = document.getElementById('nextBtn');
  DOM.skipBtn = document.getElementById('skipBtn');
  DOM.submitBtn = document.getElementById('submitBtn');
  DOM.quitBtn = document.getElementById('quitBtn');
  DOM.resultModal = document.getElementById('resultModal');
  DOM.correctCountSpan = document.getElementById('correctCount');
  DOM.accuracyRateSpan = document.getElementById('accuracyRate');
  DOM.resultGrid = document.getElementById('resultGrid');
  DOM.retryAllBtn = document.getElementById('retryAllBtn');
  DOM.reviewWrongBtn = document.getElementById('reviewWrongBtn');
  DOM.closeModalBtn = document.getElementById('closeModalBtn');
  DOM.wrongModal = document.getElementById('wrongModal');
  DOM.wrongListDiv = document.getElementById('wrongList');
  DOM.closeWrongBtn = document.getElementById('closeWrongBtn');
  DOM.retryWrongFromReviewBtn = document.getElementById('retryWrongFromReviewBtn');
  DOM.reviewBanner = document.getElementById('reviewBanner');
  DOM.savedBadgeContainer = document.getElementById('savedBadgeContainer');
  DOM.loadNextContainer = document.getElementById('loadNextContainer');
  DOM.mainContainer = document.getElementById('mainContainer');
  DOM.maxNumberDisplay = document.getElementById('maxNumberDisplay');
  DOM.setSelector = document.getElementById('setSelector');
  DOM.progressArea = document.querySelector('.progress-area');
  if (!DOM.progressArea) {
    DOM.progressArea = document.getElementById('progressArea');
  }

  initTimer();
  
  // ★★★★★ attachEvents를 전역에 노출 (B014에서도 하지만 여기도 안전하게) ★★★★★
  if (typeof window.attachEvents === 'undefined') {
    window.attachEvents = attachEvents;
  }
  
  // ★★★★★ attachEvents 호출 (setTimeout 바깥에서) ★★★★★
  attachEvents();

  updateSplash(10, 'Connecting to server...');
  
  // ★★★★★ setTimeout 제거하고 즉시 실행 (화면 멈춤 해결) ★★★★★
  (async function() {
    try {
      await detectTotalQuestions();
      
      if (TOTAL_QUESTIONS === 0) {
        TOTAL_QUESTIONS = 720;
        localStorage.setItem(TOTAL_CACHE_KEY, String(TOTAL_QUESTIONS));
      }
      
      updateSetSelector();
      
      updateSplash(60, 'Preparing data...');
      
      var maxStartNumber = TOTAL_QUESTIONS;
      console.log('📊 Total questions: ' + TOTAL_QUESTIONS);
      
      if (DOM.maxNumberSpan) DOM.maxNumberSpan.style.display = 'none';
      if (DOM.maxNumberDisplay) DOM.maxNumberDisplay.style.display = 'none';
      
      DOM.startNumberInput.placeholder = '1-' + TOTAL_QUESTIONS;
      DOM.startNumberInput.max = TOTAL_QUESTIONS;
      DOM.startNumberInput.min = 1;
      
      if (DOM.setSelector) {
        DOM.setSelector.addEventListener('change', function() {
          var setNum = parseInt(this.value);
          if (!isNaN(setNum) && setNum >= 1) {
            var startNum = (setNum - 1) * QUESTIONS_PER_SET + 1;
            DOM.startNumberInput.value = startNum;
            console.log('Set ' + setNum + ' selected, starting from question ' + startNum);
          }
        });
        if (DOM.setSelector.options.length > 0) {
          DOM.setSelector.value = '1';
          DOM.startNumberInput.value = '';
        }
      }
      
      var saved = loadProgress();
      if (saved && saved.currentQuestions && saved.currentQuestions.length > 0) {
        var answered = saved.userAnswers.filter(function(a) { return a !== null && a !== -1; }).length;
        var timeStr = new Date(saved.timestamp).toLocaleString();
        DOM.savedBadgeContainer.innerHTML =
          '<div class="resume-badge" id="resumeBadge">' +
          '<div class="count">' + answered + ' / ' + saved.currentQuestions.length + ' answered</div>' +
          '<div class="time">' + timeStr + '</div>' +
          '<div class="hint">Click to resume</div>' +
          '</div>';
        var resumeBadge = document.getElementById('resumeBadge');
        if (resumeBadge) {
          resumeBadge.addEventListener('click', function(e) {
            e.stopPropagation();
            var savedData = loadProgress();
            if (savedData) showProgressModal(savedData);
          });
        }
        var resumeCard = document.getElementById('resumeCard');
        if (resumeCard) {
          var newCard = resumeCard.cloneNode(true);
          resumeCard.parentNode.replaceChild(newCard, resumeCard);
          newCard.addEventListener('click', function() {
            var savedData = loadProgress();
            if (savedData) showProgressModal(savedData);
          });
        }
      } else {
        DOM.savedBadgeContainer.innerHTML = '<div class="no-session">' +
          'No saved session' +
          '<small>Start a new lesson</small>' +
          '</div>';
      }
      
      updateSplash(100, 'Ready!');
      
      // ★★★★★ hideSplash 호출 (화면 표시) ★★★★★
      hideSplash();
      DOM.setupSection.style.display = 'block';
      DOM.quizMain.style.display = 'block';
      
      setTimeout(function() { 
        if (DOM.startNumberInput) {
          DOM.startNumberInput.focus(); 
          DOM.startNumberInput.select(); 
        }
      }, 150);
      
      console.log('✅ Initialization complete: ' + TOTAL_QUESTIONS + ' total questions');
      
    } catch(e) {
      console.error('Initialization error:', e);
      showSplashError(e.message || 'Initialization failed');
    }
  })();
}

// ============================================================
// B013: startQuizWithNumber 함수
// ============================================================
async function startQuizWithNumber(uiStartNumber) {
  if (isNaN(uiStartNumber) || uiStartNumber < 1) uiStartNumber = 1;
  
  if (uiStartNumber > TOTAL_QUESTIONS) {
    console.log('🔄 Number ' + uiStartNumber + ' exceeds total ' + TOTAL_QUESTIONS + '. Looping back to 1.');
    uiStartNumber = 1;
  }
  
  var setNumber = Math.ceil(uiStartNumber / QUESTIONS_PER_SET);
  var setStart = (setNumber - 1) * QUESTIONS_PER_SET + 1;
  
  var startNum = uiStartNumber;
  if (uiStartNumber < setStart || uiStartNumber > Math.min(setNumber * QUESTIONS_PER_SET, TOTAL_QUESTIONS)) {
    startNum = setStart;
  }
  
  currentStartNumber = startNum;
  
  var overlay = showLoadingOverlay('Loading ' + QUESTIONS_PER_SET + ' questions from ' + startNum + '...');
  try {
    var questions = await load50Questions(startNum);
    if (questions.length === 0) throw new Error('No question data received');
    masterQuestions = questions.slice();
    currentQuestions = masterQuestions.map(function(q) { return randomizeChoicesOnly(q); });
    userAnswers = new Array(currentQuestions.length).fill(null);
    correctCount = 0;
    currentIndex = 0;
    isReviewMode = false;
    startAutoSave();
    hideLoadingOverlay();
    DOM.setupSection.style.display = 'none';
    DOM.quizMain.style.display = 'block';
    
    if (DOM.quizContent) {
      DOM.quizContent.style.display = 'block';
    }
    if (DOM.progressArea) {
      DOM.progressArea.style.display = 'flex';
    }
    
    renderCurrentQuestion();
    
    resetTimer();
    startTimer();
    
  } catch(err) {
    hideLoadingOverlay();
    alert(LANG.loadError + ' ' + err.message);
    console.error(err);
  }
}

// ============================================================
// B014: renderGraphic (통합 렌더러) - 전체 포함
// ============================================================
function renderGraphic(jsonData) {
  if (!jsonData || jsonData.trim() == "") return "";
  
  var data = jsonData.trim();
  if (data.startsWith("\"") && data.endsWith("\"")) data = data.slice(1, -1);
  data = data.replace(/\\"/g, '"').replace(/\\\\/g, '\\');
  
  var parsedData = null;
  try {
    parsedData = JSON.parse(data);
  } catch(e) {
    return '<div style="padding:10px;color:#999;text-align:center;">📊 Invalid JSON</div>';
  }
  
  if (!parsedData || typeof parsedData !== 'object') {
    return '<div style="padding:10px;color:#999;text-align:center;">📊 No data</div>';
  }
  
  var colors = ['#3498db', '#e74c3c', '#27ae60', '#f39c12', '#9b59b6', '#1abc9c', '#e67e22', '#2c3e50', '#7f8c8d', '#16a085', '#d35400', '#c0392b'];
  var chartId = 'chart_' + Math.random().toString(36).substr(2, 9);
  var html = '<div style="margin:15px 0;padding:15px;background:#f8f9fa;border-radius:8px;border:1px solid #e9ecef;"><canvas id="' + chartId + '" style="max-height:400px;width:100%;"></canvas></div>';
  
  // TABLE
  if (parsedData.type === 'table' && parsedData.headers && parsedData.rows) {
    var h = '<div style="margin:15px 0;overflow-x:auto;background:white;border-radius:8px;border:1px solid #ddd;"><table style="width:100%;border-collapse:collapse;text-align:center;font-size:14px;">';
    h += '<thead><tr style="background:#3498db;color:white;">';
    parsedData.headers.forEach(function(hd) { 
      h += '<th style="padding:10px 14px;border:1px solid #2980b9;font-weight:bold;">' + escapeHtml(hd) + '</th>'; 
    });
    h += '</tr></thead><tbody>';
    parsedData.rows.forEach(function(row, ri) {
      h += '<tr style="background:' + (ri%2===0?'#fff':'#f8f9fa') + ';">';
      row.forEach(function(cell) { 
        h += '<td style="padding:8px 14px;border:1px solid #ddd;">' + escapeHtml(cell) + '</td>'; 
      });
      h += '</tr>';
    });
    h += '</tbody></table>';
    if (parsedData.title) h += '<div style="text-align:center;padding:8px;font-weight:bold;color:#555;background:#f8f9fa;border-radius:0 0 8px 8px;">' + escapeHtml(parsedData.title) + '</div>';
    h += '</div>';
    return h;
  }
  
  // BAR
  else if (parsedData.type === 'bar') {
    console.log("✅ BAR rendering started");
    
    var labels = [];
    var datasets = [];
    var chartTitle = parsedData.title || 'Bar Chart';
    var xLabel = parsedData.xAxis?.label || '';
    var yLabel = parsedData.yAxis?.label || '';
    var yMin = parsedData.yAxis?.min !== undefined ? parsedData.yAxis.min : 0;
    var yMax = parsedData.yAxis?.max !== undefined ? parsedData.yAxis.max : undefined;
    
    if (parsedData.labels) {
      labels = parsedData.labels;
    } else if (parsedData.xAxis?.categories) {
      labels = parsedData.xAxis.categories;
    }
    
    if (parsedData.series && Array.isArray(parsedData.series)) {
      datasets = parsedData.series.map(function(s, i) {
        var color = colors[i % colors.length];
        var data = s.data || [];
        return {
          label: s.name || 'Series ' + (i+1),
          data: data,
          backgroundColor: color + '80',
          borderColor: color,
          borderWidth: 2
        };
      });
    } else if (parsedData.values) {
      datasets = [{
        label: parsedData.label || 'Data',
        data: parsedData.values,
        backgroundColor: parsedData.color || '#3498db80',
        borderColor: parsedData.stroke || '#3498db',
        borderWidth: 2
      }];
    }
    
    console.log("📊 labels:", labels);
    console.log("📊 datasets:", datasets);
    
    if (datasets.length === 0 || datasets.every(function(d) { return d.data.length === 0; })) {
      return '<div style="padding:10px;color:#999;text-align:center;">📊 No data for bar chart</div>';
    }
    
    function renderBarChart(attempt) {
      attempt = attempt || 0;
      var ctx = document.getElementById(chartId);
      if (!ctx) {
        if (attempt < 5) {
          console.log("⏳ Canvas not ready, retrying... (" + (attempt+1) + "/5)");
          setTimeout(function() { renderBarChart(attempt + 1); }, 200);
          return;
        } else {
          console.error("❌ Canvas not found after 5 attempts!");
          return;
        }
      }
      
      if (window._chartInstances && window._chartInstances[chartId]) {
        window._chartInstances[chartId].destroy();
      }
      if (!window._chartInstances) window._chartInstances = {};
      
      var cc = {
        type: 'bar',
        data: { labels: labels, datasets: datasets },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            title: { display: true, text: chartTitle, font: { size: 16, weight: 'bold' } },
            legend: { position: 'bottom' }
          },
          scales: {
            x: { title: { display: true, text: xLabel }, grid: { color: '#e0e0e0' } },
            y: { 
              beginAtZero: true, 
              title: { display: true, text: yLabel }, 
              grid: { color: '#e0e0e0' }, 
              min: yMin, 
              max: yMax 
            }
          }
        }
      };
      
      var canvas = document.getElementById(chartId);
      if (canvas && cc) {
        canvas.parentElement.style.height = '400px';
        window._chartInstances[chartId] = new Chart(canvas, cc);
        console.log("✅ Bar chart rendered!");
      } else {
        console.error("❌ Failed to render bar chart");
      }
    }
    
    setTimeout(function() { renderBarChart(); }, 100);
    return html;
  }
  
  // PIE
  else if (parsedData.type === 'pie' && parsedData.labels && parsedData.values) {
    setTimeout(function() {
      var ctx = document.getElementById(chartId);
      if (!ctx) return;
      if (window._chartInstances && window._chartInstances[chartId]) {
        window._chartInstances[chartId].destroy();
      }
      if (!window._chartInstances) window._chartInstances = {};
      
      var cc = {
        type: 'pie',
        data: {
          labels: parsedData.labels,
          datasets: [{
            data: parsedData.values,
            backgroundColor: parsedData.colors || ['#3498db', '#e74c3c', '#27ae60', '#f39c12', '#9b59b6', '#1abc9c']
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            title: { display: true, text: parsedData.title || 'Pie Chart', font: { size: 16, weight: 'bold' } },
            legend: { position: 'bottom' }
          }
        }
      };
      
      var canvas = document.getElementById(chartId);
      if (canvas && cc) {
        canvas.parentElement.style.height = '400px';
        window._chartInstances[chartId] = new Chart(canvas, cc);
      }
    }, 100);
    return html;
  }
  
  // LINE
  else if (parsedData.type === 'line' && parsedData.series) {
    setTimeout(function() {
      var ctx = document.getElementById(chartId);
      if (!ctx) return;
      if (window._chartInstances && window._chartInstances[chartId]) {
        window._chartInstances[chartId].destroy();
      }
      if (!window._chartInstances) window._chartInstances = {};
      
      var ds = parsedData.series.map(function(s, i) {
        var points = [];
        if (Array.isArray(s.points)) {
          points = s.points;
        } else if (typeof s.points === 'string') {
          try { points = JSON.parse(s.points); } catch(e) { points = []; }
        } else if (Array.isArray(s.data) && parsedData.xAxis && Array.isArray(parsedData.xAxis.categories)) {
          points = s.data.map(function(y, idx) {
            return { x: parsedData.xAxis.categories[idx], y: y };
          });
        } else if (Array.isArray(s.data) && s.data.length && typeof s.data[0] === 'object') {
          points = s.data;
        }
        return {
          label: s.name || ('Series ' + (i + 1)),
          data: points,
          showLine: true,
          borderColor: s.color || colors[i % colors.length],
          backgroundColor: (s.color || colors[i % colors.length]) + '20',
          borderWidth: s.lineWidth || 2,
          pointRadius: s.pointSize || 4,
          tension: s.tension || 0.3,
          fill: s.fill || false
        };
      });
      
      var cc = {
        type: 'scatter',
        data: { datasets: ds },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            title: { display: true, text: parsedData.title || 'Line Chart', font: { size: 16, weight: 'bold' } },
            legend: { position: 'bottom' }
          },
          scales: {
            x: { type: 'linear', title: { display: true, text: (parsedData.xAxis && (parsedData.xAxis.title || parsedData.xAxis.label)) || 'X' }, grid: { color: '#e0e0e0' } },
            y: { title: { display: true, text: (parsedData.yAxis && (parsedData.yAxis.title || parsedData.yAxis.label)) || 'Y' }, grid: { color: '#e0e0e0' } }
          }
        }
      };
      
      var canvas = document.getElementById(chartId);
      if (canvas && cc) {
        canvas.parentElement.style.height = '400px';
        window._chartInstances[chartId] = new Chart(canvas, cc);
      }
    }, 100);
    return html;
  }
  
  // SCATTER
  else if (parsedData.type === 'scatter') {
    console.log("✅ SCATTER rendering started");
    
    setTimeout(function() {
      var ctx = document.getElementById(chartId);
      if (!ctx) {
        console.error("❌ Canvas not found!");
        return;
      }
      if (window._chartInstances && window._chartInstances[chartId]) {
        window._chartInstances[chartId].destroy();
      }
      if (!window._chartInstances) window._chartInstances = {};
      
      var datasets = [];
      
      if (parsedData.series && Array.isArray(parsedData.series)) {
        parsedData.series.forEach(function(ser, i) {
          var color = colors[i % colors.length];
          datasets.push({
            label: ser.name || 'Series ' + (i+1),
            data: (ser.points || []).map(function(p) { return { x: p.x, y: p.y }; }),
            backgroundColor: color,
            borderColor: color,
            pointRadius: 5,
            pointHoverRadius: 7
          });
        });
      } else if (parsedData.points) {
        datasets.push({
          label: parsedData.title || 'Data',
          data: parsedData.points.map(function(p) { return { x: p.x, y: p.y }; }),
          backgroundColor: '#3498db',
          borderColor: '#2980b9',
          pointRadius: 5,
          pointHoverRadius: 7
        });
      }
      
      if (datasets.length === 0) {
        console.warn("⚠️ No data");
        return;
      }
      
      var cc = {
        type: 'scatter',
        data: { datasets: datasets },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            title: { display: true, text: parsedData.title || 'Scatter Plot', font: { size: 16, weight: 'bold' } },
            legend: { position: 'bottom' }
          },
          scales: {
            x: { title: { display: true, text: parsedData.xAxis?.label || 'x' }, min: parsedData.xAxis?.min, max: parsedData.xAxis?.max, grid: { color: '#e0e0e0' } },
            y: { title: { display: true, text: parsedData.yAxis?.label || 'y' }, min: parsedData.yAxis?.min, max: parsedData.yAxis?.max, grid: { color: '#e0e0e0' } }
          }
        }
      };
      
      var canvas = document.getElementById(chartId);
      if (canvas && cc) {
        canvas.parentElement.style.height = '400px';
        window._chartInstances[chartId] = new Chart(canvas, cc);
        console.log("✅ Scatter chart rendered!");
      }
    }, 100);
    return html;
  }
  
  // RADAR
  else if (parsedData.type === 'radar' && parsedData.labels && parsedData.datasets) {
    setTimeout(function() {
      var ctx = document.getElementById(chartId);
      if (!ctx) return;
      if (window._chartInstances && window._chartInstances[chartId]) {
        window._chartInstances[chartId].destroy();
      }
      if (!window._chartInstances) window._chartInstances = {};
      
      var ds = parsedData.datasets.map(function(d, i) {
        var values = d.values || [];
        if (typeof values === 'string') {
          try { values = JSON.parse(values); } catch(e) { values = values.split(',').map(function(v) { return parseFloat(v.trim()); }); }
        }
        return {
          label: d.label || 'Series ' + (i+1),
          data: values,
          borderColor: d.color || colors[i % colors.length],
          backgroundColor: (d.color || colors[i % colors.length]) + '20',
          borderWidth: 2,
          pointRadius: 4
        };
      });
      
      var cc = {
        type: 'radar',
        data: { labels: parsedData.labels, datasets: ds },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            title: { display: true, text: parsedData.title || 'Radar Chart', font: { size: 16, weight: 'bold' } }
          },
          scales: {
            r: { beginAtZero: true, grid: { color: '#e0e0e0' } }
          }
        }
      };
      
      var canvas = document.getElementById(chartId);
      if (canvas && cc) {
        canvas.parentElement.style.height = '400px';
        window._chartInstances[chartId] = new Chart(canvas, cc);
      }
    }, 100);
    return html;
  }
  
  // SCATTER-ONLY
  else if (parsedData.type === 'scatter-only' && parsedData.points) {
    setTimeout(function() {
      var ctx = document.getElementById(chartId);
      if (!ctx) return;
      if (window._chartInstances && window._chartInstances[chartId]) {
        window._chartInstances[chartId].destroy();
      }
      if (!window._chartInstances) window._chartInstances = {};
      
      var dataPoints = parsedData.points.map(function(p) {
        return { x: p.x, y: p.y };
      });
      
      var minX = parsedData.xAxis?.min ?? 0;
      var maxX = parsedData.xAxis?.max ?? 10;
      var minY = parsedData.yAxis?.min ?? -10;
      var maxY = parsedData.yAxis?.max ?? 10;
      
      var cc = {
        type: 'scatter',
        data: {
          datasets: [{
            label: parsedData.title || 'Scatterplot',
            data: dataPoints,
            backgroundColor: '#3498db',
            borderColor: '#2980b9',
            pointRadius: 5,
            pointHoverRadius: 7
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            title: { display: true, text: parsedData.title || 'Scatterplot', font: { size: 16, weight: 'bold' } },
            legend: { display: false }
          },
          scales: {
            x: {
              min: minX,
              max: maxX,
              grid: { color: '#e0e0e0' },
              title: { display: true, text: parsedData.xAxis?.label || 'x' }
            },
            y: {
              min: minY,
              max: maxY,
              grid: { color: '#e0e0e0' },
              title: { display: true, text: parsedData.yAxis?.label || 'y' }
            }
          }
        }
      };
      
      var canvas = document.getElementById(chartId);
      if (canvas && cc) {
        canvas.parentElement.style.height = '400px';
        window._chartInstances[chartId] = new Chart(canvas, cc);
      }
    }, 100);
    return html;
  }
  
  // STACKED-BAR
  else if (parsedData.type === 'stacked-bar' && parsedData.labels && parsedData.datasets) {
    var stackedChartId = 'chart_' + Math.random().toString(36).substr(2, 9);
    var stackedHtml = '<div style="margin:15px 0;padding:15px;background:#f8f9fa;border-radius:8px;border:1px solid #e9ecef;"><canvas id="' + stackedChartId + '" style="max-height:400px;width:100%;"></canvas></div>';
    
    setTimeout(function() {
      var ctx = document.getElementById(stackedChartId);
      if (!ctx) return;
      if (window._chartInstances && window._chartInstances[stackedChartId]) {
        window._chartInstances[stackedChartId].destroy();
      }
      if (!window._chartInstances) window._chartInstances = {};
      
      var datasets = parsedData.datasets.map(function(ds, i) {
        var color = colors[i % colors.length];
        return {
          label: ds.label || 'Series ' + (i+1),
          data: ds.values || [],
          backgroundColor: color + '80',
          borderColor: color,
          borderWidth: 1
        };
      });
      
      var cc = {
        type: 'bar',
        data: {
          labels: parsedData.labels,
          datasets: datasets
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            title: { display: true, text: parsedData.title || 'Stacked Bar Chart', font: { size: 16, weight: 'bold' } },
            legend: { position: 'bottom' }
          },
          scales: {
            x: { stacked: true, grid: { color: '#e0e0e0' } },
            y: { stacked: true, beginAtZero: true, grid: { color: '#e0e0e0' } }
          }
        }
      };
      
      var canvas = document.getElementById(stackedChartId);
      if (canvas && cc) {
        canvas.parentElement.style.height = '400px';
        window._chartInstances[stackedChartId] = new Chart(canvas, cc);
      }
    }, 100);
    return stackedHtml;
  }
  
  // COMPARE
  else if (parsedData.type === 'compare' && parsedData.graphs) {
    var compareChartId = 'chart_' + Math.random().toString(36).substr(2, 9);
    var compareHtml = '<div style="margin:15px 0;padding:15px;background:#f8f9fa;border-radius:8px;border:1px solid #e9ecef;"><canvas id="' + compareChartId + '" style="max-height:400px;width:100%;"></canvas></div>';
    
    setTimeout(function() {
      var ctx = document.getElementById(compareChartId);
      if (!ctx) return;
      if (window._chartInstances && window._chartInstances[compareChartId]) {
        window._chartInstances[compareChartId].destroy();
      }
      if (!window._chartInstances) window._chartInstances = {};
      
      var allPoints = [];
      parsedData.graphs.forEach(function(g) {
        if (g.points) {
          g.points.forEach(function(p) {
            allPoints.push(p.x !== undefined ? p.x : 0);
          });
        }
      });
      
      var minX = Infinity, maxX = -Infinity;
      var minY = Infinity, maxY = -Infinity;
      parsedData.graphs.forEach(function(g) {
        if (g.points) {
          g.points.forEach(function(p) {
            var x = p.x !== undefined ? p.x : 0;
            var y = p.y !== undefined ? p.y : 0;
            if (x < minX) minX = x;
            if (x > maxX) maxX = x;
            if (y < minY) minY = y;
            if (y > maxY) maxY = y;
          });
        }
      });
      
      if (minX === Infinity) { minX = 0; maxX = 10; }
      if (minY === Infinity) { minY = 0; maxY = 10; }
      var paddingX = (maxX - minX) * 0.1 || 1;
      var paddingY = (maxY - minY) * 0.1 || 1;
      
      var datasets = parsedData.graphs.map(function(g, i) {
        var color = colors[i % colors.length];
        var data = [];
        if (g.points) {
          data = g.points.map(function(p) {
            return { x: p.x !== undefined ? p.x : 0, y: p.y !== undefined ? p.y : 0 };
          });
        }
        return {
          label: g.label || 'Series ' + (i+1),
          data: data,
          borderColor: color,
          backgroundColor: color + '20',
          pointRadius: 4,
          pointBackgroundColor: color,
          tension: 0.3,
          showLine: true,
          fill: false
        };
      });
      
      var cc = {
        type: 'scatter',
        data: { datasets: datasets },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            title: { display: true, text: parsedData.title || 'Comparison Chart', font: { size: 16, weight: 'bold' } },
            legend: { position: 'bottom' }
          },
          scales: {
            x: { 
              type: 'linear',
              min: minX - paddingX,
              max: maxX + paddingX,
              grid: { color: '#e0e0e0' },
              title: { display: true, text: parsedData.xAxis?.label || '' }
            },
            y: {
              min: minY - paddingY,
              max: maxY + paddingY,
              grid: { color: '#e0e0e0' },
              title: { display: true, text: parsedData.yAxis?.label || '' }
            }
          }
        }
      };
      
      var canvas = document.getElementById(compareChartId);
      if (canvas && cc) {
        canvas.parentElement.style.height = '400px';
        window._chartInstances[compareChartId] = new Chart(canvas, cc);
      }
    }, 100);
    return compareHtml;
  }
  
  // FUNCTION (Math.js + Canvas)
  else if (parsedData.type === 'function' && parsedData.equation) {
    var funcCanvasId = 'chart_' + Math.random().toString(36).substr(2, 9);
    var funcHtml = '<div style="margin:15px 0;padding:15px;background:#f8f9fa;border-radius:8px;border:1px solid #e9ecef;position:relative;">' +
      '<canvas id="' + funcCanvasId + '" style="width:100%;height:400px;display:block;border-radius:4px;"></canvas>' +
      '</div>';
    
    setTimeout(function() {
      var canvas = document.getElementById(funcCanvasId);
      if (!canvas) return;
      
      var rect = canvas.parentElement.getBoundingClientRect();
      var dpr = window.devicePixelRatio || 1;
      var w = canvas.parentElement.clientWidth || 600;
      var h = 400;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = w + 'px';
      canvas.style.height = h + 'px';
      
      var ctx = canvas.getContext('2d');
      ctx.scale(dpr, dpr);
      
      var equation = parsedData.equation.replace(/y\s*=\s*/, '');
      var xMin = parsedData.xAxis?.min !== undefined ? parsedData.xAxis.min : -10;
      var xMax = parsedData.xAxis?.max !== undefined ? parsedData.xAxis.max : 10;
      var yMin = parsedData.yAxis?.min !== undefined ? parsedData.yAxis.min : -10;
      var yMax = parsedData.yAxis?.max !== undefined ? parsedData.yAxis.max : 10;
      var samples = 1000;
      var color = parsedData.color || '#e74c3c';
      var lineWidth = parsedData.lineWidth || 3;
      
      var padding = 40;
      var graphW = w - padding * 2;
      var graphH = h - padding * 2;
      
      function worldToScreen(wx, wy) {
        var sx = padding + ((wx - xMin) / (xMax - xMin)) * graphW;
        var sy = padding + graphH - ((wy - yMin) / (yMax - yMin)) * graphH;
        return { x: sx, y: sy };
      }
      
      function evaluate(expr, x) {
        try {
          var node = math.parse(expr);
          var result = node.evaluate({ x: x });
          return typeof result === 'number' && isFinite(result) ? result : NaN;
        } catch(e) {
          return NaN;
        }
      }
      
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, w, h);
      
      ctx.strokeStyle = '#f0f0f0';
      ctx.lineWidth = 1;
      for (var x = Math.ceil(xMin); x <= Math.floor(xMax); x++) {
        var pos = worldToScreen(x, 0);
        ctx.beginPath();
        ctx.moveTo(pos.x, padding);
        ctx.lineTo(pos.x, padding + graphH);
        ctx.stroke();
      }
      for (var y = Math.ceil(yMin); y <= Math.floor(yMax); y++) {
        if (y === 0) continue;
        var pos = worldToScreen(0, y);
        ctx.beginPath();
        ctx.moveTo(padding, pos.y);
        ctx.lineTo(padding + graphW, pos.y);
        ctx.stroke();
      }
      
      ctx.strokeStyle = '#333';
      ctx.lineWidth = 2;
      var origin = worldToScreen(0, 0);
      if (origin.x >= padding && origin.x <= padding + graphW) {
        ctx.beginPath();
        ctx.moveTo(origin.x, padding);
        ctx.lineTo(origin.x, padding + graphH);
        ctx.stroke();
      }
      if (origin.y >= padding && origin.y <= padding + graphH) {
        ctx.beginPath();
        ctx.moveTo(padding, origin.y);
        ctx.lineTo(padding + graphW, origin.y);
        ctx.stroke();
      }
      
      ctx.fillStyle = '#333';
      if (origin.x >= padding && origin.x <= padding + graphW) {
        ctx.beginPath();
        ctx.moveTo(origin.x, padding);
        ctx.lineTo(origin.x - 6, padding + 8);
        ctx.lineTo(origin.x + 6, padding + 8);
        ctx.fill();
      }
      if (origin.y >= padding && origin.y <= padding + graphH) {
        ctx.beginPath();
        ctx.moveTo(padding + graphW, origin.y);
        ctx.lineTo(padding + graphW - 8, origin.y - 6);
        ctx.lineTo(padding + graphW - 8, origin.y + 6);
        ctx.fill();
      }
      
      ctx.fillStyle = '#555';
      ctx.font = '12px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText(parsedData.xAxis?.label || 'x', padding + graphW / 2, h - 18);
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      ctx.fillText(parsedData.yAxis?.label || 'y', 12, padding);
      
      var points = [];
      var step = (xMax - xMin) / samples;
      for (var xVal = xMin; xVal <= xMax; xVal += step) {
        var yVal = evaluate(equation, xVal);
        if (!isNaN(yVal) && isFinite(yVal) && yVal >= yMin && yVal <= yMax) {
          points.push({ x: xVal, y: yVal });
        } else if (points.length > 0) {
          points.push({ x: xVal, y: NaN });
        }
      }
      
      ctx.strokeStyle = color;
      ctx.lineWidth = lineWidth;
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';
      
      var i = 0;
      while (i < points.length) {
        while (i < points.length && isNaN(points[i].y)) i++;
        if (i >= points.length) break;
        var start = i;
        while (i < points.length && !isNaN(points[i].y)) i++;
        if (i - start > 1) {
          ctx.beginPath();
          var p = worldToScreen(points[start].x, points[start].y);
          ctx.moveTo(p.x, p.y);
          for (var j = start + 1; j < i; j++) {
            p = worldToScreen(points[j].x, points[j].y);
            ctx.lineTo(p.x, p.y);
          }
          ctx.stroke();
        }
      }
      
      if (parsedData.points) {
        parsedData.points.forEach(function(pt) {
          var screen = worldToScreen(pt.x, pt.y);
          ctx.beginPath();
          ctx.arc(screen.x, screen.y, 5, 0, 2 * Math.PI);
          ctx.fillStyle = pt.color || '#e74c3c';
          ctx.fill();
          ctx.strokeStyle = '#fff';
          ctx.lineWidth = 2;
          ctx.stroke();
          if (pt.label) {
            ctx.fillStyle = '#333';
            ctx.font = '13px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'bottom';
            ctx.fillText(pt.label, screen.x, screen.y - 8);
          }
        });
      }
      
      if (parsedData.showEquation !== false) {
        ctx.fillStyle = color;
        ctx.font = 'bold 14px sans-serif';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'bottom';
        var labelPos = worldToScreen(xMax * 0.7, evaluate(equation, xMax * 0.7));
        if (isFinite(labelPos.y)) {
          ctx.fillText('y = ' + equation, padding + 10, padding + 20);
        }
      }
      
    }, 100);
    return funcHtml;
  }
  
  // COORDINATE-PLANE
  else if (parsedData.type === 'coordinate-plane') {
    var coordCanvasId = 'coord_' + Math.random().toString(36).substr(2, 9);
    var coordHtml = '<div style="margin:15px 0;padding:15px;background:#f8f9fa;border-radius:8px;border:1px solid #e9ecef;position:relative;">' +
      '<canvas id="' + coordCanvasId + '" style="width:100%;height:400px;display:block;border-radius:4px;"></canvas>' +
      '</div>';
    
    setTimeout(function() {
      console.log("✅ coordinate-plane version 2026 - full support");
      
      var canvas = document.getElementById(coordCanvasId);
      if (!canvas) {
        console.error("❌ Canvas not found!");
        return;
      }
      
      var rect = canvas.parentElement.getBoundingClientRect();
      var dpr = window.devicePixelRatio || 1;
      var w = canvas.parentElement.clientWidth || 600;
      var h = 400;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = w + 'px';
      canvas.style.height = h + 'px';
      
      var ctx = canvas.getContext('2d');
      ctx.scale(dpr, dpr);
      
      var xMin = parsedData.xAxis?.min !== undefined ? parsedData.xAxis.min : -10;
      var xMax = parsedData.xAxis?.max !== undefined ? parsedData.xAxis.max : 10;
      var yMin = parsedData.yAxis?.min !== undefined ? parsedData.yAxis.min : -10;
      var yMax = parsedData.yAxis?.max !== undefined ? parsedData.yAxis.max : 10;
      
      var padding = 40;
      var graphW = w - padding * 2;
      var graphH = h - padding * 2;
      
      function toScreen(px, py) {
        var sx = padding + ((px - xMin) / (xMax - xMin)) * graphW;
        var sy = padding + graphH - ((py - yMin) / (yMax - yMin)) * graphH;
        return { x: sx, y: sy };
      }
      
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, w, h);
      
      if (parsedData.grid !== false) {
        ctx.strokeStyle = '#f0f0f0';
        ctx.lineWidth = 1;
        var xTick = parsedData.xAxis?.tick || 1;
        var yTick = parsedData.yAxis?.tick || 1;
        for (var x = Math.ceil(xMin / xTick) * xTick; x <= xMax; x += xTick) {
          if (Math.abs(x) < 0.001) continue;
          var pos = toScreen(x, 0);
          ctx.beginPath();
          ctx.moveTo(pos.x, padding);
          ctx.lineTo(pos.x, padding + graphH);
          ctx.stroke();
        }
        for (var y = Math.ceil(yMin / yTick) * yTick; y <= yMax; y += yTick) {
          if (Math.abs(y) < 0.001) continue;
          var pos = toScreen(0, y);
          ctx.beginPath();
          ctx.moveTo(padding, pos.y);
          ctx.lineTo(padding + graphW, pos.y);
          ctx.stroke();
        }
      }
      
      ctx.strokeStyle = '#333';
      ctx.lineWidth = 2;
      var origin = toScreen(0, 0);
      if (origin.x >= padding && origin.x <= padding + graphW) {
        ctx.beginPath();
        ctx.moveTo(origin.x, padding);
        ctx.lineTo(origin.x, padding + graphH);
        ctx.stroke();
      }
      if (origin.y >= padding && origin.y <= padding + graphH) {
        ctx.beginPath();
        ctx.moveTo(padding, origin.y);
        ctx.lineTo(padding + graphW, origin.y);
        ctx.stroke();
      }
      
      ctx.fillStyle = '#333';
      if (origin.x >= padding && origin.x <= padding + graphW) {
        ctx.beginPath();
        ctx.moveTo(origin.x, padding);
        ctx.lineTo(origin.x - 6, padding + 8);
        ctx.lineTo(origin.x + 6, padding + 8);
        ctx.fill();
      }
      if (origin.y >= padding && origin.y <= padding + graphH) {
        ctx.beginPath();
        ctx.moveTo(padding + graphW, origin.y);
        ctx.lineTo(padding + graphW - 8, origin.y - 6);
        ctx.lineTo(padding + graphW - 8, origin.y + 6);
        ctx.fill();
      }
      
      ctx.fillStyle = '#555';
      ctx.font = '12px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText(parsedData.xAxis?.label || 'x', padding + graphW / 2, h - 18);
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      ctx.fillText(parsedData.yAxis?.label || 'y', 12, padding);
      
      var xTick = parsedData.xAxis?.tick || 1;
      var yTick = parsedData.yAxis?.tick || 1;
      
      ctx.fillStyle = '#555';
      ctx.font = '11px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      
      for (var x = Math.ceil(xMin / xTick) * xTick; x <= xMax; x += xTick) {
        if (Math.abs(x) < 0.001) continue;
        var pos = toScreen(x, 0);
        ctx.beginPath();
        ctx.moveTo(pos.x, origin.y - 5);
        ctx.lineTo(pos.x, origin.y + 5);
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.fillText(x, pos.x, origin.y + 8);
      }
      
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      
      for (var y = Math.ceil(yMin / yTick) * yTick; y <= yMax; y += yTick) {
        if (Math.abs(y) < 0.001) continue;
        var pos = toScreen(0, y);
        ctx.beginPath();
        ctx.moveTo(origin.x - 5, pos.y);
        ctx.lineTo(origin.x + 5, pos.y);
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.fillText(y, origin.x - 8, pos.y);
      }
      
      if (parsedData.points) {
        parsedData.points.forEach(function(pt) {
          var screen = toScreen(pt.x, pt.y);
          ctx.beginPath();
          ctx.arc(screen.x, screen.y, 5, 0, 2 * Math.PI);
          ctx.fillStyle = pt.color || '#3498db';
          ctx.fill();
          ctx.strokeStyle = '#fff';
          ctx.lineWidth = 2;
          ctx.stroke();
          if (pt.label) {
            ctx.fillStyle = '#333';
            ctx.font = '13px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'bottom';
            ctx.fillText(pt.label, screen.x, screen.y - 8);
          }
        });
      }
      
      if (parsedData.segments) {
        parsedData.segments.forEach(function(seg) {
          var from = toScreen(seg.from[0], seg.from[1]);
          var to = toScreen(seg.to[0], seg.to[1]);
          ctx.beginPath();
          ctx.moveTo(from.x, from.y);
          ctx.lineTo(to.x, to.y);
          ctx.strokeStyle = seg.color || '#2c3e50';
          ctx.lineWidth = seg.lineWidth || 2;
          ctx.stroke();
        });
      }
      
      if (parsedData.series) {
        parsedData.series.forEach(function(ser) {
          if ((ser.type === 'line' || ser.type === 'curve') && ser.points) {
            ctx.beginPath();
            var first = toScreen(ser.points[0][0], ser.points[0][1]);
            ctx.moveTo(first.x, first.y);
            for (var k = 1; k < ser.points.length; k++) {
              var p = toScreen(ser.points[k][0], ser.points[k][1]);
              ctx.lineTo(p.x, p.y);
            }
            ctx.strokeStyle = ser.color || '#e74c3c';
            ctx.lineWidth = ser.lineWidth || 2;
            ctx.stroke();
          }
        });
      }
      
      if (parsedData.functions && Array.isArray(parsedData.functions)) {
        parsedData.functions.forEach(function(func) {
          var equation = func.equation || '';
          var domain = func.domain || [xMin, xMax];
          var color = func.color || '#e74c3c';
          var lineWidth = func.lineWidth || 3;
          
          if (!equation) return;
          
          var expr = equation.replace(/y\s*=\s*/, '');
          var samples = 500;
          var step = (domain[1] - domain[0]) / samples;
          var points = [];
          
          for (var xVal = domain[0]; xVal <= domain[1]; xVal += step) {
            try {
              var node = math.parse(expr);
              var yVal = node.evaluate({ x: xVal });
              if (typeof yVal === 'number' && isFinite(yVal) && yVal >= yMin && yVal <= yMax) {
                points.push({ x: xVal, y: yVal });
              } else {
                points.push({ x: xVal, y: NaN });
              }
            } catch(e) {
              points.push({ x: xVal, y: NaN });
            }
          }
          
          ctx.strokeStyle = color;
          ctx.lineWidth = lineWidth;
          ctx.lineJoin = 'round';
          ctx.lineCap = 'round';
          
          var i = 0;
          while (i < points.length) {
            while (i < points.length && (isNaN(points[i].y) || !isFinite(points[i].y))) i++;
            if (i >= points.length) break;
            var start = i;
            while (i < points.length && !isNaN(points[i].y) && isFinite(points[i].y)) i++;
            if (i - start > 1) {
              ctx.beginPath();
              var p = toScreen(points[start].x, points[start].y);
              ctx.moveTo(p.x, p.y);
              for (var j = start + 1; j < i; j++) {
                p = toScreen(points[j].x, points[j].y);
                ctx.lineTo(p.x, p.y);
              }
              ctx.stroke();
            }
          }
        });
      }
      
      if (parsedData.labels) {
        parsedData.labels.forEach(function(label) {
          var screen = toScreen(label.x, label.y);
          ctx.fillStyle = label.color || '#333';
          ctx.font = (label.fontSize || 14) + 'px sans-serif';
          ctx.textAlign = label.align || 'center';
          ctx.textBaseline = label.baseline || 'middle';
          ctx.fillText(label.text, screen.x, screen.y);
        });
      }
      
    }, 100);
    return coordHtml;
  }
  
  // SHAPE
  else if (parsedData.type === 'shape') {
    var shapeCanvasId = 'shape_' + Math.random().toString(36).substr(2, 9);
    var shapeHtml = '<div style="margin:15px 0;padding:15px;background:#f8f9fa;border-radius:8px;border:1px solid #e9ecef;position:relative;">' +
      '<canvas id="' + shapeCanvasId + '" style="width:100%;height:400px;display:block;border-radius:4px;"></canvas>' +
      '</div>';
    
    setTimeout(function() {
      var canvas = document.getElementById(shapeCanvasId);
      if (!canvas) return;
      
      var rect = canvas.parentElement.getBoundingClientRect();
      var dpr = window.devicePixelRatio || 1;
      var w = canvas.parentElement.clientWidth || 600;
      var h = 400;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = w + 'px';
      canvas.style.height = h + 'px';
      
      var ctx = canvas.getContext('2d');
      ctx.scale(dpr, dpr);
      
      var pts = parsedData.points || [];
      var segments = parsedData.segments || [];
      var labels = parsedData.labels || [];
      var angles = parsedData.angles || [];
      var circles = parsedData.circles || [];
      var arcs = parsedData.arcs || [];
      var rightAngles = parsedData.rightAngles || [];
      
      var padding = 40;
      var graphW = w - padding * 2;
      var graphH = h - padding * 2;
      
      var allX = pts.map(function(p) { return p.x; });
      var allY = pts.map(function(p) { return p.y; });
      if (allX.length === 0) { allX = [0, 1]; allY = [0, 1]; }
      var minX = Math.min.apply(null, allX) - 1;
      var maxX = Math.max.apply(null, allX) + 1;
      var minY = Math.min.apply(null, allY) - 1;
      var maxY = Math.max.apply(null, allY) + 1;
      var rangeX = maxX - minX || 1;
      var rangeY = maxY - minY || 1;
      var scaleX = graphW / rangeX;
      var scaleY = graphH / rangeY;
      var scale = Math.min(scaleX, scaleY);
      var cx = (minX + maxX) / 2;
      var cy = (minY + maxY) / 2;
      
      function toScreen(px, py) {
        var sx = padding + graphW/2 + (px - cx) * scale;
        var sy = padding + graphH/2 - (py - cy) * scale;
        return { x: sx, y: sy };
      }
      
      function getPoint(id) {
        for (var i = 0; i < pts.length; i++) {
          if (pts[i].id === id) return pts[i];
        }
        return null;
      }
      
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, w, h);
      
      ctx.strokeStyle = '#f0f0f0';
      ctx.lineWidth = 1;
      for (var x = Math.ceil(minX); x <= Math.floor(maxX); x++) {
        var pos = toScreen(x, 0);
        ctx.beginPath();
        ctx.moveTo(pos.x, padding);
        ctx.lineTo(pos.x, padding + graphH);
        ctx.stroke();
      }
      for (var y = Math.ceil(minY); y <= Math.floor(maxY); y++) {
        var pos = toScreen(0, y);
        ctx.beginPath();
        ctx.moveTo(padding, pos.y);
        ctx.lineTo(padding + graphW, pos.y);
        ctx.stroke();
      }
      
      ctx.strokeStyle = '#333';
      ctx.lineWidth = 1.5;
      var origin = toScreen(0, 0);
      if (origin.x >= padding && origin.x <= padding + graphW) {
        ctx.beginPath();
        ctx.moveTo(origin.x, padding);
        ctx.lineTo(origin.x, padding + graphH);
        ctx.stroke();
      }
      if (origin.y >= padding && origin.y <= padding + graphH) {
        ctx.beginPath();
        ctx.moveTo(padding, origin.y);
        ctx.lineTo(padding + graphW, origin.y);
        ctx.stroke();
      }
      
      circles.forEach(function(c) {
        var center = getPoint(c.center);
        if (!center) {
          if (Array.isArray(c.center)) {
            center = { x: c.center[0], y: c.center[1] };
          } else {
            return;
          }
        }
        var centerScreen = toScreen(center.x, center.y);
        var radiusPx = c.radius * scale;
        ctx.beginPath();
        ctx.arc(centerScreen.x, centerScreen.y, radiusPx, 0, 2 * Math.PI);
        ctx.strokeStyle = c.stroke || '#3498db';
        ctx.lineWidth = c.lineWidth || 2;
        ctx.stroke();
        if (c.fill) {
          ctx.fillStyle = c.fill;
          ctx.fill();
        }
      });
      
      arcs.forEach(function(a) {
        var center = getPoint(a.center);
        if (!center) return;
        var centerScreen = toScreen(center.x, center.y);
        var radiusPx = a.radius * scale;
        var startAngle = (a.startAngle || 0) * Math.PI / 180;
        var endAngle = (a.endAngle || 0) * Math.PI / 180;
        ctx.beginPath();
        ctx.arc(centerScreen.x, centerScreen.y, radiusPx, startAngle, endAngle);
        ctx.strokeStyle = a.stroke || '#2c3e50';
        ctx.lineWidth = a.lineWidth || 2;
        ctx.stroke();
      });
      
      segments.forEach(function(seg) {
        var fromPt = getPoint(seg.from);
        var toPt = getPoint(seg.to);
        if (!fromPt || !toPt) return;
        var from = toScreen(fromPt.x, fromPt.y);
        var to = toScreen(toPt.x, toPt.y);
        ctx.beginPath();
        ctx.moveTo(from.x, from.y);
        ctx.lineTo(to.x, to.y);
        ctx.strokeStyle = seg.stroke || '#2c3e50';
        ctx.lineWidth = seg.lineWidth || 2;
        ctx.stroke();
      });
      
      rightAngles.forEach(function(vertexId) {
        var v = getPoint(vertexId);
        if (!v) return;
        var vScreen = toScreen(v.x, v.y);
        var size = 12;
        var neighbors = [];
        segments.forEach(function(seg) {
          if (seg.from === vertexId) {
            var pt = getPoint(seg.to);
            if (pt) neighbors.push(pt);
          }
          if (seg.to === vertexId) {
            var pt = getPoint(seg.from);
            if (pt) neighbors.push(pt);
          }
        });
        if (neighbors.length >= 2) {
          var n1 = toScreen(neighbors[0].x, neighbors[0].y);
          var n2 = toScreen(neighbors[1].x, neighbors[1].y);
          var dx1 = n1.x - vScreen.x, dy1 = n1.y - vScreen.y;
          var dx2 = n2.x - vScreen.x, dy2 = n2.y - vScreen.y;
          var len1 = Math.sqrt(dx1*dx1 + dy1*dy1);
          var len2 = Math.sqrt(dx2*dx2 + dy2*dy2);
          if (len1 > 0 && len2 > 0) {
            var ratio = size / len1;
            var p1x = vScreen.x + dx1 * ratio;
            var p1y = vScreen.y + dy1 * ratio;
            ratio = size / len2;
            var p2x = vScreen.x + dx2 * ratio;
            var p2y = vScreen.y + dy2 * ratio;
            var p3x = p1x + p2x - vScreen.x;
            var p3y = p1y + p2y - vScreen.y;
            ctx.beginPath();
            ctx.moveTo(p1x, p1y);
            ctx.lineTo(p3x, p3y);
            ctx.lineTo(p2x, p2y);
            ctx.strokeStyle = '#2c3e50';
            ctx.lineWidth = 1.5;
            ctx.stroke();
          }
        }
      });
      
      angles.forEach(function(a) {
        var v = getPoint(a.vertex);
        if (!v) return;
        var vScreen = toScreen(v.x, v.y);
        var sides = a.sides || [];
        var measure = a.measure || 0;
        var label = a.label || measure + '°';
        if (sides.length >= 2) {
          var p1 = getPoint(sides[0]);
          var p2 = getPoint(sides[1]);
          if (p1 && p2) {
            var p1s = toScreen(p1.x, p1.y);
            var p2s = toScreen(p2.x, p2.y);
            var angle1 = Math.atan2(p1s.y - vScreen.y, p1s.x - vScreen.x);
            var angle2 = Math.atan2(p2s.y - vScreen.y, p2s.x - vScreen.x);
            var radius = 30;
            var startA = Math.min(angle1, angle2);
            var endA = Math.max(angle1, angle2);
            if (endA - startA > Math.PI) {
              var temp = startA;
              startA = endA;
              endA = temp + 2 * Math.PI;
            }
            ctx.beginPath();
            ctx.arc(vScreen.x, vScreen.y, radius, startA, endA);
            ctx.strokeStyle = a.color || '#e74c3c';
            ctx.lineWidth = 1.5;
            ctx.stroke();
            var midA = (startA + endA) / 2;
            var labelR = radius + 15;
            var lx = vScreen.x + labelR * Math.cos(midA);
            var ly = vScreen.y + labelR * Math.sin(midA);
            ctx.fillStyle = '#e74c3c';
            ctx.font = '14px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(label, lx, ly);
          }
        }
      });
      
      pts.forEach(function(p) {
        var screen = toScreen(p.x, p.y);
        ctx.beginPath();
        ctx.arc(screen.x, screen.y, 5, 0, 2 * Math.PI);
        ctx.fillStyle = p.color || '#3498db';
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.stroke();
      });
      
      labels.forEach(function(l) {
        var pos = toScreen(l.x, l.y);
        ctx.fillStyle = l.color || '#2c3e50';
        ctx.font = (l.fontSize || 14) + 'px sans-serif';
        ctx.textAlign = l.align || 'center';
        ctx.textBaseline = l.baseline || 'middle';
        ctx.fillText(l.text, pos.x, pos.y);
      });
      
      if (parsedData.question) {
        ctx.fillStyle = '#555';
        ctx.font = '14px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText(parsedData.question, w/2, 8);
      }
      
    }, 100);
    return shapeHtml;
  }
  
  // HISTOGRAM
  else if (parsedData.type === 'histogram' && parsedData.bins && parsedData.counts) {
    setTimeout(function() {
      var ctx = document.getElementById(chartId);
      if (!ctx) return;
      if (window._chartInstances && window._chartInstances[chartId]) {
        window._chartInstances[chartId].destroy();
      }
      if (!window._chartInstances) window._chartInstances = {};
      
      var cc = {
        type: 'bar',
        data: {
          labels: parsedData.bins,
          datasets: [{
            label: parsedData.title || 'Frequency',
            data: parsedData.counts,
            backgroundColor: 'rgba(52,152,219,0.7)',
            borderColor: '#2c3e50',
            borderWidth: 1
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            title: { display: true, text: parsedData.title || 'Histogram', font: { size: 16, weight: 'bold' } },
            legend: { display: false }
          },
          scales: {
            x: { title: { display: true, text: parsedData.xLabel || '' }, grid: { color: '#e0e0e0' } },
            y: { beginAtZero: true, title: { display: true, text: parsedData.yLabel || 'Frequency' }, grid: { color: '#e0e0e0' } }
          }
        }
      };
      
      var canvas = document.getElementById(chartId);
      if (canvas && cc) {
        canvas.parentElement.style.height = '400px';
        window._chartInstances[chartId] = new Chart(canvas, cc);
      }
    }, 100);
    return html;
  }
  
  // DOT-PLOT
  else if (parsedData.type === 'dot-plot' && parsedData.data) {
    setTimeout(function() {
      var ctx = document.getElementById(chartId);
      if (!ctx) return;
      if (window._chartInstances && window._chartInstances[chartId]) {
        window._chartInstances[chartId].destroy();
      }
      if (!window._chartInstances) window._chartInstances = {};
      
      var labels = parsedData.data.map(function(d) { return d.value; });
      var values = parsedData.data.map(function(d) { return d.count; });
      
      var cc = {
        type: 'bar',
        data: {
          labels: labels,
          datasets: [{
            label: parsedData.title || 'Frequency',
            data: values,
            backgroundColor: 'rgba(52,152,219,0.5)',
            borderColor: '#2c3e50',
            borderWidth: 1,
            barPercentage: 0.3
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            title: { display: true, text: parsedData.title || 'Dot Plot', font: { size: 16, weight: 'bold' } },
            legend: { display: false }
          },
          scales: {
            x: { title: { display: true, text: parsedData.xAxis?.label || 'Value' }, grid: { color: '#e0e0e0' } },
            y: { beginAtZero: true, title: { display: true, text: parsedData.yAxis?.label || 'Count' }, grid: { color: '#e0e0e0' } }
          }
        }
      };
      
      var canvas = document.getElementById(chartId);
      if (canvas && cc) {
        canvas.parentElement.style.height = '400px';
        window._chartInstances[chartId] = new Chart(canvas, cc);
      }
    }, 100);
    return html;
  }
  
  // UNSUPPORTED
  else {
    return '<div style="padding:10px;text-align:center;color:#999;border:1px dashed #ddd;border-radius:8px;margin:15px 0;">' +
      '<span style="font-size:20px;">📊</span>' +
      '<p style="margin-top:8px;">Graph type "<strong>' + escapeHtml(parsedData.type || 'Unknown') + '</strong>" is not supported.</p>' +
      '</div>';
  }
}

// ============================================================
// B015: 내보내기 및 전역 노출 (window + export)
// ============================================================

// 1. 전역(window) 노출
window.initialize = initialize;
window.startQuizWithNumber = startQuizWithNumber;
window.renderGraphic = renderGraphic;
window.renderCurrentQuestion = renderCurrentQuestion;
window.showExplanation = showExplanation;
window.goNext = goNext;
window.goPrev = goPrev;
window.skipQuestion = skipQuestion;
window.submitSubjective = submitSubjective;
window.showResults = showResults;
window.showWrongAnswersList = showWrongAnswersList;
window.startWrongOnlyReview = startWrongOnlyReview;
window.saveProgress = saveProgress;
window.loadProgress = loadProgress;
window.clearProgress = clearProgress;

// ★★★★★ attachEvents를 전역에 노출 (가장 중요!) ★★★★★
window.attachEvents = attachEvents;

window.LANG = LANG;
window.DOM = DOM;

window.currentQuestions = currentQuestions;
window.userAnswers = userAnswers;
window.currentIndex = currentIndex;
window.correctCount = correctCount;
window.isReviewMode = isReviewMode;
window.currentStartNumber = currentStartNumber;
window.TOTAL_QUESTIONS = TOTAL_QUESTIONS;

// 2. ES Module export 추가
export { 
  initialize, 
  startQuizWithNumber, 
  renderGraphic,
  renderCurrentQuestion,
  showExplanation,
  goNext,
  goPrev,
  skipQuestion,
  submitSubjective,
  showResults,
  showWrongAnswersList,
  startWrongOnlyReview,
  saveProgress,
  loadProgress,
  clearProgress
};

console.log("✅ Full main.js loaded with all functions!");
console.log("✅ MathJax available:", typeof MathJax !== 'undefined');
console.log("✅ Exports available: initialize, startQuizWithNumber, renderGraphic, etc.");

