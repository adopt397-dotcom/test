// GongBoo Super JSON -> JSXGraph adapter (2D package).
// The Super JSON schema remains GongBoo-owned; JSXGraph is only the renderer.
function numberRange(value, fallback) {
  return Array.isArray(value) && value.length === 2 && Number(value[0]) < Number(value[1])
    ? [Number(value[0]), Number(value[1])] : fallback;
}

function attributes(style = {}) {
  return {
    strokeColor: style.stroke || style.color || '#2563eb',
    fillColor: style.fill || 'none',
    strokeWidth: Number(style.strokeWidth || 2),
    dash: style.lineStyle === 'dashed' ? 2 : 0,
    fixed: true,
    highlight: false
  };
}

function evaluate(expression) {
  if (!window.math || !expression) return null;
  try {
    const compiled = window.math.compile(String(expression));
    return x => {
      const y = Number(compiled.evaluate({ x, pi: Math.PI, e: Math.E }));
      return Number.isFinite(y) ? y : NaN;
    };
  } catch (_) { return null; }
}

function mountScene(host, scene) {
  const coord = scene.coordinateSystem || {};
  const xRange = numberRange(coord.xRange, [-10, 10]);
  const yRange = numberRange(coord.yRange, [-10, 10]);
  const boardId = 'gongboo-jxg-' + Math.random().toString(36).slice(2);
  host.innerHTML = '<div id="' + boardId + '" class="jxgbox gongboo-jxg-board"></div>';
  const board = window.JXG.JSXGraph.initBoard(boardId, {
    boundingbox: [xRange[0], yRange[1], xRange[1], yRange[0]],
    axis: true, grid: !!coord.grid, showCopyright: false, showNavigation: false,
    keepaspectratio: false
  });
  const points = {};
  const items = Array.isArray(scene.items) ? scene.items : [];
  items.forEach(item => {
    const style = attributes(item.style);
    if (item.type === 'point' && Array.isArray(item.position)) {
      const p = board.create('point', item.position, Object.assign(style, { name: item.label || '', size: item.marker === 'none' ? 0 : 2, fillColor: style.strokeColor }));
      if (item.id) points[item.id] = p;
    }
  });
  items.forEach(item => {
    const style = attributes(item.style);
    if (item.type === 'curve' && item.expression) {
      const fn = evaluate(item.expression), domain = numberRange(item.domain, xRange);
      if (fn) board.create('functiongraph', [fn, domain[0], domain[1]], style);
    } else if (item.type === 'polyline' && Array.isArray(item.points) && item.points.length > 1) {
      board.create('curve', [item.points.map(p => p[0]), item.points.map(p => p[1])], Object.assign(style, { curveType: 'plot' }));
    } else if ((item.type === 'segment' || item.type === 'connector' || item.type === 'vector') && Array.isArray(item.from) && Array.isArray(item.to)) {
      board.create(item.type === 'vector' ? 'arrow' : 'segment', [item.from, item.to], style);
    } else if (item.type === 'line' && Array.isArray(item.through) && item.through.length === 2) {
      board.create('line', item.through, style);
    } else if (item.type === 'line' && Number.isFinite(Number(item.y))) {
      board.create('line', [[xRange[0], Number(item.y)], [xRange[1], Number(item.y)]], style);
    } else if (item.type === 'line' && Number.isFinite(Number(item.x))) {
      board.create('line', [[Number(item.x), yRange[0]], [Number(item.x), yRange[1]]], style);
    } else if (item.type === 'circle' && Array.isArray(item.center) && Number.isFinite(Number(item.radius))) {
      board.create('circle', [item.center, Number(item.radius)], style);
    } else if (item.type === 'polygon' && Array.isArray(item.points) && item.points.length >= 3) {
      board.create('polygon', item.points, style);
    } else if (item.type === 'text' && Array.isArray(item.position)) {
      board.create('text', [item.position[0], item.position[1], String(item.value || '')], Object.assign(style, { display: 'html' }));
    }
  });
  return board;
}

export function mountJsxGraph(host, payload) {
  if (!window.JXG || !window.JXG.JSXGraph) return null;
  if (payload.type === 'multiPanel') {
    const panels = payload?.data?.panels || [];
    const columns = Math.min(3, Number(payload?.data?.layout?.columns) || (panels.length <= 2 ? panels.length : 2));
    host.innerHTML = '<div class="gongboo-jxg-panels" style="grid-template-columns:repeat(' + columns + ',minmax(0,1fr))"></div>';
    panels.forEach(panel => { const card = document.createElement('section'); card.className = 'gongboo-jxg-panel'; if (panel.title || panel.id) card.innerHTML = '<div>' + (panel.title || panel.id) + '</div>'; const target = document.createElement('div'); card.appendChild(target); host.firstElementChild.appendChild(card); mountScene(target, panel.scene || panel.data); });
    return true;
  }
  if (payload.type !== 'scene') return null;
  mountScene(host, payload.data);
  return true;
}
