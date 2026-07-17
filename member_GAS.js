// ======================================================================
// GAS: 전체 코드 (payment_status 처리 포함)
// ======================================================================

// BLOCK 2000: Login/Auth request router
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const action = data.action || 'login';
    
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName('member');
    const subjectsSheet = ss.getSheetByName('subjects');
    if (!sheet) {
      return createResponse(false, 'Sheet not found');
    }
    
    const rows = sheet.getDataRange().getValues();
    if (rows.length < 2) {
      return createResponse(false, 'No data found');
    }
    
    const headers = rows[0].map(h => String(h || '').trim().toLowerCase());
    const emailCol = headers.indexOf('email');
    const pinCol = headers.indexOf('pin');
    const nameCol = headers.indexOf('name');
    const pnCol = headers.indexOf('pn');
    const statusCol = headers.indexOf('payment_status');
    const accessSubjectsCol = headers.indexOf('access_subjects');
    const accountTypeCol = headers.indexOf('account_type');
    
    if (emailCol === -1 || pinCol === -1 || nameCol === -1 || pnCol === -1 || statusCol === -1) {
      return createResponse(false, 'Required columns (email, pin, name, pn, payment_status) not found. Headers: ' + headers.join(', '));
    }
    
    let response;
    
    switch(action) {
      case 'login':
        const subjectRows = subjectsSheet ? subjectsSheet.getDataRange().getValues() : [];
        response = handleLogin(rows, emailCol, pinCol, statusCol, nameCol, accessSubjectsCol, accountTypeCol, subjectRows, data);
        break;
      case 'signup':
        response = handleSignup(sheet, rows, emailCol, pinCol, nameCol, pnCol, statusCol, accessSubjectsCol, accountTypeCol, data);
        break;
      case 'changePin':
        response = handleChangePin(sheet, rows, emailCol, pinCol, statusCol, data);
        break;
      case 'changePassword':
        response = handleChangePassword(sheet, rows, emailCol, pinCol, statusCol, data);
        break;
      default:
        response = createResponse(false, 'Unknown action: ' + action);
    }
    
    return ContentService
      .createTextOutput(JSON.stringify(response))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch(e) {
    return createResponse(false, 'Server error: ' + e.message);
  }
}

function createResponse(success, message, extraData = {}) {
  return { success, message, ...extraData };
}

function findUserByEmail(rows, emailCol, email) {
  const normalizedEmail = String(email || '').trim().toLowerCase();
  for (let i = 1; i < rows.length; i++) {
    const rowEmail = String(rows[i][emailCol] || '').trim().toLowerCase();
    if (rowEmail === normalizedEmail) {
      return { index: i, row: rows[i] };
    }
  }
  return null;
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || '').trim());
}

function isValidPhone(pn) {
  return /^[0-9]{10,11}$/.test(String(pn || '').trim());
}

function logDebug(action, data) {
  const logData = { action, email: data.email || '' };
  Logger.log(JSON.stringify(logData));
}

function handleLogin(rows, emailCol, pinCol, statusCol, nameCol, accessSubjectsCol, accountTypeCol, subjectRows, data) {
  const email = String(data.email || '').trim();
  const pin = String(data.pin || '').trim();

  if (!isValidEmail(email)) {
    return createResponse(false, 'Invalid email format.');
  }

  const found = findUserByEmail(rows, emailCol, email);
  if (!found) {
    return createResponse(false, 'Email or PIN incorrect.');
  }

  const row = found.row;
  const rowPin = String(row[pinCol] || '').trim();
  if (rowPin !== pin) {
    return createResponse(false, 'Email or PIN incorrect.');
  }

  const status = String(row[statusCol] || '').trim().toLowerCase();
  const accountType = accountTypeCol >= 0
    ? String(row[accountTypeCol] || 'personal').trim().toLowerCase()
    : 'personal';
  const isAdmin = accountType === 'admin';

  // 관리자: 모든 활성 과목 사용 + index.html에서 복사 제한 해제
  if (isAdmin) {
    const subjects = buildAllActiveSubjects_(subjectRows, false);
    return createResponse(true, 'Administrator login successful', {
      status: 'active',
      user: {
        name: row[nameCol] || '',
        email: email,
        account_type: 'admin',
        payment_status: status,
        is_sample: false,
        access_level: 'admin'
      },
      subjects: subjects
    });
  }

  // 정회원: 구매한 과목 전체 이용
  if (status === 'a') {
    const subjects = buildAllowedSubjects_(row[accessSubjectsCol], subjectRows);
    return createResponse(true, 'Login successful', {
      status: 'active',
      user: {
        name: row[nameCol] || '',
        email: email,
        account_type: accountType || 'personal',
        payment_status: 'a',
        is_sample: false,
        access_level: 'full'
      },
      subjects: subjects
    });
  }

  // FREE TRIAL: 로그인 허용 + 모든 활성 과목의 첫 20문제 이용
  if (status === 'p') {
    const sampleSubjects = buildAllActiveSubjects_(subjectRows, true);
    return createResponse(true, 'FREE TRIAL is ready. Choose any subject and use questions 1-20. Upgrade for Full Access.', {
      status: 'trial',
      user: {
        name: row[nameCol] || '',
        email: email,
        account_type: accountType || 'personal',
        payment_status: 'p',
        is_sample: true,
        access_level: 'trial'
      },
      subjects: sampleSubjects
    });
  }

  if (status === 'e') {
    return createResponse(false, 'Your subscription has expired. Please renew.', { status: 'expired' });
  }
  if (status === 'n') {
    return createResponse(false, 'No active subscription. Please purchase a plan.', { status: 'none' });
  }
  return createResponse(false, 'Account status unknown. Contact support.', { status: 'unknown' });
}

