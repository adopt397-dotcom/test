/**
 * Google Apps Script - SAT Quiz API v2.0
 * 새 표준 헤더를 그대로 JSON으로 반환
 *
 * 지원:
 *   ?total=true
 *   ?start=1&limit=120
 *   ?subject=SAT
 *   ?status=ACTIVE
 */

const DEFAULT_SHEET_NAME = 'sat';
const ALLOWED_SHEETS = ['sat', 'realestate', 'mortgage', 'insurance', 'notary'];
const DEFAULT_LIMIT = 120;
const MAX_LIMIT = 150;
const TRIAL_LIMIT = 20;

// 현재 표준 헤더
const SAT_HEADERS = [
  'N',
  'SUBJECT',
  'Q_EN',
  'Q_KO',
  'P_EN',
  'P_KO',
  '1_EN',
  '1_KO',
  '2_EN',
  '2_KO',
  '3_EN',
  '3_KO',
  '4_EN',
  '4_KO',
  'A',
  'E_EN',
  'E_KO',
  'G',
  'D',
  'SOURCE_TYPE',
  'VARIANT_NO',
  'SOURCE_ID',
  'STATUS',
  'CREATED_AT',
  'UPDATED_AT'
];
const LICENSE_HEADERS = ['N', 'Q_EN', '1_EN', '2_EN', '3_EN', '4_EN', 'A', 'E_EN'];

// BLOCK 4000: Dynamic question loader
function doGet(e) {
  try {
    const params = (e && e.parameter) ? e.parameter : {};
    const access = verifyAccessToken_(params.session_token);
    let start = Math.max(1, parseInt(params.start, 10) || 1);
    const requestedLimit = parseInt(params.limit, 10) || DEFAULT_LIMIT;
    let limit = Math.max(1, Math.min(requestedLimit, MAX_LIMIT));

    const totalOnly = String(params.total || '').toLowerCase() === 'true';
    const subject = cleanText_(params.subject);
    const status = cleanText_(params.status);
    const sheetName = validateSheetName_(params.sheet || DEFAULT_SHEET_NAME);
    assertSheetAccess_(access, sheetName);

    if (access.status === 'p' && access.role !== 'admin') {
      start = 1;
      limit = TRIAL_LIMIT;
    }

    const allData = getQuizData_({
      sheet: sheetName,
      subject: subject,
      status: status
    });

    if (totalOnly) {
      return jsonResponse_({
        status: 'success',
        apiVersion: 'MULTI_SCHEMA_V2',
        total: access.status === 'p' && access.role !== 'admin'
          ? Math.min(TRIAL_LIMIT, allData.length)
          : allData.length,
        sheet: sheetName,
        subject: subject || '',
        statusFilter: status || ''
      });
    }

    const startIndex = start - 1;
    const result = allData.slice(startIndex, startIndex + limit);

    return jsonResponse_({
      status: 'success',
      apiVersion: 'MULTI_SCHEMA_V2',
      data: result,
      total: access.status === 'p' && access.role !== 'admin'
        ? Math.min(TRIAL_LIMIT, allData.length)
        : allData.length,
      start: start,
      limit: limit,
      count: result.length,
      sheet: sheetName,
      subject: subject || '',
      statusFilter: status || ''
    });

  } catch (error) {
    Logger.log('Quiz API error: ' + (error && error.stack ? error.stack : error));
    return jsonResponse_({
      status: 'error',
      code: error && error.publicCode ? error.publicCode : 'REQUEST_FAILED',
      message: error && error.publicMessage ? error.publicMessage : 'The request could not be completed.'
    });
  }
}

function doPost(e) {
  try {
    const body = parseJsonBody_(e);
    const fakeEvent = {
      parameter: Object.assign(
        {},
        (e && e.parameter) ? e.parameter : {},
        body || {}
      )
    };
    return doGet(fakeEvent);
  } catch (error) {
    Logger.log('Quiz POST error: ' + (error && error.stack ? error.stack : error));
    return jsonResponse_({
      status: 'error',
      code: 'REQUEST_FAILED',
      message: 'The request could not be completed.'
    });
  }
}

