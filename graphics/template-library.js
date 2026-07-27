import { createTemplate, listTemplates } from '../tmp/graphics-lab/jsxgraph-templates.js';

const PAGE_SIZE = 120;
const $ = (id) => document.getElementById(id);
let entries = [];

function readyCategory(id) {
  const name = id.toLowerCase();
  if (/three3d|rectangular|cylinder|cone|sphere|pyramid|tetrahedron|plane/.test(name)) return '3D / spatial';
  if (/polar|parametric|cardioid|spiral/.test(name)) return 'Polar / parametric';
  if (/integral|riemann|area|accumulation|ftc/.test(name)) return 'Calculus / integration';
  if (/circle|polygon|triangle|coordinate|vector|ellipse|parabola|concentric/.test(name)) return 'Geometry / coordinate';
  return 'Calculus / functions';
}

function readyDimension(id) {
  return /three3d|rectangular|cylinder|cone|sphere|pyramid|tetrahedron|plane/.test(id.toLowerCase()) ? '3d' : '2d';
}

function buildReadyEntries() {
  return listTemplates().map((template) => ({
    id: `ready:${template.id}`,
    kind: 'ready',
    status: 'Ready JSON',
    engine: template.id.toLowerCase().includes('three3d') ? 'three3d' : 'jsxgraph',
    title: template.label,
    sourcePath: `GongBoo template: ${template.id}`,
    category: readyCategory(template.id),
    dimension: readyDimension(template.id),
    templateId: template.id,
  }));
}

function normalizeCatalog(catalog, fallbackSource) {
  const source = catalog?.source || fallbackSource;
  const items = Array.isArray(catalog?.entries) ? catalog.entries : [];
  return items.map((item) => ({
    id: `raw:${source}:${item.id || item.sourcePath}`,
    kind: 'raw',
    status: 'Adapter required',
    engine: source,
    title: item.title || item.sourcePath || 'Unnamed source item',
    sourcePath: item.sourcePath || '',
    sourceUrl: item.sourceUrl || '',
    category: item.category || 'unclassified',
    dimension: item.dimension || '2d',
    format: item.format || 'source',
  }));
}

async function loadPool() {
  const [jsxResponse, threeResponse] = await Promise.all([
    fetch('../tmp/graphics-lab/reference/jsxgraph-catalog.json'),
    fetch('../tmp/graphics-lab/reference/threejs-catalog.json'),
  ]);
  if (!jsxResponse.ok || !threeResponse.ok) throw new Error('The official source catalog could not be loaded.');
  const [jsx, three] = await Promise.all([jsxResponse.json(), threeResponse.json()]);
  entries = [...buildReadyEntries(), ...normalizeCatalog(jsx, 'JSXGraph'), ...normalizeCatalog(three, 'Three.js')];
  populateCategories();
  render();
}

function populateCategories() {
  const categorySelect = $('category');
  const categories = [...new Set(entries.map((entry) => entry.category))].sort((a, b) => a.localeCompare(b));
  categorySelect.innerHTML = '<option value="all">All categories</option>' + categories
    .map((category) => `<option value="${escapeHtml(category)}">${escapeHtml(category)}</option>`).join('');
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' })[char]);
}

function filteredEntries() {
  const search = $('search').value.trim().toLowerCase();
  const kind = $('kind').value;
  const dimension = $('dimension').value;
  const category = $('category').value;
  return entries.filter((entry) => {
    const haystack = [entry.title, entry.category, entry.sourcePath, entry.engine, entry.format].join(' ').toLowerCase();
    return (!search || haystack.includes(search))
      && (kind === 'all' || entry.kind === kind)
      && (dimension === 'all' || entry.dimension === dimension)
      && (category === 'all' || entry.category === category);
  });
}

function render() {
  const matching = filteredEntries();
  const shown = matching.slice(0, PAGE_SIZE);
  const readyTotal = entries.filter((entry) => entry.kind === 'ready').length;
  const rawTotal = entries.length - readyTotal;
  $('summary').innerHTML = [
    `<span class="pill ready">Ready JSON: ${readyTotal}</span>`,
    `<span class="pill raw">Official source reserve: ${rawTotal}</span>`,
    `<span class="pill">Showing ${shown.length} of ${matching.length}</span>`,
  ].join('');
  $('results').innerHTML = shown.map(card).join('');
  $('empty').style.display = matching.length ? 'none' : 'block';
  document.querySelectorAll('[data-copy-template]').forEach((button) => button.addEventListener('click', copyReadyTemplate));
}

function card(entry) {
  const tags = [entry.dimension.toUpperCase(), entry.category, entry.engine, entry.status]
    .filter(Boolean).map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`).join('');
  const action = entry.kind === 'ready'
    ? `<button data-copy-template="${escapeHtml(entry.templateId)}">Copy JSON</button>`
    : '<div class="meta">Saved as source reference; conversion adapter is needed before quiz use.</div>';
  return `<article><div class="tags">${tags}</div><h2>${escapeHtml(entry.title)}</h2><code>${escapeHtml(entry.sourcePath)}</code>${action}</article>`;
}

async function copyReadyTemplate(event) {
  const templateId = event.currentTarget.dataset.copyTemplate;
  const text = JSON.stringify(createTemplate(templateId), null, 2);
  try {
    await navigator.clipboard.writeText(text);
    event.currentTarget.textContent = 'Copied';
    setTimeout(() => { event.currentTarget.textContent = 'Copy JSON'; }, 1400);
  } catch {
    window.prompt('Copy this JSON:', text);
  }
}

['search', 'kind', 'dimension', 'category'].forEach((id) => $(id).addEventListener(id === 'search' ? 'input' : 'change', render));

loadPool().catch((error) => {
  $('summary').innerHTML = `<span class="pill raw">${escapeHtml(error.message)}</span>`;
  $('empty').style.display = 'block';
});
