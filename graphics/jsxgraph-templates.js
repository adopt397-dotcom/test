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
  },
  calculus_integral_area: {
    label: 'Calculus: definite integral area',
    build: () => ({ engine: 'jsxgraph', board: { boundingbox: [-1, 5, 4, -1], grid: true }, objects: [
      { id: 'f', type: 'functiongraph', expression: '4 - x^2', range: [-1, 2], attributes: { strokeColor: '#2563eb' } },
      { id: 'axis', type: 'functiongraph', expression: '0', range: [0, 2], attributes: { strokeColor: '#111827' } },
      { type: 'regionBetweenCurves', upper: 'f', lower: 'axis', range: [0, 2], attributes: { fillColor: '#60a5fa', fillOpacity: 0.25 } },
      { type: 'text', position: [0.7, 3.5], text: '∫₀² (4 − x²) dx' }
    ] })
  },
  calculus_riemann_sum: {
    label: 'Calculus: Riemann sum',
    build: () => ({ engine: 'jsxgraph', board: { boundingbox: [-0.5, 5, 4.5, -0.5], grid: true }, objects: [
      { id: 'f', type: 'functiongraph', expression: 'x^2/4 + 1', range: [0, 4], attributes: { strokeColor: '#2563eb' } },
      { type: 'polygon', points: [[0, 0], [1, 0], [1, 1.25], [0, 1.25]], attributes: { strokeColor: '#64748b', fillColor: '#cbd5e1', fillOpacity: 0.32 } },
      { type: 'polygon', points: [[1, 0], [2, 0], [2, 2], [1, 2]], attributes: { strokeColor: '#64748b', fillColor: '#cbd5e1', fillOpacity: 0.32 } },
      { type: 'polygon', points: [[2, 0], [3, 0], [3, 3.25], [2, 3.25]], attributes: { strokeColor: '#64748b', fillColor: '#cbd5e1', fillOpacity: 0.32 } },
      { type: 'polygon', points: [[3, 0], [4, 0], [4, 5], [3, 5]], attributes: { strokeColor: '#64748b', fillColor: '#cbd5e1', fillOpacity: 0.32 } }
    ] })
  },
  calculus_tangent_secant: {
    label: 'Calculus: tangent and secant',
    build: () => ({ engine: 'jsxgraph', board: { boundingbox: [-2, 7, 5, -3], grid: true }, objects: [
      { id: 'f', type: 'functiongraph', expression: 'x^2', range: [-1.5, 3], attributes: { strokeColor: '#2563eb' } },
      { type: 'line', through: [[-2, -4], [3, 6]], attributes: { strokeColor: '#dc2626', dash: 2 } },
      { type: 'segment', from: [1, 1], to: [2, 4], attributes: { strokeColor: '#059669' } },
      { type: 'point', coords: [1, 1], name: 'P', attributes: { fillColor: '#111827' } },
      { type: 'point', coords: [2, 4], name: 'Q', attributes: { fillColor: '#111827' } }
    ] })
  },
  calculus_parametric: {
    label: 'Calculus: parametric curve',
    build: () => ({ engine: 'jsxgraph', board: { boundingbox: [-4, 4, 4, -4], grid: true }, objects: [
      { type: 'parametric', xExpression: '3*cos(t)', yExpression: '2*sin(t)', range: [0, 6.283185307179586], attributes: { strokeColor: '#2563eb' } },
      { type: 'text', position: [-3.5, 3.2], text: 'x = 3 cos t,  y = 2 sin t' }
    ] })
  },
  calculus_polar: {
    label: 'Calculus: polar curve',
    build: () => ({ engine: 'jsxgraph', board: { boundingbox: [-3, 3, 3, -3], grid: true }, objects: [
      { type: 'polar', rExpression: '2*sin(2*t)', range: [0, 6.283185307179586], attributes: { strokeColor: '#2563eb' } },
      { type: 'text', position: [-2.8, 2.5], text: 'r = 2 sin(2θ)' }
    ] })
  },
  calculus_accumulation: {
    label: 'Calculus: accumulation / FTC',
    build: () => ({ engine: 'jsxgraph', board: { boundingbox: [-1, 6, 5, -2], grid: true }, objects: [
      { id: 'rate', type: 'functiongraph', expression: 'sin(x) + 1', range: [0, 4], attributes: { strokeColor: '#2563eb' } },
      { id: 'axis', type: 'functiongraph', expression: '0', range: [0, 4], attributes: { strokeColor: '#111827' } },
      { type: 'regionBetweenCurves', upper: 'rate', lower: 'axis', range: [0, 3], attributes: { fillColor: '#60a5fa', fillOpacity: 0.22 } },
      { type: 'text', position: [1.2, 4.8], text: 'A(x) = ∫₀ˣ f(t) dt' }
    ] })
  },
  three3d_coordinate_projection: {
    label: '3D: coordinate point and projection',
    build: () => ({ engine: 'three3d', scene: { axes: true, grid: true, axisLength: 4 }, objects: [
      { type: 'point', position: [2, 3, 1], name: 'P(2, 3, 1)', attributes: { color: '#111827' } },
      { type: 'segment', from: [0, 0, 0], to: [2, 3, 1], attributes: { color: '#2563eb' } },
      { type: 'segment', from: [2, 3, 1], to: [2, 0, 1], attributes: { color: '#64748b', opacity: 0.65 } },
      { type: 'segment', from: [2, 0, 1], to: [2, 0, 0], attributes: { color: '#64748b', opacity: 0.65 } },
      { type: 'segment', from: [2, 0, 1], to: [0, 0, 1], attributes: { color: '#64748b', opacity: 0.65 } }
    ] })
  },
  three3d_rectangular_prism: {
    label: '3D: rectangular prism',
    build: () => ({ engine: 'three3d', scene: { axes: true, grid: true, axisLength: 5 }, objects: [
      { type: 'box', center: [1.5, 1, 1], size: [3, 2, 2], attributes: { color: '#60a5fa', opacity: 0.48 } },
      { type: 'point', position: [3, 2, 2], name: 'P(3, 2, 2)', attributes: { color: '#111827' } }
    ] })
  },
  three3d_cylinder: {
    label: '3D: cylinder / solid of revolution',
    build: () => ({ engine: 'three3d', scene: { axes: true, grid: true, axisLength: 4 }, objects: [
      { type: 'cylinder', center: [0, 1.5, 0], radius: 1.4, height: 3, attributes: { color: '#60a5fa', opacity: 0.52 } },
      { type: 'segment', from: [0, 0, 0], to: [0, 3, 0], attributes: { color: '#dc2626' } }
    ] })
  },
  three3d_cone: {
    label: '3D: cone',
    build: () => ({ engine: 'three3d', scene: { axes: true, grid: true, axisLength: 4 }, objects: [
      { type: 'cone', center: [0, 1.8, 0], radius: 1.5, height: 3.6, attributes: { color: '#a78bfa', opacity: 0.5 } },
      { type: 'point', position: [0, 3.6, 0], name: 'vertex', attributes: { color: '#111827' } }
    ] })
  },
  three3d_plane_face: {
    label: '3D: plane and triangular face',
    build: () => ({ engine: 'three3d', scene: { axes: true, grid: true, axisLength: 4 }, objects: [
      { type: 'face', points: [[0, 0, 0], [3, 0, 0], [1, 3, 2]], attributes: { color: '#34d399', opacity: 0.45 } },
      { type: 'point', position: [1, 3, 2], name: 'P', attributes: { color: '#111827' } }
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
