/* HoshiYaar v12 — GLYPH ENGINE
   Draws board glyphs from JSON definitions and plays Step actions over time.
   Ported for Vite / ES Modules in HoshiYaar Frontend.
*/
import defaultGlyphLibrary from './glyph_library.json';
import http from '../../../services/apiClient.js';

const Glyph = (() => {
  const W = 160, H = 100;
  const STYLE = {
    normal:       { stroke: '#7CD3FF', w: 1.15, glow: 'gl' },
    ray:          { stroke: '#A8E6FF', w: 1.2, dash: '3 2.2', glow: 'gl' },
    dim:          { stroke: '#56718C', w: 0.9 },
    trail:        { stroke: '#7CD3FF', w: 0.8, dash: '0.8 2.2', op: 0.6 },
    warn:         { stroke: '#FFD166', w: 1.2, fill: '#FFD166', glow: 'gw' },
    good:         { stroke: '#3DDC84', w: 1.6, glow: 'gg' },
    bad:          { stroke: '#FF5A5F', w: 1.6, glow: 'gb' },
    shadow:       { stroke: '#4B6178', w: 0.7, fill: 'url(#hatch)', solid: true },
    shadow_light: { stroke: '#6F8AA6', w: 0.6, dash: '1.4 .8', fill: 'url(#hatch2)', solid: true },
    shadow_faint: { stroke: '#8FA7BF', w: 0.5, dash: '.5 1.2', fill: 'url(#dots)', solid: true, op: .8 }
  };
  STYLE.thing = STYLE.normal;
  const COLORS = { 
    red: '#FF6B6B', 
    blue: '#6FB7FF', 
    green: '#5FE08F', 
    yellow: '#FFD166', 
    orange: '#FF9F43', 
    white: '#F4F8FF', 
    brown: '#C99A6B', 
    pink: '#FF8FC7', 
    purple: '#B79CFF' 
  };

  /* Primitives the board draws itself */
  const PRIM = new Set(['straight_line', 'circle', 'rectangle', 'polyline', 'text', 'arrow']);
  const LIB = {};
  const bbCache = new Map();

  function setLibrary(list) { 
    for (const k in LIB) delete LIB[k]; 
    bbCache.clear(); 
    (list || []).forEach(addGlyph); 
  }
  
  function addGlyph(g) { 
    if (g && g.name) { 
      LIB[g.name] = g; 
      bbCache.clear(); 
    } 
  }
  
  function library() { return Object.values(LIB); }
  function known(name) { return PRIM.has(name) || !!LIB[name]; }

  const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, k) => a + (b - a) * k;
  const ease = k => k < .5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
  const back = k => { const c = 1.7; return 1 + (c + 1) * Math.pow(k - 1, 3) + c * Math.pow(k - 1, 2); };
  const clone = o => JSON.parse(JSON.stringify(o));
  const f = n => Math.round((+n || 0) * 100) / 100;
  const isPt = v => Array.isArray(v) && v.length === 2 && typeof v[0] === 'number' && typeof v[1] === 'number';

  // anchor offsets may be numbers or small expressions of the piece's settings
  function num(v, p) {
    if (typeof v === 'number') return v;
    try { 
      return Function('width', 'height', 'r', 'scale', 'x', 'y', '"use strict";return (' + String(v).replace(/^x\s*[+-]?\s*/, m => m.includes('-') ? '-' : '') + ')')(p.width ?? 10, p.height ?? 10, p.r ?? 3, p.scale ?? 1, 0, 0); 
    } catch (e) { 
      return 0; 
    }
  }
  function defaultsOf(p) { const g = LIB[p.glyph]; return (g && g.settings) || {}; }

  /* ---- bounding box of a glyph in its own (local) units ---- */
  function partPoints(pt, out, depth) {
    if (pt.glyph && !PRIM.has(pt.glyph)) {
      const sub = LIB[pt.glyph]; if (!sub || depth > 5) return;
      const b = glyphBox(sub, depth + 1), s = pt.scale ?? 1, at = pt.pos || pt.at || [0, 0];
      out.push([at[0] + b[0] * s, at[1] + b[1] * s], [at[0] + b[2] * s, at[1] + b[3] * s]); return;
    }
    const kind = pt.glyph || pt.shape;
    const at = pt.pos || pt.at || [0, 0];
    if (kind === 'circle') { const r = pt.r ?? 3; out.push([at[0] - r, at[1] - r], [at[0] + r, at[1] + r]); }
    else if (kind === 'rectangle' || kind === 'rect') { const w = (pt.width ?? pt.w ?? 10) / 2, h = (pt.height ?? pt.h ?? 10) / 2; out.push([at[0] - w, at[1] - h], [at[0] + w, at[1] + h]); }
    else if (kind === 'straight_line' || kind === 'line' || kind === 'arrow') { if (isPt(pt.from)) out.push(pt.from); if (isPt(pt.to)) out.push(pt.to); }
    else if (kind === 'polyline' || kind === 'poly') (pt.points || []).forEach(q => isPt(q) && out.push(q));
    else if (kind === 'arc') { const r = pt.r || 5; out.push([at[0] - r, at[1] - r], [at[0] + r, at[1] + r]); }
  }

  function glyphBox(g, depth = 0) {
    if (bbCache.has(g.name)) return bbCache.get(g.name);
    let b;
    if (g.size) b = [-g.size[0] / 2, -g.size[1] / 2, g.size[0] / 2, g.size[1] / 2];
    else {
      const pts = []; (g.parts || []).forEach(pt => partPoints(pt, pts, depth));
      b = pts.length ? [Math.min(...pts.map(p => p[0])), Math.min(...pts.map(p => p[1])), Math.max(...pts.map(p => p[0])), Math.max(...pts.map(p => p[1]))] : [-4, -4, 4, 4];
    }
    bbCache.set(g.name, b); return b;
  }

  /* ---- anchors ---- */
  function rot(pt, deg) { if (!deg) return pt; const a = deg * Math.PI / 180, c = Math.cos(a), s = Math.sin(a); return [pt[0] * c - pt[1] * s, pt[0] * s + pt[1] * c]; }
  
  function anchor(p, name, pieces) {
    if (p.glyph === 'straight_line' || p.glyph === 'arrow') {
      const a = resolve(p.from, pieces), b = resolve(p.to, pieces);
      return { start: a, end: b, tip: b, mid: [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2], center: [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2] }[name] || a;
    }
    if (p.glyph === 'polyline') {
      const pts = polyPoints(p, pieces);
      if (!pts.length) return [0, 0];
      if (name === 'end') return pts[pts.length - 1];
      if (name === 'center') { const xs = pts.map(q => q[0]), ys = pts.map(q => q[1]); return [(Math.min(...xs) + Math.max(...xs)) / 2, (Math.min(...ys) + Math.max(...ys)) / 2]; }
      return pts[0];
    }
    const [x, y] = resolve(p.pos, pieces) || [0, 0];
    const s = p.scale ?? 1;
    if (p.glyph === 'circle') { const r = (p.r ?? 3) * s; return { center: [x, y], top: [x, y - r], bottom: [x, y + r], left: [x - r, y], right: [x + r, y] }[name] || [x, y]; }
    if (p.glyph === 'rectangle') { const w = (p.width ?? 10) / 2 * s, h = (p.height ?? 10) / 2 * s; return { center: [x, y], left: [x - w, y], right: [x + w, y], top: [x, y - h], bottom: [x, y + h], topleft: [x - w, y - h], topright: [x + w, y - h], bottomleft: [x - w, y + h], bottomright: [x + w, y + h] }[name] || [x, y]; }
    if (p.glyph === 'text') return [x, y];
    const g = LIB[p.glyph];
    let a = g && g.anchors && g.anchors[name];
    if (!isPt(a) && !(Array.isArray(a) && a.length === 2)) {
      const b = g ? glyphBox(g) : [-4, -4, 4, 4];
      a = { center: [(b[0] + b[2]) / 2, (b[1] + b[3]) / 2], left: [b[0], (b[1] + b[3]) / 2], right: [b[2], (b[1] + b[3]) / 2], top: [(b[0] + b[2]) / 2, b[1]], bottom: [(b[0] + b[2]) / 2, b[3]] }[name] || [0, 0];
    }
    const local = rot([num(a[0], p) * s, num(a[1], p) * s], p.rotate);
    return [x + local[0], y + local[1]];
  }

  function resolve(v, pieces) {
    if (isPt(v)) return v;
    if (Array.isArray(v) && v.length === 2) return [+v[0] || 0, +v[1] || 0];
    if (typeof v === 'string') {
      const i = v.lastIndexOf('.');
      const id = i > 0 ? v.slice(0, i) : v, name = i > 0 ? v.slice(i + 1) : 'center';
      const p = pieces && pieces.get(id);
      if (p) return anchor(p, name, pieces);
      const whole = pieces && pieces.get(v);
      return whole ? anchor(whole, 'center', pieces) : [0, 0];
    }
    return null;
  }

  function polyPoints(p, pieces) {
    const pts = (p.points || []).map(q => resolve(q, pieces) || [0, 0]);
    if (p.pos) { const o = resolve(p.pos, pieces) || [0, 0], s = p.scale ?? 1; return pts.map(q => { const r = rot([q[0] * s, q[1] * s], p.rotate); return [o[0] + r[0], o[1] + r[1]]; }); }
    return pts;
  }

  /* ---- timeline ---- */
  function stepDuration(step) {
    if (!step) return 1;
    let end = 0;
    for (const a of step.actions || []) end = Math.max(end, (a.at || 0) + (a.dur ?? (a.do === 'pulse' ? .9 : a.do === 'flow' ? 1.4 : .5)));
    for (const sayItem of step.say || []) {
      const t = Array.isArray(sayItem) ? sayItem[0] : (sayItem.at || 0);
      end = Math.max(end, t + 1.8);
    }
    return Math.max(1.2, end + 0.4);
  }

  function finalState(step, init) { return stateAt(step, 1e6, init); }

  function pathAt(pts, u) {
    if (!pts || !pts.length) return [0, 0]; if (pts.length === 1) return pts[0];
    const seg = []; let L = 0;
    for (let i = 1; i < pts.length; i++) { const d = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); seg.push(d); L += d; }
    let want = clamp(u) * L;
    for (let i = 0; i < seg.length; i++) { if (want <= seg[i] || i === seg.length - 1) { const k = seg[i] ? Math.min(1, want / seg[i]) : 0; return [lerp(pts[i][0], pts[i + 1][0], k), lerp(pts[i][1], pts[i + 1][1], k)]; } want -= seg[i]; }
    return pts[pts.length - 1];
  }

  function oscOf(p, ft) {
    const o = { x: 0, y: 0, r: 0, s: 0, sx: 0, sy: 0 };
    for (const q of p.osc || []) { if (ft < q.at) continue; const v = q.amp * Math.sin(2 * Math.PI * (ft - q.at) / q.period + q.phase); const key = q.prop === 'rotate' ? 'r' : q.prop === 'scale' ? 's' : q.prop; if (key in o) o[key] += v; }
    if (p.spin && ft >= p.spin.at) o.r += p.spin.speed * (ft - p.spin.at);
    return o;
  }

  function stateAt(step, t, init) {
    const pieces = new Map();
    if (init) for (const [id, p] of init) {
      if ((step?.keep || []).includes(id)) { const c = clone(p); c.drawP = 1; c.popP = 1; c.pulseAt = null; c.flowAt = c.flowAt != null ? -100 : null; pieces.set(id, c); }
    }
    if (!step) return pieces;
    const acts = (step.actions || []).map((a, i) => ({ ...a, _i: i })).sort((a, b) => (a.at || 0) - (b.at || 0) || a._i - b._i);
    for (const a of acts) {
      const at = a.at || 0;
      if (at > t) break;
      const dur = a.dur ?? .5;
      const k = dur <= 0 ? 1 : clamp((t - at) / dur);
      if (a.do === 'zoom') {
        let c = pieces.get('__cam');
        if (!c) { c = { glyph: '__cam', cx: 80, cy: 50, w: 160, drawP: 1, popP: 1, opacity: 1 }; pieces.set('__cam', c); }
        const f0 = c._zAt === at ? c._zFrom : { cx: c.cx, cy: c.cy, w: c.w };
        c._zAt = at; c._zFrom = f0; const to = a.to || [80, 50, 160], e = ease(k);
        c.cx = lerp(f0.cx, to[0], e); c.cy = lerp(f0.cy, to[1], e); c.w = lerp(f0.w, to[2], e);
        continue;
      }
      if (a.do === 'osc' || a.do === 'spin' || a.do === 'still' || a.do === 'path') {
        const p = pieces.get(a.target); if (!p) continue;
        if (a.do === 'osc') p.osc = (p.osc || []).concat([{ prop: a.prop || 'y', amp: a.amp ?? 1, period: a.period || 1, phase: a.phase || 0, at }]);
        else if (a.do === 'spin') p.spin = { speed: a.speed ?? 90, at };
        else if (a.do === 'still') { p.osc = []; p.spin = null; p.pathLoop = null; }
        else if (a.loop) p.pathLoop = { points: a.points, at, dur: a.dur || 2 };
        else { const q = pathAt(a.points, ease(k)); p.pos = q; }
        continue;
      }
      if (a.do === 'place') {
        const p = { ...a }; delete p.at; delete p.do; delete p._i;
        if (!p.style) p.style = defaultsOf(p).style;
        p.drawP = a.anim === 'draw' ? k : 1; p.popP = a.anim === 'pop' ? k : 1; p.opacity = 1;
        if (a.anim === 'fade' || a.anim === 'fade_in') p.opacity = k;
        pieces.set(a.id, p);
      } else {
        const p = pieces.get(a.target);
        if (!p) continue;
        if (a.do === 'move') {
          const from = p._moveAt === at ? p._moveFrom : (resolve(p.pos, pieces) || [0, 0]);
          p._moveFrom = from; p._moveAt = at;
          const to = resolve(a.to, pieces) || from;
          p.pos = [lerp(from[0], to[0], ease(k)), lerp(from[1], to[1], ease(k))];
        } else if (a.do === 'set') {
          for (const [key, val] of Object.entries(a.props || {})) {
            if (key === 'from' || key === 'to' || key === 'pos') {
              const cur = resolve(p[key], pieces) || [0, 0], tgt = resolve(val, pieces) || cur;
              p[key] = k >= 1 ? val : [lerp(cur[0], tgt[0], ease(k)), lerp(cur[1], tgt[1], ease(k))];
            } else if (typeof val === 'number' && typeof p[key] === 'number') p[key] = lerp(p[key], val, ease(k));
            else p[key] = val;
          }
        } else if (a.do === 'pulse') p.pulseAt = at;
        else if (a.do === 'flow') p.flowAt = at;
        else if (a.do === 'fade_out') { p.opacity = 1 - k; if (k >= 1) pieces.delete(a.target); }
      }
    }
    return pieces;
  }

  /* ---- drawing ---- */
  function styleOf(p) {
    const st = { ...(STYLE[p.style] || STYLE.normal) };
    if (p.color) { const c = COLORS[p.color] || p.color; st.stroke = c; if (st.fill && !st.solid) st.fill = c; }
    return st;
  }

  function strokeAttrs(st, k = 1, extra = '') {
    return `stroke="${st.stroke}" stroke-width="${f(st.w / (k || 1))}" stroke-linecap="round" stroke-linejoin="round"${extra}`;
  }

  function localSVG(pt, st, k, drawn, depth = 0) {
    if (depth > 6) return '';
    const kind = pt.glyph || pt.shape;
    const pst = pt.style ? styleOf({ style: pt.style, color: pt.color }) : st;
    const solidFill = pst.solid ? pst.fill : 'none';
    const dash = pst.dash ? ` stroke-dasharray="${pst.dash}"` : '';
    const draw = drawn < 1 ? ` pathLength="1" stroke-dasharray="${f(drawn)} 1"` : dash;
    const sa = strokeAttrs(pst, k, draw);
    const fillAttr = pt.fill ? ` fill="${pst.stroke}" fill-opacity="${pt.fill === true ? 1 : pt.fill}"` : '';
    const at = pt.pos || pt.at || [0, 0];
    if (pt.glyph && !PRIM.has(pt.glyph)) {
      const sub = LIB[pt.glyph]; if (!sub) return '';
      const s = pt.scale ?? 1;
      return `<g transform="translate(${f(at[0])} ${f(at[1])}) scale(${s})${pt.rotate ? ` rotate(${pt.rotate})` : ''}">${(sub.parts || []).map(q => localSVG(q, pst, k * s, drawn, depth + 1)).join('')}</g>`;
    }
    switch (kind) {
      case 'line': case 'straight_line': return `<line x1="${f(pt.from[0])}" y1="${f(pt.from[1])}" x2="${f(pt.to[0])}" y2="${f(pt.to[1])}" ${sa}/>`;
      case 'arrow': return arrowSVG(pt.from, pt.to, pt.double, sa, pst, k);
      case 'rect': case 'rectangle': { const w = pt.w ?? pt.width ?? 10, h = pt.h ?? pt.height ?? 10; return `<rect x="${f(at[0] - w / 2)}" y="${f(at[1] - h / 2)}" width="${f(w)}" height="${f(h)}" rx="${pt.rx ?? .6}" fill="${pt.fill ? pst.stroke : solidFill}"${pt.fill ? ` fill-opacity="${pt.fill === true ? 1 : pt.fill}"` : ''} ${sa}/>`; }
      case 'circle': {
        const warm = pt.style === 'warn' || (pst === STYLE.warn);
        return `<circle cx="${f(at[0])}" cy="${f(at[1])}" r="${pt.r ?? 3}" fill="${pt.fill ? pst.stroke : warm && pt.glyph ? 'rgba(255,209,102,.22)' : solidFill}"${pt.fill ? ` fill-opacity="${pt.fill === true ? 1 : pt.fill}"` : ''} ${sa}/>`;
      }
      case 'poly': case 'polyline': { const pts = (pt.points || []).map(q => q.join(',')).join(' '); return pt.closed ? `<polygon points="${pts}" fill="${pt.fill ? pst.stroke : solidFill}"${fillAttr ? '' : ''} ${sa}/>` : `<polyline points="${pts}" fill="none" ${sa}/>`; }
      case 'text': return `<text x="${f(at[0])}" y="${f(at[1])}" text-anchor="middle" dominant-baseline="middle" class="glabel" style="font-size:${pt.size || 5}px;fill:${pst.stroke}">${esc(pt.content || '')}</text>`;
      case 'arc': {
        const r = pt.r || 5;
        const a0 = (pt.from ?? pt.start ?? 0) * Math.PI / 180, a1 = (pt.to ?? pt.end ?? 180) * Math.PI / 180;
        const large = Math.abs(a1 - a0) > Math.PI ? 1 : 0, sweep = a1 > a0 ? 1 : 0;
        return `<path d="M${f(at[0] + r * Math.cos(a0))} ${f(at[1] + r * Math.sin(a0))} A${r} ${r} 0 ${large} ${sweep} ${f(at[0] + r * Math.cos(a1))} ${f(at[1] + r * Math.sin(a1))}" fill="none" ${sa}/>`;
      }
    }
    return '';
  }

  function arrowSVG(a, b, dbl, sa, st, k = 1) {
    const ang = Math.atan2(b[1] - a[1], b[0] - a[0]), L = 3.2 / (k || 1) * Math.max(1, k * .8);
    const head = (p, d) => { const x = p[0], y = p[1]; const a1 = ang + d + Math.PI * .82, a2 = ang + d - Math.PI * .82; return `<polyline points="${f(x + Math.cos(a1) * L)},${f(y + Math.sin(a1) * L)} ${f(x)},${f(y)} ${f(x + Math.cos(a2) * L)},${f(y + Math.sin(a2) * L)}" fill="none" ${sa.replace(/ pathLength="1" stroke-dasharray="[^"]*"| stroke-dasharray="[^"]*"/, '')}/>`; };
    return `<line x1="${f(a[0])}" y1="${f(a[1])}" x2="${f(b[0])}" y2="${f(b[1])}" ${sa}/>${head(b, 0)}${dbl ? head(a, Math.PI) : ''}`;
  }

  const blurIds = new Set();
  function pieceSVG(p, pieces, t, ft = t) {
    if (p.glyph === '__cam') return '';
    const st = styleOf(p);
    const dashAttr = st.dash ? ` stroke-dasharray="${st.dash}"` : '';
    const drawn = p.drawP < 1 ? ` pathLength="1" stroke-dasharray="${f(p.drawP)} 1"` : dashAttr;
    const glow = st.glow ? ` filter="url(#${st.glow})"` : '';
    let body = '', cx = 0, cy = 0, bb = [0, 0, 0, 0];
    if (p.glyph === 'straight_line' || p.glyph === 'arrow') {
      const a = resolve(p.from, pieces) || [0, 0], b0 = resolve(p.to, pieces) || a;
      const b = [lerp(a[0], b0[0], p.drawP), lerp(a[1], b0[1], p.drawP)];
      const off = p.flowAt != null && ft >= p.flowAt ? -(ft - p.flowAt) * 9 : 0;
      const sa = strokeAttrs(st, 1, dashAttr + ` stroke-dashoffset="${f(off)}"`);
      body = p.glyph === 'arrow' ? arrowSVG(a, b, p.double, sa, st) : `<line x1="${f(a[0])}" y1="${f(a[1])}" x2="${f(b[0])}" y2="${f(b[1])}" ${sa}/>`;
      if (p.flowAt != null && ft >= p.flowAt && ft - p.flowAt < 1.6) {
        const k = (ft - p.flowAt) / 1.6;
        body += `<circle cx="${f(lerp(a[0], b[0], k))}" cy="${f(lerp(a[1], b[1], k))}" r="1.6" fill="#E8FAFF" filter="url(#gl)"/>`;
      }
      cx = (a[0] + b[0]) / 2; cy = (a[1] + b[1]) / 2;
      bb = [Math.min(a[0], b[0]), Math.min(a[1], b[1]), Math.max(a[0], b[0]), Math.max(a[1], b[1])];
    } else if (p.glyph === 'polyline' && !p.pos) {
      const pts = polyPoints(p, pieces);
      body = localSVG({ glyph: 'polyline', points: pts, closed: p.closed }, st, 1, p.drawP);
      const xs = pts.map(q => q[0]), ys = pts.map(q => q[1]);
      bb = pts.length ? [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)] : [0, 0, 0, 0];
      cx = (bb[0] + bb[2]) / 2; cy = (bb[1] + bb[3]) / 2;
      if (p.popP < 1 || p.pulseAt != null) body = `<g transform="translate(${f(cx)} ${f(cy)}) scale(${f(popPulse(p, t))}) translate(${f(-cx)} ${f(-cy)})">${body}</g>`;
    } else {
      const pos = p.pathLoop && ft >= p.pathLoop.at ? pathAt(p.pathLoop.points, ((ft - p.pathLoop.at) / p.pathLoop.dur) % 1) : (resolve(p.pos, pieces) || [0, 0]);
      cx = pos[0]; cy = pos[1];
      var OS = oscOf(p, ft); cx += OS.x; cy += OS.y;
      const s = p.scale ?? 1;
      const g = LIB[p.glyph];
      if (p.glyph === 'circle') {
        const r = p.r ?? 3;
        const fl = p.fill ? `fill="${COLORS[p.fill] || p.fill}" fill-opacity="${p.fillOp ?? .9}"` : p.style === 'warn' ? `fill="${st.fill}" fill-opacity=".85"` : `fill="${st.solid ? st.fill : 'none'}"`;
        body = `<circle r="${f(r)}" ${fl} ${strokeAttrs(st, s, drawn)}/>`; bb = [-r, -r, r, r];
      } else if (p.glyph === 'rectangle') {
        const w = p.width ?? 10, h = p.height ?? 10;
        body = `<rect x="${f(-w / 2)}" y="${f(-h / 2)}" width="${f(w)}" height="${f(h)}" rx="0.8" fill="${p.fill ? p.fill : st.solid ? st.fill : 'none'}" ${strokeAttrs(st, s, drawn)}/>`; bb = [-w / 2, -h / 2, w / 2, h / 2];
      } else if (p.glyph === 'text') {
        const size = p.size || 6;
        body = `<text text-anchor="middle" dominant-baseline="middle" class="glabel" style="font-size:${size}px;fill:${p.style && p.style !== 'normal' ? st.stroke : '#F4F8FF'}">${esc(p.content ?? p.text ?? '')}</text>`;
        const w = String(p.content || '').length * size * .5; bb = [-w / 2, -size / 2, w / 2, size / 2];
        if (p.drawP < 1) body = `<g opacity="${f(p.drawP)}">${body}</g>`;
      } else if (p.glyph === 'polyline') {
        body = localSVG({ glyph: 'polyline', points: p.points || [], closed: p.closed }, st, s, p.drawP);
        const pts = p.points || [[0, 0]]; bb = [Math.min(...pts.map(q => q[0])), Math.min(...pts.map(q => q[1])), Math.max(...pts.map(q => q[0])), Math.max(...pts.map(q => q[1]))];
      } else if (g && g.parts) {
        const dv = p.drawP < 1 ? p.drawP : 1;
        body = (g.parts || []).map(pt => localSVG(pt, st, s, dv)).join('');
        if (p.fill && p.glyph === 'test_tube') body = `<rect x="-3.4" y="-1" width="6.8" height="12" fill="${p.fill}"/><circle cx="0" cy="11" r="3.4" fill="${p.fill}"/>` + body;
        else if (p.fill && p.glyph === 'balloon') body = `<ellipse rx="4.6" ry="6.6" fill="${p.fill}" opacity=".8"/>` + body;
        bb = glyphBox(g);
      } else {
        body = `<circle r="4" fill="none" stroke="#FF5A5F" stroke-width=".8" stroke-dasharray="1 1"/><text y="1.6" font-size="4.5" fill="#FF5A5F" text-anchor="middle">?</text><text y="9" font-size="3" fill="#FF5A5F" text-anchor="middle">${esc(p.glyph || '')}</text>`;
        bb = [-4, -4, 4, 4];
      }
      const sc = (p.glyph === 'text' || p.glyph === 'circle' || p.glyph === 'rectangle') ? 1 : s;
      const extraScale = (p.glyph === 'circle' || p.glyph === 'rectangle') ? s : 1;
      const rr = (p.rotate || 0) + OS.r;
      body = `<g transform="translate(${f(cx)} ${f(cy)}) scale(${f(popPulse(p, t) * sc * extraScale * (1 + OS.s))})${OS.sx || OS.sy ? ` scale(${f(1 + OS.sx)} ${f(1 + OS.sy)})` : ''}${rr ? ` rotate(${f(rr)})` : ''}">${body}</g>`;
      const k = sc * extraScale;
      bb = [bb[0] * k + cx, bb[1] * k + cy, bb[2] * k + cx, bb[3] * k + cy];
    }
    if (!(p.glyph !== 'straight_line' && p.glyph !== 'arrow' && !(p.glyph === 'polyline' && !p.pos)) && (p.osc && p.osc.length)) { 
      const o2 = oscOf(p, ft); 
      body = `<g transform="translate(${f(cx + o2.x)} ${f(cy + o2.y)}) rotate(${f(o2.r)}) scale(${f(1 + o2.s + o2.sx)} ${f(1 + o2.s + o2.sy)}) translate(${f(-cx)} ${f(-cy)})">${body}</g>`; 
    }
    let label = '';
    if (p.label && p.drawP > .6 && p.popP > .6) {
      const pos = p.labelPos || 'above';
      let lx = (bb[0] + bb[2]) / 2, ly = bb[1] - 3, anc = 'middle';
      if (pos === 'below') ly = bb[3] + 6.5;
      if (pos === 'left') { lx = bb[0] - 2; ly = (bb[1] + bb[3]) / 2 + 1.8; anc = 'end'; }
      if (pos === 'right') { lx = bb[2] + 2; ly = (bb[1] + bb[3]) / 2 + 1.8; anc = 'start'; }
      if (pos === 'center') { ly = (bb[1] + bb[3]) / 2 + 1.8; }
      if (p.glyph === 'straight_line' && pos === 'above') { lx = cx; ly = cy - 3; anc = 'middle'; }
      label = `<text x="${f(lx)}" y="${f(ly)}" text-anchor="${anc}" class="glabel" fill="#FFFFFF">${esc(p.label)}</text>`;
    }
    const pulseGlow = p.pulseAt != null && t >= p.pulseAt && t - p.pulseAt < .9 ? ' filter="url(#gl)"' : '';
    let blur = '';
    if (p.blur > .05) { const b = Math.round(p.blur * 4) / 4; const id = 'bl' + String(b).replace('.', '_'); blurIds.add(b); blur = ` filter="url(#${id})"`; }
    const visible = p.visible === false ? 0 : 1;
    const isTextGlyph = p.glyph === 'text';
    const filterAttr = isTextGlyph ? '' : (blur || glow);
    const pulseAttr = isTextGlyph ? '' : pulseGlow;
    return `<g opacity="${f((p.opacity ?? 1) * (st.op ?? 1) * visible)}"${filterAttr}${pulseAttr}>${body}</g>${visible ? label : ''}`;
  }

  function popPulse(p, t) {
    let sc = 1;
    if (p.popP < 1) sc *= Math.max(0.001, back(p.popP));
    if (p.pulseAt != null && t >= p.pulseAt && t - p.pulseAt < .9) sc *= 1 + .2 * Math.sin(Math.PI * (t - p.pulseAt) / .9);
    return sc;
  }

  function esc(s) { return String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }

  const FILTER = (id, sd) => `<filter id="${id}" filterUnits="userSpaceOnUse" x="-200" y="-200" width="600" height="600"><feGaussianBlur stdDeviation="${sd}" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>`;
  const DEFS = `<defs>${FILTER('gl', 1.1)}${FILTER('gw', 1.4)}${FILTER('gg', 1)}${FILTER('gb', 1)}
    <style>
      .glabel {
        font-family: var(--f-display, 'Fredoka', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif);
        font-size: 5.5px;
        fill: #FFFFFF !important;
        font-weight: 500;
        stroke: none !important;
        filter: none !important;
        text-shadow: none !important;
      }
      .gridnum {
        font-size: 2.8px;
        fill: rgba(124, 211, 255, 0.45);
        filter: none !important;
      }
    </style>
    <pattern id="hatch" width="2.2" height="2.2" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="2.2" height="2.2" fill="#05080B"/><line x1="0" y1="0" x2="0" y2="2.2" stroke="#2C3E52" stroke-width=".7"/></pattern>
    <pattern id="hatch2" width="3.4" height="3.4" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="3.4" height="3.4" fill="rgba(8,14,22,.55)"/><line x1="0" y1="0" x2="0" y2="3.4" stroke="#3E556E" stroke-width=".5"/></pattern>
    <pattern id="dots" width="3" height="3" patternUnits="userSpaceOnUse"><circle cx="1.5" cy="1.5" r=".35" fill="#5C748E"/></pattern>
  </defs>`;

  function blurDefs() { 
    let s = ''; 
    for (const b of blurIds) s += `<filter id="bl${String(b).replace('.', '_')}" filterUnits="userSpaceOnUse" x="-200" y="-200" width="600" height="600"><feGaussianBlur stdDeviation="${b}"/></filter>`; 
    return s ? `<defs>${s}</defs>` : ''; 
  }

  function render(pieces, t, extra = '', ft = t) {
    let out = '';
    for (const p of pieces.values()) out += pieceSVG(p, pieces, t, ft);
    const cam = pieces.get('__cam');
    if (cam && Math.abs(cam.w - 160) > .2) { 
      const kz = 160 / cam.w; 
      out = out.replace(/class="glabel">/g, `class="glabel" style="font-size:${f(5.5 / kz)}px;fill:#FFFFFF;stroke:none;filter:none">`); 
      out = `<g transform="translate(80 50) scale(${f(kz)}) translate(${f(-cam.cx)} ${f(-cam.cy)})">${out}</g>`; 
    }
    return DEFS + blurDefs() + out + extra;
  }

  function gridSVG() {
    let g = '';
    for (let x = 0; x <= W; x += 10) g += `<line x1="${x}" y1="0" x2="${x}" y2="${H}" stroke="rgba(124,211,255,${x % 50 ? .08 : .2})" stroke-width=".25"/>${x % 20 === 0 ? `<text x="${x + .6}" y="3.4" class="gridnum">${x}</text>` : ''}`;
    for (let y = 0; y <= H; y += 10) g += `<line x1="0" y1="${y}" x2="${W}" y2="${y}" stroke="rgba(124,211,255,${y % 50 ? .08 : .2})" stroke-width=".25"/>${y % 20 === 0 && y ? `<text x=".6" y="${y - .6}" class="gridnum">${y}</text>` : ''}`;
    return g;
  }

  function preview(g) {
    if (!g) return '';
    let p;
    if (g.name === 'straight_line' || g.name === 'arrow') p = { glyph: g.name, from: [-12, 0], to: [12, 0], style: 'ray', drawP: 1, popP: 1 };
    else if (g.name === 'polyline') p = { glyph: 'polyline', pos: [0, 0], points: [[-12, 4], [-4, -4], [4, 4], [12, -4]], drawP: 1, popP: 1 };
    else if (g.name === 'text') p = { glyph: 'text', pos: [0, 0], content: 'Aa', size: 9, drawP: 1, popP: 1 };
    else p = { glyph: g.name, pos: [0, 0], drawP: 1, popP: 1, style: g.name === 'cross' ? 'bad' : g.name === 'tick' ? 'good' : (g.settings || {}).style };
    const b = PRIM.has(g.name) ? (g.name === 'rectangle' ? [-5, -5, 5, 5] : g.name === 'circle' ? [-3, -3, 3, 3] : [-12, -5, 12, 5]) : glyphBox(g);
    const cx = (b[0] + b[2]) / 2, cy = (b[1] + b[3]) / 2;
    const box = Math.max(b[2] - b[0], b[3] - b[1]) + 10;
    const m = new Map([['g', p]]);
    let dots = '';
    if (!PRIM.has(g.name)) for (const n of Object.keys(g.anchors || {})) { const a = anchor(p, n, m); dots += `<circle cx="${f(a[0])}" cy="${f(a[1])}" r="${f(box / 60)}" fill="#FF8A3D"/>`; }
    return `<svg viewBox="${f(cx - box / 2)} ${f(cy - box / 2)} ${f(box)} ${f(box)}" role="img" aria-label="${esc(g.name)}" class="w-full h-full max-h-[260px]">${DEFS}${pieceSVG(p, m, 9, 9)}${dots}</svg>`;
  }

  function parseStepInput(input, title) {
    if (!input) return { title: title || '', say: [], actions: [], _empty: true };
    try {
      const j = typeof input === 'string' ? JSON.parse(input) : input;
      if (j && j.steps) return j.steps.find(s => s.title === title) || j.steps[0];
      return j;
    } catch (e) { 
      return { title: title || '', say: [], actions: [], _error: e.message }; 
    }
  }

  return { 
    W, H, STYLE, LIB, PRIM, 
    setLibrary, addGlyph, library, known, 
    stateAt, finalState, render, pieceSVG, resolve, anchor, 
    stepDuration, gridSVG, preview, parseStepInput, glyphBox, DEFS, blurDefs 
  };
})();

// Initialize the library immediately with default JSON
Glyph.setLibrary(defaultGlyphLibrary);

// Synchronize with backend glyph collection if online
export async function syncGlyphsWithBackend() {
  try {
    const res = await http.get('/api/glyphs');
    if (res?.data?.success && Array.isArray(res.data.data) && res.data.data.length > 0) {
      Glyph.setLibrary(res.data.data);
      return res.data.data;
    }
  } catch (err) {
    // Non-blocking fallback
  }
  return defaultGlyphLibrary;
}

if (typeof window !== 'undefined') {
  syncGlyphsWithBackend().catch(() => {});
}

export default Glyph;
export { Glyph };
