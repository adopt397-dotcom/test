// ================================================================
// api/main-api.js
// SAT MULTILINGUAL API ADAPTER v1.0.0
// ================================================================

const API_URL =
  '여기에_구글_APPS_SCRIPT_웹앱_URL을_넣으세요';

const DEFAULT_SHEET = 'generated_set_001';
const DEFAULT_LIMIT = 120;

/**
 * URL 파라미터 생성
 */
function createApiUrl(params = {}) {
  if (!API_URL || API_URL.includes('여기에_')) {
    throw new Error(
      'api/main-api.js의 API_URL에 Apps Script 웹앱 주소를 입력하세요.'
    );
  }

  const url = new URL(API_URL);

  Object.entries(params).forEach(([key, value]) => {
    if (
      value !== undefined &&
      value !== null &&
      value !== ''
    ) {
      url.searchParams.set(key, String(value));
    }
  });

  // 캐시 방지
  url.searchParams.set('_', Date.now());

  return url.toString();
}

/**
 * API 요청 공통 함수
 */
async function requestJson(params = {}) {
  const requestUrl = createApiUrl(params);

  console.log('📡 API 요청:', requestUrl);

  const response = await fetch(requestUrl, {
    method: 'GET',
    cache: 'no-store'
  });

  if (!response.ok) {
    throw new Error(
      `API 요청 실패: HTTP ${response.status}`
    );
  }

  const text = await response.text();

  if (!text.trim()) {
    throw new Error('API 응답이 비어 있습니다.');
  }

  if (
    text.trim().startsWith('<!DOCTYPE') ||
    text.trim().startsWith('<html')
  ) {
    throw new Error(
      'API가 JSON 대신 HTML을 반환했습니다. Apps Script 배포 주소를 확인하세요.'
    );
  }

  try {
    return JSON.parse(text);
  } catch (error) {
    console.error('API 원본 응답:', text);

    throw new Error(
      `API JSON 해석 실패: ${error.message}`
    );
  }
}

/**
 * 여러 형식의 API 응답에서 문제 배열 추출
 */
function extractQuestionArray(apiResult) {
  if (Array.isArray(apiResult)) {
    return apiResult;
  }

  if (
    apiResult &&
    Array.isArray(apiResult.questions)
  ) {
    return apiResult.questions;
  }

  if (
    apiResult &&
    Array.isArray(apiResult.data)
  ) {
    return apiResult.data;
  }

  if (
    apiResult &&
    Array.isArray(apiResult.rows)
  ) {
    return apiResult.rows;
  }

  return [];
}

/**
 * 값 안전 변환
 */
function stringValue(value) {
  if (
    value === undefined ||
    value === null
  ) {
    return '';
  }

  return String(value).trim();
}

/**
 * 숫자 정답 변환
 *
 * 객관식:
 * A = 1, 2, 3, 4
 *
 * 주관식:
 * 숫자나 문자열 원본 유지
 */
function normalizeAnswer(value) {
  const text = stringValue(value);
  const number = Number(text);

  if (
    Number.isInteger(number) &&
    number >= 1 &&
    number <= 4
  ) {
    return number;
  }

  return text;
}

/**
 * 새 다국어 구조를 main.js가 사용하기 좋은 형태로 변환
 *
 * 지원 열:
 * Q_EN, Q_KO
 * P_EN, P_KO
 * 1_EN~4_KO
 * A
 * E_EN, E_KO
 * G
 * D
 */
function normalizeQuestion(row, index = 0) {
  const questionEn =
    stringValue(row.Q_EN) ||
    stringValue(row.Q);

  const questionKo =
    stringValue(row.Q_KO);

  const passageEn =
    stringValue(row.P_EN) ||
    stringValue(row.P);

  const passageKo =
    stringValue(row.P_KO);

  const choices = [
    {
      en:
        stringValue(row['1_EN']) ||
        stringValue(row['1']),
      ko:
        stringValue(row['1_KO'])
    },
    {
      en:
        stringValue(row['2_EN']) ||
        stringValue(row['2']),
      ko:
        stringValue(row['2_KO'])
    },
    {
      en:
        stringValue(row['3_EN']) ||
        stringValue(row['3']),
      ko:
        stringValue(row['3_KO'])
    },
    {
      en:
        stringValue(row['4_EN']) ||
        stringValue(row['4']),
      ko:
        stringValue(row['4_KO'])
    }
  ];

  return {
    // 기본 번호
    number:
      Number(row.N) ||
      index + 1,

    originalNumber:
      Number(row.N) ||
      index + 1,

    // 새 다국어 필드
    questionEn,
    questionKo,

    passageEn,
    passageKo,

    choices,

    explanationEn:
      stringValue(row.E_EN) ||
      stringValue(row.E),

    explanationKo:
      stringValue(row.E_KO),

    answer:
      normalizeAnswer(row.A),

    graphic:
      stringValue(row.G),

    difficulty:
      Number(row.D) || 2,

    sourceId:
      stringValue(row.SOURCE_ID),

    variantNo:
      Number(row.VARIANT_NO) || 1,

    status:
      stringValue(row.STATUS),

    sourceSheetRow:
      Number(row.SOURCE_SHEET_ROW) || 0,

    // 기존 main.js와의 임시 호환용
    question: questionEn,
    passage: passageEn,

    explanation:
      stringValue(row.E_EN) ||
      stringValue(row.E),

    choice1: choices[0].en,
    choice2: choices[1].en,
    choice3: choices[2].en,
    choice4: choices[3].en,

    raw: row
  };
}

