import { mountSuperGraphic, validateSuperGraphic } from './super-graphic-engine.js';
import { listTemplates, createTemplate } from './jsxgraph-templates.js?v=ed6afbe';
let mountJsxGraph = function() { return null; };
let validateJsxGraphPayload = function() { return { valid: false, errors: [{ code: 'JSXGRAPH_ADAPTER_LOADING', message: 'JSXGraph adapter is still loading.' }], warnings: [] }; };
let three3dModule;
import('./jsxgraph-renderer.js')
  .then(function(module) { mountJsxGraph = module.mountJsxGraph; validateJsxGraphPayload = module.validateJsxGraphPayload; })
  .catch(function() { console.warn('JSXGraph adapter is unavailable; using the compatible renderer.'); });

const imageInput = document.getElementById('imageInput');
const imageStage = document.getElementById('imageStage');
const jsonInput = document.getElementById('jsonInput');
const viewerHost = document.getElementById('viewerHost');
const status = document.getElementById('jsonStatus');
const issues = document.getElementById('issues');
const endpoint = document.getElementById('aiEndpoint');
const conversionMode = document.getElementById('conversionMode');
const conversionQuality = document.getElementById('conversionQuality');
const panelCount = document.getElementById('panelCount');
const strictMode = document.getElementById('strictMode');
const conversionNotes = document.getElementById('conversionNotes');
const templateSelect = document.getElementById('templateSelect');
let sourceImageDataUrl = '';

function setStatus(message, kind) {
  status.className = 'status ' + (kind || 'info');
  status.textContent = message;
}

function showIssues(result) {
  const list = [].concat(result.errors || [], result.warnings || []);
  issues.innerHTML = list.map(function(item) {
    return '<li><code>' + escapeHtml(item.code || 'WARNING') + '</code>' +
      (item.path ? ' <strong>' + escapeHtml(item.path) + '</strong>' : '') +
      ' — ' + escapeHtml(item.message || '') + '</li>';
  }).join('');
}

function escapeHtml(value) {
  return String(value || '').replace(/[&<>"']/g, function(character) {
    return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character];
  });
}

function parseJson() {
  try { return { value: JSON.parse(jsonInput.value) }; }
  catch (error) { return { error: error }; }
}

function loadThree3dModule() {
  if (!three3dModule) three3dModule = import('./g3scene.js?v=335dfa6');
  return three3dModule;
}

function initializeTemplates() {
  templateSelect.innerHTML = '<option value="">Choose a reusable template…</option>' + listTemplates().map(function(template) {
    return '<option value="' + escapeHtml(template.id) + '">' + escapeHtml(template.label) + '</option>';
  }).join('');
}

async function render() {
  const parsed = parseJson();
  if (parsed.error) {
    viewerHost.innerHTML = '';
    showIssues({ errors: [{ code: 'SUPER_JSON_PARSE_ERROR', path: '', message: parsed.error.message }] });
    setStatus('JSON syntax error.', 'error');
    return;
  }
  const engine = String(parsed.value.engine || '').toLowerCase();
  if (engine === 'three3d') {
    setStatus('Loading Three.js 3D renderer…', 'info');
    try {
      const three3d = await loadThree3dModule();
      const validation = three3d.validateThree3dPayload(parsed.value);
      showIssues(validation);
      if (!validation.valid) { viewerHost.innerHTML = ''; setStatus('Validation failed. Fix the highlighted JSON fields.', 'error'); return; }
      three3d.mountThree3d(viewerHost, parsed.value);
      setStatus('READY — Three.js 3D rendered. Drag to rotate; use the wheel to zoom.', 'success');
    } catch (error) {
      viewerHost.innerHTML = '';
      showIssues({ errors: [{ code: 'THREE3D_RENDER_FAILED', message: error.message || 'Three.js could not be loaded.' }] });
      setStatus('3D renderer could not be loaded.', 'error');
    }
    return;
  }
  const validation = engine === 'jsxgraph'
    ? validateJsxGraphPayload(parsed.value)
    : validateSuperGraphic(parsed.value);
  showIssues(validation);
  if (!validation.valid) {
    viewerHost.innerHTML = '';
    setStatus('Validation failed. Fix the highlighted JSON fields.', 'error');
    return;
  }
  const usedJsxGraph = mountJsxGraph(viewerHost, parsed.value);
  const result = usedJsxGraph ? validation : mountSuperGraphic(viewerHost, parsed.value);
  showIssues(result);
  setStatus(result.valid ? (usedJsxGraph ? 'READY — JSXGraph rendered.' : 'READY — validated and rendered.') : 'Renderer reported an error.', result.valid ? 'success' : 'error');
}

