/* GongBoo Super Graphic Engine v1: isolated renderer for engine:"super" JSON. */
const DEFAULTS = { xRange: [-10, 10], yRange: [-10, 10], gridColor: '#d9d9d9', axisColor: '#111827', curveColor: '#2563eb', labelColor: '#111827' };
const ALLOWED_IDENTIFIERS = new Set(['x', 'y', 'pi', 'e', 'sqrt', 'abs', 'sin', 'cos', 'tan', 'asin', 'acos', 'atan', 'exp', 'log', 'log10', 'floor', 'ceil', 'min', 'max']);

function issue(code, path, message, detail) { return { code: code, path: path, message: message, detail: detail || '' }; }
function range(value, fallback) { return Array.isArray(value) && value.length === 2 && Number(value[0]) < Number(value[1]) ? [Number(value[0]), Number(value[1])] : fallback.slice(); }
function safeExpression(expression) {
  const value = String(expression || '').replace(/\s+/g, '');
  if (!value || /[^0-9a-zA-Z_+\-*/^().,]/.test(value)) return false;
  return (value.match(/[a-zA-Z_]+/g) || []).every(function(name) { return ALLOWED_IDENTIFIERS.has(name); });
}

export function validateSuperGraphic(payload) {
  const errors = [], warnings = [];
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return { valid: false, errors: [issue('SUPER_JSON_ROOT_INVALID', '', 'Graphic JSON must be an object.')], warnings: warnings };
  if (String(payload.engine || '').toLowerCase() !== 'super') errors.push(issue('SUPER_ENGINE_CONFIG_INVALID', 'engine', 'Expected engine:"super".'));
  if (!payload.schemaVersion) errors.push(issue('SUPER_SCHEMA_VERSION_REQUIRED', 'schemaVersion', 'schemaVersion is required.'));
  else if (String(payload.schemaVersion).split('.')[0] !== '1') errors.push(issue('SUPER_SCHEMA_VERSION_UNSUPPORTED', 'schemaVersion', 'Only Super JSON major version 1 is supported.'));
  if (!payload.type || typeof payload.type !== 'string') errors.push(issue('SUPER_JSON_FIELD_REQUIRED', 'type', 'type is required.'));
  if (!payload.data || typeof payload.data !== 'object' || Array.isArray(payload.data)) errors.push(issue('SUPER_JSON_FIELD_REQUIRED', 'data', 'data must be an object.'));
  if (errors.length) return { valid: false, errors: errors, warnings: warnings };

  const known = new Set(['scene', 'calculus.functionGraph', 'calculus.regionBetweenCurves', 'calculus.tangent', 'calculus.secant', 'calculus.piecewise']);
  if (!known.has(payload.type)) errors.push(issue('SUPER_PRIMITIVE_UNSUPPORTED', 'type', 'Unsupported Super graphic type: ' + payload.type));
  if (payload.type === 'scene' && !Array.isArray(payload.data.items)) errors.push(issue('SUPER_SCENE_ITEMS_REQUIRED', 'data.items', 'Scene data.items must be an array.'));
  if (payload.type === 'scene' && Array.isArray(payload.data.items)) validateScene(payload.data.items, errors, 'data.items');
  if (payload.type.indexOf('calculus.') === 0) validateCalculus(payload, errors);
  return { valid: errors.length === 0, errors: errors, warnings: warnings };
}

function validPoint(value) { return Array.isArray(value) && value.length === 2 && Number.isFinite(Number(value[0])) && Number.isFinite(Number(value[1])); }
function validateScene(items, errors, path) {
  const supported = new Set(['group','point','line','segment','ray','curve','region','circle','ellipse','rectangle','polygon','arc','vector','connector','text','mathLabel','symbol']);
  const ids = new Set();
  items.forEach(function(item, index) {
    const itemPath = path + '[' + index + ']';
    if (!item || typeof item !== 'object' || Array.isArray(item)) { errors.push(issue('SUPER_JSON_FIELD_TYPE_INVALID', itemPath, 'Each scene item must be an object.')); return; }
    if (!supported.has(item.type)) errors.push(issue('SUPER_PRIMITIVE_UNSUPPORTED', itemPath + '.type', 'Unsupported primitive type: ' + String(item.type || '')));
    if (item.id) { if (ids.has(item.id)) errors.push(issue('SUPER_ID_DUPLICATE', itemPath + '.id', 'Duplicate primitive id: ' + item.id)); ids.add(item.id); }
    if (item.type === 'group') { if (!Array.isArray(item.items)) errors.push(issue('SUPER_SCENE_ITEMS_REQUIRED', itemPath + '.items', 'A group requires an items array.')); else validateScene(item.items, errors, itemPath + '.items'); }
    if (item.type === 'point' && !validPoint(item.position)) errors.push(issue('SUPER_JSON_FIELD_TYPE_INVALID', itemPath + '.position', 'Point position must be [x, y].'));
    if (item.type === 'curve' && !item.pieces && (!item.expression || !safeExpression(item.expression))) errors.push(issue('SUPER_CURVE_EXPRESSION_INVALID', itemPath + '.expression', 'Curve expression is missing or invalid.'));
    if (item.type === 'curve' && Array.isArray(item.pieces)) item.pieces.forEach(function(piece, pieceIndex) { if (!piece.expression || !safeExpression(piece.expression)) errors.push(issue('SUPER_CURVE_EXPRESSION_INVALID', itemPath + '.pieces[' + pieceIndex + '].expression', 'Piece expression is missing or invalid.')); });
    if (item.type === 'region' && !item.boundary) errors.push(issue('SUPER_REGION_BOUNDARY_INVALID', itemPath + '.boundary', 'A region requires a boundary.'));
    if (item.type === 'mathLabel' && !item.latex) errors.push(issue('SUPER_JSON_FIELD_REQUIRED', itemPath + '.latex', 'MathLabel requires latex.'));
    if (item.type === 'text' && item.value === undefined) errors.push(issue('SUPER_JSON_FIELD_REQUIRED', itemPath + '.value', 'Text requires value.'));
  });
}