function handleSignup(sheet, rows, emailCol, pinCol, nameCol, pnCol, statusCol, accessSubjectsCol, accountTypeCol, data) {
  const email = String(data.email || '').trim();
  const pin = String(data.pin || '').trim();
  const name = String(data.name || '').trim();
  const pn = String(data.pn || '').trim();
  
  if (!isValidEmail(email)) {
    return createResponse(false, 'Invalid email format.');
  }
  if (pin.length < 4) {
    return createResponse(false, 'PIN must be at least 4 characters.');
  }
  if (name === '') {
    return createResponse(false, 'Name is required.');
  }
  if (!isValidPhone(pn)) {
    return createResponse(false, 'Valid phone number is required (10-11 digits).');
  }
  
  const existing = findUserByEmail(rows, emailCol, email);
  if (existing) {
    return createResponse(false, 'Email already registered.');
  }
  
  let maxId = 0;
  for (let i = 1; i < rows.length; i++) {
    const id = parseInt(rows[i][0]) || 0;
    if (id > maxId) maxId = id;
  }
  
  const headerCount = rows[0].length;
  const newRow = new Array(headerCount).fill('');
  newRow[0] = maxId + 1;
  newRow[emailCol] = email;
  newRow[pinCol] = pin;
  newRow[nameCol] = name;
  newRow[pnCol] = pn;
  // Internally p means payment pending. The same account receives FREE TRIAL access.
  newRow[statusCol] = 'p';
  if (accessSubjectsCol >= 0) newRow[accessSubjectsCol] = '';
  if (accountTypeCol >= 0) newRow[accountTypeCol] = 'personal';
  
  sheet.appendRow(newRow);
  return createResponse(true, 'Signup complete. FREE TRIAL includes questions 1-20 in every active subject. Upgrade for Full Access.');
}

function handleChangePin(sheet, rows, emailCol, pinCol, statusCol, data) {
  logDebug('changePin', data);
  
  const email = String(data.email || '').trim();
  const oldPin = String(data.oldPin || '').trim();
  const newPin = String(data.newPin || '').trim();
  
  if (!isValidEmail(email)) {
    return createResponse(false, 'Invalid email format.');
  }
  if (newPin.length < 4) {
    return createResponse(false, 'New PIN must be at least 4 characters.');
  }
  
  const user = findUserByEmail(rows, emailCol, email);
  if (!user) {
    return createResponse(false, 'User not found.');
  }
  
  const row = user.row;
  const currentPin = String(row[pinCol] || '').trim();
  if (currentPin !== oldPin) {
    return createResponse(false, 'Current PIN incorrect.');
  }
  
  const status = String(row[statusCol] || '').trim().toLowerCase();
  if (status !== 'a' && status !== 'p') {
    return createResponse(false, 'Password changes are unavailable for this account status.');
  }
  
  sheet.getRange(user.index + 1, pinCol + 1).setValue(newPin);
  return createResponse(true, 'PIN changed successfully.');
}

function handleChangePassword(sheet, rows, emailCol, pinCol, statusCol, data) {
  logDebug('changePassword', data);
  
  const email = String(data.email || '').trim();
  const oldPassword = String(data.oldPassword || '').trim();
  const newPassword = String(data.newPassword || '').trim();
  
  if (!isValidEmail(email)) {
    return createResponse(false, 'Invalid email format.');
  }
  if (newPassword.length < 4) {
    return createResponse(false, 'New password must be at least 4 characters.');
  }
  
  const user = findUserByEmail(rows, emailCol, email);
  if (!user) {
    return createResponse(false, 'User not found.');
  }
  
  const row = user.row;
  const currentPin = String(row[pinCol] || '').trim();
  if (currentPin !== oldPassword) {
    return createResponse(false, 'Current password incorrect.');
  }
  
  const status = String(row[statusCol] || '').trim().toLowerCase();
  if (status !== 'a' && status !== 'p') {
    return createResponse(false, 'Password changes are unavailable for this account status.');
  }
  
  sheet.getRange(user.index + 1, pinCol + 1).setValue(newPassword);
  return createResponse(true, 'Password changed successfully.');
}