// BLOCK 4100: Temporary authorization bridge from member GAS
function verifyAccessToken_(token) {
  const value = cleanText_(token);
  if (!value) throwPublicError_('AUTH_REQUIRED', 'Please log in again.');

  const parts = value.split('.');
  if (parts.length !== 2) throwPublicError_('AUTH_INVALID', 'Please log in again.');

  const secret = PropertiesService.getScriptProperties().getProperty('GONGBOO_AUTH_SHARED_SECRET');
  if (!secret || secret.length < 32) throw new Error('GONGBOO_AUTH_SHARED_SECRET is missing or too short.');

  const expectedBytes = Utilities.computeHmacSha256Signature(parts[0], secret);
  const expected = base64UrlEncodeBytes_(expectedBytes);
  if (!constantTimeEqual_(expected, parts[1])) {
    throwPublicError_('AUTH_INVALID', 'Please log in again.');
  }

  let payload;
  try {
    payload = JSON.parse(decodeURIComponent(parts[0]));
  } catch (error) {
    throwPublicError_('AUTH_INVALID', 'Please log in again.');
  }

  const now = Math.floor(Date.now() / 1000);
  if (!payload || !payload.email || !payload.exp || payload.exp <= now) {
    throwPublicError_('AUTH_INVALID', 'Please log in again.');
  }

  payload.status = cleanText_(payload.status).toLowerCase();
  payload.role = cleanText_(payload.role).toLowerCase();
  payload.subjects = (Array.isArray(payload.subjects) ? payload.subjects : [])
    .map(normalizeSubjectCode_)
    .filter(Boolean);

  if (payload.role !== 'admin' && payload.status !== 'a' && payload.status !== 'p') {
    throwPublicError_('ACCESS_DENIED', 'This account cannot access questions.');
  }
  return payload;
}

function assertSheetAccess_(access, sheetName) {
  if (access.role === 'admin') return;
  if (access.status === 'p') return;

  const subjectCode = sheetToSubjectCode_(sheetName);
  if (access.subjects.indexOf(subjectCode) === -1) {
    throwPublicError_('SUBJECT_DENIED', 'This subject is not available for your account.');
  }
}

function sheetToSubjectCode_(sheetName) {
  const map = {
    sat: 'SAT',
    realestate: 'RE',
    mortgage: 'MTG',
    insurance: 'INS',
    notary: 'NOT'
  };
  return map[String(sheetName || '').toLowerCase()] || '';
}

function normalizeSubjectCode_(value) {
  const code = cleanText_(value).toUpperCase();
  const aliases = {
    REAL_ESTATE: 'RE',
    REALESTATE: 'RE',
    MORTGAGE: 'MTG',
    INSURANCE: 'INS',
    NOTARY: 'NOT'
  };
  return aliases[code] || code;
}

function base64UrlEncodeBytes_(bytes) {
  return Utilities.base64EncodeWebSafe(bytes).replace(/=+$/g, '');
}

function constantTimeEqual_(left, right) {
  left = String(left || '');
  right = String(right || '');
  let mismatch = left.length ^ right.length;
  const length = Math.max(left.length, right.length);
  for (let i = 0; i < length; i++) {
    mismatch |= (left.charCodeAt(i % Math.max(1, left.length)) || 0) ^
      (right.charCodeAt(i % Math.max(1, right.length)) || 0);
  }
  return mismatch === 0;
}

function throwPublicError_(code, message) {
  const error = new Error(code);
  error.publicCode = code;
  error.publicMessage = message;
  throw error;
}

/**
 * 시트 헤더를 기준으로 각 행을 객체로 변환한다.
 * 열 순서가 바뀌어도 헤더 이름만 같으면 정상 동작한다.
 */