function validateCalculus(payload, errors) {
  const data = payload.data;
  const curves = Array.isArray(data.curves) ? data.curves : (data.curve ? [data.curve] : []);
  if (payload.type !== 'calculus.piecewise' && !curves.length) errors.push(issue('SUPER_CURVE_EXPRESSION_REQUIRED', 'data.curves', 'At least one curve is required.'));
  curves.forEach(function(curve, index) {
    const path = 'data.' + (Array.isArray(data.curves) ? 'curves[' + index + ']' : 'curve') + '.expression';
    if (!curve || typeof curve.expression !== 'string' || !curve.expression.trim()) errors.push(issue('SUPER_CURVE_EXPRESSION_REQUIRED', path, 'A curve expression is required.'));
    else if (!safeExpression(curve.expression)) errors.push(issue('SUPER_CURVE_EXPRESSION_INVALID', path, 'The expression uses unsupported syntax or identifiers.'));
  });
  if (payload.type === 'calculus.regionBetweenCurves' && (!data.region || !data.region.upper || !data.region.lower)) errors.push(issue('SUPER_REGION_BOUNDARY_INVALID', 'data.region', 'Region upper and lower curve ids are required.'));
  if (payload.type === 'calculus.regionBetweenCurves' && data.region && data.region.xRange && !Array.isArray(data.region.xRange)) errors.push(issue('SUPER_REGION_BOUNDARY_INVALID', 'data.region.xRange', 'v1 region xRange must be [min, max].'));
  if (payload.type === 'calculus.tangent' && !Number.isFinite(Number(data.atX))) errors.push(issue('SUPER_JSON_FIELD_REQUIRED', 'data.atX', 'A numeric atX is required for a tangent.'));
  if (payload.type === 'calculus.secant' && (!Array.isArray(data.xValues) || data.xValues.length !== 2 || Number(data.xValues[0]) === Number(data.xValues[1]))) errors.push(issue('SUPER_JSON_FIELD_REQUIRED', 'data.xValues', 'Two different xValues are required for a secant.'));
  if (payload.type === 'calculus.piecewise' && (!Array.isArray(data.pieces) || !data.pieces.length)) errors.push(issue('SUPER_CURVE_PIECES_CONFLICT', 'data.pieces', 'At least one piece is required.'));
  if (payload.type === 'calculus.piecewise' && Array.isArray(data.pieces)) data.pieces.forEach(function(piece, index) {
    if (!piece || !safeExpression(piece.expression)) errors.push(issue('SUPER_CURVE_EXPRESSION_INVALID', 'data.pieces[' + index + '].expression', 'Piece expression is missing or invalid.'));
    if (piece && piece.domain && !Array.isArray(piece.domain)) errors.push(issue('SUPER_CURVE_DOMAIN_INVALID', 'data.pieces[' + index + '].domain', 'v1 piece domain must be [min, max].'));
  });
}

function compile(expression) {
  if (!safeExpression(expression)) throw new Error('Invalid expression.');
  if (!window.math || typeof window.math.compile !== 'function') throw new Error('Math engine is unavailable.');
  const compiled = window.math.compile(expression);
  return function(x, y) { return Number(compiled.evaluate({ x: x, y: y, pi: Math.PI, e: Math.E })); };
}