function loadSourceImageFile(file) {
  if (!file) {
    setStatus('Choose or paste an image file first.', 'warning');
    return;
  }
  const reader = new FileReader();
  reader.onload = function() {
    sourceImageDataUrl = String(reader.result || '');
    imageStage.innerHTML = '<img alt="Source graphic for JSON review">';
    imageStage.querySelector('img').src = sourceImageDataUrl;
    setStatus('Source image loaded. Generate JSON through the configured analysis endpoint or edit JSON manually.', 'info');
  };
  reader.onerror = function() {
    setStatus('The selected image could not be read. Try saving it as PNG or JPEG first.', 'error');
  };
  reader.readAsDataURL(file);
}

imageInput.addEventListener('change', function() {
  const file = imageInput.files && imageInput.files[0];
  loadSourceImageFile(file);
});

function handlePastedImage(event) {
  if (event.defaultPrevented) return false;
  const clipboard = event.clipboardData;
  if (!clipboard) return false;
  const imageItem = Array.from(clipboard.items || []).find(function(item) {
    return String(item.type || '').startsWith('image/');
  });
  const file = imageItem ? imageItem.getAsFile() : Array.from(clipboard.files || []).find(function(item) {
    return String(item.type || '').startsWith('image/');
  });
  if (!file) return false;
  event.preventDefault();
  loadSourceImageFile(file);
  setStatus('Screenshot pasted. Click Generate JSON when ready.', 'success');
  return true;
}

imageStage.tabIndex = 0;
imageStage.addEventListener('click', function() { imageStage.focus(); });
window.addEventListener('paste', handlePastedImage, true);
imageStage.addEventListener('paste', handlePastedImage);
document.addEventListener('paste', function(event) {
  handlePastedImage(event);
});

document.getElementById('clearImage').addEventListener('click', function() {
  sourceImageDataUrl = '';
  imageInput.value = '';
  imageStage.innerHTML = '<span class="muted">Drop or choose a source image.<br>It is used for review only and is never embedded in JSON.</span>';
});
document.getElementById('renderJson').addEventListener('click', render);
document.getElementById('loadTemplate').addEventListener('click', function() {
  const template = createTemplate(templateSelect.value);
  if (!template) { setStatus('Choose a template first.', 'warning'); return; }
  jsonInput.value = JSON.stringify(template, null, 2);
  render();
});
document.getElementById('formatJson').addEventListener('click', function() {
  const parsed = parseJson();
  if (parsed.error) { setStatus('Cannot format invalid JSON.', 'error'); return; }
  jsonInput.value = JSON.stringify(parsed.value, null, 2);
  render();
});
document.getElementById('copyJson').addEventListener('click', async function() {
  const parsed = parseJson();
  if (parsed.error) { setStatus('Cannot copy invalid JSON.', 'error'); return; }
  const engine = String(parsed.value.engine || '').toLowerCase();
  const validation = engine === 'three3d'
    ? (await loadThree3dModule()).validateThree3dPayload(parsed.value)
    : (engine === 'jsxgraph' ? validateJsxGraphPayload(parsed.value) : validateSuperGraphic(parsed.value));
  if (!validation.valid) { showIssues(validation); setStatus('Fix validation errors before copying G-cell JSON.', 'error'); return; }
  try { await navigator.clipboard.writeText(JSON.stringify(parsed.value)); setStatus('Compact Super JSON copied for the G cell.', 'success'); }
  catch (_) { setStatus('Clipboard access was unavailable. Copy the formatted JSON manually.', 'warning'); }
});
document.getElementById('generateJson').addEventListener('click', async function() {
  const url = endpoint.value.trim();
  if (!sourceImageDataUrl) { setStatus('Choose a source image first.', 'warning'); return; }
  if (!url) { setStatus('Configure an authorized image-to-JSON endpoint before generation.', 'warning'); return; }
  setStatus('Requesting Super JSON analysis…', 'info');
  try {
    const conversion = {
      mode: conversionMode.value,
      quality: conversionQuality.value,
      panelCount: panelCount.value,
      strict: strictMode.checked,
      preserve: Array.from(document.querySelectorAll('.preserve-option:checked')).map(function(input) { return input.value; }),
      notes: conversionNotes.value.trim()
    };
    const response = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ imageDataUrl: sourceImageDataUrl, outputSchema: 'gongboo-super-graphic-v1', conversion: conversion }) });
    if (!response.ok) throw new Error('Analysis request failed: ' + response.status);
    const result = await response.json();
    if (!result.success) throw new Error(result.error || 'Image-to-JSON generation failed.');
    if (!result.json) {
      jsonInput.value = '';
      viewerHost.innerHTML = '';
      showIssues({ warnings: (result.warnings || []).map(function(message) { return { code: result.status || 'UNSUPPORTED', message: message }; }) });
      setStatus('Conversion status: ' + (result.status || 'UNSUPPORTED') + '. Use manual JSON or a clearer image.', 'warning');
      return;
    }
    const generated = result.json;
    jsonInput.value = JSON.stringify(generated, null, 2);
    render();
  } catch (error) {
    setStatus(error.message || 'Image-to-JSON generation failed.', 'error');
  }
});

initializeTemplates();
render();
