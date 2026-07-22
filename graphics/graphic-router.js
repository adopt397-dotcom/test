/* GongBoo Graphic Router: explicit engine:"super" only. */
let superEnginePromise = null;

function getSuperEngine() {
  if (!superEnginePromise) superEnginePromise = import('./super-graphic-engine.js');
  return superEnginePromise;
}

export function isSuperGraphicPayload(payload) {
  return Boolean(payload && typeof payload === 'object' && String(payload.engine || '').trim().toLowerCase() === 'super');
}

export function preloadSuperGraphicEngine() {
  return getSuperEngine().catch(function(error) { superEnginePromise = null; throw error; });
}

export function renderSuperGraphicPayload(payload) {
  const hostId = 'super_graphic_' + Math.random().toString(36).slice(2, 11);
  setTimeout(function() {
    getSuperEngine().then(function(module) {
      const host = document.getElementById(hostId);
      if (host) module.mountSuperGraphic(host, payload);
    }).catch(function(error) {
      const host = document.getElementById(hostId);
      if (host) host.innerHTML = '<div class="super-graphic-error">This graphic could not be displayed.</div>';
      console.error('Super Graphic Engine load failed:', error);
    });
  }, 0);
  return '<div id="' + hostId + '" class="super-graphic-host" aria-live="polite"><div class="super-graphic-loading">Loading graphic...</div></div>';
}
