// Converts safe Legacy G-cell payloads while preserving every numbered blank row.
// Output is TSV: select N1 in Google Sheets and paste the whole file.
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { basename, resolve } from 'node:path';

const [inputPath, outputDirectory] = process.argv.slice(2);
if (!inputPath || !outputDirectory) throw new Error('Usage: node convert-legacy-batch.mjs <input.txt> <output-directory>');
const COLORS = ['#2563eb', '#f59e0b', '#16a34a', '#dc2626', '#7c3aed', '#0891b2'];
const clone = value => JSON.parse(JSON.stringify(value));
const axis = (legacy = {}, fallbackLabel = '') => { const result = {}; if (legacy.label) result.title = { display:true, text:legacy.label }; if (legacy.min !== undefined) result.min = Number(legacy.min); if (legacy.max !== undefined) result.max = Number(legacy.max); if (legacy.tick !== undefined) result.ticks = { stepSize:Number(legacy.tick) }; if (!legacy.label && fallbackLabel) result.title = { display:true, text:fallbackLabel }; return result; };
function chartOptions(source, isLinearX = false) { const x = axis(source.xAxis || {}, 'x'), y = axis(source.yAxis || {}, 'y'); if (isLinearX) x.type = 'linear'; return { plugins:{ title:{ display:!!source.title, text:source.title || '' }, legend:{ display:source.showLegend !== undefined ? !!source.showLegend : (source.series || []).length > 1 } }, scales:{ x, y } }; }
function seriesDataset(series, index, kind) { const color = series.color || COLORS[index % COLORS.length]; const base = { label:series.name || `Series ${index + 1}`, borderColor:color, backgroundColor:color }; if (Array.isArray(series.points)) base.data = series.points.map(point => ({ x:Number(point.x), y:Number(point.y) })); else base.data = Array.isArray(series.data) ? clone(series.data) : []; if (kind === 'line') { base.borderWidth = Number(series.lineWidth || 2); base.pointRadius = Number(series.pointRadius || series.pointSize || 3); base.tension = 0; base.fill = false; } if (kind === 'scatter') { base.pointRadius = Number(series.pointRadius || 4); base.pointHoverRadius = base.pointRadius + 1; } return base; }
function toChart(source) {
  const type = String(source.type || '').toLowerCase();
  // Some Legacy equation-graph payloads are actually pure scatterplots: they
  // carry axis settings and points but have no equation to draw.
  if (type === 'equation-graph' && (!Array.isArray(source.equations) || source.equations.length === 0) && Array.isArray(source.points)) {
    return toChart({ ...source, type:'scatter', series:undefined });
  }
  if (type === 'bar') { const sets = Array.isArray(source.series) ? source.series : [{ name:source.label || 'Data', data:source.values || [], color:source.stroke || source.color }]; return { engine:'chart', height:source.height || 400, config:{ type:'bar', data:{ labels:source.xAxis?.categories || source.labels || [], datasets:sets.map((s, i) => seriesDataset(s, i, 'bar')) }, options:chartOptions(source) } }; }
  if (type === 'line') { const sets = Array.isArray(source.series) ? source.series : []; const points = sets.some(s => Array.isArray(s.points)); return { engine:'chart', height:source.height || 400, config:{ type:'line', data:{ ...(points ? {} : { labels:source.xAxis?.categories || source.labels || [] }), datasets:sets.map((s, i) => seriesDataset(s, i, 'line')) }, options:chartOptions(source, points) } }; }
  if (type === 'scatter' || type === 'scatter-only') { const sets = Array.isArray(source.series) ? source.series : [{ name:source.label || 'Data', points:source.points || [] }]; const datasets = sets.map((s, i) => seriesDataset(s, i, 'scatter')); if (source.line && Number.isFinite(Number(source.line.slope)) && Number.isFinite(Number(source.line.intercept))) { const min = Number(source.xAxis?.min ?? 0), max = Number(source.xAxis?.max ?? 10), slope = Number(source.line.slope), intercept = Number(source.line.intercept); datasets.push({ type:'line', label:'Model', data:[{x:min,y:slope * min + intercept},{x:max,y:slope * max + intercept}], borderColor:'#dc2626', borderWidth:2, pointRadius:0, showLine:true }); } const options = chartOptions(source, true); options.plugins.legend.display = source.showLegend !== undefined ? !!source.showLegend : datasets.length > 1; return { engine:'chart', height:source.height || 420, config:{ type:'scatter', data:{ datasets }, options } }; }
  return null;
}
function convertPayload(source) { if (!source || typeof source !== 'object' || source.engine) return source; if (source.type === 'table') return { engine:'table', columns:clone(source.headers || []), rows:clone(source.rows || []), ...(source.title ? { caption:source.title } : {}), options:{ striped:true, compact:(source.headers || []).length >= 5 } }; return toChart(source) || source; }

const raw = await readFile(inputPath, 'utf8');
const blocks = []; let current = [], previousNumber = -1;
for (const line of raw.split(/\r?\n/)) { const match = line.match(/^(\d+)\t(.*)$/); if (!match) continue; const number = Number(match[1]); if (previousNumber >= 0 && number < previousNumber) { blocks.push(current); current = []; } previousNumber = number; const original = match[2]; let value = original; if (original) { try { value = JSON.stringify(convertPayload(JSON.parse(original))); } catch { value = original; } } current.push([number, value]); }
if (current.length) blocks.push(current);
await mkdir(outputDirectory, { recursive:true });
const summary = [];
for (let i = 0; i < blocks.length; i++) { const rows = blocks[i]; const content = ['N\tG', ...rows.map(([number, value]) => `${number}\t${value}`)].join('\r\n') + '\r\n'; const filename = `N-G-standardized-paste-block-${i + 1}-${rows[0][0]}-${rows.at(-1)[0]}.tsv`; await writeFile(resolve(outputDirectory, filename), content, 'utf8'); summary.push({ filename, rows:rows.length, converted:rows.filter(([, value]) => value.includes('"engine"')).length }); }
await writeFile(resolve(outputDirectory, 'README.txt'), `Source: ${basename(inputPath)}\r\nPaste a TSV file by selecting N1 in the target sheet. Blank numbered rows are deliberately retained.\r\n${JSON.stringify(summary, null, 2)}\r\n`, 'utf8');
console.log(JSON.stringify(summary));
