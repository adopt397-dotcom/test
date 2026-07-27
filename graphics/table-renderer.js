// GongBoo Table Engine v1 — structured cells only, never arbitrary HTML or images.
const MAX_COLUMNS = 20;
const MAX_ROWS = 200;

const scalar = value => value === null || ['string', 'number', 'boolean'].includes(typeof value);
const text = value => value === null || value === undefined || value === '' ? '—' : String(value);
const escapeHtml = value => text(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');

function normalizeColumn(column, index) {
  if (typeof column === 'string' || typeof column === 'number') return { label: String(column), align: 'center' };
  if (column && typeof column === 'object') return {
    label: text(column.label ?? column.name ?? `Column ${index + 1}`),
    align: ['left', 'center', 'right'].includes(column.align) ? column.align : 'center'
  };
  return { label: `Column ${index + 1}`, align: 'center' };
}

export function validateTablePayload(payload) {
  const errors = [], warnings = [];
  if (!payload || typeof payload !== 'object') return { valid:false, errors:[{ code:'TABLE_PAYLOAD_REQUIRED', path:'', message:'A table JSON object is required.' }], warnings };
  if (String(payload.engine || '').toLowerCase() !== 'table') errors.push({ code:'TABLE_ENGINE_REQUIRED', path:'engine', message:'engine must be "table".' });
  if (!Array.isArray(payload.columns) || payload.columns.length === 0) errors.push({ code:'TABLE_COLUMNS_REQUIRED', path:'columns', message:'columns must be a non-empty array.' });
  else if (payload.columns.length > MAX_COLUMNS) errors.push({ code:'TABLE_COLUMNS_LIMIT', path:'columns', message:`A table can contain at most ${MAX_COLUMNS} columns.` });
  if (!Array.isArray(payload.rows)) errors.push({ code:'TABLE_ROWS_REQUIRED', path:'rows', message:'rows must be an array.' });
  else if (payload.rows.length > MAX_ROWS) errors.push({ code:'TABLE_ROWS_LIMIT', path:'rows', message:`A table can contain at most ${MAX_ROWS} rows.` });
  else if (Array.isArray(payload.columns)) payload.rows.forEach((row, rowIndex) => {
    if (!Array.isArray(row)) { errors.push({ code:'TABLE_ROW_ARRAY_REQUIRED', path:`rows[${rowIndex}]`, message:'Each row must be an array.' }); return; }
    if (row.length !== payload.columns.length) errors.push({ code:'TABLE_ROW_LENGTH_INVALID', path:`rows[${rowIndex}]`, message:`This row must contain ${payload.columns.length} cells.` });
    row.forEach((cell, cellIndex) => { if (!scalar(cell)) errors.push({ code:'TABLE_CELL_INVALID', path:`rows[${rowIndex}][${cellIndex}]`, message:'Each cell must be text, a number, true/false, or null.' }); });
  });
  if (payload.title !== undefined && !scalar(payload.title)) warnings.push({ code:'TABLE_TITLE_IGNORED', path:'title', message:'title must be text and will otherwise be ignored.' });
  if (payload.caption !== undefined && !scalar(payload.caption)) warnings.push({ code:'TABLE_CAPTION_IGNORED', path:'caption', message:'caption must be text and will otherwise be ignored.' });
  return { valid:errors.length === 0, errors, warnings };
}

export function mountTable(host, payload) {
  const validation = validateTablePayload(payload);
  if (!host || !validation.valid) return false;
  const columns = payload.columns.map(normalizeColumn);
  const options = payload.options && typeof payload.options === 'object' ? payload.options : {};
  const headers = columns.map(column => `<th style="text-align:${column.align}">${escapeHtml(column.label)}</th>`).join('');
  const rows = payload.rows.map(row => `<tr>${row.map((cell, i) => `<td style="text-align:${columns[i].align}">${escapeHtml(cell)}</td>`).join('')}</tr>`).join('');
  const title = scalar(payload.title) ? `<h3>${escapeHtml(payload.title)}</h3>` : '';
  const caption = scalar(payload.caption) ? `<figcaption>${escapeHtml(payload.caption)}</figcaption>` : '';
  const compact = options.compact === true ? 'compact' : '';
  const striped = options.striped === false ? '' : 'striped';
  host.innerHTML = `<style>.gongboo-table-wrap{margin:0;max-width:100%;color:#172033}.gongboo-table-wrap h3{margin:0 0 10px;font-size:17px}.gongboo-table-scroll{overflow-x:auto;border:1px solid #cbd5e1;border-radius:8px}.gongboo-table{width:100%;border-collapse:collapse;background:#fff;font:14px system-ui,sans-serif}.gongboo-table th{padding:10px 12px;background:#eaf1ff;border-bottom:2px solid #9bbaf7;font-weight:700;white-space:nowrap}.gongboo-table td{padding:9px 12px;border-top:1px solid #dbe3ee;white-space:nowrap}.gongboo-table.striped tbody tr:nth-child(even){background:#f8fafc}.gongboo-table-wrap.compact th,.gongboo-table-wrap.compact td{padding:6px 8px;font-size:13px}.gongboo-table-wrap figcaption{margin-top:8px;color:#475569;font:12px/1.45 system-ui,sans-serif}</style><figure class="gongboo-table-wrap ${compact}">${title}<div class="gongboo-table-scroll"><table class="gongboo-table ${striped}"><thead><tr>${headers}</tr></thead><tbody>${rows}</tbody></table></div>${caption}</figure>`;
  return true;
}

export function typesetTableMath(host) {
  if (!host || !window.MathJax || typeof window.MathJax.typesetPromise !== 'function') return Promise.resolve();
  return window.MathJax.typesetPromise([host]).catch(() => undefined);
}