function doGet() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName('member');
    
    if (!sheet) {
      return ContentService.createTextOutput('ERROR: "member" sheet not found!');
    }
    
    const data = sheet.getDataRange().getValues();
    const rowCount = data.length;
    const headers = data[0] || [];
    
    let result = '✅ Sheet found!\n';
    result += '📊 Total rows: ' + rowCount + '\n';
    result += '📋 Headers: ' + headers.join(', ') + '\n\n';
    result += '📝 First 3 rows:\n';
    
    for (let i = 0; i < Math.min(rowCount, 4); i++) {
      result += 'Row ' + i + ': ' + data[i].join(' | ') + '\n';
    }
    
    return ContentService.createTextOutput(result);
    
  } catch(e) {
    return ContentService.createTextOutput('ERROR: ' + e.message);
  }
}

// BLOCK 3000: Subject permissions (CSV only; no JSON in the sheet)
function buildAllActiveSubjects_(rows, sampleMode) {
  if (!rows || rows.length < 2) return [];
  const headers = rows[0].map(function(value) {
    return String(value || '').trim().toUpperCase();
  });
  const result = [];

  for (let r = 1; r < rows.length; r++) {
    const item = {};
    headers.forEach(function(header, index) {
      if (header) item[header] = rows[r][index];
    });

    const code = String(item.CODE || '').trim().toUpperCase();
    const active = String(item.ACTIVE || '').trim().toUpperCase();
    if (!code || ['TRUE', 'Y', 'YES', '1', 'ACTIVE', 'A'].indexOf(active) === -1) continue;

    const fullCount = Math.max(0, parseInt(item.QUESTION_COUNT, 10) || 0);
    result.push({
      CODE: code,
      NAME: String(item.NAME || code),
      CATEGORY: String(item.CATEGORY || ''),
      SHEET: String(item.SHEET || '').trim(),
      SET_SIZE: sampleMode ? 20 : Math.max(1, parseInt(item.SET_SIZE, 10) || 120),
      FORMAT: String(item.FORMAT || ''),
      ACTIVE: item.ACTIVE,
      VERSION: String(item.VERSION || ''),
      QUESTION_COUNT: sampleMode ? Math.min(20, fullCount || 20) : fullCount,
      SAMPLE: Boolean(sampleMode),
      TRIAL: Boolean(sampleMode),
      SAMPLE_LIMIT: sampleMode ? 20 : 0
    });
  }
  return result;
}

function buildAllowedSubjects_(accessValue, rows) {
  if (!rows || rows.length < 2) return [];
  let rawAccess = accessValue;
  if (typeof rawAccess === 'string' && rawAccess.trim().charAt(0) === '[') {
    try { rawAccess = JSON.parse(rawAccess); } catch (error) { rawAccess = accessValue; }
  }
  const allowed = (Array.isArray(rawAccess) ? rawAccess : String(rawAccess || '').split(','))
    .map(function(code) { return code.trim().toUpperCase(); })
    .filter(function(code, index, list) { return code && list.indexOf(code) === index; });
  const headers = rows[0].map(function(value) { return String(value || '').trim().toUpperCase(); });
  const result = [];
  for (let r = 1; r < rows.length; r++) {
    const item = {};
    headers.forEach(function(header, index) { if (header) item[header] = rows[r][index]; });
    const code = String(item.CODE || '').trim().toUpperCase();
    const active = String(item.ACTIVE || '').trim().toUpperCase();
    if (allowed.indexOf(code) === -1 || ['TRUE', 'Y', 'YES', '1', 'ACTIVE', 'A'].indexOf(active) === -1) continue;
    result.push({
      CODE: code,
      NAME: String(item.NAME || code),
      CATEGORY: String(item.CATEGORY || ''),
      SHEET: String(item.SHEET || '').trim(),
      SET_SIZE: Math.max(1, parseInt(item.SET_SIZE, 10) || 120),
      FORMAT: String(item.FORMAT || ''),
      ACTIVE: item.ACTIVE,
      VERSION: String(item.VERSION || ''),
      QUESTION_COUNT: Math.max(0, parseInt(item.QUESTION_COUNT, 10) || 0)
    });
  }
  return result;
}
