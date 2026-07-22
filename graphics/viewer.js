import { mountSuperGraphic, validateSuperGraphic } from './super-graphic-engine.js';

const imageInput = document.getElementById('imageInput');
const imageStage = document.getElementById('imageStage');
const jsonInput = document.getElementById('jsonInput');
const viewerHost = document.getElementById('viewerHost');
const status = document.getElementById('jsonStatus');
const issues = document.getElementById('issues');
const endpoint = document.getElementById('aiEndpoint');
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

function render() {
  const parsed = parseJson();
  if (parsed.error) {
    viewerHost.innerHTML = '';
    showIssues({ errors: [{ code: 'SUPER_JSON_PARSE_ERROR', path: '', message: parsed.error.message }] });
    setStatus('JSON syntax error.', 'error');
    return;
  }
  const validation = validateSuperGraphic(parsed.value);
  showIssues(validation);
  if (!validation.valid) {
    viewerHost.innerHTML = '';
    setStatus('Validation failed. Fix the highlighted JSON fields.', 'error');
    return;
  }
  const result = mountSuperGraphic(viewerHost, parsed.value);
  showIssues(result);
  setStatus(result.valid ? 'READY — validated and rendered.' : 'Renderer reported an error.', result.valid ? 'success' : 'error');
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
document.getElementById('formatJson').addEventListener('click', function() {
  const parsed = parseJson();
  if (parsed.error) { setStatus('Cannot format invalid JSON.', 'error'); return; }
  jsonInput.value = JSON.stringify(parsed.value, null, 2);
  render();
});
document.getElementById('copyJson').addEventListener('click', async function() {
  const parsed = parseJson();
  if (parsed.error) { setStatus('Cannot copy invalid JSON.', 'error'); return; }
  const validation = validateSuperGraphic(parsed.value);
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
    const response = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ imageDataUrl: sourceImageDataUrl, outputSchema: 'gongboo-super-graphic-v1' }) });
    if (!response.ok) throw new Error('Analysis request failed: ' + response.status);
    const result = await response.json();
    if (!result.success) throw new Error(result.error || 'Image-to-JSON generation failed.');
    if (!result.json) {
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

render();