function toScene(payload) {
  if (payload.type === 'scene') return payload.data;
  const data = payload.data, scene = { coordinateSystem: data.coordinateSystem || {}, items: [] };
  if (payload.type === 'calculus.piecewise') scene.items.push({ id: 'piecewise', type: 'curve', pieces: data.pieces, style: data.style || {} });
  else (Array.isArray(data.curves) ? data.curves : [data.curve]).forEach(function(curve, index) { scene.items.push(Object.assign({ id: curve.id || ('curve' + index), type: 'curve' }, curve)); });
  if (payload.type === 'calculus.regionBetweenCurves') scene.items.push({ type: 'region', boundary: { betweenCurves: data.region }, style: (data.region && data.region.style) || {} });
  if (payload.type === 'calculus.tangent') scene.items.push({ type: 'tangent', curve: scene.items[0].id, atX: Number(data.atX), options: data.tangent || {} });
  if (payload.type === 'calculus.secant') scene.items.push({ type: 'secant', curve: scene.items[0].id, xValues: data.xValues.map(Number), options: data.secant || {} });
  return scene;
}

function styles() {
  if (document.getElementById('super-graphic-engine-style')) return;
  const tag = document.createElement('style'); tag.id = 'super-graphic-engine-style';
  tag.textContent = '.super-graphic-host{margin:15px 0}.super-graphic-canvas-wrap{position:relative;width:100%;min-height:300px;border:1px solid #dbe3ee;border-radius:10px;background:#fff;overflow:hidden}.super-graphic-canvas{display:block;width:100%;min-height:300px}.super-graphic-label-layer{position:absolute;inset:0;pointer-events:none}.super-graphic-label{position:absolute;transform:translate(-50%,-50%);white-space:nowrap;color:#111827}.super-graphic-error{margin:12px 0;padding:12px 14px;border:1px solid #f1a5a5;border-radius:8px;background:#fff1f1;color:#8a1c1c;font:14px/1.45 system-ui,sans-serif}.super-graphic-error ul{margin:8px 0 0 18px;padding:0}.super-graphic-loading{padding:14px;border-radius:8px;background:#f8fafc;color:#475569;font:14px system-ui,sans-serif}';
  document.head.appendChild(tag);
}

function transform(coord, width, height) {
  const padding = 44, xRange = range(coord.xRange, DEFAULTS.xRange), yRange = range(coord.yRange, DEFAULTS.yRange), innerW = Math.max(20, width - padding * 2), innerH = Math.max(20, height - padding * 2);
  let sx = innerW / (xRange[1] - xRange[0]), sy = innerH / (yRange[1] - yRange[0]);
  if (coord.scaleMode === 'equal') { const s = Math.min(sx, sy); sx = s; sy = s; }
  const contentW = sx * (xRange[1] - xRange[0]), contentH = sy * (yRange[1] - yRange[0]), offsetX = padding + (innerW - contentW) / 2, offsetY = padding + (innerH - contentH) / 2;
  return { xRange: xRange, yRange: yRange, width: width, height: height, padding: padding, toPx: function(point) { return [offsetX + (point[0] - xRange[0]) * sx, offsetY + contentH - (point[1] - yRange[0]) * sy]; } };
}
function step(span) { const raw = span / 9, power = Math.pow(10, Math.floor(Math.log10(Math.max(raw, .0001)))), n = raw / power; return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10) * power; }
function number(value) { return String(Math.abs(value) < 1e-9 ? 0 : Number(value.toFixed(6))); }
function lineStyle(ctx, style, fallback) { const s = style || {}; ctx.strokeStyle = s.stroke || fallback || DEFAULTS.curveColor; ctx.lineWidth = Number(s.strokeWidth) > 0 ? Number(s.strokeWidth) : 2; ctx.globalAlpha = Number.isFinite(Number(s.opacity)) ? Number(s.opacity) : 1; ctx.setLineDash(s.lineStyle === 'dashed' ? [8, 5] : s.lineStyle === 'dotted' ? [2, 4] : []); }