function getQuizData_(filters) {
  const sheetName = validateSheetName_(filters && filters.sheet);
  const sheet = SpreadsheetApp
    .getActiveSpreadsheet()
    .getSheetByName(sheetName);

  if (!sheet) {
    throw new Error('Sheet not found: ' + sheetName);
  }

  const lastRow = sheet.getLastRow();
  const lastColumn = sheet.getLastColumn();

  if (lastRow < 2 || lastColumn < 1) {
    return [];
  }

  const values = sheet
    .getRange(1, 1, lastRow, lastColumn)
    .getValues();

  const headers = values[0].map(function(header) {
    return normalizeHeader_(header);
  });

  const schema = detectSchema_(headers);
  validateHeaders_(headers, schema);

  const subjectFilter = cleanText_(filters && filters.subject).toUpperCase();
  const statusFilter = cleanText_(filters && filters.status).toUpperCase();

  const result = [];

  for (let r = 1; r < values.length; r++) {
    const row = values[r];

    if (isBlankRow_(row)) {
      continue;
    }

    const item = {};

    for (let c = 0; c < headers.length; c++) {
      const header = headers[c];

      if (!header) {
        continue;
      }

      item[header] = normalizeCellValue_(row[c]);
    }
    item._SCHEMA = schema;

    // N이 비어 있으면 실제 데이터 순번 사용
    if (item.N === '' || item.N === null || item.N === undefined) {
      item.N = r;
    }

    // 선택 필터
    if (
      subjectFilter &&
      cleanText_(item.SUBJECT).toUpperCase() !== subjectFilter
    ) {
      continue;
    }

    if (
      statusFilter &&
      cleanText_(item.STATUS).toUpperCase() !== statusFilter
    ) {
      continue;
    }

    result.push(item);
  }

  return result;
}

function validateSheetName_(value) {
  const requested = cleanText_(value || DEFAULT_SHEET_NAME);
  const match = ALLOWED_SHEETS.find(function(name) {
    return name.toUpperCase() === requested.toUpperCase();
  });
  if (!match) throw new Error('Unsupported quiz sheet: ' + requested);
  return match;
}

function detectSchema_(headers) {
  if (SAT_HEADERS.every(function(header) { return headers.indexOf(header) !== -1; })) return 'SAT_25_COLUMN';
  if (LICENSE_HEADERS.every(function(header) { return headers.indexOf(header) !== -1; })) return 'LICENSE_8_COLUMN';
  return 'UNKNOWN';
}

function validateHeaders_(headers, schema) {
  const requiredHeaders = schema === 'SAT_25_COLUMN' ? SAT_HEADERS : LICENSE_HEADERS;
  const missing = requiredHeaders.filter(function(required) {
    return headers.indexOf(required) === -1;
  });

  if (missing.length > 0) {
    throw new Error(
      'Missing required headers: ' + missing.join(', ')
    );
  }
}

function normalizeHeader_(value) {
  return String(value === null || value === undefined ? '' : value)
    .replace(/^\uFEFF/, '')
    .trim()
    .toUpperCase();
}

function normalizeCellValue_(value) {
  if (value === null || value === undefined) {
    return '';
  }

  if (
    Object.prototype.toString.call(value) === '[object Date]' &&
    !isNaN(value.getTime())
  ) {
    return Utilities.formatDate(
      value,
      Session.getScriptTimeZone(),
      "yyyy-MM-dd'T'HH:mm:ss"
    );
  }

  return value;
}

function isBlankRow_(row) {
  return row.every(function(value) {
    return value === '' || value === null || value === undefined;
  });
}

function cleanText_(value) {
  return String(value === null || value === undefined ? '' : value).trim();
}

function parseJsonBody_(e) {
  if (
    !e ||
    !e.postData ||
    !e.postData.contents
  ) {
    return {};
  }

  try {
    return JSON.parse(e.postData.contents);
  } catch (error) {
    return {};
  }
}

function jsonResponse_(payload) {
  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Apps Script 편집기에서 직접 실행하는 테스트 함수
 */
function testAPI() {
  const data = getQuizData_({
    subject: '',
    status: ''
  });

  Logger.log('총 문제 수: ' + data.length);

  if (data.length > 0) {
    Logger.log(
      '첫 문제 키: ' +
      Object.keys(data[0]).join(', ')
    );

    Logger.log(
      '첫 문제: ' +
      JSON.stringify(data[0], null, 2)
    );
  }

  return 'Success: ' + data.length;
}

/**
 * 헤더 검사 전용
 */
function testHeaders() {
  const sheet = SpreadsheetApp
    .getActiveSpreadsheet()
    .getSheetByName(DEFAULT_SHEET_NAME);

  if (!sheet) {
    throw new Error('Sheet not found: ' + DEFAULT_SHEET_NAME);
  }

  const headers = sheet
    .getRange(1, 1, 1, sheet.getLastColumn())
    .getValues()[0]
    .map(normalizeHeader_);

  const schema = detectSchema_(headers);
  validateHeaders_(headers, schema);

  Logger.log('헤더 정상: ' + headers.join(', '));
  return 'Headers OK';
}