/**
 * 총 문제 수 조회
 */
async function fetchTotalQuestions({
  sheet = DEFAULT_SHEET
} = {}) {
  const result = await requestJson({
    sheet,
    total: 'true'
  });

  const total =
    Number(result.total) ||
    Number(result.count) ||
    Number(result.totalQuestions);

  if (Number.isFinite(total)) {
    console.log('✅ 총 문제 수:', total);
    return total;
  }

  // total API 형식이 없는 경우 전체 배열 길이로 대체
  const rows = extractQuestionArray(result);

  if (rows.length > 0) {
    return rows.length;
  }

  throw new Error(
    'API 응답에서 총 문제 수를 찾지 못했습니다.'
  );
}

/**
 * 문제 불러오기
 */
async function fetchQuestions({
  start = 1,
  limit = DEFAULT_LIMIT,
  sheet = DEFAULT_SHEET
} = {}) {
  const result = await requestJson({
    sheet,
    start,
    limit,
    count: limit
  });

  const rows = extractQuestionArray(result);

  if (rows.length === 0) {
    console.warn(
      '⚠️ API에서 문제 데이터가 반환되지 않았습니다.',
      result
    );

    return [];
  }

  const questions = rows
    .map((row, index) =>
      normalizeQuestion(
        row,
        start + index - 1
      )
    )
    .filter(question =>
      question.questionEn
    );

  console.log(
    `✅ 문제 ${questions.length}개 불러오기 완료`
  );

  return questions;
}

/**
 * 한 세트 120문제 불러오기
 */
async function fetchGeneratedSet({
  start = 1,
  sheet = DEFAULT_SHEET
} = {}) {
  return fetchQuestions({
    start,
    limit: 120,
    sheet
  });
}

/**
 * 영어와 번역문이 동일한지 비교
 */
function isSameTranslation(
  english,
  translated
) {
  const en = stringValue(english)
    .replace(/\s+/g, ' ')
    .trim();

  const tr = stringValue(translated)
    .replace(/\s+/g, ' ')
    .trim();

  return Boolean(en && tr && en === tr);
}

/**
 * 번역이 없거나 동일하면 영어만 반환
 */
function getLocalizedText(
  english,
  translated,
  language = 'bilingual'
) {
  const en = stringValue(english);
  const tr = stringValue(translated);

  if (language === 'en') {
    return en;
  }

  if (language === 'ko') {
    return tr || en;
  }

  if (
    !tr ||
    isSameTranslation(en, tr)
  ) {
    return en;
  }

  return `${en}<br><span class="translation-ko">${tr}</span>`;
}

/**
 * 선택 언어에 따른 문제 화면 데이터 생성
 */
function localizeQuestion(
  question,
  language = 'bilingual'
) {
  return {
    ...question,

    questionText: getLocalizedText(
      question.questionEn,
      question.questionKo,
      language
    ),

    passageText: getLocalizedText(
      question.passageEn,
      question.passageKo,
      language
    ),

    explanationText: getLocalizedText(
      question.explanationEn,
      question.explanationKo,
      language
    ),

    localizedChoices:
      question.choices.map(choice =>
        getLocalizedText(
          choice.en,
          choice.ko,
          language
        )
      )
  };
}

/**
 * API 연결 테스트
 */
async function testMainApi() {
  try {
    console.log(
      '🧪 api/main-api.js 연결 테스트 시작'
    );

    const total =
      await fetchTotalQuestions();

    const questions =
      await fetchQuestions({
        start: 1,
        limit: 3
      });

    console.log('총 문제:', total);
    console.log('테스트 문제:', questions);

    return {
      success: true,
      total,
      questions
    };

  } catch (error) {
    console.error(
      '❌ API 연결 테스트 실패:',
      error
    );

    return {
      success: false,
      error: error.message
    };
  }
}

// ================================================================
// ES MODULE EXPORT
// ================================================================

export {
  API_URL,
  DEFAULT_SHEET,
  DEFAULT_LIMIT,

  fetchTotalQuestions,
  fetchQuestions,
  fetchGeneratedSet,

  normalizeQuestion,
  localizeQuestion,
  getLocalizedText,
  isSameTranslation,

  testMainApi
};

// 콘솔 테스트 및 일반 스크립트 호환
if (typeof window !== 'undefined') {
  window.SAT_MAIN_API = {
    API_URL,
    DEFAULT_SHEET,

    fetchTotalQuestions,
    fetchQuestions,
    fetchGeneratedSet,

    normalizeQuestion,
    localizeQuestion,
    getLocalizedText,

    testMainApi
  };

  console.log(
    '✅ api/main-api.js v1.0.0 loaded'
  );
}