function drawCoordinates(ctx, t, coord) {
  const sx = Number(coord.xStep) > 0 ? Number(coord.xStep) : step(t.xRange[1] - t.xRange[0]), sy = Number(coord.yStep) > 0 ? Number(coord.yStep) : step(t.yRange[1] - t.yRange[0]);
  ctx.save(); ctx.strokeStyle = (coord.style && coord.style.gridColor) || DEFAULTS.gridColor; ctx.lineWidth = 1;
  for (let x = Math.ceil(t.xRange[0] / sx) * sx; x <= t.xRange[1] + sx * .001; x += sx) { const px = t.toPx([x, 0])[0]; ctx.beginPath(); ctx.moveTo(px, t.padding); ctx.lineTo(px, t.height - t.padding); ctx.stroke(); }
  for (let y = Math.ceil(t.yRange[0] / sy) * sy; y <= t.yRange[1] + sy * .001; y += sy) { const py = t.toPx([0, y])[1]; ctx.beginPath(); ctx.moveTo(t.padding, py); ctx.lineTo(t.width - t.padding, py); ctx.stroke(); }
  if (coord.axes !== false) { ctx.strokeStyle = (coord.style && coord.style.axisColor) || DEFAULTS.axisColor; ctx.lineWidth = 1.5; if (0 >= t.xRange[0] && 0 <= t.xRange[1]) { const px = t.toPx([0, 0])[0]; ctx.beginPath(); ctx.moveTo(px, t.padding); ctx.lineTo(px, t.height - t.padding); ctx.stroke(); } if (0 >= t.yRange[0] && 0 <= t.yRange[1]) { const py = t.toPx([0, 0])[1]; ctx.beginPath(); ctx.moveTo(t.padding, py); ctx.lineTo(t.width - t.padding, py); ctx.stroke(); } }
  if (coord.labels !== false) { ctx.fillStyle = (coord.style && coord.style.labelColor) || DEFAULTS.labelColor; ctx.font = '12px system-ui,sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'top'; for (let x = Math.ceil(t.xRange[0] / sx) * sx; x <= t.xRange[1] + sx * .001; x += sx) { if (Math.abs(x) < 1e-9) continue; const p = t.toPx([x, 0]); ctx.fillText(number(x), p[0], Math.min(t.height - t.padding + 5, p[1] + 5)); } ctx.textAlign = 'right'; ctx.textBaseline = 'middle'; for (let y = Math.ceil(t.yRange[0] / sy) * sy; y <= t.yRange[1] + sy * .001; y += sy) { if (Math.abs(y) < 1e-9) continue; const p = t.toPx([0, y]); ctx.fillText(number(y), Math.max(t.padding - 7, p[0] - 7), p[1]); } }
  ctx.restore();
}

function drawCurve(ctx, t, item, curves) {
  const parts = item.pieces ? item.pieces : [item], compiled = [];
  parts.forEach(function(part) { if (part.expression) compiled.push({ fn: compile(part.expression), domain: range(part.domain, t.xRange), style: Object.assign({}, item.style || {}, part.style || {}) }); });
  curves[item.id] = compiled;
  compiled.forEach(function(part) { lineStyle(ctx, part.style, DEFAULTS.curveColor); const samples = Math.min(900, Math.max(160, Math.round((part.domain[1] - part.domain[0]) * 50))); let open = false, previous = null; ctx.beginPath(); for (let i = 0; i <= samples; i++) { const x = part.domain[0] + (part.domain[1] - part.domain[0]) * i / samples; let y; try { y = part.fn(x); } catch (_) { y = NaN; } if (!Number.isFinite(y) || Math.abs(y) > 1e7) { open = false; previous = null; continue; } const p = t.toPx([x, y]), jump = previous && Math.abs(p[1] - previous[1]) > t.height * .65; if (!open || jump) { ctx.moveTo(p[0], p[1]); open = true; } else ctx.lineTo(p[0], p[1]); previous = p; } ctx.stroke(); }); ctx.setLineDash([]); ctx.globalAlpha = 1;
}
function curveValue(parts, x) { for (let i = 0; i < parts.length; i++) if (x >= parts[i].domain[0] - 1e-9 && x <= parts[i].domain[1] + 1e-9) return parts[i].fn(x); return NaN; }
function drawRegion(ctx, t, item, curves) {
  const data = item.boundary && item.boundary.betweenCurves; if (!data) return; const upper = curves[data.upper], lower = curves[data.lower]; if (!upper || !lower) throw new Error('Region references an unknown curve.'); const xRange = range(data.xRange, t.xRange), top = [], bottom = [];
  for (let i = 0; i <= 360; i++) { const x = xRange[0] + (xRange[1] - xRange[0]) * i / 360, a = curveValue(upper, x), b = curveValue(lower, x); if (Number.isFinite(a) && Number.isFinite(b)) { top.push(t.toPx([x, a])); bottom.push(t.toPx([x, b])); } }
  if (top.length < 2) throw new Error('Region could not be closed.'); const style = item.style || {}; ctx.save(); ctx.globalAlpha = Number.isFinite(Number(style.opacity)) ? Number(style.opacity) : 1; ctx.fillStyle = style.fill || 'rgba(37,99,235,0.18)'; ctx.beginPath(); ctx.moveTo(top[0][0], top[0][1]); top.slice(1).forEach(function(p) { ctx.lineTo(p[0], p[1]); }); bottom.reverse().forEach(function(p) { ctx.lineTo(p[0], p[1]); }); ctx.closePath(); ctx.fill(); ctx.restore();
}
function drawPoint(ctx, t, point, style) { const p = t.toPx(point), s = style || {}; ctx.save(); ctx.fillStyle = s.fill || '#111827'; ctx.strokeStyle = s.stroke || '#111827'; ctx.lineWidth = Number(s.strokeWidth) || 1.5; ctx.beginPath(); ctx.arc(p[0], p[1], Number(s.radius) || 4, 0, Math.PI * 2); if (s.marker === 'open') { ctx.fillStyle = '#fff'; ctx.fill(); ctx.stroke(); } else ctx.fill(); ctx.restore(); }
function drawLine(ctx, t, point, slope, style) { lineStyle(ctx, style, '#dc2626'); const x1 = t.xRange[0], x2 = t.xRange[1], p1 = t.toPx([x1, point[1] + slope * (x1 - point[0])]), p2 = t.toPx([x2, point[1] + slope * (x2 - point[0])]); ctx.beginPath(); ctx.moveTo(p1[0], p1[1]); ctx.lineTo(p2[0], p2[1]); ctx.stroke(); ctx.setLineDash([]); ctx.globalAlpha = 1; }
function drawCalculatedLine(ctx, t, item, curves) {
  const parts = curves[item.curve]; if (!parts) throw new Error('Calculated line references an unknown curve.');
  if (item.type === 'tangent') { const x = item.atX, y = curveValue(parts, x), h = Math.max(1e-5, (t.xRange[1] - t.xRange[0]) / 100000), slope = (curveValue(parts, x + h) - curveValue(parts, x - h)) / (2 * h); if (!Number.isFinite(y) || !Number.isFinite(slope)) throw new Error('Tangent cannot be calculated.'); drawLine(ctx, t, [x, y], slope, item.options && item.options.style); if (!item.options || item.options.showPoint !== false) drawPoint(ctx, t, [x, y], {}); return; }
  const x1 = item.xValues[0], x2 = item.xValues[1], y1 = curveValue(parts, x1), y2 = curveValue(parts, x2); if (![y1, y2].every(Number.isFinite)) throw new Error('Secant endpoints cannot be calculated.'); const style = item.options && item.options.style;
  if (item.options && item.options.mode === 'segment') { lineStyle(ctx, style, '#d97706'); const p1 = t.toPx([x1, y1]), p2 = t.toPx([x2, y2]); ctx.beginPath(); ctx.moveTo(p1[0], p1[1]); ctx.lineTo(p2[0], p2[1]); ctx.stroke(); ctx.setLineDash([]); ctx.globalAlpha = 1; } else drawLine(ctx, t, [x1, y1], (y2 - y1) / (x2 - x1), style);
  if (!item.options || item.options.showPoints !== false) { drawPoint(ctx, t, [x1, y1], {}); drawPoint(ctx, t, [x2, y2], {}); }
}
function appendLabel(layer, point, value, math) { const el = document.createElement('div'); el.className = 'super-graphic-label'; el.style.left = point[0] + 'px'; el.style.top = point[1] + 'px'; el.style.fontSize = '14px'; if (math && window.MathJax && window.MathJax.tex2chtml) { try { el.appendChild(window.MathJax.tex2chtml(value, { display: false })); } catch (_) { el.textContent = value; } } else el.textContent = value; layer.appendChild(el); }
function drawScene(canvas, labels, scene) {
  const rect = canvas.parentElement.getBoundingClientRect(), width = Math.max(320, Math.round(rect.width || 720)), height = Math.max(300, Math.round(width * .62)), ratio = Math.min(window.devicePixelRatio || 1, 2); canvas.width = width * ratio; canvas.height = height * ratio; canvas.style.height = height + 'px'; const ctx = canvas.getContext('2d'); ctx.setTransform(ratio, 0, 0, ratio, 0, 0); ctx.clearRect(0, 0, width, height); const coord = scene.coordinateSystem || {}, t = transform(coord, width, height); drawCoordinates(ctx, t, coord);
  const items = Array.isArray(scene.items) ? scene.items : [], curves = {}; items.filter(function(x) { return x && x.type === 'curve'; }).forEach(function(x) { drawCurve(ctx, t, x, curves); }); items.filter(function(x) { return x && x.type === 'region'; }).forEach(function(x) { drawRegion(ctx, t, x, curves); }); items.filter(function(x) { return x && x.type === 'curve'; }).forEach(function(x) { drawCurve(ctx, t, x, curves); }); items.filter(function(x) { return x && (x.type === 'tangent' || x.type === 'secant'); }).forEach(function(x) { drawCalculatedLine(ctx, t, x, curves); }); items.filter(function(x) { return x && x.type === 'point' && Array.isArray(x.position); }).forEach(function(x) { drawPoint(ctx, t, x.position, x.style || {}); }); labels.innerHTML = '';
  items.forEach(function(item) { if (!item) return; const label = item.label && typeof item.label === 'object' ? item.label : null; if (label && label.latex && Number.isFinite(Number(label.atX)) && item.type === 'curve') { const parts = curves[item.id], y = parts ? curveValue(parts, Number(label.atX)) : NaN; if (Number.isFinite(y)) appendLabel(labels, t.toPx([Number(label.atX), y]), label.latex, true); } if (item.type === 'mathLabel' && item.latex && Array.isArray(item.position)) appendLabel(labels, t.toPx(item.position), item.latex, true); if (item.type === 'text' && item.value && Array.isArray(item.position)) appendLabel(labels, t.toPx(item.position), item.value, false); });
}

// v1 primitive scene renderer.  The original Calculus-only renderer above is
// retained as a compact reference; this function is the canonical v1 path.
function offsetPoint(value, offset) {
  return Array.isArray(value) && value.length === 2 ? [Number(value[0]) + offset[0], Number(value[1]) + offset[1]] : value;
}
function flattenItems(items, offset) {
  const result = [], base = offset || [0, 0];
  (items || []).forEach(function(item) {
    if (!item) return;
    if (item.type === 'group') {
      const next = Array.isArray(item.offset) ? [base[0] + Number(item.offset[0] || 0), base[1] + Number(item.offset[1] || 0)] : base;
      flattenItems(item.items, next).forEach(function(child) { result.push(child); });
      return;
    }
    const clone = Object.assign({}, item);
    ['position', 'from', 'to', 'center', 'through'].forEach(function(key) { if (Array.isArray(clone[key])) clone[key] = offsetPoint(clone[key], base); });
    if (Array.isArray(clone.points)) clone.points = clone.points.map(function(point) { return offsetPoint(point, base); });
    result.push(clone);
  });
  return result;
}
function resolvePoint(value, points) {
  if (Array.isArray(value)) return value;
  return points[value] || null;
}
function drawArrow(ctx, from, to, size) {
  const angle = Math.atan2(to[1] - from[1], to[0] - from[0]), s = size || 8;
  ctx.beginPath(); ctx.moveTo(to[0], to[1]); ctx.lineTo(to[0] - s * Math.cos(angle - Math.PI / 6), to[1] - s * Math.sin(angle - Math.PI / 6)); ctx.lineTo(to[0] - s * Math.cos(angle + Math.PI / 6), to[1] - s * Math.sin(angle + Math.PI / 6)); ctx.closePath(); ctx.fill();
}
function drawSegment(ctx, t, from, to, style, arrow) {
  const a = t.toPx(from), b = t.toPx(to); lineStyle(ctx, style, '#334155'); ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke(); ctx.fillStyle = (style && style.stroke) || '#334155';
  if (arrow === 'end' || arrow === 'both') drawArrow(ctx, a, b, style && style.arrowSize);
  if (arrow === 'start' || arrow === 'both') drawArrow(ctx, b, a, style && style.arrowSize);
  ctx.setLineDash([]); ctx.globalAlpha = 1;
}
function drawShape(ctx, t, item, points) {
  const style = item.style || {}; lineStyle(ctx, style, '#111827'); ctx.fillStyle = style.fill || 'transparent';
  if (item.type === 'circle') {
    const center = resolvePoint(item.center, points); if (!center || !(Number(item.radius) > 0)) return;
    const p = t.toPx(center), edge = t.toPx([center[0] + Number(item.radius), center[1]]); ctx.beginPath(); ctx.arc(p[0], p[1], Math.abs(edge[0] - p[0]), 0, Math.PI * 2); if (style.fill && style.fill !== 'transparent') ctx.fill(); ctx.stroke();
  } else if (item.type === 'ellipse') {
    const center = resolvePoint(item.center, points); if (!center || !(Number(item.rx) > 0) || !(Number(item.ry) > 0)) return;
    const p = t.toPx(center), px = t.toPx([center[0] + Number(item.rx), center[1]]), py = t.toPx([center[0], center[1] + Number(item.ry)]); ctx.beginPath(); ctx.ellipse(p[0], p[1], Math.abs(px[0] - p[0]), Math.abs(py[1] - p[1]), -Number(item.rotation || 0) * Math.PI / 180, 0, Math.PI * 2); if (style.fill && style.fill !== 'transparent') ctx.fill(); ctx.stroke();
  } else if (item.type === 'rectangle') {
    const from = resolvePoint(item.from, points), to = resolvePoint(item.to, points); if (!from || !to) return; const a = t.toPx(from), b = t.toPx(to); ctx.beginPath(); ctx.rect(a[0], a[1], b[0] - a[0], b[1] - a[1]); if (style.fill && style.fill !== 'transparent') ctx.fill(); ctx.stroke();
  } else if (item.type === 'polygon') {
    const vertices = (item.points || []).map(function(point) { return resolvePoint(point, points); }).filter(Boolean); if (vertices.length < 3) return; const first = t.toPx(vertices[0]); ctx.beginPath(); ctx.moveTo(first[0], first[1]); vertices.slice(1).forEach(function(point) { const p = t.toPx(point); ctx.lineTo(p[0], p[1]); }); ctx.closePath(); if (style.fill && style.fill !== 'transparent') ctx.fill(); ctx.stroke();
  } else if (item.type === 'arc') {
    const center = resolvePoint(item.center, points); if (!center || !(Number(item.radius) > 0)) return; const p = t.toPx(center), edge = t.toPx([center[0] + Number(item.radius), center[1]]); ctx.beginPath(); ctx.arc(p[0], p[1], Math.abs(edge[0] - p[0]), -Number(item.startAngle || 0) * Math.PI / 180, -Number(item.endAngle || 0) * Math.PI / 180, item.direction !== 'clockwise'); ctx.stroke();
  }
  ctx.setLineDash([]); ctx.globalAlpha = 1;
}
function drawSymbol(ctx, t, item, points) {
  const position = resolvePoint(item.position || item.center, points); if (!position) return;
  const scale = Number(item.scale) > 0 ? Number(item.scale) : 1, p = t.toPx(position), style = item.style || {};
  lineStyle(ctx, style, '#111827'); ctx.fillStyle = style.stroke || '#111827';
  if (item.name === 'math.rightAngle') {
    const size = 10 * scale; ctx.beginPath(); ctx.moveTo(p[0], p[1]); ctx.lineTo(p[0] + size, p[1]); ctx.lineTo(p[0] + size, p[1] - size); ctx.stroke();
  } else if (item.name === 'math.parallelMark') {
    const size = 6 * scale; ctx.beginPath(); ctx.moveTo(p[0] - size, p[1] + size); ctx.lineTo(p[0] + size, p[1] - size); ctx.stroke();
  } else if (item.name === 'physics.resistor') {
    const w = 28 * scale, h = 9 * scale; ctx.beginPath(); ctx.rect(p[0] - w / 2, p[1] - h / 2, w, h); ctx.stroke();
  } else if (item.name === 'physics.battery') {
    const s = 12 * scale; ctx.beginPath(); ctx.moveTo(p[0] - s, p[1] - s); ctx.lineTo(p[0] - s, p[1] + s); ctx.moveTo(p[0] + s, p[1] - s * .55); ctx.lineTo(p[0] + s, p[1] + s * .55); ctx.stroke();
  } else if (item.name === 'physics.bulb') {
    const r = 10 * scale; ctx.beginPath(); ctx.arc(p[0], p[1], r, 0, Math.PI * 2); ctx.stroke(); ctx.beginPath(); ctx.moveTo(p[0] - r * .7, p[1] - r * .7); ctx.lineTo(p[0] + r * .7, p[1] + r * .7); ctx.moveTo(p[0] + r * .7, p[1] - r * .7); ctx.lineTo(p[0] - r * .7, p[1] + r * .7); ctx.stroke();
  } else if (item.name === 'chemistry.atom') {
    const r = 13 * scale; ctx.beginPath(); ctx.arc(p[0], p[1], r, 0, Math.PI * 2); ctx.stroke(); if (item.label) { ctx.font = Math.round(12 * scale) + 'px system-ui,sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(String(item.label), p[0], p[1]); }
  }
  ctx.setLineDash([]); ctx.globalAlpha = 1;
}
function drawPrimitive(ctx, t, item, points) {
  if (item.type === 'line') {
    if (Number.isFinite(Number(item.x))) { drawSegment(ctx, t, [Number(item.x), t.yRange[0]], [Number(item.x), t.yRange[1]], item.style); return; }
    if (Number.isFinite(Number(item.y))) { drawSegment(ctx, t, [t.xRange[0], Number(item.y)], [t.xRange[1], Number(item.y)], item.style); return; }
    const pair = Array.isArray(item.through) ? item.through.map(function(point) { return resolvePoint(point, points); }) : null;
    if (pair && pair[0] && pair[1] && pair[0][0] !== pair[1][0]) { const slope = (pair[1][1] - pair[0][1]) / (pair[1][0] - pair[0][0]); drawLine(ctx, t, pair[0], slope, item.style); }
    else if (item.point && Number.isFinite(Number(item.slope))) { const point = resolvePoint(item.point, points); if (point) drawLine(ctx, t, point, Number(item.slope), item.style); }
  } else if (item.type === 'segment' || item.type === 'connector') {
    const from = resolvePoint(item.from, points), to = resolvePoint(item.to, points); if (from && to) drawSegment(ctx, t, from, to, item.style, item.arrow);
  } else if (item.type === 'ray') {
    const from = resolvePoint(item.from, points), through = resolvePoint(item.through, points); if (!from || !through) return; const dx = through[0] - from[0], dy = through[1] - from[1], scale = Math.max(t.xRange[1] - t.xRange[0], t.yRange[1] - t.yRange[0]) * 2; drawSegment(ctx, t, from, [from[0] + dx * scale, from[1] + dy * scale], item.style, 'end');
  } else if (item.type === 'vector') {
    const from = resolvePoint(item.from || [0, 0], points), to = item.to ? resolvePoint(item.to, points) : (from && Array.isArray(item.delta) ? [from[0] + Number(item.delta[0]), from[1] + Number(item.delta[1])] : null); if (from && to) drawSegment(ctx, t, from, to, item.style, 'end');
  } else if (['circle', 'ellipse', 'rectangle', 'polygon', 'arc'].indexOf(item.type) >= 0) drawShape(ctx, t, item, points);
  else if (item.type === 'symbol') drawSymbol(ctx, t, item, points);
}
function drawPolygonRegion(ctx, t, item, points) {
  const polygon = item.boundary && item.boundary.polygon; if (!Array.isArray(polygon) || polygon.length < 3) return; const vertices = polygon.map(function(point) { return resolvePoint(point, points); }).filter(Boolean); if (vertices.length < 3) return; const style = item.style || {}; ctx.save(); ctx.fillStyle = style.fill || 'rgba(37,99,235,0.18)'; const first = t.toPx(vertices[0]); ctx.beginPath(); ctx.moveTo(first[0], first[1]); vertices.slice(1).forEach(function(point) { const p = t.toPx(point); ctx.lineTo(p[0], p[1]); }); ctx.closePath(); ctx.fill(); ctx.restore();
}
function drawSceneV1(canvas, labels, scene) {
  const rect = canvas.parentElement.getBoundingClientRect(), width = Math.max(320, Math.round(rect.width || 720)), height = Math.max(300, Math.round(width * .62)), ratio = Math.min(window.devicePixelRatio || 1, 2); canvas.width = width * ratio; canvas.height = height * ratio; canvas.style.height = height + 'px'; const ctx = canvas.getContext('2d'); ctx.setTransform(ratio, 0, 0, ratio, 0, 0); ctx.clearRect(0, 0, width, height);
  const coord = scene.coordinateSystem || {}, t = transform(coord, width, height), items = flattenItems(scene.items), points = {};
  items.filter(function(item) { return item.type === 'point' && item.id && Array.isArray(item.position); }).forEach(function(item) { points[item.id] = item.position; });
  drawCoordinates(ctx, t, coord);
  const curves = {}; items.filter(function(item) { return item.type === 'curve'; }).forEach(function(item) { drawCurve(ctx, t, item, curves); });
  items.filter(function(item) { return item.type === 'region'; }).forEach(function(item) { if (item.boundary && item.boundary.polygon) drawPolygonRegion(ctx, t, item, points); else drawRegion(ctx, t, item, curves); });
  items.filter(function(item) { return ['line','segment','ray','vector','connector','circle','ellipse','rectangle','polygon','arc','symbol'].indexOf(item.type) >= 0; }).forEach(function(item) { drawPrimitive(ctx, t, item, points); });
  items.filter(function(item) { return item.type === 'curve'; }).forEach(function(item) { drawCurve(ctx, t, item, curves); });
  items.filter(function(item) { return item.type === 'tangent' || item.type === 'secant'; }).forEach(function(item) { drawCalculatedLine(ctx, t, item, curves); });
  items.filter(function(item) { return item.type === 'point' && Array.isArray(item.position); }).forEach(function(item) { drawPoint(ctx, t, item.position, Object.assign({}, item.style || {}, { marker: item.marker })); });
  labels.innerHTML = '';
  items.forEach(function(item) { if (item.type === 'text' && item.value && Array.isArray(item.position)) appendLabel(labels, t.toPx(item.position), item.value, false); if (item.type === 'mathLabel' && item.latex && Array.isArray(item.position)) appendLabel(labels, t.toPx(item.position), item.latex, true); if (item.type === 'point' && item.label && Array.isArray(item.position)) appendLabel(labels, t.toPx(item.position), item.label, false); const label = item.label && typeof item.label === 'object' ? item.label : null; if (label && label.latex && Number.isFinite(Number(label.atX)) && item.type === 'curve') { const parts = curves[item.id], y = parts ? curveValue(parts, Number(label.atX)) : NaN; if (Number.isFinite(y)) appendLabel(labels, t.toPx([Number(label.atX), y]), label.latex, true); } });
}
function errorHtml(host, errors) { host.innerHTML = '<div class="super-graphic-error"><strong>Graphic validation failed.</strong><ul>' + errors.map(function(e) { return '<li><strong>' + e.code + '</strong>' + (e.path ? ' <code>' + e.path + '</code>' : '') + '<br>' + e.message + '</li>'; }).join('') + '</ul></div>'; }

export function mountSuperGraphic(host, payload) {
  styles(); const validation = validateSuperGraphic(payload); if (!validation.valid) { errorHtml(host, validation.errors); return validation; }
  try {
    const scene = toScene(payload);
    if (host.__superGraphicResizeObserver) host.__superGraphicResizeObserver.disconnect();
    host.innerHTML = '<div class="super-graphic-canvas-wrap"><canvas class="super-graphic-canvas"></canvas><div class="super-graphic-label-layer"></div></div>';
    const canvas = host.querySelector('canvas'), labels = host.querySelector('.super-graphic-label-layer');
    const redraw = function() { drawSceneV1(canvas, labels, scene); };
    redraw();
    if (typeof ResizeObserver !== 'undefined') {
      host.__superGraphicResizeObserver = new ResizeObserver(function() { redraw(); });
      host.__superGraphicResizeObserver.observe(host);
    }
    return validation;
  }
  catch (caught) { const failed = issue('SUPER_RENDER_FAILED', '', caught && caught.message ? caught.message : 'The graphic could not be rendered.'); errorHtml(host, [failed]); console.error('Super Graphic Engine render failed:', caught); return { valid: false, errors: [failed], warnings: validation.warnings || [] }; }
}
