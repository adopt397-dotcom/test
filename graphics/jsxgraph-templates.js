// Reusable starter JSON for new GongBoo 2D questions.
// Each template intentionally uses the engine-aligned JSXGraph JSON shape.
const TEMPLATES = {
  function_graph: {
    label: 'Function graph',
    build: () => ({ engine: 'jsxgraph', board: { boundingbox: [-6, 6, 6, -4], grid: true }, objects: [
      { id: 'f', type: 'functiongraph', expression: 'x^2 - 2*x - 1', range: [-4, 5], attributes: { strokeColor: '#2563eb' } },
      { type: 'text', position: [3.2, 3.8], text: 'f(x) = x² − 2x − 1' }
    ] })
  },
  function_comparison: {
    label: 'Two function comparison',
    build: () => ({ engine: 'jsxgraph', board: { boundingbox: [-4, 6, 5, -4], grid: true }, objects: [
      { id: 'f', type: 'functiongraph', expression: 'x^2', range: [-2, 3], attributes: { strokeColor: '#2563eb' } },
      { id: 'g', type: 'functiongraph', expression: '2*x', range: [-2, 3], attributes: { strokeColor: '#dc2626', dash: 2 } },
      { type: 'text', position: [2.3, 4.8], text: 'f and g' }
    ] })
  },
  region_between_curves: {
    label: 'Area between two curves',
    build: () => ({ engine: 'jsxgraph', board: { boundingbox: [-1, 5, 3, -1], grid: true }, objects: [
      { id: 'f', type: 'functiongraph', expression: 'x^2', range: [-1, 3], attributes: { strokeColor: '#2563eb' } },
      { id: 'g', type: 'functiongraph', expression: '2*x', range: [-1, 3], attributes: { strokeColor: '#2563eb' } },
      { type: 'regionBetweenCurves', upper: 'g', lower: 'f', range: [0, 2], attributes: { fillColor: '#60a5fa', fillOpacity: 0.25 } }
    ] })
  },
  piecewise: {
    label: 'Piecewise function',
    build: () => ({ engine: 'jsxgraph', board: { boundingbox: [-5, 5, 5, -4], grid: true }, objects: [
      { id: 'left', type: 'functiongraph', expression: 'x + 2', range: [-5, 0], attributes: { strokeColor: '#2563eb' } },
      { id: 'right', type: 'functiongraph', expression: 'x^2 - 2', range: [0, 3], attributes: { strokeColor: '#2563eb' } },
      { type: 'point', coords: [0, 2], name: '', attributes: { fillColor: '#2563eb' } },
      { type: 'point', coords: [0, -2], name: '', attributes: { fillColor: '#ffffff', strokeColor: '#2563eb' } }
    ] })
  },
  tangent_and_secant: {
    label: 'Tangent and secant',
    build: () => ({ engine: 'jsxgraph', board: { boundingbox: [-2, 7, 5, -3], grid: true }, objects: [
      { id: 'f', type: 'functiongraph', expression: 'x^2', range: [-1.5, 3], attributes: { strokeColor: '#2563eb' } },
      { type: 'line', through: [[-2, -4], [3, 6]], attributes: { strokeColor: '#dc2626', dash: 2 } },
      { type: 'segment', from: [1, 1], to: [2, 4], attributes: { strokeColor: '#059669' } },
      { type: 'point', coords: [1, 1], name: 'P', attributes: { fillColor: '#111827' } },
      { type: 'point', coords: [2, 4], name: 'Q', attributes: { fillColor: '#111827' } }
    ] })
  },
  coordinate_polygon: {
    label: 'Coordinate polygon',
    build: () => ({ engine: 'jsxgraph', board: { boundingbox: [-3, 5, 6, -3], grid: true }, objects: [
      { type: 'polygon', points: [[-1, 0], [1, 4], [5, 3], [3, -1]], attributes: { strokeColor: '#2563eb', fillColor: '#bfdbfe', fillOpacity: 0.28 } },
      { type: 'text', position: [-1.4, -0.5], text: 'A' }, { type: 'text', position: [0.7, 4.3], text: 'B' },
      { type: 'text', position: [5.1, 3.2], text: 'C' }, { type: 'text', position: [3.1, -1.4], text: 'D' }
    ] })
  },
  circle_geometry: {
    label: 'Circle and radius',
    build: () => ({ engine: 'jsxgraph', board: { boundingbox: [-5, 5, 5, -5], grid: true }, objects: [
      { type: 'circle', center: [0, 0], radius: 3, attributes: { strokeColor: '#2563eb' } },
      { type: 'segment', from: [0, 0], to: [3, 0], attributes: { strokeColor: '#dc2626' } },
      { type: 'point', coords: [0, 0], name: 'O', attributes: { fillColor: '#111827' } },
      { type: 'text', position: [1.2, 0.4], text: 'r = 3' }
    ] })
  },
  inequality_region: {
    label: 'Linear inequality region',
    build: () => ({ engine: 'jsxgraph', board: { boundingbox: [-1, 7, 7, -1], grid: true }, objects: [
      { id: 'xAxis', type: 'line', y: 0, attributes: { strokeColor: '#111827' } },
      { id: 'yAxis', type: 'line', x: 0, attributes: { strokeColor: '#111827' } },
      { type: 'polygon', points: [[0, 0], [0, 6], [6, 0]], attributes: { strokeColor: '#2563eb', fillColor: '#60a5fa', fillOpacity: 0.25 } },
      { type: 'segment', from: [0, 6], to: [6, 0], attributes: { strokeColor: '#2563eb' } },
      { type: 'text', position: [3.2, 3.4], text: 'x + y ≤ 6' }
    ] })
  }
};

export function listTemplates() {
  return Object.entries(TEMPLATES).map(([id, template]) => ({ id, label: template.label }));
}

export function createTemplate(id) {
  const template = TEMPLATES[id];
  return template ? template.build() : null;
}
